import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const BASE = 'https://pokaz.me';
const PLAYLIST_FILE = path.resolve('./playlists/pokaz_playlist.m3u8');
const LOG_FILE = path.resolve('./playlists/error_log.txt');

// Список каналов (полный)
const channels = [
  '/336-tv_pervyy_kanal_online.html',
  '/385-kanal-rossiya-1-tv.html',
  '/6-kanal-ntv.html',
  '/8-kanal-ren-tv.html',
  '/62-kanal-rossiya-24.html'
];

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

  // Запускаем браузер с антидетект-аргументами
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: null,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });

  const page = await browser.newPage();

  // Устанавливаем заголовки как у реального браузера
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
  });

  // Убираем следы автоматизации
  await page.evaluateOnNewDocument(() => {
    delete navigator.__proto__.webdriver;
    window.navigator.chrome = { runtime: {} };
    Object.defineProperty(navigator, 'plugins', { get: () => [1,2,3] });
  });

  let playlist = '#EXTM3U\n';
  fs.writeFileSync(LOG_FILE, ''); // очистка лога

  let successCount = 0, failCount = 0;

  for (let i = 0; i < channels.length; i++) {
    const url = BASE + channels[i];
    console.log(`📺 [${i + 1}/${channels.length}] ${url}`);

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      console.log(`  ⏳ Ожидание загрузки плеера...`);

      // Ждём появления кнопки плеера
      await page.waitForSelector('pjsdiv', { timeout: 15000 });
      console.log(`  🖱️ Клик по плееру...`);
      await page.click('pjsdiv');

      // Ждём ответа с m3u8 (именно ответ, а не запрос)
      const response = await page.waitForResponse(
        response => response.url().includes('s.pokaz.me/') && response.url().includes('/index.m3u8'),
        { timeout: 15000 }
      );

      const finalUrl = response.url();
      console.log(`  ✅ Перехвачен ответ: ${finalUrl.substring(0, 80)}...`);
      console.log(`  📊 Статус ответа: ${response.status()}`);

      // Получаем название канала
      let name = '';
      try {
        name = await page.$eval('h1', el => el.textContent);
      } catch {
        name = await page.$eval('title', el => el.textContent.split('—')[0].trim());
      }
      name = cleanName(name);

      // Получаем логотип
      let logo = '';
      try {
        logo = await page.$eval('article.block.story img', img =>
          img.src.startsWith('http') ? img.src : 'https://pokaz.me' + img.src
        );
      } catch {}

      // Сохраняем чистый URL
      playlist += `#EXTINF:-1 tvg-id="${name}" tvg-name="${name}" tvg-logo="${logo}",${name}\n${finalUrl}\n`;
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
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Статистика: ✅ ${successCount} ❌ ${failCount}`);
  console.log(`📁 Плейлист сохранён: ${PLAYLIST_FILE}`);
  await browser.close();
}

build().catch(err => {
  console.error('❌ Критическая ошибка:', err);
  process.exit(1);
});