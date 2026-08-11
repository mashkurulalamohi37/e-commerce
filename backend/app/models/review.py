import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Float, Integer, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.base_class import Base


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), index=True, nullable=False)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=True)
    author_name: Mapped[str] = mapped_column(String(255), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 to 5
    comment: Mapped[str] = mapped_column(Text, nullable=False)
    verified_purchase: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    published: Mapped[bool] = mapped_column(Boolean, default=True, index=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    product = relationship("Product", back_populates="reviews")
    user = relationship("User", back_populates="reviews")


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), index=True, nullable=False)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=True)
    asker_name: Mapped[str] = mapped_column(String(255), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    published: Mapped[bool] = mapped_column(Boolean, default=True, index=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    product = relationship("Product", back_populates="questions")
    user = relationship("User", back_populates="questions")


class Promotion(Base):
    __tablename__ = "promotions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    discount_type: Mapped[str] = mapped_column(String(20), default="percentage", nullable=False)  # percentage or flat
    discount_value: Mapped[float] = mapped_column(Float, nullable=False)  # e.g., 10.0 for 10% or 100 for 100 BDT
    min_order_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    valid_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Wishlist(Base):
    __tablename__ = "wishlists"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="wishlists")
