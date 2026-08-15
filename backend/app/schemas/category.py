from typing import List, Literal, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, model_validator

from app.core.text import LinkTarget, SafeText, Slug

# The storefront only ever queries these two. Free text meant a typo saved
# successfully, returned 200, and produced a banner that rendered nowhere.
BannerPlacement = Literal["hero", "offer"]
BannerTone = Literal["dark", "light"]


class CategoryBase(BaseModel):
    name: SafeText = Field(min_length=1, max_length=255)
    slug: Slug
    sort_order: int = Field(default=0, ge=0, le=9999)
    children: Optional[List[SafeText]] = Field(default_factory=list, max_length=50)


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class BrandBase(BaseModel):
    name: SafeText = Field(min_length=1, max_length=255)
    slug: Slug
    origin: Optional[SafeText] = Field(default=None, max_length=255)
    is_top: bool = False
    sort_order: int = Field(default=0, ge=0, le=9999)


class BrandCreate(BrandBase):
    pass


class BrandResponse(BrandBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class BannerBase(BaseModel):
    title: SafeText = Field(min_length=1, max_length=255)
    subtitle: Optional[SafeText] = Field(default=None, max_length=255)
    kicker: Optional[SafeText] = Field(default=None, max_length=255)
    image_url: LinkTarget
    # Required: a decorative-only alt would leave the storefront's largest image
    # unannounced to screen readers.
    alt: SafeText = Field(min_length=1, max_length=255)
    cta_label: Optional[SafeText] = Field(default=None, max_length=100)
    # Rendered straight into an anchor wrapping the full-bleed hero, so the
    # scheme has to be checked here: javascript: and data: are refused.
    cta_href: Optional[LinkTarget] = None
    placement: BannerPlacement = "hero"
    tone: BannerTone = "dark"
    active: bool = True
    sort_order: int = Field(default=0, ge=0, le=9999)
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None

    @model_validator(mode="after")
    def _window_ordered(self):
        if self.starts_at and self.ends_at and self.ends_at <= self.starts_at:
            raise ValueError("The banner's end date must come after its start date.")
        return self


class BannerCreate(BannerBase):
    pass


class BannerResponse(BannerBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class BannerReorder(BaseModel):
    placement: BannerPlacement
    ids: List[UUID] = Field(min_length=1, max_length=60)
