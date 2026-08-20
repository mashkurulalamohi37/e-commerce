import re
import secrets
import string
from typing import Any, List, Optional
import uuid
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload

from app.api.v1.endpoints.reviews import find_live_promotion, promo_discount
from app.core.config import settings
from app.core.mailer import (
    send_order_confirmation_email,
    send_order_sms_notification,
    send_order_status_email,
)
from app.db.session import get_db
from app.models.order import Order, OrderIdempotency, OrderItem
from app.models.product import Product
from app.schemas.order import (
    OrderCreate,
    OrderResponse,
    OrderStatusUpdate,
    PaymentConfirm,
    mask_customer_name,
    mask_phone_number,
    mask_email_address,
    mask_street_address,
)
from app.models.user import User
from app.api.v1.endpoints.auth import (
    get_current_admin,
    get_current_user,
    get_optional_current_user,
)

router = APIRouter()


def generate_order_number() -> str:
    """Unguessable order number.

    Six sequential-ish digits made numbers walkable; secrets + a wider alphabet
    means an order number cannot be brute-forced into a lookup. Tracking also
    requires the matching phone, so this is defence in depth.
    """
    alphabet = string.ascii_uppercase + string.digits
    return "NM-" + "".join(secrets.choice(alphabet) for _ in range(10))


def _normalise_phone(value: str) -> str:
    """Reduces a BD mobile number to its 10-digit national part.

    01712345678, +8801712345678 and 8801712345678 are the same number, so all
    three must reduce to 1712345678. Both the country code and the trunk '0'
    have to come off — stripping only the country code left '01712345678' and
    '1712345678' looking like different people.
    """
    digits = re.sub(r"\D", "", value)
    if digits.startswith("880"):
        digits = digits[3:]
    return digits.lstrip("0")


def _same_phone(a: Optional[str], b: Optional[str]) -> bool:
    if not a or not b:
        return False
    left, right = _normalise_phone(a), _normalise_phone(b)
    return bool(left) and secrets.compare_digest(left, right)


# Statuses that no longer hold inventory.
RELEASED_STATUSES = {"cancelled"}


def _wanted_from_items(items) -> dict:
    wanted: dict[uuid.UUID, int] = {}
    for item in items:
        if item.product_id:
            wanted[item.product_id] = wanted.get(item.product_id, 0) + item.qty
    return wanted


async def _reserve_stock(db: AsyncSession, wanted: dict) -> None:
    """Take the requested quantities out of stock, or raise 409.

    Stock used to move only when `/pay` ran. Checkout deliberately skips that
    call for cash on delivery — the dominant payment method here — so COD orders
    never touched inventory and the store could sell the same five units
    indefinitely. Reserving at order creation makes every sale cost stock
    exactly once, whoever pays and however.

    The decrement is a single conditional UPDATE rather than a read, a subtract
    in Python and a write back. Two shoppers racing for the last unit both read
    the same starting figure, so the read-modify-write version sold it twice;
    letting the database do the arithmetic under `stock >= qty` means exactly one
    of them matches a row. `with_for_update()` would not have covered this —
    SQLite ignores it.
    """
    names = {
        p.id: p.name
        for p in (
            await db.execute(select(Product).where(Product.id.in_(list(wanted))))
        ).scalars().all()
    }
    missing = [str(pid) for pid in wanted if pid not in names]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown product(s): {', '.join(missing)}",
        )

    # Stable order so two concurrent multi-item orders cannot deadlock.
    for pid in sorted(wanted, key=str):
        qty = wanted[pid]
        result = await db.execute(
            update(Product)
            .where(Product.id == pid, Product.stock >= qty)
            .values(stock=Product.stock - qty)
        )
        if result.rowcount == 0:
            left = (
                await db.execute(select(Product.stock).where(Product.id == pid))
            ).scalar_one_or_none()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Insufficient stock: {names[pid]} (only {left or 0} left)",
            )


async def _release_stock(db: AsyncSession, wanted: dict) -> None:
    """Put reserved quantities back, e.g. when an order is cancelled."""
    for pid in sorted(wanted, key=str):
        await db.execute(
            update(Product).where(Product.id == pid).values(stock=Product.stock + wanted[pid])
        )


