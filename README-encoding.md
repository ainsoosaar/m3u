# Работа с кириллицей в PowerShell для проекта m3u

## 📋 Проблема
В PowerShell по умолчанию используется кодировка, которая неправильно отображает кириллицу, что приводит к появлению "кракозябр" (ÐŸÑ€Ð¸Ð²ÐµÑ‚ вместо Привет).

## 🔧 Решение

### Способ 1: Быстрая настройка (рекомендуется)

Скопируйте и выполните эти команды в PowerShell:

```powershell
# Настройка кодировки для текущей сессии
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Настройка для всех будущих сессий
$profilePath = $PROFILE.CurrentUserAllHosts
$profileDir = Split-Path $profilePath -Parent
if (!(Test-Path $profileDir)) { New-Item -ItemType Directory -Path $profileDir -Force }

$settings = @'
# Настройка UTF-8 для кириллицы
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Функции для просмотра логов
function Show-VsetvLogs {
    param([int]$Lines = 30, [switch]$Follow)
    $logPath = "C:\Users\megaa\Desktop\Raschirenija\Pokaz.me-Github\m3u\logs\vsetv-listener.log"
    if (!(Test-Path $logPath)) { Write-Host "❌ Лог не найден" -ForegroundColor Red; return }
    if ($Follow) { Get-Content $logPath -Wait -Encoding UTF8 }
    else { Get-Content $logPath -Tail $Lines -Encoding UTF8 }
}

function Show-PokazLogs {
    param([int]$Lines = 30, [switch]$Follow)
    $logPath = "C:\Users\megaa\Desktop\Raschirenija\Pokaz.me-Github\m3u\listener.log"
    if (!(Test-Path $logPath)) { Write-Host "❌ Лог не найден" -ForegroundColor Red; return }
    if ($Follow) { Get-Content $logPath -Wait -Encoding UTF8 }
    else { Get-Content $logPath -Tail $Lines -Encoding UTF8 }
}

Write-Host "✅ PowerShell настроен для работы с кириллицей" -ForegroundColor Green
Write-Host "📋 Используйте Show-VsetvLogs или Show-PokazLogs для просмотра логов" -ForegroundColor Cyan
'@

Add-Content -Path $profilePath -Value $settings
Write-Host "✅ Настройки добавлены в профиль PowerShell" -ForegroundColor Green
Write-Host "🔄 Перезапустите PowerShell для применения изменений" -ForegroundColor Yellow