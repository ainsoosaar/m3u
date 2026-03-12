param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("status", "stop", "start", "logs", "restart")]
    [string]$Command
)

function Show-Status {
    if (Test-Path "listener-job.xml") {
        $job = Import-Clixml -Path "listener-job.xml"
        $realJob = Get-Job -Id $job.Id -ErrorAction SilentlyContinue
        
        if ($realJob -and $realJob.State -eq "Running") {
            Write-Host "✅ Слушатель работает (ID: $($job.Id))" -ForegroundColor Green
            Write-Host "📊 Состояние: $($realJob.State)" -ForegroundColor Green
        } else {
            Write-Host "❌ Слушатель не работает" -ForegroundColor Red
            if (Test-Path "listener-job.xml") {
                Remove-Item "listener-job.xml" -Force
            }
        }
    } else {
        Write-Host "❌ Слушатель не запущен" -ForegroundColor Red
    }
}

function Show-Logs {
    if (Test-Path "listener.log") {
        Get-Content "listener.log" -Tail 20
    } else {
        Write-Host "📝 Лог-файл не найден" -ForegroundColor Yellow
    }
}

function Stop-Listener {
    if (Test-Path "listener-job.xml") {
        $job = Import-Clixml -Path "listener-job.xml"
        $realJob = Get-Job -Id $job.Id -ErrorAction SilentlyContinue
        
        if ($realJob) {
            Stop-Job -Id $job.Id
            Remove-Job -Id $job.Id
            Write-Host "✅ Слушатель остановлен" -ForegroundColor Green
        }
        Remove-Item "listener-job.xml" -Force
    } else {
        Write-Host "❌ Слушатель не запущен" -ForegroundColor Red
    }
}

function Start-Listener {
    Stop-Listener
    & ".\start-listener.ps1"
}

switch ($Command) {
    "status" { Show-Status }
    "logs" { Show-Logs }
    "stop" { Stop-Listener }
    "start" { Start-Listener }
    "restart" {
        Stop-Listener
        Start-Listener
    }
}
