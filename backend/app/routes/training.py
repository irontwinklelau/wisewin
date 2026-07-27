"""
训练相关 API 路由
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db, UserState, TrainingLog, Weapon, Lesson, now

router = APIRouter()


# ── 获取今日训练内容 ──

@router.get("/today")
def get_today_training(db: Session = Depends(get_db)):
    """获取今日训练内容"""
    # 获取用户状态
    user = db.query(UserState).filter(UserState.id == 1).first()
    if not user:
        user = UserState(id=1, level=0, streak_days=0)
        db.add(user)
        db.commit()

    # 查找当前应学的课程：按模块顺序 + 课程序号
    lesson = db.query(Lesson).order_by(
        Lesson.module, Lesson.lesson_index
    ).offset(user.total_checkins).first()

    if not lesson:
        return {
            "status": "no_content",
            "message": "今日暂无新课程，请复习错题本或等待内容更新",
            "user": _user_info(user),
        }

    return {
        "status": "ok",
        "lesson": {
            "id": lesson.id,
            "module": lesson.module,
            "lesson_index": lesson.lesson_index,
            "title": lesson.title,
            "content": lesson.content_json,
        },
        "user": _user_info(user),
    }


# ── 提交练习答案 ──

class ExerciseSubmit(BaseModel):
    lesson_id: int
    answer: str


@router.post("/submit")
def submit_exercise(data: ExerciseSubmit, db: Session = Depends(get_db)):
    """提交练习答案并打卡"""
    from datetime import date

    user = db.query(UserState).filter(UserState.id == 1).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户未初始化")

    lesson = db.query(Lesson).filter(Lesson.id == data.lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="课程不存在")

    today_str = date.today().isoformat()

    # 避免同一天重复打卡
    if user.last_checkin_date == today_str:
        return {"status": "already_checked_in", "message": "今天已经打卡过了"}

    # 更新连续打卡
    if user.last_checkin_date:
        last_date = date.fromisoformat(user.last_checkin_date)
        yesterday = date.today()
        from datetime import timedelta
        yesterday = date.today() - timedelta(days=1)
        if last_date == yesterday:
            user.streak_days += 1
        elif last_date == date.today():
            pass  # 同一天
        else:
            user.streak_days = 1  # 断了
    else:
        user.streak_days = 1

    user.last_checkin_date = today_str
    user.total_checkins += 1

    # 保存训练记录
    log = TrainingLog(
        date=today_str,
        module=lesson.module,
        lesson_index=lesson.lesson_index,
        exercise_answer=data.answer,
        completed=True,
    )
    db.add(log)

    # 武器入库：每完成一课，自动获得对应武器
    existing = db.query(Weapon).filter(
        Weapon.module == lesson.module,
        Weapon.lesson_index == lesson.lesson_index,
    ).first()
    if not existing:
        weapon = Weapon(
            name=f"{lesson.module} · {lesson.title}",
            definition=lesson.content_json.get("one_liner", "") if lesson.content_json else "",
            module=lesson.module,
            lesson_index=lesson.lesson_index,
        )
        db.add(weapon)

    db.commit()

    # 返回打卡结果
    weapon_count = db.query(Weapon).count()
    return {
        "status": "ok",
        "streak_days": user.streak_days,
        "total_checkins": user.total_checkins,
        "weapon_count": weapon_count,
        "weapon_name": f"{lesson.module} · {lesson.title}",
    }


# ── 获取用户状态 ──

@router.get("/user")
def get_user_status(db: Session = Depends(get_db)):
    """获取用户状态概览"""
    user = db.query(UserState).filter(UserState.id == 1).first()
    if not user:
        user = UserState(id=1, level=0, streak_days=0)
        db.add(user)
        db.commit()

    weapon_count = db.query(Weapon).count()
    return {
        "level": user.level,
        "streak_days": user.streak_days,
        "total_checkins": user.total_checkins,
        "weapon_count": weapon_count,
        "last_checkin_date": user.last_checkin_date,
    }


# ── 获取武器库 ──

@router.get("/weapons")
def get_weapons(db: Session = Depends(get_db)):
    """获取所有已解锁武器"""
    weapons = db.query(Weapon).order_by(Weapon.acquired_at.desc()).all()
    return {
        "count": len(weapons),
        "weapons": [
            {
                "id": w.id,
                "name": w.name,
                "definition": w.definition,
                "module": w.module,
                "acquired_at": w.acquired_at.isoformat() if w.acquired_at else None,
            }
            for w in weapons
        ],
    }


def _user_info(user: UserState) -> dict:
    return {
        "level": user.level,
        "streak_days": user.streak_days,
        "total_checkins": user.total_checkins,
    }
