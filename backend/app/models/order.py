import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Float, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.base_class import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=True)

    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    city: Mapped[str] = mapped_column(String(100), default="Dhaka", nullable=False)
    delivery_zone: Mapped[str] = mapped_column(String(100), default="inside_dhaka", nullable=False)

    subtotal: Mapped[float] = mapped_column(Float, nullable=False)
    delivery_fee: Mapped[float] = mapped_column(Float, default=60.0, nullable=False)
    discount_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total: Mapped[float] = mapped_column(Float, nullable=False)

    status: Mapped[str] = mapped_column(String(50), default="pending", index=True, nullable=False)  # pending, processing, shipped, delivered, cancelled
    payment_method: Mapped[str] = mapped_column(String(50), default="cod", nullable=False)  # cod, bkash, nagad, card
    payment_status: Mapped[str] = mapped_column(String(50), default="unpaid", nullable=False)  # unpaid, paid, refunded
    payment_reference: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    product_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    size: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    qty: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)

    order = relationship("Order", back_populates="items")


class Cart(Base):
    __tablename__ = "carts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")


class CartItem(Base):
    __tablename__ = "cart_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cart_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("carts.id"), nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    qty: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    cart = relationship("Cart", back_populates="items")
