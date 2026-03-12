import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Конфигурация для vsetv.click
const CONFIG = {
  site: 'vsetv.click',
  repoPath: path.resolve(__dirname, '../..'),
  triggerFile: path.join(path.resolve(__dirname, '../..'), 'trigger-vsetv.txt'),
  logFile: path.join(path.resolve(__dirname, '../..'), 'logs/vsetv-listener.log'),
  buildScript: 'src/build_vsetv.js',
  pollInterval: 60000, // 1 минута
  backupDir: path.join(path.resolve(__dirname, '../..'), 'backups/vsetv'),
  branch: 'feature/vsetv-click'
};

// Создаем необходимые папки
function ensureDirectories() {
  const dirs = [
    path.dirname(CONFIG.logFile),
    CONFIG.backupDir
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Создана папка: ${dir}`);
    }
  });
}

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] [${CONFIG.site}] ${message}\n`;
  
  // В консоль
  process.stdout.write(logMessage);
  
  // В файл
  fs.appendFileSync(CONFIG.logFile, logMessage);
}

function execPromise(command, options = {}) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: CONFIG.repoPath, ...options }, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stdout, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

// Создание бэкапа перед сборкой
async function createBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(CONFIG.backupDir, `playlist-${timestamp}.m3u8`);
    const currentPlaylist = path.join(CONFIG.repoPath, 'playlists/vsetv_playlist.m3u8');
    
    if (fs.existsSync(currentPlaylist)) {
      fs.copyFileSync(currentPlaylist, backupFile);
      log(`💾 Создан бэкап: ${backupFile}`);
      return true;
    }
  } catch (error) {
    log(`❌ Ошибка создания бэкапа: ${error.message}`, 'ERROR');
    return false;
  }
}

// Восстановление из последнего бэкапа
async function restoreFromBackup() {
  try {
    const backups = fs.readdirSync(CONFIG.backupDir)
      .filter(f => f.endsWith('.m3u8'))
      .sort()
      .reverse();
    
    if (backups.length > 0) {
      const latestBackup = path.join(CONFIG.backupDir, backups[0]);
      const currentPlaylist = path.join(CONFIG.repoPath, 'playlists/vsetv_playlist.m3u8');
      
      fs.copyFileSync(latestBackup, currentPlaylist);
      log(`🔄 Восстановлен бэкап: ${backups[0]}`);
      return true;
    }
  } catch (error) {
    log(`❌ Ошибка восстановления: ${error.message}`, 'ERROR');
    return false;
  }
}

async function checkForTrigger() {
  try {
    if (fs.existsSync(CONFIG.triggerFile)) {
      const content = fs.readFileSync(CONFIG.triggerFile, 'utf8').trim();
      log(`🚀 Обнаружен триггер: ${content}`);
      
      // Создаем бэкап перед сборкой
      await createBackup();
      
      // Удаляем триггер
      fs.unlinkSync(CONFIG.triggerFile);
      
      log('📦 Обновление репозитория...');
      try {
        const pullResult = await execPromise(`git pull origin ${CONFIG.branch}`);
        log(`✅ git pull: ${pullResult.stdout}`);
        
        // Запускаем сборку
        log(`🎬 Запуск сборки для ${CONFIG.site}...`);
        try {
          const buildResult = await execPromise(`node ${CONFIG.buildScript}`);
          log(`✅ Результат сборки:\n${buildResult.stdout}`);
          
          // Проверяем успешность сборки
          const playlistPath = path.join(CONFIG.repoPath, 'playlists/vsetv_playlist.m3u8');
          if (fs.existsSync(playlistPath)) {
            const stats = fs.statSync(playlistPath);
            log(`📊 Размер плейлиста: ${stats.size} байт`);
            
            // Отправляем все изменения в правильную ветку
            log(`📤 Отправка в GitHub (ветка ${CONFIG.branch})...`);
            
            // Добавляем все изменения
            await execPromise('git add .');
            
            // Проверяем есть ли изменения для коммита
            const statusResult = await execPromise('git status --porcelain');
            if (statusResult.stdout.trim()) {
              // Коммит с датой
              const date = new Date().toISOString();
              await execPromise(`git commit -m "Авто-обновление проекта ${CONFIG.site} ${date}"`);
              
              // Пуш в правильную ветку
              try {
                await execPromise(`git push origin ${CONFIG.branch}`);
                log('✅ Изменения отправлены в GitHub');
              } catch (pushError) {
                log(`⚠️ Ошибка при пуше: ${pushError.error?.message || pushError}`, 'WARNING');
                
                // Пробуем pull + push
                log('🔄 Пробуем pull + push...');
                await execPromise(`git pull origin ${CONFIG.branch}`);
                await execPromise(`git push origin ${CONFIG.branch}`);
                log('✅ Успешно после pull');
              }
            } else {
              log('📝 Нет изменений для коммита');
            }
          }
          
        } catch (buildError) {
          log(`❌ Ошибка сборки: ${buildError.error?.message || buildError}`, 'ERROR');
          
          // При ошибке пробуем восстановить из бэкапа
          log('🔄 Пробуем восстановить из бэкапа...');
          await restoreFromBackup();
        }
        
      } catch (pullError) {
        log(`❌ Ошибка git pull: ${pullError.error?.message || pullError}`, 'ERROR');
      }
    }
  } catch (error) {
    log(`❌ Ошибка в checkForTrigger: ${error.message}`, 'ERROR');
  }
}

// Инициализация
ensureDirectories();
log('='.repeat(60));
log(`🚀 СЛУШАТЕЛЬ ЗАПУЩЕН ДЛЯ ${CONFIG.site}`);
log(`📁 Репозиторий: ${CONFIG.repoPath}`);
log(`🔔 Триггер: ${CONFIG.triggerFile}`);
log(`📝 Лог: ${CONFIG.logFile}`);
log(`💾 Бэкапы: ${CONFIG.backupDir}`);
log(`🌿 Ветка: ${CONFIG.branch}`);
log(`⏱️  Проверка каждые ${CONFIG.pollInterval/1000} секунд`);
log('='.repeat(60));

setInterval(checkForTrigger, CONFIG.pollInterval);

process.on('SIGINT', () => {
  log('👋 Слушатель остановлен');
  process.exit();
});