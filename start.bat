@echo off
echo ========================================
echo 智能文本阅读器 - 启动脚本
echo ========================================
echo.

echo 正在启动后端服务...
cd backend
start "后端服务" python app.py

echo 等待后端服务启动...
timeout /t 3 /nobreak > nul

echo 正在启动前端服务...
cd ..\frontend
start "前端服务" npm start

echo.
echo ========================================
echo 服务启动完成！
echo 后端服务: http://localhost:5000
echo 前端服务: http://localhost:3000
echo ========================================
echo.
echo 按任意键退出...
pause > nul
