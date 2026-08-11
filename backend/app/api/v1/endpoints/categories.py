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

# Categories
@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)) -> Any:
    result = await db.execute(select(Category).order_by(Category.sort_order.asc()))
    return result.scalars().all()


@router.post("/categories", response_model=CategoryResponse, dependencies=[Depends(get_current_admin)])
async def create_category(category_in: CategoryCreate, db: AsyncSession = Depends(get_db)) -> Any:
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
    db_brand = Brand(**brand_in.model_dump())
    db.add(db_brand)
    await db.commit()
    await db.refresh(db_brand)
    return db_brand
