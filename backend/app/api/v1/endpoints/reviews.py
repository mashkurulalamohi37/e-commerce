from datetime import datetime, timezone
from typing import Any, List
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select

from app.core.limiter import limiter
from app.db.session import get_db
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.review import Review, Question, Promotion
from app.schemas.review import (
    MAX_PERCENTAGE_DISCOUNT,
    ReviewCreate, ReviewResponse,
    QuestionCreate, QuestionAnswerUpdate, QuestionResponse,
    PromotionCreate, PromotionFullResponse, PromotionValidate, PromotionResponse
)
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user, get_current_admin

router = APIRouter()


async def _require_product(db: AsyncSession, product_id: uuid.UUID) -> Product:
    """Resolve a product id or 404.

    Nothing checked this before, so a review or question could be written
    against any id at all. Besides the obvious orphan rows, one specific id —
    the all-zero UUID — was stored by SQLite as an integer and then crashed
    every subsequent read of the table, taking the admin moderation panels down
    permanently. See app/db/types.py for the storage-layer half of that fix.
    """
    product = (await db.execute(select(Product).where(Product.id == product_id))).scalars().first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="That product no longer exists."
        )
    return product


async def _refresh_product_rating(db: AsyncSession, product_id: uuid.UUID) -> None:
    """Recompute the cached rating and review count for one product.

    Both columns kept their seeded defaults forever, so every product advertised
    5.0 stars and 0 reviews on the card and the detail page while the review
    list underneath showed something else entirely.
    """
    row = (
        await db.execute(
            select(func.avg(Review.rating), func.count(Review.id)).where(
                Review.product_id == product_id, Review.published == True
            )
        )
    ).one()
    average, count = row[0], row[1] or 0

    product = (await db.execute(select(Product).where(Product.id == product_id))).scalars().first()
    if product:
        # With no published reviews, fall back to the neutral default rather
        # than showing a zero-star product.
        product.rating = round(float(average), 2) if average is not None else 5.0
        product.reviews_count = int(count)
        db.add(product)


async def _has_purchased(db: AsyncSession, user_id: uuid.UUID, product_id: uuid.UUID) -> bool:
    """True when this customer has an order for this product that was paid or delivered."""
    found = (
        await db.execute(
            select(Order.id)
            .join(OrderItem, OrderItem.order_id == Order.id)
            .where(
                Order.user_id == user_id,
                OrderItem.product_id == product_id,
                Order.status != "cancelled",
            )
            .limit(1)
        )
    ).scalars().first()
    return found is not None


# Reviews
@router.get("/reviews/{product_id}", response_model=List[ReviewResponse])
async def list_product_reviews(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> Any:
    result = await db.execute(
        select(Review).where(Review.product_id == product_id, Review.published == True).order_by(Review.created_at.desc())
    )
    return result.scalars().all()


@router.post("/reviews", response_model=ReviewResponse)
@limiter.limit("10/hour")
async def create_review(
    request: Request,
    review_in: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    await _require_product(db, review_in.product_id)

    # One review per customer per product. Six identical reviews in a burst were
    # all accepted, which is the whole of what a ratings-spam attack needs.
    already = (
        await db.execute(
            select(Review.id).where(
                Review.product_id == review_in.product_id, Review.user_id == current_user.id
            ).limit(1)
        )
    ).scalars().first()
    if already:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reviewed this product. Edit or delete your existing review instead.",
        )

    db_review = Review(
        product_id=review_in.product_id,
        user_id=current_user.id,
        author_name=review_in.author_name or current_user.full_name or "Customer",
        rating=review_in.rating,
        comment=review_in.comment,
        # Was hardcoded False, so the badge could never appear on any review.
        verified_purchase=await _has_purchased(db, current_user.id, review_in.product_id),
        published=True
    )
    db.add(db_review)
    await db.flush()
    await _refresh_product_rating(db, review_in.product_id)
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
@limiter.limit("10/hour")
async def ask_question(
    request: Request,
    question_in: QuestionCreate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    await _require_product(db, question_in.product_id)

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
    product_id = review.product_id
    await db.delete(review)
    await db.flush()
    # Moderating a review away has to move the average it contributed to.
    await _refresh_product_rating(db, product_id)
    await db.commit()
    return {"message": "Review deleted"}


@router.get("/questions/admin/list", response_model=List[QuestionResponse], dependencies=[Depends(get_current_admin)])
async def list_all_admin_questions(db: AsyncSession = Depends(get_db)) -> Any:
    result = await db.execute(select(Question).order_by(Question.created_at.desc()))
    return result.scalars().all()


# Promotions
def promo_discount(promo: Promotion, subtotal: float) -> float:
    """The discount this code is worth on this subtotal.

    Clamped to the subtotal in one place so the quote the customer sees at
    checkout and the amount the order actually applies cannot disagree — the
    validator used to advertise an uncapped figure while the order path clamped.
    """
    if promo.discount_type == "percentage":
        rate = min(promo.discount_value, MAX_PERCENTAGE_DISCOUNT)
        raw = (subtotal * rate) / 100.0
    else:
        raw = promo.discount_value
    return round(min(max(raw, 0.0), subtotal), 2)


def promo_is_live(promo: Promotion) -> bool:
    """Active, and not past its end date."""
    if not promo.is_active:
        return False
    if promo.valid_until is None:
        return True
    expiry = promo.valid_until
    # SQLite hands back naive datetimes; treat those as UTC.
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    return expiry > datetime.now(timezone.utc)


async def find_live_promotion(db: AsyncSession, code: str) -> Promotion | None:
    """Look a code up the way customers type it — case-insensitively."""
    promo = (
        await db.execute(select(Promotion).where(Promotion.code == code.strip().upper()))
    ).scalars().first()
    return promo if promo and promo_is_live(promo) else None


@router.post("/promotions/validate", response_model=PromotionResponse)
async def validate_promotion(
    promo_in: PromotionValidate, db: AsyncSession = Depends(get_db)
) -> Any:
    promo = await find_live_promotion(db, promo_in.code)

    if not promo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="That promo code is not valid or has expired.",
        )
    if promo_in.subtotal < promo.min_order_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Minimum order amount for code '{promo.code}' is {promo.min_order_amount:g} BDT"
        )

    return {
        "id": promo.id,
        "code": promo.code,
        "description": promo.description,
        "discount_type": promo.discount_type,
        "discount_value": promo.discount_value,
        "min_order_amount": promo.min_order_amount,
        "is_valid": True,
        "calculated_discount": promo_discount(promo, promo_in.subtotal),
    }


@router.get(
    "/promotions/admin/list",
    response_model=List[PromotionFullResponse],
    dependencies=[Depends(get_current_admin)],
)
async def list_admin_promotions(db: AsyncSession = Depends(get_db)) -> Any:
    result = await db.execute(select(Promotion).order_by(Promotion.code.asc()))
    return result.scalars().all()


@router.post(
    "/promotions",
    response_model=PromotionFullResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(get_current_admin)],
)
async def create_promotion(
    promo_in: PromotionCreate, db: AsyncSession = Depends(get_db)
) -> Any:
    """Create a coupon.

    The body used to be an untyped `dict` that ran `float()` over whatever
    arrived, so a non-numeric discount raised ValueError and returned 500. It
    also had no response_model, which meant a successful create still answered
    500 while committing the row — so the admin retried and was told the code
    already existed.
    """
    existing = (
        await db.execute(select(Promotion).where(Promotion.code == promo_in.code))
    ).scalars().first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Promo code '{promo_in.code}' already exists.",
        )

    promo = Promotion(**promo_in.model_dump())
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
