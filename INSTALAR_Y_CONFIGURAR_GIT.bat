@echo off
echo ========================================
echo INSTALADOR AUTOMATICO DE GIT PARA WINDOWS
echo ========================================
echo.

REM Verificar si Git ya está instalado
git --version >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo ✅ Git ya está instalado
    git --version
    goto :configurar
)

echo ❌ Git no está instalado
echo.

REM Opción 1: Usar winget si está disponible
winget --version >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo 📦 Instalando Git usando winget...
    winget install --id Git.Git -e --source winget
    if %ERRORLEVEL% == 0 (
        echo ✅ Git instalado correctamente con winget
        goto :configurar
    )
)

REM Opción 2: Descargar e instalar manualmente
echo 📥 Git no se pudo instalar automaticamente
echo.
echo Por favor:
echo 1. Abrir navegador web
echo 2. Ir a: https://git-scm.com/download/win
echo 3. Descargar Git for Windows
echo 4. Ejecutar el instalador descargado
echo 5. Usar opciones por defecto durante instalación
echo.
echo Presiona cualquier tecla cuando hayas terminado de instalar Git...
pause >nul

:configurar
echo.
echo ========================================
echo CONFIGURANDO GIT
echo ========================================
echo.

REM Configurar nombre de usuario
git config --global user.name "Camilo"
if %ERRORLEVEL% == 0 (
    echo ✅ Nombre configurado: Camilo
) else (
    echo ❌ Error configurando nombre
)

REM Configurar email
git config --global user.email "brifyaimaster@gmail.com"
if %ERRORLEVEL% == 0 (
    echo ✅ Email configurado: brifyaimaster@gmail.com
) else (
    echo ❌ Error configurando email
)

REM Ver configuración
echo.
echo 📋 Configuración actual:
git config --global --list

echo.
echo ========================================
echo CONFIGURACION COMPLETADA
echo ========================================
echo.
echo Ahora puedes ejecutar los siguientes comandos:
echo.
echo cd "C:\Users\admin\Desktop\AIntelligence\Cobranzas\plataforma-incentivos-mvp"
echo git add .
echo git commit -m "Solución definitiva importación Excel deudores"
echo git push origin main
echo.
echo Presiona cualquier tecla para salir...
pause >nul