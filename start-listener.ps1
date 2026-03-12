# Переход в папку репозитория
cd C:\Users\megaa\Desktop\Raschirenija\Pokaz.me-Github\m3u

# Проверка наличия Node.js
$nodeVersion = node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js не установлен!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js $nodeVersion" -ForegroundColor Green

# Проверка зависимостей
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Установка зависимостей..." -ForegroundColor Yellow
    npm install puppeteer
}

# Запуск слушателя в фоне
Write-Host "🚀 Запуск слушателя GitHub триггеров..." -ForegroundColor Green
Write-Host "📝 Лог будет сохраняться в listener.log" -ForegroundColor Cyan

# Запуск в фоновом режиме
$job = Start-Job -ScriptBlock {
    cd C:\Users\megaa\Desktop\Raschirenija\Pokaz.me-Github\m3u
    node src/local-listener.js
}

# Сохраняем информацию о задании
$job | Export-Clixml -Path "listener-job.xml"

Write-Host "✅ Слушатель запущен в фоновом режиме" -ForegroundColor Green
Write-Host "📊 ID задания: $($job.Id)" -ForegroundColor Yellow
Write-Host "💡 Для остановки: Stop-Job -Id $($job.Id)" -ForegroundColor Magenta
