from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, model_validator

from app.core.text import LinkTarget, SafeText, Slug


class ProductBase(BaseModel):
    """Bounds match the columns behind them.

    Prices and stock were bare `float` and `int`, so a product could be saved
    with a price of -500 and a stock of -99 — and a negative price flowed
    straight into order subtotals. Text fields had no `max_length` at all
    despite the columns being String(100)/String(255), so a 100,000-character
    name was accepted and truncated silently by the database.
    """

    sku: SafeText = Field(min_length=1, max_length=100)
    name: SafeText = Field(min_length=1, max_length=255)
    slug: Slug
    brief: Optional[SafeText] = Field(default=None, max_length=2000)
    size: Optional[SafeText] = Field(default=None, max_length=100)
    price: float = Field(gt=0, le=10_000_000)
    list_price: Optional[float] = Field(default=None, gt=0, le=10_000_000)
    stock: int = Field(default=0, ge=0, le=1_000_000)
    ingredients: Optional[SafeText] = Field(default=None, max_length=5000)
    how_to_use: Optional[SafeText] = Field(default=None, max_length=5000)
    image_url: Optional[LinkTarget] = None
    brand_slug: Optional[Slug] = None
    categories: List[SafeText] = Field(default_factory=list, max_length=20)
    concerns: Optional[List[SafeText]] = Field(default=None, max_length=20)
    best_seller: bool = False
    on_offer: bool = False
    offer_ends_at: Optional[datetime] = None
    published: bool = True

    @model_validator(mode="after")
    def _list_price_above_price(self):
        # A "was ৳500, now ৳900" badge reads as a price rise dressed as a saving.
        if self.list_price is not None and self.list_price < self.price:
            raise ValueError("list_price is the pre-discount price, so it cannot be below price.")
        return self


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    sku: Optional[SafeText] = Field(default=None, min_length=1, max_length=100)
    name: Optional[SafeText] = Field(default=None, min_length=1, max_length=255)
    slug: Optional[Slug] = None
    brief: Optional[SafeText] = Field(default=None, max_length=2000)
    size: Optional[SafeText] = Field(default=None, max_length=100)
    price: Optional[float] = Field(default=None, gt=0, le=10_000_000)
    list_price: Optional[float] = Field(default=None, gt=0, le=10_000_000)
    stock: Optional[int] = Field(default=None, ge=0, le=1_000_000)
    ingredients: Optional[SafeText] = Field(default=None, max_length=5000)
    how_to_use: Optional[SafeText] = Field(default=None, max_length=5000)
    image_url: Optional[LinkTarget] = None
    brand_slug: Optional[Slug] = None
    categories: Optional[List[SafeText]] = Field(default=None, max_length=20)
    concerns: Optional[List[SafeText]] = Field(default=None, max_length=20)
    best_seller: Optional[bool] = None
    on_offer: Optional[bool] = None
    offer_ends_at: Optional[datetime] = None
    published: Optional[bool] = None


class ProductResponse(ProductBase):
    id: UUID
    rating: float
    reviews_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
