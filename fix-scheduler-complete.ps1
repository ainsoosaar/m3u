# ============================================
# ПОЛНОЕ ИСПРАВЛЕНИЕ ПЛАНИРОВЩИКА (ИСПРАВЛЕННАЯ ВЕРСИЯ)
# ============================================

# Создаем новый файл с правильной кодировкой
$scriptContent = @'
# ============================================
# ПОЛНОЕ ИСПРАВЛЕНИЕ ПЛАНИРОВЩИКА (Запускать от Администратора!)
# ============================================

# Проверка прав администратора
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ Запустите PowerShell от имени Администратора!" -ForegroundColor Red
    Read-Host "Нажмите Enter для выхода"
    exit
}

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        ИСПРАВЛЕНИЕ ПЛАНИРОВЩИКА POKAZ-M3U                 ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Пути
$srcPath = "C:\Users\megaa\Desktop\Raschirenija\pokaz-m3u-clean\src\build_pokaz.js"
$playlistsPath = "C:\Users\megaa\Desktop\Raschirenija\pokaz-m3u-clean\playlists"
$destPath = "$playlistsPath\build_pokaz.js"

# Шаг 1: Проверка файла build_pokaz.js
Write-Host "📋 Шаг 1: Проверка файла build_pokaz.js..." -ForegroundColor Cyan

if (Test-Path $srcPath) {
    Write-Host "  ✅ Исходный файл найден: $srcPath" -ForegroundColor Green
    
    if (Test-Path $destPath) {
        Write-Host "  ✅ Файл уже есть в папке playlists" -ForegroundColor Green
        $fileInfo = Get-Item $destPath
        Write-Host "     Размер: $($fileInfo.Length) байт" -ForegroundColor Gray
        Write-Host "     Изменен: $($fileInfo.LastWriteTime)" -ForegroundColor Gray
    } else {
        Write-Host "  📦 Копирование в папку playlists..." -ForegroundColor Yellow
        Copy-Item -Path $srcPath -Destination $destPath -Force
        Write-Host "  ✅ Файл скопирован!" -ForegroundColor Green
    }
} else {
    Write-Host "  ⚠️ Исходный файл не найден в src" -ForegroundColor Yellow
    
    # Альтернативный поиск
    $searchPaths = @(
        "C:\Users\megaa\Desktop\Raschirenija\GitHub\Github_Pokaz.me\pokaz-m3u.v1.0 — копия\pokaz-m3u\src\build_pokaz.js",
        "C:\Users\megaa\Desktop\Raschirenija\GitHub\Github_Pokaz.me\pokaz-m3u.v1.2\pokaz-m3u\src\build_pokaz.js",
        "C:\Users\megaa\Desktop\Расширения\GitHub\Github_Pokaz.me\pokaz-m3u.v1.0 — копия\pokaz-m3u\src\build_pokaz.js",
        "C:\Users\megaa\Desktop\Расширения\GitHub\Github_Pokaz.me\pokaz-m3u.v1.2\pokaz-m3u\src\build_pokaz.js"
    )
    
    $found = $false
    foreach ($path in $searchPaths) {
        if (Test-Path $path) {
            Write-Host "  ✅ Найден альтернативный источник: $path" -ForegroundColor Green
            Copy-Item -Path $path -Destination $destPath -Force
            Write-Host "  ✅ Файл скопирован!" -ForegroundColor Green
            $found = $true
            break
        }
    }
    
    if (-not $found) {
        Write-Host "  ❌ Файл build_pokaz.js не найден" -ForegroundColor Red
        Write-Host "  Создаю базовую версию..." -ForegroundColor Yellow
        
        $basicContent = @'
// build_pokaz.js - Базовая версия
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🚀 Запуск build_pokaz.js');
console.log('📁 Рабочая папка:', __dirname);

try {
    // Проверяем наличие Update-Playlist.ps1
    const psScript = path.join(__dirname, 'Update-Playlist.ps1');
    
    if (fs.existsSync(psScript)) {
        console.log('✅ Найден Update-Playlist.ps1, запускаю...');
        
        exec(`powershell.exe -ExecutionPolicy Bypass -File "${psScript}"`, (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Ошибка:', error);
                fs.appendFileSync(path.join(__dirname, 'error_log.txt'), 
                    `[${new Date().toISOString()}] ${error.message}\n`);
                return;
            }
            console.log('stdout:', stdout);
            console.error('stderr:', stderr);
            console.log('✅ Скрипт выполнен успешно');
        });
    } else {
        console.log('⚠️ Update-Playlist.ps1 не найден');
        
        // Создаем простой плейлист
        const playlist = `#EXTM3U
#EXTINF:-1,Пример канала
http://example.com/stream.m3u8
#EXTINF:-1,Тестовый канал
http://test.com/stream.m3u8
`;
        
        fs.writeFileSync(path.join(__dirname, 'pokaz_playlist.m3u8'), playlist);
        console.log('✅ Создан базовый плейлист');
    }
    
} catch (error) {
    console.error('❌ Ошибка:', error);
    fs.appendFileSync(path.join(__dirname, 'error_log.txt'), 
        `[${new Date().toISOString()}] ${error.message}\n`);
}
'@
        $basicContent | Out-File -FilePath $destPath -Encoding UTF8
        Write-Host "  ✅ Базовая версия создана" -ForegroundColor Green
    }
}

