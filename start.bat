@echo off
chcp 65001 >nul
echo ⚔️  启动「内功」开发环境...

:: 启动后端
start "内功-API" cmd /c "cd /d %~dp0backend && python -m uvicorn app:app --reload --port 8090"

:: 启动前端
start "内功-前端" cmd /c "cd /d %~dp0frontend && npm run dev"

echo.
echo ✅ 后端: http://localhost:8090
echo ✅ 前端: http://localhost:5173
echo.
echo 按任意键停止所有服务...
pause >nul
taskkill /FI "WINDOWTITLE eq 内功-*" /T /F >nul 2>&1
