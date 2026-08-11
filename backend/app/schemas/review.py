from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class ReviewCreate(BaseModel):
    product_id: UUID
    rating: int  # 1-5
    comment: str
    author_name: str


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
    asker_name: str
    question: str


class QuestionAnswerUpdate(BaseModel):
    answer: str
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
    code: str
    subtotal: float


class PromotionCreate(BaseModel):
    code: str
    description: Optional[str] = None
    discount_type: str = "percentage"
    discount_value: float
    min_order_amount: float = 0.0
    is_active: bool = True


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
    is_active: bool

    class Config:
        from_attributes = True
