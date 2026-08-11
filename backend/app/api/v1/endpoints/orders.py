import re
import secrets
import string
from typing import Any, List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.db.session import get_db
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.review import Promotion
from app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate, PaymentConfirm
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


@router.post("/", response_model=OrderResponse)
async def create_order(
    order_in: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> Any:
    if not order_in.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order must contain at least one item")

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

    short = [
        f"{products[pid].name} (only {products[pid].stock} left)"
        for pid, qty in requested.items()
        if products[pid].stock < qty
    ]
    if short:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Insufficient stock: {', '.join(short)}",
        )

    subtotal = sum(products[pid].price * qty for pid, qty in requested.items())

    if order_in.delivery_zone == "inside_dhaka":
        delivery_fee = settings.DELIVERY_FEE_INSIDE_DHAKA
    else:
        delivery_fee = settings.DELIVERY_FEE_OUTSIDE_DHAKA

    discount_amount = 0.0
    if order_in.promo_code:
        promo_res = await db.execute(
            select(Promotion).where(Promotion.code == order_in.promo_code, Promotion.is_active == True)
        )
        promo = promo_res.scalars().first()
        if promo and subtotal >= promo.min_order_amount:
            if promo.discount_type == "percentage":
                discount_amount = (subtotal * promo.discount_value) / 100.0
            else:
                discount_amount = promo.discount_value
            # Never discount below zero, and never discount the delivery fee away.
            discount_amount = min(discount_amount, subtotal)

    total = max(0.0, subtotal + delivery_fee - discount_amount)

    db_order = Order(
        order_number=generate_order_number(),
        user_id=current_user.id if current_user else None,
        customer_name=order_in.customer_name,
        phone=order_in.phone,
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

    await db.commit()

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
        return order  # idempotent: a retried confirmation must not decrement twice

    # Lock the product rows in a stable order so concurrent checkouts queue
    # rather than deadlock, then re-check stock inside the same transaction.
    product_ids = sorted({item.product_id for item in order.items if item.product_id})
    products_result = await db.execute(
        select(Product).where(Product.id.in_(product_ids)).order_by(Product.id).with_for_update()
    )
    products = {p.id: p for p in products_result.scalars().all()}

    wanted: dict[uuid.UUID, int] = {}
    for item in order.items:
        if item.product_id:
            wanted[item.product_id] = wanted.get(item.product_id, 0) + item.qty

    sold_out = [
        products[pid].name
        for pid, qty in wanted.items()
        if pid not in products or products[pid].stock < qty
    ]
    if sold_out:
        order.payment_status = "unpaid"
        db.add(order)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{', '.join(sold_out)} just sold out — you have not been charged.",
        )

    for pid, qty in wanted.items():
        products[pid].stock -= qty
        db.add(products[pid])

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
    order_number: str, phone: str, db: AsyncSession = Depends(get_db)
) -> Any:
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(and_(Order.order_number == order_number, Order.phone == phone))
    )
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found with provided credentials")
    return order


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

    if status_in.status:
        order.status = status_in.status
    if status_in.payment_status:
        order.payment_status = status_in.payment_status
    if status_in.payment_reference:
        order.payment_reference = status_in.payment_reference

    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order
