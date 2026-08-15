from typing import Literal, Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.core.text import BdPhone, PromoCode, SafeText

# The lifecycle the storefront's tracking page draws, plus the terminal state.
# Free-text status let an admin save "totally-made-up", which the tracker then
# rendered as four grey segments with no current step and no error.
OrderStatus = Literal["pending", "processing", "shipped", "delivered", "cancelled"]
PaymentStatus = Literal["unpaid", "pending", "paid", "refunded"]
PaymentMethod = Literal["cod", "bkash", "nagad", "card"]
DeliveryZone = Literal["inside_dhaka", "outside_dhaka"]


class OrderItemCreate(BaseModel):
    """What the client is allowed to ask for: which product, and how many.

    Name, size and unit_price are deliberately absent — they are read from the
    products table server-side. Accepting a client-supplied unit_price let a
    buyer set their own price.
    """

    model_config = ConfigDict(extra="forbid")

    product_id: UUID
    qty: int = Field(default=1, ge=1, le=20)


class OrderItemResponse(BaseModel):
    id: UUID
    product_id: Optional[UUID] = None
    name: str
    size: Optional[str] = None
    qty: int
    unit_price: float

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    """Mirrors the rules the checkout form applies in the browser.

    The form validated all four contact fields well and none of it existed
    server-side, so anything that skipped the form could create an order with a
    blank name, phone and address — undeliverable, and untrackable, because
    tracking needs the phone.
    """

    customer_name: SafeText = Field(min_length=2, max_length=120)
    phone: BdPhone
    address: SafeText = Field(min_length=5, max_length=400)
    city: SafeText = Field(default="Dhaka", min_length=2, max_length=80)
    delivery_zone: DeliveryZone = "inside_dhaka"
    payment_method: PaymentMethod = "cod"
    payment_reference: Optional[SafeText] = Field(default=None, max_length=60)
    # Bounded, but an empty list is left to the endpoint so it can answer with
    # the friendlier 400 it already had rather than a schema 422.
    items: List[OrderItemCreate] = Field(max_length=50)
    promo_code: Optional[PromoCode] = None


class PaymentConfirm(BaseModel):
    """Proof the caller placed this order — the order id alone is not enough."""

    phone: Optional[str] = Field(default=None, max_length=20)
    payment_reference: Optional[SafeText] = Field(default=None, max_length=60)


class OrderStatusUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    payment_status: Optional[PaymentStatus] = None
    payment_reference: Optional[SafeText] = Field(default=None, max_length=60)


class OrderResponse(BaseModel):
    id: UUID
    order_number: str
    user_id: Optional[UUID] = None
    customer_name: str
    phone: str
    address: str
    city: str
    delivery_zone: str
    subtotal: float
    delivery_fee: float
    discount_amount: float
    total: float
    status: str
    payment_method: str
    payment_status: str
    payment_reference: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True
