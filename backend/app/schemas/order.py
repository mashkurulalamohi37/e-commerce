from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


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
    customer_name: str
    phone: str
    address: str
    city: str = "Dhaka"
    delivery_zone: str = "inside_dhaka"
    payment_method: str = "cod"
    payment_reference: Optional[str] = None
    items: List[OrderItemCreate]
    promo_code: Optional[str] = None


class PaymentConfirm(BaseModel):
    """Proof the caller placed this order — the order id alone is not enough."""

    phone: Optional[str] = Field(default=None, max_length=20)
    payment_reference: Optional[str] = Field(default=None, max_length=60)


class OrderStatusUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    payment_reference: Optional[str] = None


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