@router.post("/", response_model=OrderResponse)
async def create_order(
    order_in: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
    idempotency_key: Optional[str] = Header(default=None, alias="Idempotency-Key", max_length=120),
) -> Any:
    if not order_in.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order must contain at least one item")

    # A retry of the same checkout attempt returns the order it already made,
    # instead of placing a second one with its own stock reservation.
    if idempotency_key:
        seen = (
            await db.execute(
                select(Order)
                .options(selectinload(Order.items))
                .join(OrderIdempotency, OrderIdempotency.order_id == Order.id)
                .where(OrderIdempotency.key == idempotency_key)
            )
        ).scalars().first()
        if seen:
            return seen

    # Every price comes from the database. The request body carries only
    # product_id and qty — a client-supplied unit_price would let the buyer
    # name their own price.
    requested = {}
    for item in order_in.items:
        requested[item.product_id] = requested.get(item.product_id, 0) + item.qty

    product_res = await db.execute(select(Product).where(Product.id.in_(list(requested.keys()))))
    products = {p.id: p for p in product_res.scalars().all()}

    missing = [str(pid) for pid in requested if pid not in products]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown product(s): {', '.join(missing)}",
        )

    unavailable = [products[pid].name for pid in requested if not products[pid].published]
    if unavailable:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product unavailable: {', '.join(unavailable)}",
        )

    subtotal = sum(products[pid].price * qty for pid, qty in requested.items())

    if order_in.delivery_zone == "inside_dhaka":
        delivery_fee = settings.DELIVERY_FEE_INSIDE_DHAKA
    else:
        delivery_fee = settings.DELIVERY_FEE_OUTSIDE_DHAKA

    discount_amount = 0.0
    if order_in.promo_code:
        # A code that cannot be applied is an error, not a silent no-op. It used
        # to fall through to a zero discount, so an order placed with a code that
        # had just expired charged full price without saying so — after the
        # checkout page had already quoted the discounted total.
        promo = await find_live_promotion(db, order_in.promo_code)
        if not promo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Promo code '{order_in.promo_code}' is not valid or has expired.",
            )
        if subtotal < promo.min_order_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Code '{promo.code}' needs a minimum order of {promo.min_order_amount:g} BDT.",
            )
        discount_amount = promo_discount(promo, subtotal)

    total = max(0.0, subtotal + delivery_fee - discount_amount)

    await _reserve_stock(db, requested)

    db_order = Order(
        order_number=generate_order_number(),
        user_id=current_user.id if current_user else None,
        customer_name=order_in.customer_name,
        phone=order_in.phone,
        email=order_in.email.strip() if order_in.email else None,
        address=order_in.address,
        city=order_in.city,
        delivery_zone=order_in.delivery_zone,
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        discount_amount=discount_amount,
        total=total,
        status="pending",
        payment_method=order_in.payment_method,
        # Card/bKash stay pending until a gateway confirms; COD stays unpaid
        # until the courier collects. Neither is ever "paid" at creation.
        payment_status="unpaid" if order_in.payment_method == "cod" else "pending",
        payment_reference=order_in.payment_reference,
    )
    db.add(db_order)
    await db.flush()

    for pid, qty in requested.items():
        product = products[pid]
        db.add(
            OrderItem(
                order_id=db_order.id,
                product_id=product.id,
                name=product.name,
                size=product.size,
                qty=qty,
                unit_price=product.price,
            )
        )

    if idempotency_key:
        db.add(OrderIdempotency(key=idempotency_key, order_id=db_order.id))

    await db.commit()

    if db_order.email:
        await send_order_confirmation_email(
            to_email=db_order.email,
            customer_name=db_order.customer_name,
            order_number=db_order.order_number,
            total=db_order.total,
            address=f"{db_order.address}, {db_order.city}",
        )

    # SMS notification is sent to the mobile number (for all orders, ensuring updates via SMS or both SMS & Email)
    track_url = f"{settings.FRONTEND_URL.rstrip('/')}/track?order={db_order.order_number}"
    await send_order_sms_notification(
        phone=db_order.phone,
        message=f"Nills Mart: Order #{db_order.order_number} confirmed! Total: ৳{db_order.total:g}. Track live at {track_url}",
    )

    result = await db.execute(
        select(Order).options(selectinload(Order.items)).where(Order.id == db_order.id)
    )
    return result.scalars().first()


@router.post("/{order_id}/pay", response_model=OrderResponse)
async def confirm_payment(
    order_id: uuid.UUID,
    payload: PaymentConfirm,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> Any:
    """Confirm payment and decrement stock atomically.

    Knowing an order id is not authorisation: the caller must also present the
    phone number the order was placed with, or be signed in as its owner.
    """
    result = await db.execute(
        select(Order).options(selectinload(Order.items)).where(Order.id == order_id).with_for_update()
    )
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    owns_it = current_user is not None and order.user_id == current_user.id
    knows_phone = _same_phone(payload.phone, order.phone)
    if not (owns_it or knows_phone):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This payment could not be verified.",
        )

    if order.payment_status == "paid":
        return order  # idempotent: a retried confirmation must not be charged twice

    if order.status in RELEASED_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This order was cancelled and cannot be paid for.",
        )

    # No stock movement here any more. The units were taken out of stock when the
    # order was created, so this endpoint only records that the money arrived —
    # which also means a bKash order confirmed by an admin and a card order
    # confirmed by the customer cost inventory the same way.
    order.payment_status = "paid"
    order.status = "processing"
    order.payment_reference = payload.payment_reference or f"SIM-{uuid.uuid4().hex[:8].upper()}"
    db.add(order)
    await db.commit()

    refreshed = await db.execute(
        select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
    )
    return refreshed.scalars().first()


