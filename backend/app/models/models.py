from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from app.core.db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    quizzes = relationship("Quiz", back_populates="creator", cascade="all, delete-orphan")

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=True) # allow system pre-seeded quizzes without creator
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    game_mode = Column(String(50), nullable=False, default="hanzi_to_pinyin") # "hanzi_to_pinyin", "listening", "sentence_builder", "radical_match"
    default_time_limit = Column(Integer, nullable=False, default=15) # 0 = untimed, 10, 15, 30, etc.
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    creator = relationship("User", back_populates="quizzes")
    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan", order_by="Question.id")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    prompt = Column(Text, nullable=False)          # Chinese text / Hanzi / Listening audio prompt
    pinyin = Column(String(100), nullable=True)     # Pinyin annotation (e.g. "nǐ hǎo")
    correct_answer = Column(Text, nullable=False)   # The correct option or sentence string
    options = Column(JSON, nullable=False)          # JSON array of choices, e.g. ["Hello", "Goodbye", "Thank you", "Sorry"]
    meta_info = Column(JSON, nullable=True)        # JSON dict storing question_type, image_url, option_images, time_limit
    quiz = relationship("Quiz", back_populates="questions")

    @property
    def time_limit(self):
        if isinstance(self.meta_info, dict) and "time_limit" in self.meta_info:
            return self.meta_info["time_limit"]
        return None
