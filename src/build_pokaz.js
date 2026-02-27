import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const BASE = 'https://pokaz.me';
const PLAYLIST_FILE = path.resolve('./playlists/pokaz_playlist.m3u8');
const LOG_FILE = path.resolve('./playlists/error_log.txt');

// Полный список каналов
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

  // 1. Запуск браузера с антидетект-аргументами
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

  // 2. Установка заголовков, как у реального браузера
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
  });

  // 3. Убираем следы автоматизации
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
      // Переходим на страницу канала
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      console.log(`  ⏳ Ожидание загрузки плеера...`);

      // Ждём кнопку плеера
      await page.waitForSelector('pjsdiv', { timeout: 15000 });
      console.log(`  🖱️ Клик по плееру...`);
      await page.click('pjsdiv');

      // Перехватываем ответ с m3u8
      const response = await page.waitForResponse(
        resp => resp.url().includes('s.pokaz.me/') && resp.url().includes('/index.m3u8'),
        { timeout: 15000 }
      );

      const finalUrl = response.url();
      const status = response.status();
      console.log(`  ✅ Перехвачен URL: ${finalUrl.substring(0, 80)}...`);
      console.log(`  📊 Статус ответа: ${status}`);

      if (status !== 200) {
        console.log(`  ⚠️ Сервер вернул ${status}, пропускаем`);
        fs.appendFileSync(LOG_FILE, `${url} - статус ${status}\n`);
        failCount++;
        continue;
      }

      // Получаем куки текущей сессии (важно для аутентификации запроса)
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

      // Получаем логотип
      let logo = '';
      try {
        logo = await page.$eval('article.block.story img', img =>
          img.src.startsWith('http') ? img.src : 'https://pokaz.me' + img.src
        );
      } catch {}

      // Формируем запись в плейлисте: добавляем Cookie и Referer
      // Внимание: не все плееры поддерживают такой формат (поддерживают VLC и некоторые IPTV-плееры)
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
