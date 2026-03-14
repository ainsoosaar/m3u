# ontivi-control.ps1 - Управление слушателем для ip.ontivi.net
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("status", "stop", "start", "logs", "restart", "backup", "switch-to-main")]
    [string]$Command
)

$LOG_FILE = "logs/ontivi-listener.log"
$JOB_FILE = "ontivi-listener-job.xml"
$SCRIPT_PATH = "src/listeners/ontivi-listener.js"

function Show-Status {
    Write-Host "`n══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "📊 ПРОВЕРКА СТАТУСА СЛУШАТЕЛЯ ONTIVI" -ForegroundColor Cyan
    Write-Host "══════════════════════════════════════════════════" -ForegroundColor Cyan
    
    if (Test-Path $JOB_FILE) {
        $job = Import-Clixml -Path $JOB_FILE
        $realJob = Get-Job -Id $job.Id -ErrorAction SilentlyContinue
        
        if ($realJob -and $realJob.State -eq "Running") {
            Write-Host "✅ Слушатель ontivi работает (ID: $($job.Id))" -ForegroundColor Green
            Write-Host "📊 Состояние: $($realJob.State)" -ForegroundColor Green
        } else {
            Write-Host "❌ Слушатель ontivi не работает" -ForegroundColor Red
            if (Test-Path $JOB_FILE) {
                Remove-Item $JOB_FILE -Force
            }
        }
    } else {
        Write-Host "❌ Слушатель ontivi не запущен" -ForegroundColor Red
    }
}

function Show-Logs {
    Write-Host "`n══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "📋 ПОСЛЕДНИЕ ЗАПИСИ ЛОГА ONTIVI" -ForegroundColor Cyan
    Write-Host "══════════════════════════════════════════════════" -ForegroundColor Cyan
    
    if (Test-Path $LOG_FILE) {
        Write-Host "📁 Файл: $LOG_FILE" -ForegroundColor Yellow
        Write-Host "-"*50
        Get-Content $LOG_FILE -Tail 30 -Encoding UTF8
    } else {
        Write-Host "📝 Лог-файл не найден" -ForegroundColor Yellow
    }
}

function Stop-Listener {
    Write-Host "`n══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "🛑 ОСТАНОВКА СЛУШАТЕЛЯ ONTIVI" -ForegroundColor Cyan
    Write-Host "══════════════════════════════════════════════════" -ForegroundColor Cyan
    
    if (Test-Path $JOB_FILE) {
        $job = Import-Clixml -Path $JOB_FILE
        $realJob = Get-Job -Id $job.Id -ErrorAction SilentlyContinue
        
        if ($realJob) {
            Stop-Job -Id $job.Id
            Remove-Job -Id $job.Id
            Write-Host "✅ Слушатель ontivi остановлен" -ForegroundColor Green
        }
        Remove-Item $JOB_FILE -Force
    } else {
        Write-Host "❌ Слушатель не запущен" -ForegroundColor Red
    }
}

function Start-Listener {
    Write-Host "`n══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "🚀 ЗАПУСК СЛУШАТЕЛЯ ONTIVI" -ForegroundColor Cyan
    Write-Host "══════════════════════════════════════════════════" -ForegroundColor Cyan
    
    Stop-Listener
    
    # Создаем папку для логов
    if (-not (Test-Path "logs")) {
        New-Item -ItemType Directory -Path "logs" -Force | Out-Null
    }
    
    # Создаем папку для бэкапов
    if (-not (Test-Path "backups/ontivi")) {
        New-Item -ItemType Directory -Path "backups/ontivi" -Force | Out-Null
    }
    
    Write-Host "🚀 Запуск слушателя для ip.ontivi.net..." -ForegroundColor Green
    
    $job = Start-Job -ScriptBlock {
        param($path)
        cd $path
        node src/listeners/ontivi-listener.js
    } -ArgumentList (Get-Location).Path
    
    $job | Export-Clixml -Path $JOB_FILE
    
    Write-Host "✅ Слушатель запущен (ID: $($job.Id))" -ForegroundColor Green
    Write-Host "📝 Лог: $LOG_FILE" -ForegroundColor Cyan
    Write-Host "💾 Бэкапы: backups/ontivi/" -ForegroundColor Cyan
}

function Show-Backups {
    Write-Host "`n══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "📦 БЭКАПЫ ONTIVI" -ForegroundColor Cyan
    Write-Host "══════════════════════════════════════════════════" -ForegroundColor Cyan
    
    $backupDir = "backups/ontivi"
    if (Test-Path $backupDir) {
        $backups = Get-ChildItem $backupDir | Sort-Object LastWriteTime -Descending
        
        if ($backups.Count -gt 0) {
            Write-Host "Найдено бэкапов: $($backups.Count)" -ForegroundColor Green
            foreach ($backup in $backups) {
                $size = "{0:N2} KB" -f ($backup.Length / 1KB)
                Write-Host "  $($backup.Name) - $size" -ForegroundColor White
            }
        } else {
            Write-Host "📦 В папке нет бэкапов" -ForegroundColor Yellow
        }
    } else {
        Write-Host "📦 Папка бэкапов не найдена" -ForegroundColor Yellow
    }
}

function Switch-ToMain {
    Write-Host "`n══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "🔄 ПЕРЕКЛЮЧЕНИЕ НА ОСНОВНУЮ ВЕТКУ" -ForegroundColor Cyan
    Write-Host "══════════════════════════════════════════════════" -ForegroundColor Cyan
    
    Stop-Listener
    
    Write-Host "🔄 Переключение на ветку main..." -ForegroundColor Yellow
    git checkout main
    git pull origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Переключено на main" -ForegroundColor Green
    } else {
        Write-Host "❌ Ошибка при переключении ветки" -ForegroundColor Red
    }
}

Clear-Host
Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║     🎬 ONTIVI - УПРАВЛЕНИЕ СЛУШАТЕЛЕМ          ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Magenta

switch ($Command) {
    "status" { Show-Status }
    "logs" { Show-Logs }
    "stop" { Stop-Listener }
    "start" { Start-Listener }
    "restart" {
        Write-Host "`n🔄 Перезапуск слушателя..." -ForegroundColor Yellow
        Stop-Listener
        Start-Listener
    }
    "backup" { Show-Backups }
    "switch-to-main" { Switch-ToMain }
}
