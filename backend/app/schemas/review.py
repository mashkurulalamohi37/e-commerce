from typing import Literal, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, model_validator

from app.core.text import PromoCode, SafeText

# Percentage coupons are capped at the whole order. Above 100 the arithmetic
# still "worked" — it just produced a discount larger than the basket, which the
# checkout page then quoted to the customer.
MAX_PERCENTAGE_DISCOUNT = 100.0


class ReviewCreate(BaseModel):
    product_id: UUID
    # The column comment always said 1 to 5; nothing enforced it, so ratings of
    # 999 and -50 were both accepted and would have skewed the product average.
    rating: int = Field(ge=1, le=5)
    comment: SafeText = Field(min_length=3, max_length=2000)
    # Optional: the endpoint falls back to the signed-in customer's name.
    author_name: Optional[SafeText] = Field(default=None, max_length=120)


class ReviewResponse(BaseModel):
    id: UUID
    product_id: UUID
    author_name: str
    rating: int
    comment: str
    verified_purchase: bool
    created_at: datetime

    class Config:
        from_attributes = True


class QuestionCreate(BaseModel):
    product_id: UUID
    asker_name: SafeText = Field(min_length=2, max_length=120)
    question: SafeText = Field(min_length=5, max_length=1000)


class QuestionAnswerUpdate(BaseModel):
    answer: SafeText = Field(min_length=1, max_length=2000)
    published: bool = True


class QuestionResponse(BaseModel):
    id: UUID
    product_id: UUID
    asker_name: str
    question: str
    answer: Optional[str] = None
    published: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PromotionValidate(BaseModel):
    code: PromoCode
    subtotal: float = Field(ge=0)


class PromotionCreate(BaseModel):
    code: PromoCode
    description: Optional[SafeText] = Field(default=None, max_length=255)
    discount_type: Literal["percentage", "fixed"] = "percentage"
    discount_value: float = Field(gt=0)
    min_order_amount: float = Field(default=0.0, ge=0)
    # The column existed and was read by nothing, so every code was permanent.
    valid_until: Optional[datetime] = None
    is_active: bool = True

    @model_validator(mode="after")
    def _cap_percentage(self):
        if self.discount_type == "percentage" and self.discount_value > MAX_PERCENTAGE_DISCOUNT:
            raise ValueError("A percentage discount cannot exceed 100%.")
        return self


class PromotionResponse(BaseModel):
    id: UUID
    code: str
    description: Optional[str] = None
    discount_type: str
    discount_value: float
    min_order_amount: float
    is_valid: bool
    calculated_discount: float


class PromotionFullResponse(BaseModel):
    id: UUID
    code: str
    description: Optional[str] = None
    discount_type: str
    discount_value: float
    min_order_amount: float
    valid_until: Optional[datetime] = None
    is_active: bool

    class Config:
        from_attributes = True
