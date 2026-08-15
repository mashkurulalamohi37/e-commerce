import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Float, Integer, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.types import GUID
from app.db.base_class import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    sku: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    brief: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    size: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    list_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    rating: Mapped[float] = mapped_column(Float, default=5.0, nullable=False)
    reviews_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ingredients: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    how_to_use: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    image_key: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    brand_slug: Mapped[Optional[str]] = mapped_column(String(255), ForeignKey("brands.slug"), index=True, nullable=True)
    categories: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    concerns: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list, nullable=True)

    best_seller: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    on_offer: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    offer_ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    published: Mapped[bool] = mapped_column(Boolean, default=True, index=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    brand = relationship("Brand", back_populates="products")
    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="product", cascade="all, delete-orphan")
