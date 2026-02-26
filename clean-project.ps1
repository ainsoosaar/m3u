# ============================================
# СКРИПТ РЕВИЗИИ И ОЧИСТКИ ПРОЕКТА POKAZ-M3U
# ============================================

# Цветовое оформление
$Host.UI.RawUI.ForegroundColor = "White"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Очистка экрана
Clear-Host

# Пути к проектам
$sourcePath = "C:\Users\megaa\Desktop\Расширения\GitHub\Github_Pokaz.me\pokaz-m3u.v1.0 — копия\pokaz-m3u"
$destinationPath = "C:\Users\megaa\Desktop\Raschirenija\pokaz-m3u-clean"

Write-ColorOutput "╔════════════════════════════════════════════════════════════╗" "Cyan"
Write-ColorOutput "║     РЕВИЗИЯ, ОЧИСТКА И ПЕРЕНОС ПРОЕКТА POKAZ-M3U          ║" "Cyan"
Write-ColorOutput "╚════════════════════════════════════════════════════════════╝" "Cyan"
Write-ColorOutput ""
Write-ColorOutput "Исходный путь: $sourcePath" "Yellow"
Write-ColorOutput "Путь назначения: $destinationPath" "Yellow"
Write-ColorOutput ""

# Проверка существования исходной папки
if (-not (Test-Path $sourcePath)) {
    Write-ColorOutput "ОШИБКА: Исходная папка не найдена!" "Red"
    exit 1
}

# ============================================
# ЧАСТЬ 1: АНАЛИЗ ПРОЕКТА
# ============================================
Write-ColorOutput "`n[1] АНАЛИЗ ПРОЕКТА" "Green"
Write-ColorOutput "────────────────────────────────────────────────────" "DarkGray"

Set-Location $sourcePath

# Общая информация
$allFiles = Get-ChildItem -Path $sourcePath -Recurse -File -Force -ErrorAction SilentlyContinue
$allFolders = Get-ChildItem -Path $sourcePath -Recurse -Directory -Force -ErrorAction SilentlyContinue
$totalSize = ($allFiles | Measure-Object Length -Sum).Sum

Write-ColorOutput "   Статистика проекта:" "White"
Write-ColorOutput "   ├─ Папок: $($allFolders.Count)" "Gray"
Write-ColorOutput "   ├─ Файлов: $($allFiles.Count)" "Gray"
Write-ColorOutput "   └─ Размер: $('{0:N2}' -f ($totalSize/1MB)) MB" "Gray"

# Поиск системных файлов
$systemFiles = @(
    "Thumbs.db",
    "desktop.ini",
    ".DS_Store",
    "*.tmp",
    "*.temp",
    "*.bak",
    "*.log",
    "*.old",
    "~*",
    "*.swo",
    "*.swp"
)

$foundSystemFiles = @()
foreach ($pattern in $systemFiles) {
    $foundSystemFiles += Get-ChildItem -Path $sourcePath -Recurse -File -Force -Include $pattern -ErrorAction SilentlyContinue
}

if ($foundSystemFiles.Count -gt 0) {
    Write-ColorOutput "`n   ⚠ Системные и временные файлы:" "Yellow"
    $foundSystemFiles | ForEach-Object {
        Write-ColorOutput "     - $($_.Name) ($('{0:N2}' -f ($_.Length/1KB)) KB)" "Gray"
    }
}

# Поиск файлов разработки
$devFiles = @(
    "*.log",
    "npm-debug.log*",
    "yarn-debug.log*",
    "yarn-error.log*",
    "*.tsbuildinfo",
    ".eslintcache",
    "*.sublime-*",
    "*.vsix",
    "*.user",
    "*.suo",
    "*.userosscache",
    "*.pidb",
    "*.booproj",
    "*.pidb",
    "*.suo",
    "*.user",
    "*.userprefs",
    "*.lock"
)

$foundDevFiles = @()
foreach ($pattern in $devFiles) {
    $foundDevFiles += Get-ChildItem -Path $sourcePath -Recurse -File -Force -Include $pattern -ErrorAction SilentlyContinue
}

