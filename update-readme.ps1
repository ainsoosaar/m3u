# Создание расширенного README.md с полным мануалом

$readmePath = "C:\Users\megaa\Desktop\Raschirenija\pokaz-m3u-clean\README.md"

$content = @'
# 🎬 POKAZ-M3U - ПРОЕКТ ДЛЯ РАБОТЫ С M3U ПЛЕЙЛИСТАМИ

## 📋 СОДЕРЖАНИЕ
- [О проекте](#о-проекте)
- [Быстрый старт](#быстрый-старт)
- [Структура проекта](#структура-проекта)
- [Команды для работы](#команды-для-работы)
- [Перенос на другие устройства](#перенос-на-другие-устройства)
- [Перенос на флешку](#перенос-на-флешку)
- [Установка на новом ПК](#установка-на-новом-пк)
- [Решение проблем](#решение-проблем)
- [Автоматизация](#автоматизация)

---

## 📖 О ПРОЕКТЕ

**POKAZ-M3U** - это инструмент для работы с M3U плейлистами. Проект использует Puppeteer для генерации плейлистов и имеет удобную систему сборки.

**Версия:** 1.0.0  
**Технологии:** Node.js, Puppeteer, JavaScript  
**Автор:** Разработчик

---

## 🚀 БЫСТРЫЙ СТАРТ

### 1. Установка зависимостей
```bash
npm install
2. Сборка проекта
bash
npm run build
3. Запуск проекта
bash
npm start
📁 СТРУКТУРА ПРОЕКТА
text
pokaz-m3u-clean/
├── src/                    # Исходный код
│   ├── build_pokaz.js      # Скрипт сборки с Puppeteer
│   └── ...                 # Другие исходные файлы
├── package.json             # Зависимости и скрипты
├── package-lock.json        # Фиксация версий зависимостей
├── README.md                # Этот файл
└── .gitignore               # Исключения для Git
🛠️ КОМАНДЫ ДЛЯ РАБОТЫ
Основные команды
Команда	Описание
npm install	Установка всех зависимостей
npm run build	Сборка проекта (запуск Puppeteer)
npm start	Запуск проекта
npm test	Запуск тестов (если есть)
Команды для разработки
bash
# Очистка кэша npm
npm cache clean --force

# Переустановка всех зависимостей
rm -rf node_modules package-lock.json
npm install

# Обновление пакетов
npm update
💾 ПЕРЕНОС НА ДРУГИЕ УСТРОЙСТВА
Полный мануал по переносу проекта
📦 ПОДГОТОВКА ПРОЕКТА К ПЕРЕНОСУ
1.1. Очистка проекта перед переносом
Создайте скрипт prepare-for-transfer.ps1:

powershell
# ============================================
# ПОДГОТОВКА ПРОЕКТА К ПЕРЕНОСУ
# ============================================

param(
    [string]$ProjectPath = "C:\Users\megaa\Desktop\Raschirenija\pokaz-m3u-clean",
    [string]$OutputPath = "C:\Users\megaa\Desktop\pokaz-m3u-portable"
)

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        ПОДГОТОВКА ПРОЕКТА К ПЕРЕНОСУ                      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Проверка существования проекта
if (-not (Test-Path $ProjectPath)) {
    Write-Host "❌ Проект не найден: $ProjectPath" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Исходный проект: $ProjectPath" -ForegroundColor Yellow
Write-Host "📁 Целевая папка: $OutputPath" -ForegroundColor Yellow
Write-Host ""

# Создание чистой копии
Write-Host "🔍 Создание чистой копии..." -ForegroundColor Green

# Удаляем старую папку если есть
if (Test-Path $OutputPath) {
    Remove-Item $OutputPath -Recurse -Force
}

# Создаем новую папку
New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null

# Файлы для исключения (мусор)
$excludePatterns = @(
    "node_modules",
    ".git",
    ".vscode",
    ".idea",
    "*.log",
    "*.tmp",
    "*.bak",
    "Thumbs.db",
    ".DS_Store",
    "desktop.ini",
    "*.user",
    "*.suo",
    "*.pidb",
    "*.userosscache",
    "npm-debug.log*",
    "yarn-debug.log*",
    "yarn-error.log*",
    ".eslintcache",
    "*.tsbuildinfo"
)

# Копирование файлов
$fileCount = 0
Get-ChildItem -Path $ProjectPath -Force | ForEach-Object {
    $exclude = $false
    foreach ($pattern in $excludePatterns) {
        if ($_.Name -like $pattern) {
            $exclude = $true
            break
        }
    }
    
    if (-not $exclude) {
        try {
            if ($_.PSIsContainer) {
                Copy-Item -Path $_.FullName -Destination (Join-Path $OutputPath $_.Name) -Recurse -Force
            } else {
                Copy-Item -Path $_.FullName -Destination $OutputPath -Force
            }
            $fileCount++
            Write-Host "  ✓ $($_.Name)" -ForegroundColor Green
        } catch {
            Write-Host "  ✗ $($_.Name) - ошибка копирования" -ForegroundColor Red
        }
    } else {
        Write-Host "  ⏭ $($_.Name) (исключен)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "✅ Чистая копия создана!" -ForegroundColor Green
Write-Host "📊 Скопировано файлов: $fileCount" -ForegroundColor White
Write-Host "📦 Размер: $('{0:N2}' -f ((Get-ChildItem $OutputPath -Recurse -File | Measure-Object Length -Sum).Sum / 1MB)) MB" -ForegroundColor White

# Создание README для переноса
$readmeContent = @"
# POKAZ-M3U - ПОРТАТИВНАЯ ВЕРСИЯ

## Информация о проекте
- Оригинальный проект: $ProjectPath
- Дата подготовки: $(Get-Date -Format "dd.MM.yyyy HH:mm")
- Версия: 1.0

## Структура проекта
$(Get-ChildItem $OutputPath | ForEach-Object { "- $($_.Name)" }) -join "`n"

## Инструкция по развертыванию
1. Скопируйте эту папку на флешку или другой компьютер
2. Запустите скрипт `install-on-new-pc.ps1` на новом устройстве
3. Следуйте инструкциям на экране

## Системные требования
- Windows 10/11
- Node.js (установится автоматически если отсутствует)
- Интернет для установки зависимостей (только первый раз)
"@

$readmePath = Join-Path $OutputPath "README-PORTABLE.md"
$readmeContent | Out-File -FilePath $readmePath -Encoding UTF8
Write-Host "📄 Создан README-PORTABLE.md" -ForegroundColor Green

Write-Host ""
Write-Host "✨ Проект готов к переносу!" -ForegroundColor Cyan
💾 ПЕРЕНОС НА ФЛЕШКУ
2.1. Скрипт для копирования на флешку
Создайте copy-to-usb.ps1:

powershell
# ============================================
# БЫСТРЫЙ ПЕРЕНОС ПРОЕКТА НА ФЛЕШКУ
# ============================================

param(
    [string]$ProjectPath = "C:\Users\megaa\Desktop\Raschirenija\pokaz-m3u-clean"
)

function Show-Menu {
    Clear-Host
    Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║        ПЕРЕНОС ПРОЕКТА НА USB ФЛЕШКУ              ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

Show-Menu

# Поиск USB накопителей
$usbDrives = Get-WmiObject Win32_LogicalDisk | Where-Object { $_.DriveType -eq 2 }

if ($usbDrives.Count -eq 0) {
    Write-Host "❌ USB накопитель не найден!" -ForegroundColor Red
    Write-Host "💡 Вставьте флешку и нажмите любую клавишу для повторного поиска..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    & $MyInvocation.MyCommand.Path
    exit
}

# Показываем найденные диски
Write-Host "📀 Найденные USB накопители:" -ForegroundColor Green
$i = 1
$usbDrives | ForEach-Object {
    $freeSpaceGB = [math]::Round($_.FreeSpace / 1GB, 2)
    $totalSpaceGB = [math]::Round($_.Size / 1GB, 2)
    Write-Host "   $i. Диск $($_.DeviceID) - $totalSpaceGB GB (свободно: $freeSpaceGB GB)" -ForegroundColor White
    $i++
}

# Выбор диска
$choice = Read-Host "`nВыберите номер диска"
$selectedDrive = $usbDrives[[int]$choice - 1].DeviceID

# Создание папки на флешке
$usbPath = "$selectedDrive\pokaz-m3u"
Write-Host "`n📁 Целевая папка: $usbPath" -ForegroundColor Yellow

if (Test-Path $usbPath) {
    $overwrite = Read-Host "Папка уже существует. Перезаписать? (y/n)"
    if ($overwrite -eq 'y') {
        Remove-Item $usbPath -Recurse -Force
        Write-Host "🗑 Существующая папка удалена" -ForegroundColor Gray
    } else {
        Write-Host "❌ Операция отменена" -ForegroundColor Yellow
        exit
    }
}

# Создание папки
New-Item -ItemType Directory -Path $usbPath -Force | Out-Null

# Копирование с прогресс-баром
Write-Host "`n📋 Копирование файлов..." -ForegroundColor Green

$totalFiles = (Get-ChildItem $ProjectPath -Recurse -File).Count
$copiedFiles = 0

Get-ChildItem -Path $ProjectPath -Recurse | ForEach-Object {
    $relativePath = $_.FullName.Substring($ProjectPath.Length + 1)
    $destination = Join-Path $usbPath $relativePath
    
    if ($_.PSIsContainer) {
        New-Item -ItemType Directory -Path $destination -Force | Out-Null
    } else {
        $destDir = Split-Path $destination -Parent
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        Copy-Item $_.FullName -Destination $destination -Force
        
        $copiedFiles++
        $percent = [math]::Round(($copiedFiles / $totalFiles) * 100, 2)
        Write-Progress -Activity "Копирование на флешку" -Status "$percent% завершено" -PercentComplete $percent
    }
}

Write-Progress -Activity "Копирование на флешку" -Completed

Write-Host ""
Write-Host "✅ Проект успешно скопирован на флешку!" -ForegroundColor Green
Write-Host "📍 Путь: $usbPath" -ForegroundColor Cyan
Write-Host "📊 Скопировано файлов: $totalFiles" -ForegroundColor White

# Создание автозапуска
$autorun = @"
[AutoRun]
open=setup.exe
icon=pokaz-m3u.ico
label=POKAZ-M3U Portable
"@

$autorun | Out-File -FilePath "$selectedDrive\autorun.inf" -Encoding ASCII
Write-Host "📄 Создан файл автозапуска" -ForegroundColor Gray

Read-Host "`nНажмите Enter для выхода"
🖥️ УСТАНОВКА НА НОВОМ ПК
3.1. Скрипт для установки на новом ПК
Создайте install-on-new-pc.ps1:

powershell
# ============================================
# УСТАНОВКА POKAZ-M3U НА НОВОМ КОМПЬЮТЕРЕ
# ============================================

param(
    [string]$InstallPath = "$env:USERPROFILE\Desktop\pokaz-m3u"
)

function Write-Step {
    param($Number, $Text, $Status)
    $color = if ($Status -eq "OK") { "Green" } elseif ($Status -eq "WAIT") { "Yellow" } else { "White" }
    Write-Host "[$Number] $Text" -ForegroundColor $color
}

Clear-Host
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        УСТАНОВКА POKAZ-M3U НА НОВОМ КОМПЬЮТЕРЕ            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Шаг 1: Проверка Windows
Write-Step "1/6" "Проверка операционной системы..." "WAIT"
$os = Get-WmiObject Win32_OperatingSystem
if ($os.Caption -like "*Windows 10*" -or $os.Caption -like "*Windows 11*") {
    Write-Step "1/6" "✅ $($os.Caption)" "OK"
} else {
    Write-Step "1/6" "⚠ Неоптимальная версия Windows" "WAIT"
}

# Шаг 2: Проверка Node.js
Write-Step "2/6" "Проверка Node.js..." "WAIT"
$nodeVersion = $null
try {
    $nodeVersion = node --version
    Write-Step "2/6" "✅ Node.js $nodeVersion" "OK"
} catch {
    Write-Step "2/6" "❌ Node.js не найден" "OK"
    Write-Host "   Установка Node.js..." -ForegroundColor Yellow
    
    # Скачивание Node.js
    $nodeInstaller = "$env:TEMP\node-installer.msi"
    Write-Host "   Скачивание установщика..." -ForegroundColor Gray
    Invoke-WebRequest -Uri "https://nodejs.org/dist/v18.18.0/node-v18.18.0-x64.msi" -OutFile $nodeInstaller
    
    Write-Host "   Запуск установщика..." -ForegroundColor Gray
    Start-Process msiexec.exe -Wait -ArgumentList "/i `"$nodeInstaller`" /quiet"
    
    # Обновление PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    Write-Step "2/6" "✅ Node.js установлен" "OK"
}

# Шаг 3: Копирование проекта
Write-Step "3/6" "Копирование проекта на рабочий стол..." "WAIT"

$sourcePath = Split-Path -Parent $MyInvocation.MyCommand.Path

if (Test-Path $InstallPath) {
    Remove-Item $InstallPath -Recurse -Force
}

New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null

$totalFiles = (Get-ChildItem $sourcePath -Recurse -File -Exclude "*.ps1").Count
$copiedFiles = 0

Get-ChildItem -Path $sourcePath -Exclude "*.ps1" | ForEach-Object {
    try {
        if ($_.PSIsContainer) {
            Copy-Item -Path $_.FullName -Destination (Join-Path $InstallPath $_.Name) -Recurse -Force
        } else {
            Copy-Item -Path $_.FullName -Destination $InstallPath -Force
        }
        $copiedFiles++
        Write-Progress -Activity "Копирование" -Status "$copiedFiles из $totalFiles" -PercentComplete (($copiedFiles / $totalFiles) * 100)
    } catch {
        Write-Host "   Ошибка копирования: $($_.Name)" -ForegroundColor Red
    }
}

Write-Progress -Activity "Копирование" -Completed
Write-Step "3/6" "✅ Проект скопирован ($copiedFiles файлов)" "OK"

# Шаг 4: Установка зависимостей
Write-Step "4/6" "Установка зависимостей..." "WAIT"
Set-Location $InstallPath

try {
    $output = npm install 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Step "4/6" "✅ Зависимости установлены" "OK"
    } else {
        throw "Ошибка установки"
    }
} catch {
    Write-Step "4/6" "⚠ Ошибка установки зависимостей" "WAIT"
    Write-Host "   Попробуйте установить вручную: npm install" -ForegroundColor Yellow
}

# Шаг 5: Тестовый запуск
Write-Step "5/6" "Тестовый запуск..." "WAIT"
try {
    $test = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Step "5/6" "✅ Проект собирается" "OK"
    } else {
        Write-Step "5/6" "⚠ Проблемы со сборкой" "WAIT"
    }
} catch {
    Write-Step "5/6" "⚠ Ошибка запуска" "WAIT"
}

# Шаг 6: Создание ярлыков
Write-Step "6/6" "Создание ярлыков..." "WAIT"

$WScriptShell = New-Object -ComObject WScript.Shell
$shortcut = $WScriptShell.CreateShortcut("$env:USERPROFILE\Desktop\pokaz-m3u.lnk")
$shortcut.TargetPath = "cmd.exe"
$shortcut.Arguments = "/c cd /d `"$InstallPath`" && npm start"
$shortcut.WorkingDirectory = $InstallPath
$shortcut.Description = "Запуск POKAZ-M3U"
$shortcut.Save()

Write-Step "6/6" "✅ Ярлык создан на рабочем столе" "OK"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              УСТАНОВКА ЗАВЕРШЕНА!                         ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Проект установлен в: $InstallPath" -ForegroundColor Cyan
Write-Host "🖥️ Ярлык на рабочем столе: pokaz-m3u" -ForegroundColor Cyan
Write-Host ""
Write-Host "Для запуска:" -ForegroundColor Yellow
Write-Host "  1. Дважды щелкните по ярлыку на рабочем столе" -ForegroundColor White
Write-Host "  2. Или откройте командную строку и выполните:" -ForegroundColor White
Write-Host "     cd $InstallPath" -ForegroundColor Gray
Write-Host "     npm start" -ForegroundColor Gray

Read-Host "`nНажмите Enter для выхода"
🚀 ЗАПУСК НА НОВОМ УСТРОЙСТВЕ
4.1. Скрипт для запуска (run.bat)
batch
@echo off
title POKAZ-M3U Launcher
color 0A

echo ========================================
echo         ЗАПУСК POKAZ-M3U
echo ========================================
echo.

REM Проверка наличия Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js не найден!
    echo.
    echo Установите Node.js с сайта: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Проверка наличия папки node_modules
if not exist "node_modules" (
    echo [INFO] Установка зависимостей...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Ошибка установки зависимостей
        pause
        exit /b 1
    )
)

echo [INFO] Запуск проекта...
echo.

REM Запуск проекта
start cmd /k "npm start"

echo.
echo Проект запущен! Закройте это окно для выхода.
echo.
pause
🔧 РЕШЕНИЕ ПРОБЛЕМ
5.1. Диагностика проблем
powershell
# diagnostic.ps1 - Диагностика проблем

Write-Host "🔍 ДИАГНОСТИКА ПРОЕКТА POKAZ-M3U" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Проверка структуры проекта
$projectPath = "C:\Users\megaa\Desktop\Raschirenija\pokaz-m3u-clean"

if (-not (Test-Path $projectPath)) {
    Write-Host "❌ Проект не найден по пути: $projectPath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Проект найден" -ForegroundColor Green

# Проверка package.json
if (Test-Path "$projectPath\package.json") {
    Write-Host "✅ package.json найден" -ForegroundColor Green
    $package = Get-Content "$projectPath\package.json" -Raw | ConvertFrom-Json
    Write-Host "   Название: $($package.name)" -ForegroundColor Gray
    Write-Host "   Версия: $($package.version)" -ForegroundColor Gray
} else {
    Write-Host "❌ package.json не найден" -ForegroundColor Red
}

# Проверка зависимостей
if (Test-Path "$projectPath\node_modules") {
    Write-Host "✅ node_modules найден" -ForegroundColor Green
    $modules = Get-ChildItem "$projectPath\node_modules" -Directory
    Write-Host "   Установлено пакетов: $($modules.Count)" -ForegroundColor Gray
} else {
    Write-Host "⚠ node_modules не найден (нужно установить зависимости)" -ForegroundColor Yellow
}

# Проверка точки входа
$mainFile = $package.main
if ($mainFile) {
    if (Test-Path "$projectPath\$mainFile") {
        Write-Host "✅ Точка входа найдена: $mainFile" -ForegroundColor Green
    } else {
        Write-Host "❌ Точка входа не найдена: $mainFile" -ForegroundColor Red
    }
}

# Проверка скриптов сборки
if ($package.scripts.build) {
    Write-Host "✅ Скрипт сборки: $($package.scripts.build)" -ForegroundColor Green
} else {
    Write-Host "⚠ Скрипт сборки не определен" -ForegroundColor Yellow
}

# Проверка прав доступа
try {
    $testFile = "$projectPath\test.tmp"
    "test" | Out-File $testFile
    Remove-Item $testFile
    Write-Host "✅ Права на запись есть" -ForegroundColor Green
} catch {
    Write-Host "❌ Нет прав на запись в папку проекта" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 ИТОГОВЫЙ ВЕРДИКТ:" -ForegroundColor Cyan

if ((Test-Path "$projectPath\package.json") -and (Test-Path "$projectPath\node_modules")) {
    Write-Host "✅ Проект полностью готов к переносу!" -ForegroundColor Green
} elseif (Test-Path "$projectPath\package.json") {
    Write-Host "⚠ Проект требует установки зависимостей (npm install)" -ForegroundColor Yellow
} else {
    Write-Host "❌ Проект поврежден или неполный" -ForegroundColor Red
}
5.2. Быстрое исправление проблем
powershell
# quick-fix.ps1

Write-Host "🔧 БЫСТРОЕ ИСПРАВЛЕНИЕ ПРОБЛЕМ" -ForegroundColor Cyan

$projectPath = "C:\Users\megaa\Desktop\Raschirenija\pokaz-m3u-clean"
Set-Location $projectPath

# Проблема 1: Очистка кэша npm
Write-Host "`n1. Очистка кэша npm..." -ForegroundColor Yellow
npm cache clean --force

# Проблема 2: Переустановка зависимостей
Write-Host "`n2. Переустановка зависимостей..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "package-lock.json") {
    Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue
}
npm install

# Проблема 3: Проверка портов
Write-Host "`n3. Проверка занятых портов..." -ForegroundColor Yellow
$usedPorts = netstat -ano | findstr :3000
if ($usedPorts) {
    Write-Host "⚠ Порт 3000 занят, освобождаю..." -ForegroundColor Yellow
    $pid = ($usedPorts -split '\s+')[4]
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Процесс остановлен" -ForegroundColor Green
}

Write-Host "`n✅ Исправление завершено!" -ForegroundColor Green
🤖 АВТОМАТИЗАЦИЯ
6.1. Полный мастер переноса
powershell
# master-transfer.ps1

function Show-Menu {
    Clear-Host
    Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║         МАСТЕР ПЕРЕНОСА POKAZ-M3U                 ║" -ForegroundColor Cyan
    Write-Host "╠════════════════════════════════════════════════════╣" -ForegroundColor Cyan
    Write-Host "║  1. Подготовить проект к переносу                 ║" -ForegroundColor White
    Write-Host "║  2. Скопировать на флешку                         ║" -ForegroundColor White
    Write-Host "║  3. Создать портативную версию                    ║" -ForegroundColor White
    Write-Host "║  4. Установить на новом ПК                        ║" -ForegroundColor White
    Write-Host "║  5. Создать архив для отправки                     ║" -ForegroundColor White
    Write-Host "║  6. Выход                                          ║" -ForegroundColor White
    Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Prepare-Project {
    Write-Host "`n📦 Подготовка проекта..." -ForegroundColor Yellow
    & ".\prepare-for-transfer.ps1"
}

function Copy-ToUSB {
    Write-Host "`n💾 Копирование на флешку..." -ForegroundColor Yellow
    & ".\copy-to-usb.ps1"
}

function Create-Portable {
    Write-Host "`n🖥️ Создание портативной версии..." -ForegroundColor Yellow
    & ".\create-portable.ps1"
}

function Install-NewPC {
    Write-Host "`n🆕 Установка на новом ПК..." -ForegroundColor Yellow
    & ".\install-on-new-pc.ps1"
}

function Create-Archive {
    $timestamp = Get-Date -Format "yyyy-MM-dd"
    $archiveName = "pokaz-m3u-backup-$timestamp.zip"
    
    Write-Host "`n🗜️ Создание архива: $archiveName" -ForegroundColor Yellow
    
    $source = "C:\Users\megaa\Desktop\Raschirenija\pokaz-m3u-clean"
    $destination = "C:\Users\megaa\Desktop\$archiveName"
    
    if (Test-Path $destination) {
        Remove-Item $destination -Force
    }
    
    Compress-Archive -Path $source -DestinationPath $destination
    Write-Host "✅ Архив создан: $destination" -ForegroundColor Green
    Write-Host "📊 Размер: $('{0:N2}' -f ((Get-Item $destination).Length / 1MB)) MB" -ForegroundColor White
}

do {
    Show-Menu
    $choice = Read-Host "Выберите действие (1-6)"
    
    switch ($choice) {
        "1" { Prepare-Project }
        "2" { Copy-ToUSB }
        "3" { Create-Portable }
        "4" { Install-NewPC }
        "5" { Create-Archive }
        "6" { Write-Host "Выход..."; break }
        default { Write-Host "Неверный выбор!" -ForegroundColor Red }
    }
    
    if ($choice -ne "6") {
        Write-Host "`n"
        Read-Host "Нажмите Enter для продолжения"
    }
} while ($choice -ne "6")
📋 ЧЕК-ЛИСТ ПЕРЕД ПЕРЕНОСОМ
Проект очищен от мусора

package.json существует

Все зависимости указаны в package.json

Создан README с инструкциями

Проверена работа проекта локально

Есть запасная копия

На флешке достаточно места

📞 ПОДДЕРЖКА
При возникновении проблем:

Запустите diagnostic.ps1 для анализа

Запустите quick-fix.ps1 для автоматического исправления

Проверьте, установлен ли Node.js

Убедитесь, что интернет работает для загрузки зависимостей

📅 ИСТОРИЯ ИЗМЕНЕНИЙ
Версия 1.0.0 (Текущая)

Базовая структура проекта

Интеграция с Puppeteer

Скрипты сборки и запуска

Полный мануал по переносу

Документ создан: 25.02.2026
Последнее обновление: 25.02.2026
'@

Сохранение в файл
$content | Out-File -FilePath $readmePath -Encoding UTF8

Write-Host "✅ README.md успешно обновлен!" -ForegroundColor Green
Write-Host "📍 Путь: $readmePath" -ForegroundColor Cyan

text

## Как использовать:

1. **Скопируйте весь код выше**
2. **Вставьте в PowerShell** (запущенный от имени администратора)
3. **Нажмите Enter**

Или сохраните код в файл `update-readme.ps1` и запустите:

```powershell
.\update-readme.ps1
Что будет сделано:
✅ Создан/обновлен файл README.md по пути:
C:\Users\megaa\Desktop\Raschirenija\pokaz-m3u-clean\README.md

✅ Добавлен полный мануал со следующими разделами:

О проекте

Быстрый старт

Структура проекта

Команды для работы

Полный мануал по переносу (все скрипты)

Перенос на флешку

Установка на новом ПК

Решение проблем

Автоматизация

Чек-лист

✅ Все PowerShell скрипты включены прямо в README для удобного копирования