import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const BASE = 'https://pokaz.me';
const PLAYLIST_FILE = path.resolve('./playlists/pokaz_playlist.m3u8');
const LOG_FILE = path.resolve('./playlists/error_log.txt');

// Список каналов (ваш полный список)
const channels = [ /* ... ваш полный список каналов ... */ ];

function cleanName(name) {
  return name.replace(/смотреть онлайн|телеканал|прямой эфир|онлайн/gi, '').replace(/\s+/g, ' ').trim();
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
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');

  let playlist = '#EXTM3U\n';
  fs.writeFileSync(LOG_FILE, '');
  let successCount = 0, failCount = 0;

  for (let i = 0; i < channels.length; i++) {
    const url = BASE + channels[i];
    console.log(`📺 [${i + 1}/${channels.length}] ${url}`);

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('pjsdiv video', { timeout: 10000 });

      // 🔥 Ждем появления НЕПУСТОГО src с токеном
      await page.waitForFunction(
        () => {
          const video = document.querySelector('pjsdiv video');
          return video && video.src && video.src.includes('.m3u8?k=') && !video.src.endsWith('S');
        },
        { timeout: 15000 }
      );

      await delay(2000); // Дополнительная страховка

      const stream = await page.$eval('pjsdiv video', vid => vid.src);
      const name = cleanName(await page.$eval('h1', el => el.textContent).catch(() => 'Channel'));

      let logo = '';
      try {
        logo = await page.$eval('article.block.story img', img => img.src.startsWith('http') ? img.src : 'https://pokaz.me' + img.src);
      } catch { /* без лого */ }

      // Добавляем Referer для работы в плеере
      playlist += `#EXTINF:-1 tvg-id="${name}" tvg-name="${name}" tvg-logo="${logo}",${name}\n${stream}|Referer=https://pokaz.me/\n`;
      console.log(`  ✅ ${name}`);
      successCount++;
    } catch (err) {
      console.error(`  ❌ Ошибка: ${err.message}`);
      fs.appendFileSync(LOG_FILE, `${url} - ${err.message}\n`);
      failCount++;
    }
    await delay(1000);
  }

  fs.writeFileSync(PLAYLIST_FILE, playlist);
  console.log(`\n📊 Статистика: ✅ ${successCount} ❌ ${failCount}\n📁 Плейлист: ${PLAYLIST_FILE}`);
  await browser.close();
}

build().catch(console.error);
