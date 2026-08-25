from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class GoogleLoginIn(BaseModel):
    credential: str


class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None

    class Config:
        from_attributes = True
