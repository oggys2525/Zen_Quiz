from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core.security import get_current_user, get_current_user_optional
from app.models.models import Quiz, Question, User
from app.schemas.schemas import QuizCreate, QuizResponse

router = APIRouter(prefix="/api/quizzes", tags=["quizzes"])

@router.get("", response_model=List[QuizResponse])
def get_quizzes(
    scope: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    query = db.query(Quiz)
    if current_user and isinstance(current_user, User):
        if scope == "my":
            query = query.filter(Quiz.creator_id == current_user.id)
        elif scope == "sample":
            query = query.filter(Quiz.creator_id.is_(None))
        else:
            # Default for logged-in users: return sample quizzes + quizzes created by this user only
            query = query.filter((Quiz.creator_id == current_user.id) | (Quiz.creator_id.is_(None)))
    else:
        if scope == "my":
            return []
        query = query.filter(Quiz.creator_id.is_(None))

    return query.order_by(Quiz.id.desc()).all()

@router.get("/{quiz_id}", response_model=QuizResponse)
def get_quiz(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz

@router.post("", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
def create_quiz(
    payload: QuizCreate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    if len(payload.questions) == 0:
        raise HTTPException(status_code=400, detail="Quiz must have at least 1 question")

    user_id = current_user.id if (current_user and isinstance(current_user, User)) else None
    quiz = Quiz(
        creator_id=user_id,
        title=payload.title,
        description=payload.description,
        game_mode=payload.game_mode,
        default_time_limit=payload.default_time_limit
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    for q_data in payload.questions:
        meta = dict(q_data.meta_info) if q_data.meta_info else {}
        if q_data.time_limit is not None:
            meta["time_limit"] = q_data.time_limit

        question = Question(
            quiz_id=quiz.id,
            prompt=q_data.prompt,
            pinyin=q_data.pinyin,
            correct_answer=q_data.correct_answer,
            options=q_data.options,
            meta_info=meta
        )
        db.add(question)
    
    db.commit()
    db.refresh(quiz)
    return quiz

@router.put("/{quiz_id}", response_model=QuizResponse)
def update_quiz(
    quiz_id: int,
    payload: QuizCreate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    if len(payload.questions) == 0:
        raise HTTPException(status_code=400, detail="Quiz must have at least 1 question")

    # Permission check: If owned by another user, deny edit
    if quiz.creator_id is not None:
        if not current_user or quiz.creator_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to edit this quiz."
            )
    else:
        # If editing a sample quiz (creator_id is None), convert it to user's personal quiz
        if current_user and isinstance(current_user, User):
            quiz.creator_id = current_user.id

    quiz.title = payload.title
    quiz.description = payload.description
    quiz.game_mode = payload.game_mode
    quiz.default_time_limit = payload.default_time_limit

    # Replace questions
    db.query(Question).filter(Question.quiz_id == quiz.id).delete()

    for q_data in payload.questions:
        meta = dict(q_data.meta_info) if q_data.meta_info else {}
        if q_data.time_limit is not None:
            meta["time_limit"] = q_data.time_limit

        question = Question(
            quiz_id=quiz.id,
            prompt=q_data.prompt,
            pinyin=q_data.pinyin,
            correct_answer=q_data.correct_answer,
            options=q_data.options,
            meta_info=meta
        )
        db.add(question)

    db.commit()
    db.refresh(quiz)
    return quiz

@router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quiz(
    quiz_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # Permission check: If owned by another user, deny deletion
    if quiz.creator_id is not None:
        if not current_user or quiz.creator_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this quiz."
            )

    db.delete(quiz)
    db.commit()
    return None

@router.post("/seed/default", response_model=List[QuizResponse])
def seed_default_quizzes(db: Session = Depends(get_db)):
    # Check if sample quizzes already exist
    existing_count = db.query(Quiz).filter(Quiz.creator_id.is_(None)).count()
    if existing_count > 0:
        return db.query(Quiz).filter(Quiz.creator_id.is_(None)).all()
        return db.query(Quiz).all()

    seeds = [
        {
            "title": "HSK 1 - Basic Hanzi & Vocabulary",
            "description": "Master essential Chinese words, pinyin, and meanings.",
            "game_mode": "hanzi_to_pinyin",
            "default_time_limit": 15,
            "questions": [
                {
                    "prompt": "你好",
                    "pinyin": "nǐ hǎo",
                    "correct_answer": "Hello",
                    "options": ["Hello", "Goodbye", "Thank you", "Sorry"]
                },
                {
                    "prompt": "谢谢",
                    "pinyin": "xiè xie",
                    "correct_answer": "Thank you",
                    "options": ["Thank you", "You're welcome", "Please", "Hello"]
                },
                {
                    "prompt": "再见",
                    "pinyin": "zài jiàn",
                    "correct_answer": "Goodbye",
                    "options": ["Goodbye", "See you tomorrow", "Good morning", "Yes"]
                },
                {
                    "prompt": "水",
                    "pinyin": "shuǐ",
                    "correct_answer": "Water",
                    "options": ["Water", "Tea", "Rice", "Apple"]
                },
                {
                    "prompt": "猫",
                    "pinyin": "māo",
                    "correct_answer": "Cat",
                    "options": ["Cat", "Dog", "Bird", "Fish"]
                }
            ]
        },
        {
            "title": "Chinese Food & Delicacies (Listening Mode)",
            "description": "Listen to spoken Chinese food names and select the correct translation.",
            "game_mode": "listening",
            "default_time_limit": 15,
            "questions": [
                {
                    "prompt": "包子",
                    "pinyin": "bāo zi",
                    "correct_answer": "Steamed Bun",
                    "options": ["Steamed Bun", "Dumpling", "Fried Rice", "Noodles"]
                },
                {
                    "prompt": "绿茶",
                    "pinyin": "lǜ chá",
                    "correct_answer": "Green Tea",
                    "options": ["Green Tea", "Boba Milk Tea", "Coffee", "Fruit Juice"]
                },
                {
                    "prompt": "饺子",
                    "pinyin": "jiǎo zi",
                    "correct_answer": "Dumpling",
                    "options": ["Dumpling", "Wonton", "Spring Roll", "Peking Duck"]
                },
                {
                    "prompt": "米饭",
                    "pinyin": "mǐ fàn",
                    "correct_answer": "Cooked Rice",
                    "options": ["Cooked Rice", "Bread", "Soup", "Porridge"]
                }
            ]
        },
        {
            "title": "Radical Match Challenge",
            "description": "Identify core Chinese radicals and their English meanings.",
            "game_mode": "radical_match",
            "default_time_limit": 10,
            "questions": [
                {
                    "prompt": "氵 (三点水)",
                    "pinyin": "sān diǎn shuǐ",
                    "correct_answer": "Water Radical",
                    "options": ["Water Radical", "Fire Radical", "Wood Radical", "Person Radical"]
                },
                {
                    "prompt": "亻 (单人旁)",
                    "pinyin": "dān rén páng",
                    "correct_answer": "Person Radical",
                    "options": ["Person Radical", "Heart Radical", "Sun Radical", "Hand Radical"]
                },
                {
                    "prompt": "木 (木字旁)",
                    "pinyin": "mù zì páng",
                    "correct_answer": "Tree/Wood Radical",
                    "options": ["Tree/Wood Radical", "Metal Radical", "Earth Radical", "Grass Radical"]
                },
                {
                    "prompt": "灬 (四点底)",
                    "pinyin": "sì diǎn dǐ",
                    "correct_answer": "Fire Radical",
                    "options": ["Fire Radical", "Water Radical", "Ice Radical", "Moon Radical"]
                }
            ]
        },
        {
            "title": "Daily Conversations & Sentence Building",
            "description": "Test your understanding of everyday Chinese sentences.",
            "game_mode": "sentence_builder",
            "default_time_limit": 20,
            "questions": [
                {
                    "prompt": "你叫什么名字？",
                    "pinyin": "nǐ jiào shén me míng zi?",
                    "correct_answer": "What is your name?",
                    "options": ["What is your name?", "Where are you going?", "How old are you?", "Who are you?"]
                },
                {
                    "prompt": "我是学生。",
                    "pinyin": "wǒ shì xué shēng.",
                    "correct_answer": "I am a student.",
                    "options": ["I am a student.", "I am a teacher.", "I love Chinese.", "He is a doctor."]
                },
                {
                    "prompt": "今天天气很好。",
                    "pinyin": "jīn tiān tiān qì hěn hǎo.",
                    "correct_answer": "The weather is very nice today.",
                    "options": ["The weather is very nice today.", "It is raining today.", "Tomorrow will be cold.", "I like summer."]
                }
            ]
        }
    ]

    created_quizzes = []
    for quiz_data in seeds:
        questions_data = quiz_data.pop("questions")
        q_obj = Quiz(**quiz_data)
        db.add(q_obj)
        db.commit()
        db.refresh(q_obj)
        for qd in questions_data:
            q_elem = Question(quiz_id=q_obj.id, **qd)
            db.add(q_elem)
        db.commit()
        db.refresh(q_obj)
        created_quizzes.append(q_obj)

    return created_quizzes
