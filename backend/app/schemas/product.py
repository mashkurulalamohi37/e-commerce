from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class ProductBase(BaseModel):
    sku: str
    name: str
    slug: str
    brief: Optional[str] = None
    size: Optional[str] = None
    price: float
    list_price: Optional[float] = None
    stock: int = 0
    ingredients: Optional[str] = None
    how_to_use: Optional[str] = None
    image_url: Optional[str] = None
    brand_slug: Optional[str] = None
    categories: List[str] = []
    concerns: Optional[List[str]] = []
    best_seller: bool = False
    on_offer: bool = False
    offer_ends_at: Optional[datetime] = None
    published: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    slug: Optional[str] = None
    brief: Optional[str] = None
    size: Optional[str] = None
    price: Optional[float] = None
    list_price: Optional[float] = None
    stock: Optional[int] = None
    ingredients: Optional[str] = None
    how_to_use: Optional[str] = None
    image_url: Optional[str] = None
    brand_slug: Optional[str] = None
    categories: Optional[List[str]] = None
    concerns: Optional[List[str]] = None
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
