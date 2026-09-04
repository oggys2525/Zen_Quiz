from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, EmailStr, Field

# --- Auth Schemas ---
class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: Optional[str] = "teacher"

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
    role: str = "teacher"
    is_active: bool = True
    status: str = "active"
    created_at: datetime
    quizzes_count: Optional[int] = 0

    class Config:
        from_attributes = True

# --- Admin Management Schemas ---
class UserAdminCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = "teacher" # "admin", "teacher", "student"
    status: str = "active" # "active", "suspended", "pending"
    is_active: bool = True

class UserAdminUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    role: Optional[str] = None # "admin", "teacher", "student"
    status: Optional[str] = None # "active", "suspended", "pending"
    is_active: Optional[bool] = None

class UserPasswordReset(BaseModel):
    new_password: str = Field(..., min_length=6)

class AdminStatsResponse(BaseModel):
    total_users: int
    active_users: int
    suspended_users: int
    total_quizzes: int
    total_questions: int
    role_distribution: dict
    status_distribution: dict

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
