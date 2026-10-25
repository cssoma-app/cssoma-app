@echo off
setlocal enabledelayedexpansion

REM Obtener la ruta del directorio actual del script
set SCRIPT_DIR=%~dp0

REM Colores y títulos para las ventanas
title SSTerra Dev - Frontend & Backend

echo.
echo ====================================================
echo   SSTerra Development Environment
echo ====================================================
echo.
echo Iniciando Backend y Frontend...
echo.

REM Iniciar Backend en una nueva ventana
echo [Backend] Iniciando en puerto 5166...
start "SSTerra Backend" cmd /k "cd /d "%SCRIPT_DIR%Backend" && dotnet run"

REM Dar un segundo para que el backend empiece a iniciar
timeout /t 2 /nobreak

REM Iniciar Frontend en una nueva ventana
echo [Frontend] Iniciando en puerto 3000...
start "SSTerra Frontend" cmd /k "cd /d "%SCRIPT_DIR%frontend" && npm run dev"

echo.
echo ====================================================
echo   ✓ Backend corriendo en: http://localhost:5166
echo   ✓ Frontend corriendo en: http://localhost:3000
echo ====================================================
echo.
echo Presiona Ctrl+C o cierra esta ventana para detener ambos servidores.
echo.

REM Esperar a que el usuario presione una tecla o cierre la ventana
pause

REM Limpiar: matar todos los procesos de dotnet y node al cerrar
echo.
echo Deteniendo servidores...
taskkill /F /IM dotnet.exe 2>nul
taskkill /F /IM node.exe 2>nul

echo ✓ Servidores detenidos.
exit /b 0
