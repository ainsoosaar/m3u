# ============================================
# production.ps1 - ГЛАВНЫЙ СКРИПТ АВТОМАТИЗАЦИИ
# ============================================

$playlistsPath = "C:\Users\megaa\Desktop\Raschirenija\Pokaz-Github\playlists"
$playlistFile = "pokaz_playlist.m3u8"
$githubToken = [Environment]::GetEnvironmentVariable("GITHUB_TOKEN", "User")
$repoOwner = "ainsoosaar"
$repoName = "m3u"
$branch = "main"

# Создаём имя файла с текущей датой и временем
$githubFileName = "playlist_from_pc_$(Get-Date -Format 'yyyyMMdd_HHmmss').m3u8"

$fullPlaylistPath = Join-Path $playlistsPath $playlistFile
$logFile = Join-Path $playlistsPath "production.log"

function Write-Log {
    param($Message, $Color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "$timestamp - $Message"
    Add-Content -Path $logFile -Value $logMessage -ErrorAction SilentlyContinue
    Write-Host $logMessage -ForegroundColor $Color
}

Clear-Host
Write-Host @"

██████╗  ██████╗ ██╗  ██╗ █████╗ ███████╗
██╔══██╗██╔═══██╗██║ ██╔╝██╔══██╗╚══███╔╝
██████╔╝██║   ██║█████╔╝ ███████║  ███╔╝ 
██╔═══╝ ██║   ██║██╔═██╗ ██╔══██║ ███╔╝  
██║     ╚██████╔╝██║  ██╗██║  ██║███████╗
╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
                                        
    POKAZ-GITHUB PRODUCTION
    Автоматическое обновление плейлиста
"@ -ForegroundColor Cyan

Write-Log "📁 Папка: $playlistsPath" "Yellow"
Write-Log "📄 Файл: $playlistFile" "Yellow"
Write-Log "📦 GitHub файл: $githubFileName" "Yellow"
Write-Log ""

# ШАГ 1: Проверка токена
Write-Log "🔑 ШАГ 1: Проверка токена..." "Cyan"
if (-not $githubToken) {
    Write-Log "❌ Токен не найден!" "Red"
    Write-Log "   Установите токен командой:" "Yellow"
    Write-Log '   [Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "ваш_токен", "User")' "Cyan"
    exit 1
}
Write-Log "✅ Токен найден" "Green"

# ШАГ 2: Проверка скрипта сборки
Write-Log "🔧 ШАГ 2: Проверка скрипта сборки..." "Cyan"
$buildScript = Join-Path $playlistsPath "build_pokaz_fixed.js"

if (Test-Path $buildScript) {
    Write-Log "   ✅ Скрипт найден: build_pokaz_fixed.js" "Green"
} else {
    Write-Log "   ❌ Скрипт не найден! Будет использован build_pokaz.js" "Yellow"
    $buildScript = Join-Path $playlistsPath "build_pokaz.js"
}

# ШАГ 3: Сборка плейлиста
Write-Log "📦 ШАГ 3: Сборка плейлиста..." "Cyan"
try {
    Push-Location $playlistsPath
    $result = node $buildScript 2>&1
    $exitCode = $LASTEXITCODE
    Pop-Location
    
    if ($exitCode -eq 0) {
        Write-Log "✅ Сборка успешно завершена" "Green"
        $result | Where-Object { $_ } | ForEach-Object { Write-Log "   $_" "Gray" }
    } else {
        Write-Log "❌ Ошибка сборки (код: $exitCode)" "Red"
        $result | Where-Object { $_ } | ForEach-Object { Write-Log "   $_" "Red" }
        exit 1
    }
} catch {
    Write-Log "❌ Исключение: $_" "Red"
    Pop-Location -ErrorAction SilentlyContinue
    exit 1
}

# ШАГ 4: Проверка файла плейлиста
Write-Log "📁 ШАГ 4: Проверка файла..." "Cyan"
Start-Sleep -Seconds 2

if (-not (Test-Path $fullPlaylistPath)) {
    Write-Log "❌ Файл не найден: $fullPlaylistPath" "Red"
    exit 1
}

$fileInfo = Get-Item $fullPlaylistPath
Write-Log "✅ Файл найден: $($fileInfo.Length) байт" "Green"

# ШАГ 5: Кодирование в Base64
Write-Log "🔐 ШАГ 5: Кодирование в Base64..." "Cyan"
try {
    $bytes = [System.IO.File]::ReadAllBytes($fullPlaylistPath)
    $base64 = [Convert]::ToBase64String($bytes)
    $base64Escaped = $base64 -replace '"', '\"' -replace '\\', '\\\\'
    Write-Log "   ✅ Файл закодирован (длина: $($base64.Length))" "Green"
} catch {
    Write-Log "❌ Ошибка кодирования: $_" "Red"
    exit 1
}

# ШАГ 6: Отправка на GitHub
Write-Log "📤 ШАГ 6: Отправка на GitHub..." "Cyan"
$message = "Auto-update playlist $(Get-Date -Format 'yyyy-MM-dd HH:mm') - Pokaz-Github"
$jsonString = '{"message":"' + $message + '","content":"' + $base64Escaped + '","branch":"' + $branch + '"}'

$tempFile = Join-Path $env:TEMP "github_prod.json"
$jsonString | Out-File -FilePath $tempFile -Encoding ASCII -NoNewline

$apiUrl = "https://api.github.com/repos/$repoOwner/$repoName/contents/$githubFileName"
$response = curl.exe -s -X PUT `
    -H "Authorization: token $githubToken" `
    -H "Accept: application/vnd.github+json" `
    -H "Content-Type: application/json" `
    -d "@$tempFile" `
    "$apiUrl"

$result = $response | ConvertFrom-Json

if ($result.content) {
    Write-Log "✅ УСПЕХ! Файл отправлен на GitHub!" "Green"
    Write-Log "   📝 Имя: $githubFileName" "Yellow"
    Write-Log "   🔗 URL: https://github.com/$repoOwner/$repoName/blob/$branch/$githubFileName" "Cyan"
    Write-Log "   🔑 SHA: $($result.content.sha)" "Gray"
    Write-Log "   📥 Скачать: https://github.com/$repoOwner/$repoName/raw/$branch/$githubFileName" "Cyan"
} else {
    Write-Log "❌ Ошибка: $($result.message)" "Red"
    $result | ConvertTo-Json -Depth 5 | Add-Content (Join-Path $playlistsPath "error.log")
}

Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
Write-Log ""
Write-Log "✅ ПРОЦЕСС ЗАВЕРШЕН" "Green"
Write-Log "⏰ Следующий запуск: $(Get-Date (Get-Date).AddHours(6) -Format 'yyyy-MM-dd HH:mm:ss')" "Cyan"

# Показываем последние строки лога
if (Test-Path $logFile) {
    Write-Log ""
    Write-Log "📋 Последние записи в логе:" "Cyan"
    Get-Content $logFile -Tail 5 -ErrorAction SilentlyContinue | ForEach-Object { Write-Log "   $_" "Gray" }
}
