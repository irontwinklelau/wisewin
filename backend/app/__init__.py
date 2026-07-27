"""
FastAPI 应用入口 — 商业内功每日一练
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import training, user

# 创建数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(title="内功 API", version="0.1.0")

# CORS — 允许前端开发服务器访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(training.router, prefix="/api/training", tags=["训练"])
app.include_router(user.router, prefix="/api/user", tags=["用户"])


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "0.1.0"}
