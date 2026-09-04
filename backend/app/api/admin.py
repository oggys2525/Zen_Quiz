from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.db import get_db
from app.core.security import get_current_admin, hash_password
from app.models.models import User, Quiz, Question
from app.schemas.schemas import (
    UserResponse,
    UserAdminCreate,
    UserAdminUpdate,
    UserPasswordReset,
    AdminStatsResponse,
    QuizResponse,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == 1, User.status == "active").count()
    suspended_users = db.query(User).filter((User.is_active == 0) | (User.status == "suspended")).count()
    
    # Official / Admin quizzes only (exclude teacher-created quizzes)
    total_quizzes = db.query(Quiz).outerjoin(User, Quiz.creator_id == User.id).filter(
        (Quiz.creator_id.is_(None)) | (User.role == "admin")
    ).count()

    total_questions = db.query(Question).join(Quiz, Question.quiz_id == Quiz.id).outerjoin(User, Quiz.creator_id == User.id).filter(
        (Quiz.creator_id.is_(None)) | (User.role == "admin")
    ).count()

    # Role distribution
    roles = db.query(User.role, func.count(User.id)).group_by(User.role).all()
    role_dist = {r[0] or "teacher": r[1] for r in roles}

    # Status distribution
    statuses = db.query(User.status, func.count(User.id)).group_by(User.status).all()
    status_dist = {s[0] or "active": s[1] for s in statuses}

    return AdminStatsResponse(
        total_users=total_users,
        active_users=active_users,
        suspended_users=suspended_users,
        total_quizzes=total_quizzes,
        total_questions=total_questions,
        role_distribution=role_dist,
        status_distribution=status_dist,
    )

@router.get("/users", response_model=List[UserResponse])
def list_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(User)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter((User.username.ilike(s)) | (User.email.ilike(s)))

    if role and role != "all":
        query = query.filter(User.role == role)

    if status and status != "all":
        query = query.filter(User.status == status)

    users = query.order_by(User.id.desc()).offset(skip).limit(limit).all()
    return [UserResponse.model_validate(u) for u in users]

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user_by_admin(
    payload: UserAdminCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Check username uniqueness
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")

    # Check email uniqueness
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        status=payload.status,
        is_active=1 if payload.is_active else 0
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)

@router.get("/users/{user_id}", response_model=UserResponse)
def get_user_detail(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.model_validate(user)

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user_by_admin(
    user_id: int,
    payload: UserAdminUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.username and payload.username != user.username:
        existing = db.query(User).filter(User.username == payload.username, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        user.username = payload.username

    if payload.email and payload.email != user.email:
        existing = db.query(User).filter(User.email == payload.email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already taken")
        user.email = payload.email

    if payload.role is not None:
        # Prevent demoting the last admin
        if user.role == "admin" and payload.role != "admin":
            admin_count = db.query(User).filter(User.role == "admin", User.is_active == 1).count()
            if admin_count <= 1:
                raise HTTPException(status_code=400, detail="Cannot demote the only active administrator")
        user.role = payload.role

    if payload.status is not None:
        if user.id == current_admin.id and payload.status == "suspended":
            raise HTTPException(status_code=400, detail="You cannot suspend your own admin account")
        user.status = payload.status
        if payload.status == "active":
            user.is_active = 1
        elif payload.status == "suspended":
            user.is_active = 0

    if payload.is_active is not None:
        if user.id == current_admin.id and not payload.is_active:
            raise HTTPException(status_code=400, detail="You cannot deactivate your own admin account")
        user.is_active = 1 if payload.is_active else 0
        if not payload.is_active:
            user.status = "suspended"
        elif user.status == "suspended":
            user.status = "active"

    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)

@router.put("/users/{user_id}/password")
def reset_user_password(
    user_id: int,
    payload: UserPasswordReset,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"message": f"Password for user '{user.username}' successfully reset"}

@router.delete("/users/{user_id}")
def delete_user_by_admin(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own admin account")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    username = user.username
    db.delete(user)
    db.commit()
    return {"message": f"User '{username}' (ID: {user_id}) and all associated quizzes deleted successfully"}

@router.get("/quizzes", response_model=List[QuizResponse])
def list_all_quizzes_admin(
    search: Optional[str] = None,
    creator_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Only return Official Sample Quizzes and Admin-Created Quizzes (exclude teacher-created quizzes)
    query = db.query(Quiz).outerjoin(User, Quiz.creator_id == User.id).filter(
        (Quiz.creator_id.is_(None)) | (User.role == "admin")
    )

    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Quiz.title.ilike(s)) | (Quiz.description.ilike(s)))
    if creator_id is not None:
        query = query.filter(Quiz.creator_id == creator_id)

    quizzes = query.order_by(Quiz.id.desc()).offset(skip).limit(limit).all()
    return [QuizResponse.model_validate(q) for q in quizzes]

@router.delete("/quizzes/{quiz_id}")
def delete_quiz_admin(
    quiz_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    title = quiz.title
    db.delete(quiz)
    db.commit()
    return {"message": f"Quiz '{title}' (ID: {quiz_id}) deleted successfully"}
