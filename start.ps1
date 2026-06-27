$serverPath = "E:\3d\curtain-showcase\src\server"
$j1 = Start-Job -Name "client" -ScriptBlock { Set-Location $args[0]; node src/server.js } -ArgumentList $serverPath
$j2 = Start-Job -Name "admin" -ScriptBlock { Set-Location $args[0]; node src/admin-server.js } -ArgumentList $serverPath
Write-Host "客户端: http://localhost:3000"
Write-Host "管理端: http://localhost:3001"
Write-Host "按 Enter 停止服务..."
Read-Host
$j1.Stop(); $j2.Stop(); Remove-Job $j1, $j2
