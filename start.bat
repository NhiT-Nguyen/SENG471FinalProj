@echo off
echo Starting Healthcare Platform...
echo.
echo Starting Django backend on http://localhost:8000
start "Django Backend" cmd /k "cd /d %~dp0 && python manage.py runserver"
echo.
echo Starting React frontend on http://localhost:3000
start "React Frontend" cmd /k "cd /d %~dp0\react-frontend && npm run dev"
echo.
echo Both servers starting...
echo Open http://localhost:3000 in your browser
pause
