@echo off
cd /d "E:\3d\curtain-showcase\src\server"
start "客户端" /B node src\server.js
start "管理端" /B node src\admin-server.js
echo 客户端: http://localhost:3000
echo 管理端: http://localhost:3001
echo 按任意键关闭服务...
pause
taskkill /f /im node.exe >nul 2>&1
