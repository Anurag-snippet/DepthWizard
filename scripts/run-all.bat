@echo off
echo ===================================================================
echo [DepthWizard] Starting All Microservices (SIH 26175)
echo ===================================================================

start "DepthWizard AI Service" cmd /k "cd ai-service && .venv\Scripts\python main.py"
timeout /t 3 /nobreak >nul

start "DepthWizard Backend Server" cmd /k "cd server && npm start"
timeout /t 2 /nobreak >nul

start "DepthWizard Frontend Client" cmd /k "cd client && npm run dev"

echo All services launched in separate windows.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000/api/health
echo AI API:   http://localhost:8000/health
pause