if ($foundDevFiles.Count -gt 0) {
    Write-ColorOutput "`n   ⚠ Файлы разработки и логи:" "Yellow"
    $foundDevFiles | ForEach-Object {
        Write-ColorOutput "     - $($_.Name) ($('{0:N2}' -f ($_.Length/1KB)) KB)" "Gray"
    }
}

# Поиск пустых папок
$emptyFolders = $allFolders | Where-Object {
    (Get-ChildItem $_.FullName -Recurse -Force -ErrorAction SilentlyContinue).Count -eq 0
}

if ($emptyFolders.Count -gt 0) {
    Write-ColorOutput "`n   ⚠ Пустые папки:" "Yellow"
    $emptyFolders | ForEach-Object {
        Write-ColorOutput "     - $($_.FullName.Replace($sourcePath, ''))" "Gray"
    }
}

# Поиск node_modules и зависимостей
$nodeModules = Get-ChildItem -Path $sourcePath -Recurse -Directory -Filter "node_modules" -Force -ErrorAction SilentlyContinue
if ($nodeModules.Count -gt 0) {
    Write-ColorOutput "`n   ⚠ Найдены папки node_modules:" "Yellow"
    $nodeModules | ForEach-Object {
        $size = (Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
        Write-ColorOutput "     - $($_.FullName.Replace($sourcePath, '')) ($('{0:N2}' -f ($size/1MB)) MB)" "Gray"
    }
}

# Поиск package.json
$packageJson = Get-ChildItem -Path $sourcePath -Filter "package.json" -Recurse -ErrorAction SilentlyContinue
if ($packageJson) {
    Write-ColorOutput "`n   📦 Информация о зависимостях:" "Cyan"
    $packageJson | ForEach-Object {
        try {
            $content = Get-Content $_.FullName -Raw | ConvertFrom-Json
            $deps = 0
            $devDeps = 0
            if ($content.dependencies) { $deps = $content.dependencies.PSObject.Properties.Count }
            if ($content.devDependencies) { $devDeps = $content.devDependencies.PSObject.Properties.Count }
            Write-ColorOutput "     ├─ Зависимостей: $deps" "Gray"
            Write-ColorOutput "     └─ Dev-зависимостей: $devDeps" "Gray"
        } catch {
            Write-ColorOutput "     └─ Ошибка чтения package.json" "Red"
        }
    }
}

# ============================================
# ЧАСТЬ 2: ОЧИСТКА ПРОЕКТА
# ============================================
Write-ColorOutput "`n`n[2] ОЧИСТКА ПРОЕКТА" "Green"
Write-ColorOutput "────────────────────────────────────────────────────" "DarkGray"

$allWaste = $foundSystemFiles + $foundDevFiles
$wasteSize = ($allWaste | Measure-Object Length -Sum).Sum

if ($allWaste.Count -gt 0 -or $emptyFolders.Count -gt 0) {
    Write-ColorOutput "   Найдено мусора для удаления:" "White"
    Write-ColorOutput "   ├─ Файлов: $($allWaste.Count)" "Gray"
    Write-ColorOutput "   ├─ Объем: $('{0:N2}' -f ($wasteSize/1MB)) MB" "Gray"
    Write-ColorOutput "   └─ Пустых папок: $($emptyFolders.Count)" "Gray"
    
    Write-ColorOutput "`n   ⚠ ВНИМАНИЕ: Будет произведена очистка проекта!" "Yellow"
    $confirmClean = Read-Host "   Подтвердите очистку (y/n)"
    
    if ($confirmClean -eq 'y') {
        Write-ColorOutput "`n   Очистка начата..." "Cyan"
        
        # Удаление системных и временных файлов
        if ($foundSystemFiles.Count -gt 0) {
            Write-ColorOutput "   Удаление системных файлов..." "White"
            $foundSystemFiles | ForEach-Object {
                try {
                    Remove-Item $_.FullName -Force -ErrorAction Stop
                    Write-ColorOutput "     ✓ $($_.Name)" "Green"
                } catch {
                    Write-ColorOutput "     ✗ $($_.Name) - ошибка удаления" "Red"
                }
            }
        }
        
        # Удаление файлов разработки
        if ($foundDevFiles.Count -gt 0) {
            Write-ColorOutput "   Удаление файлов разработки..." "White"
            $foundDevFiles | ForEach-Object {
                try {
                    Remove-Item $_.FullName -Force -ErrorAction Stop
                    Write-ColorOutput "     ✓ $($_.Name)" "Green"
                } catch {
                    Write-ColorOutput "     ✗ $($_.Name) - ошибка удаления" "Red"
                }
            }
        }
        
        # Удаление пустых папок
        if ($emptyFolders.Count -gt 0) {
            Write-ColorOutput "   Удаление пустых папок..." "White"
            $emptyFolders | ForEach-Object {
                try {
                    Remove-Item $_.FullName -Force -ErrorAction Stop
                    Write-ColorOutput "     ✓ $($_.Name)" "Green"
                } catch {
                    Write-ColorOutput "     ✗ $($_.Name) - ошибка удаления" "Red"
                }
            }
        }
        
        Write-ColorOutput "`n   ✅ Очистка завершена!" "Green"
    } else {
        Write-ColorOutput "   ⏭ Очистка отменена пользователем" "Yellow"
    }
} else {
    Write-ColorOutput "   ✅ Мусор не найден, проект чистый" "Green"
}

# ============================================
# ЧАСТЬ 3: ЗАПУСК ПРОЕКТА
# ============================================
Write-ColorOutput "`n`n[3] ЗАПУСК ПРОЕКТА" "Green"
Write-ColorOutput "────────────────────────────────────────────────────" "DarkGray"

$runConfirm = Read-Host "`n   Запустить проект для проверки? (y/n)"

if ($runConfirm -eq 'y') {
    Write-ColorOutput "`n   Поиск точки входа..." "Cyan"
    
    # Поиск основного файла проекта
    $possibleEntries = @(
        "index.html",
        "index.js",
        "index.ts",
        "main.js",
        "main.ts",
        "app.js",
        "app.ts",
        "server.js",
        "server.ts",
        "start.js",
        "start.ts"
    )
    
    $entryPoint = $null
    foreach ($entry in $possibleEntries) {
        $found = Get-ChildItem -Path $sourcePath -Filter $entry -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            $entryPoint = $found
            break
        }
    }
    
    if ($entryPoint) {
        Write-ColorOutput "   Найдена точка входа: $($entryPoint.Name)" "Green"
        Write-ColorOutput "   Запуск..." "Cyan"
        
        # Определение типа проекта и запуск
        if ($entryPoint.Name -match "\.html$") {
            # HTML проект - открыть в браузере
            Start-Process $entryPoint.FullName
            Write-ColorOutput "   ✅ Проект открыт в браузере" "Green"
        } elseif ($entryPoint.Name -match "\.js$|\.ts$") {
            # Node.js проект
            if (Test-Path (Join-Path $sourcePath "node_modules")) {
                Write-ColorOutput "   Запуск Node.js проекта..." "Cyan"
                try {
                    $process = Start-Process -FilePath "node" -ArgumentList "`"$($entryPoint.FullName)`"" -NoNewWindow -PassThru
                    Write-ColorOutput "   ✅ Проект запущен (PID: $($process.Id))" "Green"
                } catch {
                    Write-ColorOutput "   ❌ Ошибка запуска: $_" "Red"
                }
            } else {
                Write-ColorOutput "   ⚠ node_modules не найдены, установка зависимостей..." "Yellow"
                try {
                    Set-Location $sourcePath
                    npm install
                    Write-ColorOutput "   ✅ Зависимости установлены" "Green"
                    $process = Start-Process -FilePath "node" -ArgumentList "`"$($entryPoint.FullName)`"" -NoNewWindow -PassThru
                    Write-ColorOutput "   ✅ Проект запущен (PID: $($process.Id))" "Green"
                } catch {
                    Write-ColorOutput "   ❌ Ошибка установки зависимостей: $_" "Red"
                }
            }
        }
    } else {
        Write-ColorOutput "   ⚠ Точка входа не найдена" "Yellow"
        Write-ColorOutput "   Содержимое папки:" "Gray"
        Get-ChildItem $sourcePath | Select-Object -First 10 | ForEach-Object {
            Write-ColorOutput "     - $($_.Name)" "Gray"
        }
    }
}

