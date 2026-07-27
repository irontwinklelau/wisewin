# ⚔️ 内功 — 商业博弈能力每日训练

一个只服务于个人的博弈能力训练系统。融合财会+商业+人性，教练+陪练+复盘师三位一体。

## 快速开始

```bash
# 1. 安装后端依赖
cd backend && pip install -r requirements.txt

# 2. 安装前端依赖
cd frontend && npm install

# 3. 初始化种子数据
cd backend && python seed.py

# 4. 启动（双击 start.bat 或手动）
# 后端: cd backend && python -m uvicorn app:app --port 8090
# 前端: cd frontend && npm run dev
```

打开浏览器访问 **http://localhost:5173**

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | Vite + React + Tailwind CSS |
| 后端 | Python 3 + FastAPI |
| 数据库 | SQLite + SQLAlchemy |
| AI | DeepSeek API（课程生成） |

## 项目结构

```
├── frontend/          # React 前端
│   └── src/App.jsx    # 核心组件（6屏交互）
├── backend/           # FastAPI 后端
│   ├── app/           # API 路由 + 数据模型
│   ├── seed.py        # 种子数据（第一课）
│   ├── generate_lessons.py  # AI 课程生成器
│   └── data/          # SQLite 数据库
├── discovery/         # 需求发现文档
│   ├── PRD.md         # 产品需求文档
│   ├── pre-mortem.md  # 事前验尸
│   └── mockup.html    # 界面原型
├── start.bat          # 一键启动脚本
├── CHANGELOG.md       # 版本迭代记录
└── VERSION            # 当前版本号
```

## 版本历史

| 版本 | 日期 | 内容 |
|------|------|------|
| v0.1.0 | 07-28 | 项目骨架搭建 |
| v0.2.0 | 07-28 | 5屏训练流程上线 |
| v0.3.0 | 07-28 | 武器库展示 |
| v0.4.0 | 07-28 | 段位升级系统 |
| v0.5.0 | 07-28 | DeepSeek API 课程生成 |
| v1.0.0 | 07-28 | 正式上线 |

## 课程大纲

### 第一期：不被PUA
1. 受害者叙事 vs 策略选择者叙事
2. 识别你的受害者叙事模式
3. 叙事改写：职场场景实战
4. 叙事改写：人际与谈判场景
5. 从"为什么是我"到"我选择什么"

### 第二期：框架化表达
1. STAR法则的正确用法
2. 一句话能力标签
3. 证据链一致性
