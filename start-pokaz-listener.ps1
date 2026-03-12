# Запуск слушателя при старте Windows
$listenerPath = "C:\Users\megaa\Desktop\Raschirenija\Pokaz.me-Github\m3u\start-listener.ps1"
$logPath = "C:\Users\megaa\Desktop\Raschirenija\Pokaz.me-Github\m3u\autostart.log"

# Ждем 30 секунд после запуска Windows
Start-Sleep -Seconds 30

# Запускаем слушатель
powershell -File $listenerPath >> $logPath 2>&1