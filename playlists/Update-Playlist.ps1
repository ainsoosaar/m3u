# Путь к папке с плейлистами
$playlistPath = "C:\Users\megaa\Desktop\Расширения\GitHub\Github_Pokaz.me\pokaz-m3u.v1.0 — копия\pokaz-m3u\playlists"
$playlistFile = "pokaz.m3u"

# URL плейлиста на GitHub
$githubUrl = "https://raw.githubusercontent.com/OlDom/BaltTV/main/pokaz.m3u"

try {
    # Создаем полный путь к файлу
    $fullPath = Join-Path $playlistPath $playlistFile
    
    # Скачиваем файл
    Invoke-WebRequest -Uri $githubUrl -OutFile $fullPath -UseBasicParsing
    
    # Логируем успешное обновление
    $logMessage = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Плейлист успешно обновлен"
    Add-Content -Path (Join-Path $playlistPath "update_log.txt") -Value $logMessage
    
    Write-Host "Плейлист успешно обновлен"
}
catch {
    # Логируем ошибку
    $errorMessage = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - ОШИБКА: $_"
    Add-Content -Path (Join-Path $playlistPath "error_log.txt") -Value $errorMessage
    
    Write-Host "Ошибка при обновлении плейлиста: $_"
    exit 1
}