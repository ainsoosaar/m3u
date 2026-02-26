# ============================================
# production-final.ps1 - ФИНАЛЬНАЯ ВЕРСИЯ
# ============================================

$playlistsPath = "C:\Users\megaa\Desktop\Raschirenija\pokaz-m3u-clean\playlists"
$playlistFile = "pokaz_playlist.m3u8"
$githubToken = [Environment]::GetEnvironmentVariable("GITHUB_TOKEN", "User")
$repoOwner = "ainsoosaar"
$repoName = "m3u"
$branch = "main"
$githubFileName = "playlist_from_pc.m3u8"

$fullPlaylistPath = Join-Path $playlistsPath $playlistFile
$logFile = Join-Path $playlistsPath "production.log"
$errorFile = Join-Path $playlistsPath "error.log"

function Write-Log {
    param($Message, $Color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "$timestamp - $Message"
    Add-Content -Path $logFile -Value $logMessage
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
                                        
    PRODUCTION СКРИПТ v3.0.0
    Автоматическое обновление плейлиста
"@ -ForegroundColor Cyan

Write-Log "📁 Папка: $playlistsPath" "Yellow"
Write-Log "📄 Файл: $playlistFile" "Yellow"
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

# ШАГ 2: Сборка плейлиста
Write-Log "📦 ШАГ 2: Сборка плейлиста..." "Cyan"
try {
    Push-Location $playlistsPath
    $result = node build_pokaz.js 2>&1
    $exitCode = $LASTEXITCODE
    Pop-Location
    
    if ($exitCode -eq 0) {
        Write-Log "✅ Сборка успешно завершена" "Green"
        Write-Log "📊 Результат сборки:" "Gray"
        $result | Where-Object { $_ } | ForEach-Object { Write-Log "   $_" "Gray" }
    } else {
        Write-Log "❌ Ошибка сборки (код: $exitCode)" "Red"
        Write-Log "📋 Вывод ошибки:" "Red"
        $result | Where-Object { $_ } | ForEach-Object { Write-Log "   $_" "Red" }
        exit 1
    }
} catch {
    Write-Log "❌ Исключение при сборке: $_" "Red"
    Pop-Location -ErrorAction SilentlyContinue
    exit 1
}

# ШАГ 3: Проверка файла плейлиста
Write-Log "📁 ШАГ 3: Проверка файла..." "Cyan"
Start-Sleep -Seconds 2

if (-not (Test-Path $fullPlaylistPath)) {
    Write-Log "❌ Файл не найден: $fullPlaylistPath" "Red"
    
    # Ищем другие m3u8 файлы
    $foundFiles = Get-ChildItem $playlistsPath -Filter "*.m3u8"
    if ($foundFiles) {
        Write-Log "📋 Найденные m3u8 файлы:" "Yellow"
        $foundFiles | ForEach-Object {
            Write-Log "   - $($_.Name) ($($_.Length) байт, изменен: $($_.LastWriteTime))" "Gray"
        }
    }
    exit 1
}

$fileInfo = Get-Item $fullPlaylistPath
Write-Log "✅ Файл найден" "Green"
Write-Log "   📍 Размер: $($fileInfo.Length) байт" "Gray"
Write-Log "   🕒 Изменен: $($fileInfo.LastWriteTime)" "Gray"

# ШАГ 4: Получение SHA с GitHub
Write-Log "🔑 ШАГ 4: Получение SHA..." "Cyan"
$apiUrl = "https://api.github.com/repos/$repoOwner/$repoName/contents/$githubFileName"

try {
    $checkResponse = curl.exe -s -H "Authorization: token $githubToken" `
        -H "Accept: application/vnd.github+json" `
        "$apiUrl?ref=$branch"
    
    if ($checkResponse -and $checkResponse.Trim() -and $checkResponse -notlike "*Not Found*") {
        $checkResult = $checkResponse | ConvertFrom-Json
        $sha = $checkResult.sha
        Write-Log "✅ Получен SHA: $sha" "Green"
    } else {
        Write-Log "📝 Файл на GitHub не найден, будет создан новый" "Yellow"
        $sha = $null
    }
} catch {
    Write-Log "⚠️ Ошибка получения SHA: $_" "Yellow"
    $sha = $null
}

# ШАГ 5: Кодирование в Base64
Write-Log "🔐 ШАГ 5: Кодирование в Base64..." "Cyan"
try {
    $bytes = [System.IO.File]::ReadAllBytes($fullPlaylistPath)
    $base64 = [Convert]::ToBase64String($bytes)
    Write-Log "✅ Файл закодирован (длина: $($base64.Length))" "Green"
} catch {
    Write-Log "❌ Ошибка кодирования: $_" "Red"
    exit 1
}

# ШАГ 6: Отправка на GitHub
Write-Log "📤 ШАГ 6: Отправка на GitHub..." "Cyan"
$message = "Auto-update playlist $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
$base64Escaped = $base64 -replace '"', '\"' -replace '\\', '\\\\'

if ($sha) {
    $jsonString = '{"message":"' + $message + '","content":"' + $base64Escaped + '","sha":"' + $sha + '","branch":"' + $branch + '"}'
    Write-Log "   📝 Обновление существующего файла" "Gray"
} else {
    $jsonString = '{"message":"' + $message + '","content":"' + $base64Escaped + '","branch":"' + $branch + '"}'
    Write-Log "   📝 Создание нового файла" "Gray"
}

$tempFile = Join-Path $env:TEMP "github_prod_$([System.Guid]::NewGuid()).json"
$jsonString | Out-File -FilePath $tempFile -Encoding ASCII -NoNewline

try {
    $response = curl.exe -s -X PUT `
        -H "Authorization: token $githubToken" `
        -H "Accept: application/vnd.github+json" `
        -H "Content-Type: application/json" `
        -d "@$tempFile" `
        "$apiUrl"
    
    $result = $response | ConvertFrom-Json
    
    if ($result.content) {
        Write-Log "✅ УСПЕХ! Файл отправлен на GitHub!" "Green"
        Write-Log "   🔗 https://github.com/$repoOwner/$repoName/blob/$branch/$githubFileName" "Cyan"
        Write-Log "   🔑 Новый SHA: $($result.content.sha)" "Yellow"
        
        # Сохраняем SHA для следующего раза
        $newSha = $result.content.sha
        Write-Log "   📝 SHA для следующего обновления: $newSha" "Gray"
    } else {
        Write-Log "❌ Ошибка GitHub: $($result.message)" "Red"
        $result | ConvertTo-Json -Depth 5 | Add-Content $errorFile
    }
} catch {
    Write-Log "❌ Ошибка отправки: $_" "Red"
    if ($response) { Add-Content $errorFile $response }
} finally {
    Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
}

Write-Log ""
Write-Log "✅ ПРОЦЕСС ЗАВЕРШЕН" "Green"

# Показываем последние строки лога
if (Test-Path $logFile) {
    Write-Log ""
    Write-Log "📋 Последние записи в логе:" "Cyan"
    Get-Content $logFile -Tail 5 | ForEach-Object { Write-Log "   $_" "Gray" }
}
