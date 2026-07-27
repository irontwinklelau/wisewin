# Changelog

所有 notable changes 记录在此。遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

格式：`## [版本号] - YYYY-MM-DD`

---

## [0.1.0] - 2026-07-28

### Added
- 项目骨架初始化：Git 仓库、目录结构、CHANGELOG、VERSION
- 前端：Vite + React + Tailwind CSS 脚手架
- 后端：FastAPI 骨架 + SQLite 数据库模型
- discovery/ 目录：PRD、pre-mortem、界面原型

---

## [0.2.0] - 2026-07-28

### Added
- 5屏训练流程完整实现：首页仪表盘→框架讲解→案例拆解→练习→打卡成功
- 前后端 API 联通：用户状态、今日训练、提交练习
- 琥珀暖色调设计（支持暗色模式）
- 段位系统中文汉字显示（零壹贰叁肆）
- 后端端口改为 8090

### Fixed
- 修复端口冲突导致服务无法启动

---

## [0.3.0] - 2026-07-28

### Added
- 武器库页面：按模块分组展示已获得的框架/概念，含定义和获得日期
- 首页武器库计数可点击跳转
- Dashboard 点击"武器库 →"进入详细列表

---

## [0.4.0] - 2026-07-28

### Added
- 段位升级系统: 完成当前模块所有课程后解锁升段测验
- 升段测验页: 开放式问答题，通过后自动升级
- 升段庆祝页: 段位徽章动画 + 新模块解锁提示
- 后端升级API: level-up-status / level-up-test

---

## [0.5.0] - 2026-07-28

### Added
- 课程生成器: 使用 DeepSeek API 批量生成训练课程
- 8节课程内容: 不被PUA(5天) + 框架化表达(3天)
- 课程大纲: 受害者叙事觉察 → 框架化表达
- 支持 OpenAI-compatible API (DeepSeek)

---

## [1.0.0] - 2026-07-28

### Added
- README.md 项目文档
- 数据库重置脚本
- 8节课完整内容就位（4天不被PUA + 3天框架化表达）
- GitHub 备份推送

### Ready
- 双击 start.bat 即可启动完整开发环境
- 前端: http://localhost:5173
- 后端: http://localhost:8090

---

## [Unreleased]

### Planned
- v0.2.0: 第一课全流程硬编码（5屏走通）
- v0.3.0: 打卡持久化 + 武器库数据入库
- v0.4.0: 段位系统（LV.0→LV.1 升级+测验）
- v0.5.0: Claude API 接入生成后续课程
- v1.0.0: 正式上线
