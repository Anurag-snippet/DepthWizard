Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "[DepthWizard] Launching Microservices in Parallel..." -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-File", "$PSScriptRoot\run-ai.ps1"
Start-Sleep -Seconds 3

Start-Process powershell -ArgumentList "-NoExit", "-File", "$PSScriptRoot\run-server.ps1"
Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList "-NoExit", "-File", "$PSScriptRoot\run-client.ps1"

Write-Host "Services dispatched successfully!" -ForegroundColor Green
Write-Host "• Frontend Client: http://localhost:5173" -ForegroundColor White
Write-Host "• Backend Gateway: http://localhost:5000/api/health" -ForegroundColor White
Write-Host "• AI Microservice: http://localhost:8000/health" -ForegroundColor White
