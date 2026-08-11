from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    phone: Optional[str] = None


class UserCreate(UserBase):
    # Upper bound is bcrypt's 72-byte truncation limit: without it, two passwords
    # sharing a 72-byte prefix would be interchangeable at login.
    password: str = Field(min_length=8, max_length=72)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None


class UserResponse(UserBase):
    id: UUID
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordReset(BaseModel):
    token: str = Field(min_length=1, max_length=2048)
    new_password: str = Field(min_length=8, max_length=72)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    sub: Optional[str] = None
