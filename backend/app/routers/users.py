from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import User
from app.schemas.schemas import UserSummary
from app.auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("", response_model=List[UserSummary])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    users = db.query(User).order_by(User.name.asc()).all()
    return [UserSummary(id=u.id, name=u.name, email=u.email) for u in users]