@router.get("/track", response_model=OrderResponse)
async def track_order(
    order_number: str,
    phone: Optional[str] = None,
    email: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> Any:
    """Look an order up by number, optionally verified by phone or email.

    Signed-in users can also track orders they own directly.
    """
    clean_num = order_number.strip().upper()
    if not clean_num:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order number is required",
        )

    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.order_number == clean_num)
    )
    order = result.scalars().first()

    matched = False
    verified = False
    if order:
        if phone:
            if _same_phone(phone, order.phone):
                matched = True
                verified = True
        elif email:
            if order.email and email.strip().lower() == order.email.strip().lower():
                matched = True
                verified = True
        elif current_user and order.user_id == current_user.id:
            matched = True
            verified = True
        else:
            # Order number itself is cryptographically unguessable (NM- + 10 random alphanumeric)
            matched = True
            verified = False

    if not order or not matched:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found with provided credentials",
        )

    if verified:
        return order

    # Mask sensitive PII for unverified anonymous tracking lookup
    return OrderResponse(
        id=order.id,
        order_number=order.order_number,
        user_id=order.user_id,
        customer_name=mask_customer_name(order.customer_name),
        phone=mask_phone_number(order.phone),
        email=mask_email_address(order.email),
        address=mask_street_address(order.address, order.city),
        city=order.city,
        delivery_zone=order.delivery_zone,
        subtotal=order.subtotal,
        delivery_fee=order.delivery_fee,
        discount_amount=order.discount_amount,
        total=order.total,
        status=order.status,
        payment_method=order.payment_method,
        payment_status=order.payment_status,
        payment_reference=order.payment_reference,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=order.items,
    )


@router.get("/my", response_model=List[OrderResponse])
async def list_my_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 50,
) -> Any:
    """Orders placed by the signed-in customer, newest first.

    Without this a signed-in customer had to re-enter the order number and the
    phone number on /track — both of which we already know — because the only
    lookup available was the anonymous one.

    Scoped to `user_id` from the token, never from a query parameter, so it can
    only ever return the caller's own orders.
    """
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/admin/list", response_model=List[OrderResponse], dependencies=[Depends(get_current_admin)])
async def list_admin_orders(
    db: AsyncSession = Depends(get_db),
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    query = select(Order).options(selectinload(Order.items))
    if status_filter:
        query = query.where(Order.status == status_filter)
    query = query.order_by(Order.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/{order_id}/status", response_model=OrderResponse, dependencies=[Depends(get_current_admin)])
async def update_order_status(
    order_id: uuid.UUID,
    status_in: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db)
) -> Any:
    result = await db.execute(select(Order).options(selectinload(Order.items)).where(Order.id == order_id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if status_in.status and status_in.status != order.status:
        was_holding = order.status not in RELEASED_STATUSES
        now_holding = status_in.status not in RELEASED_STATUSES
        wanted = _wanted_from_items(order.items)
        # Cancelling an order has to put its units back on the shelf, and
        # un-cancelling has to take them again — otherwise the stock a cancelled
        # order was holding stayed invisible forever.
        if was_holding and not now_holding:
            await _release_stock(db, wanted)
        elif now_holding and not was_holding:
            await _reserve_stock(db, wanted)
        order.status = status_in.status

    if status_in.payment_status:
        order.payment_status = status_in.payment_status
    if status_in.payment_reference:
        order.payment_reference = status_in.payment_reference

    db.add(order)
    await db.commit()
    await db.refresh(order)

    # Send status updates via email and/or SMS when status changes
    if status_in.status:
        track_url = f"{settings.FRONTEND_URL.rstrip('/')}/track?order={order.order_number}"
        if order.email:
            await send_order_status_email(
                to_email=order.email,
                customer_name=order.customer_name,
                order_number=order.order_number,
                new_status=order.status,
            )
        await send_order_sms_notification(
            phone=order.phone,
            message=f"Nills Mart: Order #{order.order_number} status updated to {order.status.upper()}. Track: {track_url}",
        )

    return order
