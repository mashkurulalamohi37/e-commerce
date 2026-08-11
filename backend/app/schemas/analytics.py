from typing import List

from pydantic import BaseModel


class SalesPoint(BaseModel):
    date: str
    orders: int
    revenue: float


class TopProduct(BaseModel):
    name: str
    units: int
    revenue: float


class LowStockItem(BaseModel):
    name: str
    stock: int


class AnalyticsTotals(BaseModel):
    revenue: float
    paid_orders: int
    total_orders: int
    aov: float
    payment_success_rate: float


class AdminAnalytics(BaseModel):
    range_days: int
    totals: AnalyticsTotals
    sales_by_day: List[SalesPoint]
    top_products: List[TopProduct]
    low_stock: List[LowStockItem]
