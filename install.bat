@echo off
title Instalador del Sistema FWI - Django + MySQL + React
echo ================================================================
echo       INSTALADOR AUTOMATICO - SISTEMA FWI WEATHER MONITOR
echo ================================================================
echo.

echo [1/4] Creando entorno virtual de Python...
python -m venv venv
if %errorlevel% neq 0 (
    echo Error al crear el entorno virtual de Python. Por favor verifica que Python 3.10+ este instalado y agregado al PATH.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/4] Instalando dependencias de Python Backend...
call .\venv\Scripts\activate.bat
pip install -r backend\requirements.txt

echo.
echo [3/4] Ejecutando migraciones de Base de Datos y Sembrado Inicial...
python backend\manage.py makemigrations core
python backend\manage.py migrate
python backend\seed_data.py

echo.
echo [4/4] Instalando dependencias de Frontend React...
cd frontend
call npm install
cd ..

echo.
echo ================================================================
echo ¡INSTALACION COMPLETADA CON EXITO!
echo Para iniciar la aplicacion, ejecuta el archivo 'start.bat'
echo ================================================================
pause