Write-Host ""

# Шаг 2: Проверка Node.js
Write-Host "⚙️ Шаг 2: Проверка Node.js..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host "  ✅ Node.js установлен: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Node.js не найден!" -ForegroundColor Red
    Write-Host "  📦 Устанавливаю Node.js..." -ForegroundColor Yellow
    
    try {
        # Скачивание Node.js
        $nodeInstaller = "$env:TEMP\node-installer.msi"
        Write-Host "  Скачивание Node.js..." -ForegroundColor Gray
        Invoke-WebRequest -Uri "https://nodejs.org/dist/v18.18.0/node-v18.18.0-x64.msi" -OutFile $nodeInstaller
        
        Write-Host "  Запуск установки..." -ForegroundColor Gray
        Start-Process msiexec.exe -Wait -ArgumentList "/i `"$nodeInstaller`" /quiet"
        
        # Обновление PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        Write-Host "  ✅ Node.js установлен" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Ошибка установки Node.js" -ForegroundColor Red
        Write-Host "  Установите вручную с https://nodejs.org/" -ForegroundColor Yellow
    }
}

Write-Host ""

# Шаг 3: Установка зависимостей
Write-Host "📦 Шаг 3: Проверка зависимостей..." -ForegroundColor Cyan
Set-Location $playlistsPath

if (Test-Path "node_modules") {
    Write-Host "  ✅ node_modules уже существует" -ForegroundColor Green
} else {
    Write-Host "  Установка зависимостей..." -ForegroundColor Yellow
    try {
        npm install puppeteer --save
        Write-Host "  ✅ Зависимости установлены" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️ Ошибка установки зависимостей" -ForegroundColor Yellow
    }
}

Write-Host ""

# Шаг 4: Удаление старых задач
Write-Host "🗑️ Шаг 4: Удаление старых задач..." -ForegroundColor Cyan
$oldTasks = Get-ScheduledTask -TaskName "Pokaz-M3U*" -ErrorAction SilentlyContinue
if ($oldTasks) {
    foreach ($task in $oldTasks) {
        Write-Host "  Удаление: $($task.TaskName)" -ForegroundColor Gray
        Unregister-ScheduledTask -TaskName $task.TaskName -Confirm:$false
    }
    Write-Host "  ✅ Все старые задачи удалены" -ForegroundColor Green
} else {
    Write-Host "  ✅ Старых задач не найдено" -ForegroundColor Green
}

Write-Host ""

# Шаг 5: Создание новой задачи
Write-Host "🆕 Шаг 5: Создание новой задачи..." -ForegroundColor Cyan

$taskName = "Pokaz-M3U Generator"
$scriptPath = "C:\Users\megaa\Desktop\Raschirenija\pokaz-m3u-clean\playlists\build_pokaz.js"
$workingDir = "C:\Users\megaa\Desktop\Raschirenija\pokaz-m3u-clean\playlists"

if (-not (Test-Path $scriptPath)) {
    Write-Host "  ❌ Скрипт не найден: $scriptPath" -ForegroundColor Red
    Read-Host "Нажмите Enter для выхода"
    exit
}

# Создание действия (запуск node со скриптом)
$action = New-ScheduledTaskAction -Execute "node.exe" `
    -Argument "`"$scriptPath`"" `
    -WorkingDirectory $workingDir

# Триггеры
$trigger1 = New-ScheduledTaskTrigger -Daily -At 03:00AM
$trigger2 = New-ScheduledTaskTrigger -AtStartup
$trigger2.Delay = "PT5M"

# Настройки
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartInterval (New-TimeSpan -Minutes 15) `
    -RestartCount 3 `
    -MultipleInstances IgnoreNew

# Принципал
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -RunLevel Highest -LogonType ServiceAccount

# Регистрация
Register-ScheduledTask -TaskName $taskName `
    -Action $action `
    -Trigger $trigger1, $trigger2 `
    -Settings $settings `
    -Principal $principal `
    -Description "Генерация M3U плейлиста" `
    -Force

Write-Host "  ✅ Задача '$taskName' создана!" -ForegroundColor Green

Write-Host ""

# Шаг 6: Проверка задачи
Write-Host "🔍 Шаг 6: Проверка задачи..." -ForegroundColor Cyan
$newTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($newTask) {
    Write-Host "  ✅ Задача найдена" -ForegroundColor Green
    Write-Host "  📊 Статус: $($newTask.State)" -ForegroundColor White
} else {
    Write-Host "  ❌ Задача не найдена!" -ForegroundColor Red
}

Write-Host ""

# Шаг 7: Тестовый запуск
Write-Host "🧪 Шаг 7: Тестовый запуск..." -ForegroundColor Cyan
$testRun = Read-Host "Запустить задачу сейчас для проверки? (y/n)"

if ($testRun -eq 'y') {
    Write-Host "  Запуск задачи..." -ForegroundColor Yellow
    Start-ScheduledTask -TaskName $taskName
    
    Start-Sleep -Seconds 10
    
    if (Test-Path "$workingDir\pokaz_playlist.m3u8") {
        $fileInfo = Get-Item "$workingDir\pokaz_playlist.m3u8"
        Write-Host "  ✅ Плейлист создан!" -ForegroundColor Green
        Write-Host "     Размер: $($fileInfo.Length) байт" -ForegroundColor Gray
        Write-Host "     Изменен: $($fileInfo.LastWriteTime)" -ForegroundColor Gray
    } elseif (Test-Path "$workingDir\error_log.txt") {
        Write-Host "  ⚠️ Обнаружены ошибки:" -ForegroundColor Yellow
        Get-Content "$workingDir\error_log.txt" -Tail 3 | ForEach-Object { Write-Host "     $_" -ForegroundColor Red }
    } else {
        Write-Host "  ⏳ Результат не найден" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              НАСТРОЙКА ЗАВЕРШЕНА!                        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Итог:" -ForegroundColor Cyan
Write-Host "  ✅ Файл: $destPath" -ForegroundColor White
Write-Host "  ✅ Задача: $taskName" -ForegroundColor White
Write-Host "  ⏰ Расписание: ежедневно в 3:00 и при запуске системы" -ForegroundColor White

Read-Host "`nНажмите Enter для выхода"
'@

# Сохраняем исправленный скрипт
$scriptContent | Out-File -FilePath "C:\Users\megaa\Desktop\Raschirenija\pokaz-m3u-clean\fix-scheduler-fixed.ps1" -Encoding UTF8

Write-Host "✅ Исправленный скрипт создан!" -ForegroundColor Green
Write-Host "📍 Путь: C:\Users\megaa\Desktop\Raschirenija\pokaz-m3u-clean\fix-scheduler-fixed.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "👉 Теперь запустите его командой:" -ForegroundColor Yellow
Write-Host "   cd C:\Users\megaa\Desktop\Raschirenija\pokaz-m3u-clean" -ForegroundColor White
Write-Host "   .\fix-scheduler-fixed.ps1" -ForegroundColor White