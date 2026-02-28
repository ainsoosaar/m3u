import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const BASE = 'https://pokaz.me';
const PLAYLIST_FILE = path.resolve('./playlists/pokaz_playlist.m3u8');
const LOG_FILE = path.resolve('./playlists/error_log.txt');

// ============================================
// ПОЛНЫЙ СПИСОК КАНАЛОВ (ВОССТАНОВЛЕН ИЗ УСПЕШНЫХ ЗАПУСКОВ)
// ============================================
const channels = [
  // Основные федеральные
  '/336-tv_pervyy_kanal_online.html',
  '/62-kanal-rossiya-24.html'
];

// Очистка названия канала
function cleanName(name) {
  return name
    .replace(/смотреть онлайн/i, '')
    .replace(/телеканал/i, '')
    .replace(/прямой эфир/i, '')
    .replace(/онлайн/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function build() {
  console.log('🚀 Запуск сборки плейлиста...');
  console.log('='.repeat(50));

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: null,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080'
    ]
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  let playlist = '#EXTM3U\n';
  fs.writeFileSync(LOG_FILE, '');

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < channels.length; i++) {
    const channelPath = channels[i];
    const url = BASE + channelPath;

    console.log(`📺 [${i + 1}/${channels.length}] ${url}`);

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await delay(3000);

      let stream = '';
      try {
        stream = await page.$eval('video', vid => vid.src);
      } catch {
        console.warn('  ⚠️ Видео не найдено, пропускаем');
        fs.appendFileSync(LOG_FILE, `${url} - видео не найдено\n`);
        failCount++;
        continue;
      }

      if (!stream) {
        console.warn('  ⚠️ Пустой src, пропускаем');
        fs.appendFileSync(LOG_FILE, `${url} - пустой src\n`);
        failCount++;
        continue;
      }

      console.log(`  ✅ Найден поток`);

      let name = '';
      try {
        name = await page.$eval('h1', el => el.textContent);
      } catch {
        name = await page.$eval('title', el => el.textContent.split('—')[0].trim());
      }
      name = cleanName(name);

      let logo = '';
      try {
        logo = await page.$eval('article.block.story img', img =>
          img.src.startsWith('http') ? img.src : 'https://pokaz.me' + img.src
        );
      } catch {}

      playlist += `#EXTINF:-1 tvg-id="${name}" tvg-name="${name}" tvg-logo="${logo}",${name}\n${stream}\n`;
      console.log(`  ✅ ${name}`);
      successCount++;

    } catch (err) {
      console.error(`  ❌ Ошибка на канале ${channelPath}:`, err.message);
      fs.appendFileSync(LOG_FILE, `${url} - ${err.message}\n`);
      failCount++;
    }

    await delay(1000);
  }

  fs.writeFileSync(PLAYLIST_FILE, playlist);

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Статистика:`);
  console.log(`   ✅ Успешно: ${successCount}`);
  console.log(`   ❌ Ошибок: ${failCount}`);
  console.log(`   📁 Плейлист сохранён: ${PLAYLIST_FILE}`);

  await browser.close();
}

build().catch(err => {
  console.error('❌ Критическая ошибка:', err);
  process.exit(1);
});
