@echo off
title Lanzador - Sistema FWI (Django + MySQL + React)
echo ================================================================
echo        INICIANDO SISTEMA MONITOREO Y CALCULO FWI
echo ================================================================
echo.

echo [1/2] Iniciando servidor Backend Django REST API en http://127.0.0.1:8000 ...
start "Backend Django FWI API" cmd /k ".\venv\Scripts\activate.bat && python backend\manage.py runserver 0.0.0.0:8000"

timeout /t 3 /nobreak >nul

echo [2/2] Iniciando servidor Frontend React Vite en http://localhost:3000 ...
start "Frontend React FWI Dashboard" cmd /k "cd frontend && npm run dev -- --open"

echo.
echo ================================================================
echo ¡SISTEMA FWI EN EJECUCION!
echo - Dashboard UI: http://localhost:3000
echo - Django API:   http://127.0.0.1:8000/api/
echo ================================================================
pause
