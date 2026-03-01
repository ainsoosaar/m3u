import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AnonymizeUAPlugin from 'puppeteer-extra-plugin-anonymize-ua';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

puppeteer.use(StealthPlugin());
puppeteer.use(AnonymizeUAPlugin());

const channels = [
  { name: 'Первый канал', url: 'https://pokaz.me/336-tv_pervyy_kanal_online.html' },
  { name: 'Россия 24', url: 'https://pokaz.me/62-kanal-rossiya-24.html' }
];

const OUTPUT_FILE = path.join(__dirname, '..', 'playlists', 'pokaz_playlist.m3u8');
const ERROR_LOG = path.join(__dirname, '..', 'playlists', 'error_log.txt');

// Функция для подключения к browserless
async function connectBrowser() {
  const apiKey = process.env.BROWSERLESS_API_KEY;
  if (!apiKey) {
    throw new Error('BROWSERLESS_API_KEY environment variable not set');
  }
  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${apiKey}`,
  });
  return browser;
}

async function emulateHumanActivity(page) {
  await page.mouse.move(100 + Math.random() * 500, 100 + Math.random() * 500);
  await page.mouse.move(200 + Math.random() * 500, 200 + Math.random() * 500);
  await page.evaluate(() => window.scrollBy(0, Math.random() * 200));
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
}

async function getStreamUrl(page, channelUrl) {
  try {
    console.log(`📺 ${channelUrl}`);
    await page.goto(channelUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    await emulateHumanActivity(page);

    await page.waitForFunction(
      () => {
        const video = document.querySelector('video');
        return video && video.src && video.src.startsWith('https://s.pokaz.me/');
      },
      { timeout: 60000 }
    );

    const src = await page.$eval('video', el => el.src);
    console.log(`  ✅ Найден поток: ${src}`);

    const userAgent = await page.evaluate(() => navigator.userAgent);
    console.log(`  🕵️ User-Agent: ${userAgent}`);
    const webglVendor = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      if (!gl) return 'no webgl';
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      return debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) + ' ' + gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
    });
    console.log(`  🖥️ WebGL: ${webglVendor}`);

    const outer = await page.$eval('video', el => el.outerHTML);
    console.log(`  📄 Video element: ${outer.substring(0, 200)}...`);

    return src;
  } catch (error) {
    console.error(`  ❌ Ошибка: ${error.message}`);
    return null;
  }
}

async function buildPlaylist() {
  console.log('🚀 Запуск сборки плейлиста с browserless.io...');
  console.log('==================================================');


  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--window-size=1920,1080',
      '--start-maximized',
      '--disable-blink-features=AutomationControlled',
      '--use-gl=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--disable-dev-shm-usage'
    ]
  });

  const errors = [];
  const playlist = ['#EXTM3U'];


  let browser;

  try {
    browser = await connectBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
    });

    const errors = [];
    const playlist = ['#EXTM3U'];

    for (let i = 0; i < channels.length; i++) {
      const ch = channels[i];
      console.log(`📺 [${i+1}/${channels.length}] ${ch.url}`);

      const streamUrl = await getStreamUrl(page, ch.url);

      if (streamUrl) {
        playlist.push(`#EXTINF:-1 tvg-id="${ch.name}" tvg-name="${ch.name}" tvg-logo="https://pokaz.me/posts/2017-11/1511429376_1463597059_pervyy-kanal.png",${ch.name}`);
        playlist.push(streamUrl);
      } else {
        errors.push(`❌ ${ch.name}: не удалось получить поток`);
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    await page.close();

    fs.writeFileSync(OUTPUT_FILE, playlist.join('\n'), 'utf8');
    console.log('==================================================');
    console.log(`📊 Статистика:`);
    console.log(`   ✅ Успешно: ${playlist.length - 1}`);
    console.log(`   ❌ Ошибок: ${errors.length}`);
    console.log(`   📁 Плейлист сохранён: ${OUTPUT_FILE}`);

    if (errors.length > 0) {
      fs.writeFileSync(ERROR_LOG, errors.join('\n'), 'utf8');
    } else if (fs.existsSync(ERROR_LOG)) {
      fs.unlinkSync(ERROR_LOG);
    }
  } finally {
    if (browser) await browser.close();
  }
}

buildPlaylist().catch(console.error);
