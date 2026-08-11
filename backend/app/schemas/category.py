from typing import List, Literal, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field


class CategoryBase(BaseModel):
    name: str
    slug: str
    sort_order: int = 0
    children: Optional[List[str]] = []


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class BrandBase(BaseModel):
    name: str
    slug: str
    origin: Optional[str] = None
    is_top: bool = False
    sort_order: int = 0


class BrandCreate(BrandBase):
    pass


class BrandResponse(BrandBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class BannerBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    subtitle: Optional[str] = Field(default=None, max_length=255)
    kicker: Optional[str] = Field(default=None, max_length=255)
    image_url: str = Field(min_length=1, max_length=500)
    # Required: a decorative-only alt would leave the storefront's largest image
    # unannounced to screen readers.
    alt: str = Field(min_length=1, max_length=255)
    cta_label: Optional[str] = None
    cta_href: Optional[str] = None
    placement: str = "hero"
    tone: str = "dark"
    active: bool = True
    sort_order: int = 0
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None


class BannerCreate(BannerBase):
    pass


class BannerResponse(BannerBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class BannerReorder(BaseModel):
    placement: Literal["hero", "offer"]
    ids: List[UUID] = Field(min_length=1, max_length=60)
