# vsetv-control.ps1 - Управление слушателем для vsetv.click
# Устанавливаем кодировку UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("status", "stop", "start", "logs", "restart", "backup", "switch-to-main")]
    [string]$Command
)

$LOG_FILE = "logs/vsetv-listener.log"
$JOB_FILE = "vsetv-listener-job.xml"
$SCRIPT_PATH = "src/listeners/vsetv-listener.js"

function Show-Status {
    Write-Host "`n══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "📊 ПРОВЕРКА СТАТУСА СЛУШАТЕЛЯ" -ForegroundColor Cyan
    Write-Host "══════════════════════════════════════════════════" -ForegroundColor Cyan
    
    if (Test-Path $JOB_FILE) {
        $job = Import-Clixml -Path $JOB_FILE
        $realJob = Get-Job -Id $job.Id -ErrorAction SilentlyContinue
        
        if ($realJob -and $realJob.State -eq "Running") {
            Write-Host "✅ Слушатель vsetv.click работает (ID: $($job.Id))" -ForegroundColor Green
            Write-Host "📊 Состояние: $($realJob.State)" -ForegroundColor Green
        } else {
            Write-Host "❌ Слушатель vsetv.click не работает" -ForegroundColor Red
            if (Test-Path $JOB_FILE) {
                Remove-Item $JOB_FILE -Force
                Write-Host "🧹 Удален устаревший файл задания" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "❌ Слушатель vsetv.click не запущен" -ForegroundColor Red
    }
}

function Show-Logs {
    Write-Host "`n══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "📋 ПОСЛЕДНИЕ ЗАПИСИ ЛОГА" -ForegroundColor Cyan
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
    Write-Host "🛑 ОСТАНОВКА СЛУШАТЕЛЯ" -ForegroundColor Cyan
    Write-Host "══════════════════════════════════════════════════" -ForegroundColor Cyan
    
    if (Test-Path $JOB_FILE) {
        $job = Import-Clixml -Path $JOB_FILE
        $realJob = Get-Job -Id $job.Id -ErrorAction SilentlyContinue
        
        if ($realJob) {
            Write-Host "🔄 Останавливаем задание ID: $($job.Id)..." -ForegroundColor Yellow
            Stop-Job -Id $job.Id
            Remove-Job -Id $job.Id
            Write-Host "✅ Слушатель vsetv.click остановлен" -ForegroundColor Green
        }
        Remove-Item $JOB_FILE -Force
    } else {
        Write-Host "❌ Слушатель не запущен" -ForegroundColor Red
    }
}

function Start-Listener {
    Write-Host "`n══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "🚀 ЗАПУСК СЛУШАТЕЛЯ" -ForegroundColor Cyan
    Write-Host "══════════════════════════════════════════════════" -ForegroundColor Cyan
    
    Stop-Listener
    
    # Создаем папку для логов
    if (-not (Test-Path "logs")) {
        New-Item -ItemType Directory -Path "logs" -Force | Out-Null
        Write-Host "📁 Создана папка: logs/" -ForegroundColor Green
    }
    
    # Создаем папку для бэкапов
    if (-not (Test-Path "backups/vsetv")) {
        New-Item -ItemType Directory -Path "backups/vsetv" -Force | Out-Null
        Write-Host "📁 Создана папка: backups/vsetv/" -ForegroundColor Green
    }
    
    Write-Host "🚀 Запуск слушателя для vsetv.click..." -ForegroundColor Green
    
    $job = Start-Job -ScriptBlock {
        param($path)
        cd $path
        node src/listeners/vsetv-listener.js
    } -ArgumentList (Get-Location).Path
    
    $job | Export-Clixml -Path $JOB_FILE
    
    Write-Host "✅ Слушатель запущен (ID: $($job.Id))" -ForegroundColor Green
    Write-Host "📝 Лог: $LOG_FILE" -ForegroundColor Cyan
    Write-Host "💾 Бэкапы: backups/vsetv/" -ForegroundColor Cyan
}

function Show-Backups {
    Write-Host "`n══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "📦 БЭКАПЫ VSETV.CLICK" -ForegroundColor Cyan
    Write-Host "══════════════════════════════════════════════════" -ForegroundColor Cyan
    
    $backupDir = "backups/vsetv"
    if (Test-Path $backupDir) {
        $backups = Get-ChildItem $backupDir | Sort-Object LastWriteTime -Descending
        
        if ($backups.Count -gt 0) {
            Write-Host "Найдено бэкапов: $($backups.Count)" -ForegroundColor Green
            Write-Host "-"*50
            
            $i = 1
            foreach ($backup in $backups) {
                $size = "{0:N2} KB" -f ($backup.Length / 1KB)
                $date = $backup.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
                Write-Host "[$i] $date | $($backup.Name) | $size"
                $i++
            }
            
            Write-Host "-"*50
            $totalSize = "{0:N2} KB" -f (($backups | Measure-Object -Property Length -Sum).Sum / 1KB)
            Write-Host "📊 Общий размер: $totalSize" -ForegroundColor Yellow
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
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Переключено на main" -ForegroundColor Green
        Write-Host "📌 Текущая ветка: $(git branch --show-current)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Ошибка при переключении ветки" -ForegroundColor Red
    }
}

# Главное меню
Clear-Host
Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║     🎬 VSETV.CLICK - УПРАВЛЕНИЕ СЛУШАТЕЛЕМ     ║" -ForegroundColor Magenta
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

Write-Host "`n"