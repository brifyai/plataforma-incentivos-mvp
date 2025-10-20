# Instalador Automático de Git para Windows
# Ejecutar como: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
# Luego: .\INSTALAR_GIT_POWERSHELL.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "INSTALADOR AUTOMATICO DE GIT PARA WINDOWS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si Git ya está instalado
try {
    $gitVersion = git --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Git ya está instalado:" -ForegroundColor Green
        Write-Host $gitVersion -ForegroundColor Yellow
        goto configurar
    }
} catch {
    Write-Host "❌ Git no está instalado" -ForegroundColor Red
}

Write-Host ""

# Método 1: Usar winget (Windows Package Manager)
try {
    $wingetVersion = winget --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "📦 Instalando Git usando winget..." -ForegroundColor Blue
        winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Git instalado correctamente con winget" -ForegroundColor Green
            
            # Recargar PATH
            $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
            
            # Verificar instalación
            $gitVersion = git --version 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Verificación exitosa:" -ForegroundColor Green
                Write-Host $gitVersion -ForegroundColor Yellow
                goto configurar
            }
        }
    }
} catch {
    Write-Host "❌ Winget no disponible o falló" -ForegroundColor Red
}

# Método 2: Descargar e instalar automáticamente
Write-Host "📥 Descargando Git for Windows automáticamente..." -ForegroundColor Blue

try {
    # URL de descarga directa de Git for Windows
    $gitDownloadUrl = "https://github.com/git-for-windows/git/releases/latest/download/Git-2.43.0-64-bit.exe"
    $downloadPath = "$env:TEMP\GitInstaller.exe"
    
    Write-Host "Descargando desde: $gitDownloadUrl" -ForegroundColor Yellow
    Invoke-WebRequest -Uri $gitDownloadUrl -OutFile $downloadPath
    
    if (Test-Path $downloadPath) {
        Write-Host "✅ Descargado correctamente, instalando..." -ForegroundColor Green
        
        # Instalar silenciosamente con opciones por defecto
        Start-Process -FilePath $downloadPath -ArgumentList "/VERYSILENT", "/NORESTART", "/NOCANCEL" -Wait
        
        # Limpiar archivo
        Remove-Item $downloadPath -Force -ErrorAction SilentlyContinue
        
        # Recargar PATH
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
        
        Write-Host "✅ Instalación completada" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error en instalación automática" -ForegroundColor Red
    Write-Host "Por favor instala Git manualmente:" -ForegroundColor Yellow
    Write-Host "1. Abre: https://git-scm.com/download/win" -ForegroundColor White
    Write-Host "2. Descarga Git for Windows" -ForegroundColor White
    Write-Host "3. Ejecuta el instalador con opciones por defecto" -ForegroundColor White
    Write-Host ""
    Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Cyan
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

:configurar
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CONFIGURANDO GIT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Esperar un momento para que PATH se actualice
Start-Sleep -Seconds 3

# Configurar nombre de usuario
try {
    git config --global user.name "Camilo"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Nombre configurado: Camilo" -ForegroundColor Green
    } else {
        Write-Host "❌ Error configurando nombre" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error configurando nombre: $_" -ForegroundColor Red
}

# Configurar email
try {
    git config --global user.email "brifyaimaster@gmail.com"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Email configurado: brifyaimaster@gmail.com" -ForegroundColor Green
    } else {
        Write-Host "❌ Error configurando email" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error configurando email: $_" -ForegroundColor Red
}

# Ver configuración
Write-Host ""
Write-Host "📋 Configuración actual:" -ForegroundColor Blue
git config --global --list

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CONFIGURACION COMPLETADA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Comandos para ejecutar después
Write-Host "Ahora ejecuta estos comandos en PowerShell:" -ForegroundColor Yellow
Write-Host ""
Write-Host 'cd "C:\Users\admin\Desktop\AIntelligence\Cobranzas\plataforma-incentivos-mvp"' -ForegroundColor White
Write-Host "git add ." -ForegroundColor White
Write-Host 'git commit -m "🔧 Solución definitiva importación Excel deudores"' -ForegroundColor White
Write-Host "git push origin main" -ForegroundColor White
Write-Host ""

Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")