# ============================================
# ЧАСТЬ 4: КЛОНИРОВАНИЕ ПРОЕКТА
# ============================================
Write-ColorOutput "`n`n[4] КЛОНИРОВАНИЕ ПРОЕКТА" "Green"
Write-ColorOutput "────────────────────────────────────────────────────" "DarkGray"

$cloneConfirm = Read-Host "`n   Создать чистую копию проекта в Raschirenija? (y/n)"

if ($cloneConfirm -eq 'y') {
    # Создание папки назначения
    if (Test-Path $destinationPath) {
        Write-ColorOutput "   ⚠ Папка назначения уже существует" "Yellow"
        $overwriteConfirm = Read-Host "   Перезаписать? (y/n)"
        if ($overwriteConfirm -eq 'y') {
            Remove-Item $destinationPath -Recurse -Force
            Write-ColorOutput "   Существующая папка удалена" "Gray"
        } else {
            Write-ColorOutput "   ⏭ Клонирование отменено" "Yellow"
            exit 0
        }
    }
    
    Write-ColorOutput "`n   Клонирование проекта..." "Cyan"
    
    # Создание структуры папок
    New-Item -ItemType Directory -Path $destinationPath -Force | Out-Null
    
    # Файлы и папки для исключения при копировании
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
        "desktop.ini"
    )
    
    # Копирование файлов
    $fileCount = 0
    Get-ChildItem -Path $sourcePath -Force | ForEach-Object {
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
                    Copy-Item -Path $_.FullName -Destination (Join-Path $destinationPath $_.Name) -Recurse -Force
                } else {
                    Copy-Item -Path $_.FullName -Destination $destinationPath -Force
                }
                $fileCount++
                Write-ColorOutput "     ✓ $($_.Name)" "Green"
            } catch {
                Write-ColorOutput "     ✗ $($_.Name) - ошибка копирования" "Red"
            }
        } else {
            Write-ColorOutput "     ⏭ $($_.Name) (исключен)" "Gray"
        }
    }
    
    Write-ColorOutput "`n   ✅ Клонирование завершено!" "Green"
    Write-ColorOutput "   Скопировано элементов: $fileCount" "Gray"
    Write-ColorOutput "   Путь назначения: $destinationPath" "Cyan"
    
    # Создание README с информацией
    $readmeContent = @"
