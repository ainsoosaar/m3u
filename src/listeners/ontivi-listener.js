import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  site: 'ontivi',
  repoPath: path.resolve(__dirname, '../..'),
  triggerFile: path.join(path.resolve(__dirname, '../..'), 'trigger-ontivi.txt'),
  logFile: path.join(path.resolve(__dirname, '../..'), 'logs/ontivi-listener.log'),
  buildScript: 'src/build_ontivi.js',
  pollInterval: 60000,
  backupDir: path.join(path.resolve(__dirname, '../..'), 'backups/ontivi'),
  branch: 'feature/ontivi'
};

function ensureDirectories() {
  const dirs = [path.dirname(CONFIG.logFile), CONFIG.backupDir];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] [${CONFIG.site}] ${message}\n`;
  process.stdout.write(logMessage);
  fs.appendFileSync(CONFIG.logFile, logMessage);
}

function execPromise(command, options = {}) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: CONFIG.repoPath, ...options }, (error, stdout, stderr) => {
      if (error) reject({ error, stdout, stderr });
      else resolve({ stdout, stderr });
    });
  });
}

async function createBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(CONFIG.backupDir, `playlist-${timestamp}.m3u8`);
    const currentPlaylist = path.join(CONFIG.repoPath, 'playlists/ontivi_playlist.m3u8');
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

async function checkForTrigger() {
  try {
    if (fs.existsSync(CONFIG.triggerFile)) {
      const content = fs.readFileSync(CONFIG.triggerFile, 'utf8').trim();
      log(`🚀 Обнаружен триггер: ${content}`);

      await createBackup();
      fs.unlinkSync(CONFIG.triggerFile);

      log('📦 Обновление репозитория...');
      try {
        await execPromise(`git pull origin ${CONFIG.branch}`);
        log(`🎬 Запуск сборки для ${CONFIG.site}...`);
        const buildResult = await execPromise(`node ${CONFIG.buildScript}`);
        log(`✅ Результат сборки:\n${buildResult.stdout}`);

        // Добавляем в Git и пушим
        await execPromise('git add .');
        const date = new Date().toISOString();
        try {
          await execPromise(`git commit -m "Авто-обновление ${CONFIG.site} ${date}"`);
          log('✅ Коммит создан');
        } catch (commitError) {
          if (!commitError.stderr?.includes('nothing to commit')) throw commitError;
          log('📝 Нет изменений для коммита');
        }

        await execPromise(`git push origin ${CONFIG.branch}`);
        log('✅ Изменения отправлены в GitHub');

      } catch (buildError) {
        log(`❌ Ошибка сборки: ${buildError.message}`, 'ERROR');
        // Попытка восстановления из бэкапа...
      }
    }
  } catch (error) {
    log(`❌ Ошибка: ${error.message}`, 'ERROR');
  }
}

ensureDirectories();
log('='.repeat(60));
log(`🚀 СЛУШАТЕЛЬ ЗАПУЩЕН ДЛЯ ${CONFIG.site}`);
log(`🌿 Ветка: ${CONFIG.branch}`);
log('='.repeat(60));

setInterval(checkForTrigger, CONFIG.pollInterval);

process.on('SIGINT', () => {
  log('👋 Слушатель остановлен');
  process.exit();
});