import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const POLL_INTERVAL = 60000 // Проверка каждую минуту
const REPO_PATH = path.resolve(__dirname, '..')
const TRIGGER_FILE = path.join(REPO_PATH, 'trigger.txt')
const LOG_FILE = path.join(REPO_PATH, 'listener.log')

function log(message) {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] ${message}\n`
  console.log(logMessage.trim())
  fs.appendFileSync(LOG_FILE, logMessage)
}

function execPromise(command, options = {}) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: REPO_PATH, ...options }, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stdout, stderr })
      } else {
        resolve({ stdout, stderr })
      }
    })
  })
}

async function checkForTrigger() {
  try {
    // Проверяем наличие триггер-файла
    if (fs.existsSync(TRIGGER_FILE)) {
      const content = fs.readFileSync(TRIGGER_FILE, 'utf8').trim()
      log(`🚀 Обнаружен триггер: ${content}`)
      
      // Удаляем триггер-файл сразу
      fs.unlinkSync(TRIGGER_FILE)
      
      // Обновляем репозиторий
      log('📦 Обновление репозитория...')
      try {
        const pullResult = await execPromise('git pull origin main')
        log(`✅ git pull: ${pullResult.stdout}`)
        
        // Запускаем сборку
        log('🎬 Запуск сборки плейлиста...')
        try {
          const buildResult = await execPromise('node src/build_pokaz.js')
          log(`✅ Результат сборки:\n${buildResult.stdout}`)
          
          // Пушим изменения
          log('📤 Отправка в GitHub...')
          try {
            // Добавляем файлы
            await execPromise('git add playlists/')
            
            // Проверяем есть ли изменения для коммита
            const statusResult = await execPromise('git status --porcelain')
            if (statusResult.stdout.trim()) {
              // Коммит
              const date = new Date().toISOString()
              await execPromise(`git commit -m "Авто-обновление плейлиста ${date}"`)
              
              // Пуш
              const pushResult = await execPromise('git push origin main')
              log(`✅ Изменения отправлены: ${pushResult.stdout}`)
            } else {
              log('📝 Нет изменений для коммита')
            }
            
          } catch (pushError) {
            log(`❌ Ошибка при пуше: ${pushError.error?.message || pushError}`)
            
            // Если ошибка из-за удаленных изменений, пробуем pull и push снова
            if (pushError.stderr?.includes('fetch first') || pushError.error?.message?.includes('fetch first')) {
              log('🔄 Обнаружены удаленные изменения, пробуем pull...')
              try {
                await execPromise('git pull origin main')
                await execPromise('git push origin main')
                log('✅ Успешный пуш после pull')
              } catch (retryError) {
                log(`❌ Повторная попытка не удалась: ${retryError.error?.message || retryError}`)
              }
            }
          }
          
        } catch (buildError) {
          log(`❌ Ошибка сборки: ${buildError.error?.message || buildError}`)
          if (buildError.stderr) {
            log(`⚠️ Stderr: ${buildError.stderr}`)
          }
        }
        
      } catch (pullError) {
        log(`❌ Ошибка git pull: ${pullError.error?.message || pullError}`)
      }
    }
  } catch (error) {
    log(`❌ Ошибка в checkForTrigger: ${error.message}`)
  }
}

// Запускаем бесконечный цикл проверки
log('🚀 Слушатель GitHub триггеров запущен')
log(`📁 Репозиторий: ${REPO_PATH}`)
log(`⏱️  Проверка каждые ${POLL_INTERVAL/1000} секунд`)

setInterval(checkForTrigger, POLL_INTERVAL)

// Обработка корректного завершения
process.on('SIGINT', () => {
  log('👋 Слушатель остановлен')
  process.exit()
})
