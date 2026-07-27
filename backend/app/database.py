"""
数据库模型 — SQLite
"""
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text, JSON
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime, timezone

DATABASE_URL = "sqlite:///./data/neigong.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """依赖注入：获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def now():
    """当前 UTC 时间"""
    return datetime.now(timezone.utc)


# ── 用户状态 ──

class UserState(Base):
    __tablename__ = "user_state"

    id = Column(Integer, primary_key=True, default=1)
    level = Column(Integer, default=0)                # LV.0 ~ LV.4
    streak_days = Column(Integer, default=0)           # 连续打卡天数
    last_checkin_date = Column(String, nullable=True)  # 上次打卡日期 YYYY-MM-DD
    total_checkins = Column(Integer, default=0)        # 总打卡次数
    created_at = Column(DateTime, default=now)
    updated_at = Column(DateTime, default=now, onupdate=now)


# ── 训练记录 ──

class TrainingLog(Base):
    __tablename__ = "training_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String, nullable=False)              # YYYY-MM-DD
    module = Column(String, nullable=False)             # 模块名称
    lesson_index = Column(Integer, default=1)           # 第几课
    exercise_answer = Column(Text, nullable=True)       # 练习答案
    completed = Column(Boolean, default=False)          # 是否完成
    created_at = Column(DateTime, default=now)


# ── 武器库 ──

class Weapon(Base):
    __tablename__ = "weapons"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)               # 框架/概念名称
    definition = Column(Text, nullable=True)             # 一句话定义
    module = Column(String, nullable=False)              # 所属模块
    lesson_index = Column(Integer, default=1)           # 在第几课获得
    acquired_at = Column(DateTime, default=now)


# ── 课程内容（AI 生成或硬编码） ──

class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, autoincrement=True)
    module = Column(String, nullable=False)              # 模块名称
    lesson_index = Column(Integer, nullable=False)       # 该模块第几课
    title = Column(String, nullable=False)               # 课程标题
    content_json = Column(JSON, nullable=True)           # 课程内容（结构化 JSON）
    created_at = Column(DateTime, default=now)
