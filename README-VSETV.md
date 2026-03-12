# Проект для vsetv.click

## 🌳 Ветка: feature/vsetv-click

### 📋 Структура
- `src/build_vsetv.js` - скрипт сборки плейлиста
- `src/listeners/vsetv-listener.js` - отдельный слушатель
- `vsetv-control.ps1` - управление слушателем
- `switch-project.ps1` - переключение между проектами
- `logs/vsetv-listener.log` - логи
- `backups/vsetv/` - бэкапы плейлистов

### 🚀 Команды
```powershell
# Запуск слушателя
.\vsetv-control.ps1 -Command start

# Проверка статуса
.\vsetv-control.ps1 -Command status

# Просмотр логов
.\vsetv-control.ps1 -Command logs

# Остановка
.\vsetv-control.ps1 -Command stop

# Просмотр бэкапов
.\vsetv-control.ps1 -Command backup