@echo off
title Sistema POS - Inicializando...

set PATH=%~dp0node-portable;%PATH%

echo =========================================
echo    Iniciando el Sistema POS Berrones
echo =========================================
echo.

if not exist "server\node_modules\" (
    echo Instalando dependencias del servidor por primera vez...
    cd server
    call npm install
    cd ..
)

if not exist "node_modules\" (
    echo Instalando dependencias de la interfaz por primera vez...
    call npm install
)

echo.
echo Todo listo. Levantando los servicios...

start "Servidor Backend" cmd /k "cd server && npm run dev"

start "Interfaz Frontend" cmd /k "npm run dev"

echo.
echo Puedes minimizar estas ventanas, no las cierres.
pause
