from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.auth import get_current_admin
from app.db.session import get_db
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.schemas.analytics import AdminAnalytics

router = APIRouter()

PAID = "paid"


@router.get("/", response_model=AdminAnalytics, dependencies=[Depends(get_current_admin)])
async def admin_analytics(
    db: AsyncSession = Depends(get_db),
    days: int = Query(default=30, ge=7, le=180),
) -> Any:
    since = datetime.now(timezone.utc) - timedelta(days=days)

    orders = (
        (await db.execute(select(Order).where(Order.created_at >= since))).scalars().all()
    )
    paid_orders = [o for o in orders if o.payment_status == PAID]
    revenue = sum(o.total for o in paid_orders)

    # Zero-fill the range so the chart shows quiet days rather than skipping them.
    by_day: dict[str, dict[str, float]] = {}
    today = datetime.now(timezone.utc).date()
    for offset in range(days - 1, -1, -1):
        key = (today - timedelta(days=offset)).isoformat()
        by_day[key] = {"date": key, "orders": 0, "revenue": 0.0}

    for order in paid_orders:
        key = order.created_at.date().isoformat()
        if key in by_day:
            by_day[key]["orders"] += 1
            by_day[key]["revenue"] += order.total

    top_rows = (
        await db.execute(
            select(
                OrderItem.name,
                func.sum(OrderItem.qty).label("units"),
                func.sum(OrderItem.qty * OrderItem.unit_price).label("revenue"),
            )
            .join(Order, Order.id == OrderItem.order_id)
            .where(Order.payment_status == PAID, Order.created_at >= since)
            .group_by(OrderItem.name)
            .order_by(func.sum(OrderItem.qty * OrderItem.unit_price).desc())
            .limit(8)
        )
    ).all()

    low_stock_rows = (
        await db.execute(
            select(Product.name, Product.stock)
            .where(Product.published == True)
            .order_by(Product.stock.asc())
            .limit(6)
        )
    ).all()

    return {
        "range_days": days,
        "totals": {
            "revenue": revenue,
            "paid_orders": len(paid_orders),
            "total_orders": len(orders),
            "aov": round(revenue / len(paid_orders)) if paid_orders else 0,
            # Payment success is measured against orders that were meant to be
            # paid online; COD is excluded because it is never "paid" at checkout.
            "payment_success_rate": (
                len(paid_orders) / len([o for o in orders if o.payment_method != "cod"])
                if any(o.payment_method != "cod" for o in orders)
                else 0.0
            ),
        },
        "sales_by_day": list(by_day.values()),
        "top_products": [
            {"name": r.name, "units": int(r.units or 0), "revenue": float(r.revenue or 0)}
            for r in top_rows
        ],
        "low_stock": [{"name": r.name, "stock": r.stock} for r in low_stock_rows],
    }
