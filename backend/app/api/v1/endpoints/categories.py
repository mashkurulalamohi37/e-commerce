from typing import Any, List
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.category import Category, Brand
from app.schemas.category import CategoryCreate, CategoryResponse, BrandCreate, BrandResponse
from app.api.v1.endpoints.auth import get_current_admin

router = APIRouter()


async def _require_free_slug(db: AsyncSession, model, slug: str, noun: str) -> None:
    """Reject a slug that is already taken, before the database does.

    The unique constraint was left to fire on its own, so an admin who reused a
    slug got "Internal Server Error" — where the products endpoint, for the same
    mistake, already said "Product slug already exists".
    """
    existing = (await db.execute(select(model).where(model.slug == slug))).scalars().first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A {noun} with the slug '{slug}' already exists.",
        )


# Categories
@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)) -> Any:
    result = await db.execute(select(Category).order_by(Category.sort_order.asc()))
    return result.scalars().all()


@router.post("/categories", response_model=CategoryResponse, dependencies=[Depends(get_current_admin)])
async def create_category(category_in: CategoryCreate, db: AsyncSession = Depends(get_db)) -> Any:
    await _require_free_slug(db, Category, category_in.slug, "category")
    db_cat = Category(**category_in.model_dump())
    db.add(db_cat)
    await db.commit()
    await db.refresh(db_cat)
    return db_cat


# Brands
@router.get("/brands", response_model=List[BrandResponse])
async def list_brands(db: AsyncSession = Depends(get_db)) -> Any:
    result = await db.execute(select(Brand).order_by(Brand.sort_order.asc()))
    return result.scalars().all()


@router.post("/brands", response_model=BrandResponse, dependencies=[Depends(get_current_admin)])
async def create_brand(brand_in: BrandCreate, db: AsyncSession = Depends(get_db)) -> Any:
    await _require_free_slug(db, Brand, brand_in.slug, "brand")
    db_brand = Brand(**brand_in.model_dump())
    db.add(db_brand)
    await db.commit()
    await db.refresh(db_brand)
    return db_brand
