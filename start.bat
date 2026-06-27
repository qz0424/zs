@echo off
cd /d "E:\3d\curtain-showcase\src\server"
start "客户端" node src\server.js
start "管理端" node src\admin-server.js
echo 客户端: http://localhost:3000
echo 管理端: http://localhost:3001
pause
