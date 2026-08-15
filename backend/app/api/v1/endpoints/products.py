from typing import Any, List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func, String

from app.db.session import get_db
from app.models.category import Brand
from app.models.product import Product
from app.models.user import User
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.api.v1.endpoints.auth import get_current_admin, get_optional_current_user

router = APIRouter()


@router.get("/", response_model=List[ProductResponse])
async def list_products(
    db: AsyncSession = Depends(get_db),
    category: Optional[str] = None,
    brand: Optional[str] = None,
    search: Optional[str] = None,
    on_offer: Optional[bool] = None,
    best_seller: Optional[bool] = None,
    # Unbounded page size and negative offsets both reached the query untouched.
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
) -> Any:
    query = select(Product).where(Product.published == True)

    if category:
        # Cross-DB compatible category filter in JSON array.
        #
        # Products store display names ("Skin Care") while the storefront routes
        # on slugs ("skin-care"). Comparing them raw only worked for
        # single-word categories — "makeup" matched "Makeup" case-insensitively,
        # but "skin-care" never matched "Skin Care", so every multi-word
        # department returned an empty page. Normalise both sides: lower-case
        # and turn spaces into hyphens before comparing.
        normalised = func.replace(func.lower(Product.categories.cast(String)), " ", "-")
        needle = f'%"{category.strip().lower().replace(" ", "-")}"%'
        query = query.where(normalised.like(needle))

    if brand:
        query = query.where(Product.brand_slug == brand)
    if on_offer is not None:
        query = query.where(Product.on_offer == on_offer)
    if best_seller is not None:
        query = query.where(Product.best_seller == best_seller)
    if search:
        # Shoppers search by brand ("Hikari") and by concern ("acne") as often as
        # by product name, so the brand and the JSON category/concern arrays are
        # part of the match, not just name/brief/sku.
        pattern = f"%{search}%"
        query = query.where(
            or_(
                Product.name.ilike(pattern),
                Product.brief.ilike(pattern),
                Product.sku.ilike(pattern),
                Product.brand_slug.ilike(pattern),
                Product.categories.cast(String).ilike(pattern),
                Product.concerns.cast(String).ilike(pattern),
                # Brand display name too — "Radiant Skin Co." never matches the
                # "radiant-skin-co" slug on its own.
                Product.brand_slug.in_(select(Brand.slug).where(Brand.name.ilike(pattern))),
            )
        )

    query = query.order_by(Product.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    products = result.scalars().all()
    return products


@router.get("/admin/list", response_model=List[ProductResponse], dependencies=[Depends(get_current_admin)])
async def list_admin_products(
    db: AsyncSession = Depends(get_db),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=200, ge=1, le=500),
) -> Any:
    """Every product, published or not.

    The public list filters on `published`, so an admin who unpublished a product
    watched it vanish from their own table with no way to bring it back.
    """
    query = select(Product).order_by(Product.name).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/by-slug/{slug}", response_model=ProductResponse)
async def get_product_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
    viewer: Optional[User] = Depends(get_optional_current_user),
) -> Any:
    """Public product lookup, with an admin preview.

    The list endpoint filtered on `published` and this one did not, so a draft
    product — unreleased pricing, an unannounced launch — was readable by anyone
    who knew or guessed the slug. Admins keep the preview so an unpublished
    product can still be checked before it goes live.
    """
    result = await db.execute(select(Product).where(Product.slug == slug))
    product = result.scalars().first()
    is_admin = viewer is not None and viewer.role == "admin"
    if not product or (not product.published and not is_admin):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.post("/", response_model=ProductResponse, dependencies=[Depends(get_current_admin)])
async def create_product(product_in: ProductCreate, db: AsyncSession = Depends(get_db)) -> Any:
    # Check slug uniqueness
    res_slug = await db.execute(select(Product).where(Product.slug == product_in.slug))
    if res_slug.scalars().first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product slug already exists")

    # Check SKU uniqueness
    res_sku = await db.execute(select(Product).where(Product.sku == product_in.sku))
    if res_sku.scalars().first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product SKU already exists")

    db_product = Product(**product_in.model_dump())
    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)
    return db_product



@router.put("/{product_id}", response_model=ProductResponse, dependencies=[Depends(get_current_admin)])
async def update_product(
    product_id: uuid.UUID, product_in: ProductUpdate, db: AsyncSession = Depends(get_db)
) -> Any:
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    update_data = product_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@router.delete("/{product_id}", dependencies=[Depends(get_current_admin)])
async def delete_product(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> Any:
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    await db.delete(product)
    await db.commit()
    return {"message": "Product deleted successfully"}
