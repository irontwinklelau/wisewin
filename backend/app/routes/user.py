"""
用户相关 API 路由
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db, UserState

router = APIRouter()


@router.get("/status")
def get_status(db: Session = Depends(get_db)):
    """获取用户状态"""
    user = db.query(UserState).filter(UserState.id == 1).first()
    if not user:
        user = UserState(id=1, level=0, streak_days=0)
        db.add(user)
        db.commit()

    return {
        "level": user.level,
        "streak_days": user.streak_days,
        "total_checkins": user.total_checkins,
        "last_checkin_date": user.last_checkin_date,
    }
