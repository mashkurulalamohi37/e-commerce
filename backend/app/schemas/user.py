from typing import Optional
from uuid import UUID
from datetime import datetime
import re
from pydantic import BaseModel, EmailStr, Field, field_validator


COMMON_WEAK_PASSWORDS = {
    "password", "12345678", "123456789", "qwertyuiop", "admin12345", "password123"
}


def _check_password_strength(password: str) -> str:
    cleaned = password.strip()
    if len(cleaned) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    if cleaned.lower() in COMMON_WEAK_PASSWORDS:
        raise ValueError("This password is too common and easily guessed. Please choose a stronger one.")
    if len(set(cleaned)) < 4:
        raise ValueError("Password must not be composed of repeating identical characters.")
    # For short passwords under 12 characters, require a mix of letters and numbers/symbols
    if len(cleaned) < 12:
        has_letter = bool(re.search(r"[a-zA-Z]", cleaned))
        has_other = bool(re.search(r"[^a-zA-Z]", cleaned))
        if not (has_letter and has_other):
            raise ValueError("Passwords under 12 characters must contain a mix of letters and numbers or symbols.")
    return password


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    phone: Optional[str] = None


class UserCreate(UserBase):
    # Upper bound is bcrypt's 72-byte truncation limit: without it, two passwords
    # sharing a 72-byte prefix would be interchangeable at login.
    password: str = Field(min_length=8, max_length=72)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        return _check_password_strength(v)


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

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        return _check_password_strength(v)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    sub: Optional[str] = None
