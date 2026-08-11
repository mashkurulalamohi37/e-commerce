from fastapi import APIRouter
from app.api.v1.endpoints import (
    analytics,
    auth,
    products,
    categories,
    banners,
    orders,
    reviews,
    uploads
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["admin analytics"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(categories.router, prefix="/catalog", tags=["categories & brands"])
api_router.include_router(banners.router, prefix="/banners", tags=["banners"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(reviews.router, prefix="/feedback", tags=["reviews, questions & promos"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["file uploads"])
