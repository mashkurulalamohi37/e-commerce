from typing import Any, List
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.review import Review, Question, Promotion
from app.schemas.review import (
    ReviewCreate, ReviewResponse,
    QuestionCreate, QuestionAnswerUpdate, QuestionResponse,
    PromotionValidate, PromotionResponse
)
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user, get_current_admin

router = APIRouter()


# Reviews
@router.get("/reviews/{product_id}", response_model=List[ReviewResponse])
async def list_product_reviews(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> Any:
    result = await db.execute(
        select(Review).where(Review.product_id == product_id, Review.published == True).order_by(Review.created_at.desc())
    )
    return result.scalars().all()


@router.post("/reviews", response_model=ReviewResponse)
async def create_review(
    review_in: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    db_review = Review(
        product_id=review_in.product_id,
        user_id=current_user.id,
        author_name=review_in.author_name or current_user.full_name or "Customer",
        rating=review_in.rating,
        comment=review_in.comment,
        published=True
    )
    db.add(db_review)
    await db.commit()
    await db.refresh(db_review)
    return db_review


# Q&A
@router.get("/questions/{product_id}", response_model=List[QuestionResponse])
async def list_product_questions(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> Any:
    result = await db.execute(
        select(Question).where(Question.product_id == product_id, Question.published == True).order_by(Question.created_at.desc())
    )
    return result.scalars().all()


@router.post("/questions", response_model=QuestionResponse)
async def ask_question(
    question_in: QuestionCreate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    db_q = Question(
        product_id=question_in.product_id,
        asker_name=question_in.asker_name,
        question=question_in.question,
        published=True
    )
    db.add(db_q)
    await db.commit()
    await db.refresh(db_q)
    return db_q


@router.patch("/questions/{question_id}/answer", response_model=QuestionResponse, dependencies=[Depends(get_current_admin)])
async def answer_question(
    question_id: uuid.UUID,
    answer_in: QuestionAnswerUpdate,
    db: AsyncSession = Depends(get_db)
) -> Any:
    result = await db.execute(select(Question).where(Question.id == question_id))
    q = result.scalars().first()
    if not q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    q.answer = answer_in.answer
    q.published = answer_in.published
    db.add(q)
    await db.commit()
    await db.refresh(q)
    return q


# Admin Review & Q&A Moderation
@router.get("/reviews/admin/list", response_model=List[ReviewResponse], dependencies=[Depends(get_current_admin)])
async def list_all_admin_reviews(db: AsyncSession = Depends(get_db)) -> Any:
    result = await db.execute(select(Review).order_by(Review.created_at.desc()))
    return result.scalars().all()


@router.delete("/reviews/{review_id}", dependencies=[Depends(get_current_admin)])
async def delete_review(review_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> Any:
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalars().first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    await db.delete(review)
    await db.commit()
    return {"message": "Review deleted"}


@router.get("/questions/admin/list", response_model=List[QuestionResponse], dependencies=[Depends(get_current_admin)])
async def list_all_admin_questions(db: AsyncSession = Depends(get_db)) -> Any:
    result = await db.execute(select(Question).order_by(Question.created_at.desc()))
    return result.scalars().all()


# Promotions
@router.post("/promotions/validate", response_model=PromotionResponse)
async def validate_promotion(
    promo_in: PromotionValidate, db: AsyncSession = Depends(get_db)
) -> Any:
    result = await db.execute(select(Promotion).where(Promotion.code == promo_in.code, Promotion.is_active == True))
    promo = result.scalars().first()

    if not promo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid promo code")
    if promo_in.subtotal < promo.min_order_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Minimum order amount for code '{promo.code}' is {promo.min_order_amount} BDT"
        )

    calc_discount = (promo_in.subtotal * promo.discount_value / 100.0) if promo.discount_type == "percentage" else promo.discount_value

    return {
        "id": promo.id,
        "code": promo.code,
        "description": promo.description,
        "discount_type": promo.discount_type,
        "discount_value": promo.discount_value,
        "min_order_amount": promo.min_order_amount,
        "is_valid": True,
        "calculated_discount": calc_discount
    }


@router.get("/promotions/admin/list", dependencies=[Depends(get_current_admin)])
async def list_admin_promotions(db: AsyncSession = Depends(get_db)) -> Any:
    result = await db.execute(select(Promotion).order_by(Promotion.code.asc()))
    return result.scalars().all()


@router.post("/promotions", dependencies=[Depends(get_current_admin)])
async def create_promotion(
    promo_in: dict, db: AsyncSession = Depends(get_db)
) -> Any:
    code = str(promo_in.get("code", "")).upper().strip()
    if not code:
        raise HTTPException(status_code=400, detail="Promo code is required")
    
    existing = (await db.execute(select(Promotion).where(Promotion.code == code))).scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="Promo code already exists")
    
    promo = Promotion(
        code=code,
        description=promo_in.get("description", ""),
        discount_type=promo_in.get("discount_type", "percentage"),
        discount_value=float(promo_in.get("discount_value", 10.0)),
        min_order_amount=float(promo_in.get("min_order_amount", 0.0)),
        is_active=bool(promo_in.get("is_active", True))
    )
    db.add(promo)
    await db.commit()
    await db.refresh(promo)
    return promo


@router.delete("/promotions/{promo_id}", dependencies=[Depends(get_current_admin)])
async def delete_promotion(promo_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> Any:
    result = await db.execute(select(Promotion).where(Promotion.id == promo_id))
    promo = result.scalars().first()
    if not promo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Promo code not found")
    await db.delete(promo)
    await db.commit()
    return {"message": "Promo code deleted"}