# POKAZ-M3U Clean Project

## Информация о проекте
- Оригинальный путь: $sourcePath
- Дата очистки: $(Get-Date -Format "dd.MM.yyyy HH:mm")
- Очищенная копия: $destinationPath

## Структура проекта
$(Get-ChildItem $destinationPath | ForEach-Object { "- $($_.Name)" }) -join "`n"

## Инструкция по запуску
1. Установите зависимости: `npm install` (если есть package.json)
2. Запустите проект: `npm start` или откройте index.html

## Примечания
- Проект очищен от системных и временных файлов
- node_modules исключены для уменьшения размера
- Для работы могут потребоваться дополнительные зависимости
"@

    $readmePath = Join-Path $destinationPath "README-CLEAN.md"
    $readmeContent | Out-File -FilePath $readmePath -Encoding UTF8
    Write-ColorOutput "   📄 Создан README-CLEAN.md" "Green"
}

# ============================================
# ЗАВЕРШЕНИЕ
# ============================================
Write-ColorOutput "`n`n╔════════════════════════════════════════════════════════════╗" "Cyan"
Write-ColorOutput "║           РЕВИЗИЯ УСПЕШНО ЗАВЕРШЕНА!                     ║" "Cyan"
Write-ColorOutput "╚════════════════════════════════════════════════════════════╝" "Cyan"
Write-ColorOutput ""
Write-ColorOutput "Итоги работы:" "White"
Write-ColorOutput "├─ Исходный проект: $sourcePath" "Gray"
Write-ColorOutput "├─ Чистая копия: $destinationPath" "Gray"
Write-ColorOutput "├─ Очищено файлов: $($allWaste.Count)" "Gray"
Write-ColorOutput "└─ Освобождено места: $('{0:N2}' -f ($wasteSize/1MB)) MB" "Gray"
Write-ColorOutput ""

# Открыть папку назначения
$openFolder = Read-Host "Открыть папку с чистым проектом? (y/n)"
if ($openFolder -eq 'y') {
    Invoke-Item $destinationPath
}

Write-ColorOutput "`nНажмите любую клавишу для выхода..." "DarkGray"
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")