@echo off
set NGROK=C:\Users\dines\AppData\Local\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe

echo ========================================
echo    Starting MediConnect + ngrok
echo ========================================

:: Start Backend
start "Backend" cmd /k "cd /d C:\Users\dines\MediConnect\Backend && npm run dev"
timeout /t 4 /nobreak >nul

:: Start Frontend
start "Frontend" cmd /k "cd /d C:\Users\dines\MediConnect\Frontend && npm run dev"
timeout /t 4 /nobreak >nul

:: Start ngrok for backend
start "Ngrok-Backend" cmd /k "%NGROK% http 5000"
timeout /t 4 /nobreak >nul

:: Start ngrok for frontend
start "Ngrok-Frontend" cmd /k "%NGROK% http 5173"

echo.
echo ========================================
echo  All 4 windows are now open!
echo ========================================
echo.
echo  NEXT STEPS:
echo  1. Look at "Ngrok-Backend" window
echo     Copy the https URL (e.g. https://abc.ngrok-free.app)
echo     Open Frontend\.env and set:
echo     VITE_API_URL=https://abc.ngrok-free.app/api
echo.
echo  2. Look at "Ngrok-Frontend" window
echo     Copy the https URL (e.g. https://xyz.ngrok-free.app)
echo     Share this URL with your friend!
echo.
echo  3. Restart frontend after updating .env:
echo     cd Frontend and npm run dev
echo ========================================
pause
