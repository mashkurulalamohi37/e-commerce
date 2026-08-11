import uuid
from datetime import timedelta
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core import security
from app.core.config import settings
from app.core.mailer import send_password_reset_email
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import (
    PasswordReset,
    PasswordResetRequest,
    Token,
    UserCreate,
    UserResponse,
)

router = APIRouter()
reusable_oauth2 = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")
reusable_oauth2_optional = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)


async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> User:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        user_id = uuid.UUID(user_id_str) if isinstance(user_id_str, str) else user_id_str
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return user


async def get_optional_current_user(
    db: AsyncSession = Depends(get_db), token: Optional[str] = Depends(reusable_oauth2_optional)
) -> Optional[User]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str: str = payload.get("sub")
        if not user_id_str:
            return None
        user_id = uuid.UUID(user_id_str) if isinstance(user_id_str, str) else user_id_str
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalars().first()
    except Exception:
        return None


async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return current_user



@router.post("/register", response_model=Token)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)) -> Any:
    result = await db.execute(select(User).where(User.email == user_in.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    db_user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        phone=user_in.phone,
        role="customer"
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)

    access_token = security.create_access_token(subject=db_user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)
) -> Any:
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user account")

    access_token = security.create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserResponse)
async def read_user_me(current_user: User = Depends(get_current_user)) -> Any:
    return current_user


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
async def forgot_password(payload: PasswordResetRequest, db: AsyncSession = Depends(get_db)) -> Any:
    """Start a password reset.

    Always reports the same result whether or not the address exists — a
    different response for unknown emails turns this into an account oracle.
    The token is never returned in the response body; it is delivered out of band.
    """
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalars().first()

    if user and user.is_active:
        token = security.create_password_reset_token(user.id, user.hashed_password)
        await send_password_reset_email(user.email, token)

    return {"message": "If that email is registered, a reset link is on its way."}


@router.post("/reset-password")
async def reset_password(payload: PasswordReset, db: AsyncSession = Depends(get_db)) -> Any:
    # The token carries the user id, but it only verifies against that user's
    # current password hash — so a token cannot be replayed after use.
    unverified_id = security.peek_token_subject(payload.token)
    user = None
    if unverified_id:
        result = await db.execute(select(User).where(User.id == unverified_id))
        user = result.scalars().first()

    if not user or not security.read_password_reset_token(payload.token, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This reset link is invalid or has expired. Please request a new one.",
        )

    user.hashed_password = security.get_password_hash(payload.new_password)
    db.add(user)
    await db.commit()

    return {"message": "Password updated. You can now sign in."}
