from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, EmailStr, Field

# --- Auth Schemas ---
class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Question Schemas ---
class QuestionCreate(BaseModel):
    prompt: str
    pinyin: Optional[str] = None
    correct_answer: str
    options: List[str]
    meta_info: Optional[dict] = None
    time_limit: Optional[int] = None

class QuestionResponse(BaseModel):
    id: int
    quiz_id: int
    prompt: str
    pinyin: Optional[str] = None
    correct_answer: str
    options: List[str]
    meta_info: Optional[dict] = None
    time_limit: Optional[int] = None

    class Config:
        from_attributes = True

# --- Quiz Schemas ---
class QuizCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = None
    game_mode: str = "hanzi_to_pinyin" # "hanzi_to_pinyin", "listening", "sentence_builder", "radical_match"
    default_time_limit: int = 15
    questions: List[QuestionCreate]

class QuizResponse(BaseModel):
    id: int
    creator_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    game_mode: str
    default_time_limit: int
    created_at: datetime
    questions: List[QuestionResponse] = []

    class Config:
        from_attributes = True

Token.model_rebuild()
