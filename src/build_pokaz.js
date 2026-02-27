import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const BASE = 'https://pokaz.me';
const PLAYLIST_FILE = path.resolve('./playlists/pokaz_playlist.m3u8');
const LOG_FILE = path.resolve('./playlists/error_log.txt');

// Полный список каналов (здесь только первые три для теста, замените на полный)
const channels = [
  '/336-tv_pervyy_kanal_online.html',
  '/385-kanal-rossiya-1-tv.html',
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
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
  });

  await page.evaluateOnNewDocument(() => {
    delete navigator.__proto__.webdriver;
    window.navigator.chrome = { runtime: {} };
    Object.defineProperty(navigator, 'plugins', { get: () => [1,2,3] });
  });

  let playlist = '#EXTM3U\n';
  fs.writeFileSync(LOG_FILE, '');

  let successCount = 0, failCount = 0;

  for (let i = 0; i < channels.length; i++) {
    const url = BASE + channels[i];
    console.log(`📺 [${i + 1}/${channels.length}] ${url}`);

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      console.log(`  ⏳ Ожидание загрузки плеера...`);

      await page.waitForSelector('pjsdiv', { timeout: 15000 });
      console.log(`  🖱️ Клик по плееру...`);
      await page.click('pjsdiv');

      // Ждём ответ с m3u8 (может быть 302 или 200)
      const response = await page.waitForResponse(
        resp => resp.url().includes('s.pokaz.me/') && resp.url().includes('/index.m3u8'),
        { timeout: 15000 }
      );

      let finalUrl;
      const status = response.status();
      console.log(`  📊 Статус ответа: ${status}`);

      if (status === 200) {
        finalUrl = response.url();
        console.log(`  ✅ URL получен (200): ${finalUrl.substring(0, 80)}...`);
      } else if (status === 302) {
        const location = response.headers()['location'];
        if (!location) {
          throw new Error('302 без заголовка Location');
        }
        // Преобразуем относительный URL в абсолютный, если нужно
        finalUrl = location.startsWith('http') ? location : new URL(location, response.url()).href;
        console.log(`  🔄 Редирект на: ${finalUrl.substring(0, 80)}...`);
      } else {
        throw new Error(`Неожиданный статус ${status}`);
      }

      // Получаем куки сессии
      const cookies = await page.cookies();
      const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

      // Получаем название канала
      let name = '';
      try {
        name = await page.$eval('h1', el => el.textContent);
      } catch {
        name = await page.$eval('title', el => el.textContent.split('—')[0].trim());
      }
      name = cleanName(name);

      // Логотип
      let logo = '';
      try {
        logo = await page.$eval('article.block.story img', img =>
          img.src.startsWith('http') ? img.src : 'https://pokaz.me' + img.src
        );
      } catch {}

      // Формируем запись с куками и реферером
      const streamLine = `${finalUrl}|Referer=https://pokaz.me/|Cookie="${cookieString}"`;
      playlist += `#EXTINF:-1 tvg-id="${name}" tvg-name="${name}" tvg-logo="${logo}",${name}\n${streamLine}\n`;
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
