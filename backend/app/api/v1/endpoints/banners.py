from datetime import datetime, timezone
from typing import Any, List
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, select

from app.db.session import get_db
from app.models.banner import Banner
from app.schemas.category import BannerCreate, BannerReorder, BannerResponse
from app.api.v1.endpoints.auth import get_current_admin

router = APIRouter()


@router.get("/", response_model=List[BannerResponse])
async def list_banners(db: AsyncSession = Depends(get_db)) -> Any:
    """Public banners: active, and inside their scheduled window.

    starts_at / ends_at were being ignored here, so a banner scheduled for next
    month — or one that finished last week — still appeared on the storefront.
    """
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(Banner)
        .where(
            Banner.active == True,
            or_(Banner.starts_at.is_(None), Banner.starts_at <= now),
            or_(Banner.ends_at.is_(None), Banner.ends_at > now),
        )
        .order_by(Banner.sort_order.asc())
    )
    return result.scalars().all()


@router.get("/admin/list", response_model=List[BannerResponse], dependencies=[Depends(get_current_admin)])
async def list_admin_banners(db: AsyncSession = Depends(get_db)) -> Any:
    """Every banner, including inactive and scheduled ones."""
    result = await db.execute(
        select(Banner).order_by(Banner.placement.asc(), Banner.sort_order.asc())
    )
    return result.scalars().all()


@router.post("/", response_model=BannerResponse, dependencies=[Depends(get_current_admin)])
async def create_banner(banner_in: BannerCreate, db: AsyncSession = Depends(get_db)) -> Any:
    db_banner = Banner(**banner_in.model_dump())
    db.add(db_banner)
    await db.commit()
    await db.refresh(db_banner)
    return db_banner


@router.put("/{banner_id}", response_model=BannerResponse, dependencies=[Depends(get_current_admin)])
async def update_banner(
    banner_id: uuid.UUID, banner_in: BannerCreate, db: AsyncSession = Depends(get_db)
) -> Any:
    result = await db.execute(select(Banner).where(Banner.id == banner_id))
    banner = result.scalars().first()
    if not banner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Banner not found")

    for field, value in banner_in.model_dump().items():
        setattr(banner, field, value)

    db.add(banner)
    await db.commit()
    await db.refresh(banner)
    return banner


@router.post("/reorder", dependencies=[Depends(get_current_admin)])
async def reorder_banners(payload: BannerReorder, db: AsyncSession = Depends(get_db)) -> Any:
    """Persist a drag-and-drop ordering for one placement."""
    result = await db.execute(
        select(Banner).where(Banner.id.in_(payload.ids), Banner.placement == payload.placement)
    )
    found = {b.id: b for b in result.scalars().all()}

    missing = [str(i) for i in payload.ids if i not in found]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown banner(s) for this placement: {', '.join(missing)}",
        )

    for index, banner_id in enumerate(payload.ids):
        found[banner_id].sort_order = index + 1
        db.add(found[banner_id])

    await db.commit()
    return {"message": "Order saved"}


@router.delete("/{banner_id}", dependencies=[Depends(get_current_admin)])
async def delete_banner(banner_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> Any:
    result = await db.execute(select(Banner).where(Banner.id == banner_id))
    banner = result.scalars().first()
    if not banner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Banner not found")

    await db.delete(banner)
    await db.commit()
    return {"message": "Banner deleted successfully"}
