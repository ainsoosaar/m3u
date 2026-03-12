# Перейдите в корень репозитория (если вы не там)
cd C:\Users\megaa\Desktop\Raschirenija\Pokaz.me-Github\m3u

# Создайте файл CHEATSHEET.md с полной памяткой
@'
# 📚 ПОЛНАЯ ПАМЯТКА ПО УПРАВЛЕНИЮ ПРОЕКТОМ

## 🔧 Основные команды для switch-project.ps1

| Команда | Описание | Пример использования |
|---------|----------|---------------------|
| `.\switch-project.ps1 -Target status` | Показывает текущий статус проекта (ветка, слушатели, бэкапы) | `.\switch-project.ps1 -Target status` |
| `.\switch-project.ps1 -Target pokaz` | Переключает на проект pokaz.me (ветка main) | `.\switch-project.ps1 -Target pokaz` |
| `.\switch-project.ps1 -Target vsetv` | Переключает на проект vsetv.click (ветка feature/vsetv-click) | `.\switch-project.ps1 -Target vsetv` |
| `.\switch-project.ps1 -Target experimental` | Создает новую экспериментальную ветку с текущей датой | `.\switch-project.ps1 -Target experimental` |
| `.\switch-project.ps1 -Target list` | Показывает список всех веток в проекте | `.\switch-project.ps1 -Target list` |
| `.\switch-project.ps1 -Target help` | Показывает справку по всем командам | `.\switch-project.ps1 -Target help` |
| `.\switch-project.ps1 -Target clean` | Останавливает все активные слушатели | `.\switch-project.ps1 -Target clean` |

---

## 🎬 Управление слушателем pokaz.me

| Команда | Описание |
|---------|----------|
| `.\start-listener.ps1` | Запускает слушатель для pokaz.me |
| `.\listener-control.ps1 -Command status` | Проверяет статус слушателя pokaz.me |
| `.\listener-control.ps1 -Command stop` | Останавливает слушатель pokaz.me |
| `.\listener-control.ps1 -Command restart` | Перезапускает слушатель pokaz.me |
| `.\listener-control.ps1 -Command logs` | Показывает последние логи pokaz.me |

---

## 📺 Управление слушателем vsetv.click

| Команда | Описание |
|---------|----------|
| `.\vsetv-control.ps1 -Command start` | Запускает слушатель для vsetv.click |
| `.\vsetv-control.ps1 -Command status` | Проверяет статус слушателя vsetv.click |
| `.\vsetv-control.ps1 -Command stop` | Останавливает слушатель vsetv.click |
| `.\vsetv-control.ps1 -Command restart` | Перезапускает слушатель vsetv.click |
| `.\vsetv-control.ps1 -Command logs` | Показывает последние логи vsetv.click |
| `.\vsetv-control.ps1 -Command backup` | Показывает список бэкапов vsetv.click |

---

## 📊 Просмотр логов с кириллицей

| Команда | Описание |
|---------|----------|
| `Show-VsetvLogs` | Показывает последние 30 строк лога vsetv.click |
| `Show-VsetvLogs -Lines 50` | Показывает последние 50 строк |
| `Show-VsetvLogs -Follow` | Следит за логом в реальном времени (Ctrl+C для выхода) |
| `Show-PokazLogs` | Показывает последние 30 строк лога pokaz.me |
| `Show-PokazLogs -Follow` | Следит за логом pokaz.me в реальном времени |

---

## 🗂️ Работа с Git и ветками

| Команда | Описание |
|---------|----------|
| `git branch` | Показывает локальные ветки |
| `git branch -a` | Показывает все ветки (локальные и удаленные) |
| `git checkout main` | Переключается на ветку main (pokaz.me) |
| `git checkout feature/vsetv-click` | Переключается на ветку vsetv.click |
| `git pull origin main` | Обновляет текущую ветку |

---

## 💾 Работа с бэкапами

| Команда | Описание |
|---------|----------|
| `dir backups\vsetv` | Просмотр бэкапов vsetv.click |
| `dir backups\main` | Просмотр бэкапов pokaz.me |
| `.\vsetv-control.ps1 -Command backup` | Показывает список бэкапов с размерами |

---

## 🔄 Быстрые команды для повседневной работы

```powershell
# Проверить статус всего проекта
.\switch-project.ps1 -Target status

# Переключиться на vsetv и запустить слушатель
.\switch-project.ps1 -Target vsetv
.\vsetv-control.ps1 -Command start

# Переключиться на pokaz и запустить слушатель
.\switch-project.ps1 -Target pokaz
.\start-listener.ps1

# Посмотреть логи vsetv
Show-VsetvLogs -Follow

# Остановить всё и привести к чистоте
.\switch-project.ps1 -Target clean