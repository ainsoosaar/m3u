import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const BASE = 'https://pokaz.me';
const PLAYLIST_FILE = path.resolve('./playlists/pokaz_playlist.m3u8');
const LOG_FILE = path.resolve('./playlists/error_log.txt');

// Определяем путь к браузеру
const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || 
                       (process.platform === 'win32' 
                         ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
                         : '/usr/bin/chromium-browser');

console.log(`🔍 Используем браузер: ${executablePath}`);

// Список каналов (полный)
const channels = [
  '/336-tv_pervyy_kanal_online.html',
  '/385-kanal-rossiya-1-tv.html',
  '/6-kanal-ntv.html',
  '/8-kanal-ren-tv.html',
  '/431-kanal-tvc.html',
  '/100-kanal-domashniy.html',
  '/93-kanal-pyatyy-kanal-sankt-peterburg.html',
  '/81-kanal-rossiya-k-kultura.html',
  '/468-360-podmoskove-tv.html',
  '/283-kanal-gtrk-krym.html',
  '/144-kanal_rtr_planeta-tvkanal.html',
  '/438-kanal-mir-tv.html',
  '/40-kanal-zvezda.html',
  '/437-kanal-galaxy-tv.html',
  '/397-kanal-morskoy.html',
  '/393-kanal-nauka-2.html',
  '/448-kanal-rtg.html',
  '/373-kanal-bober.html',
  '/396-kanal-oruzhie.html',
  '/208-kanal-history-channel.html',
  '/352-kanal-24-tehno.html',
  '/459-kanal-priklyucheniya-hd.html',
  '/60-kanal-sovershenno-sekretno.html',
  '/213-kanal-travel-channel.html',
  '/395-kanal-ohota-i-rybalka.html',
  '/103-kanal-ohotnik-i-rybolov.html',
  '/104-kanal-eda-tv.html',
  '/286-kanal-travel-and-adventure.html',
  '/439-kanal-illyuzion.html',
  '/418-kanal-mir-seriala.html',
  '/115-kanal-dom-kino.html',
  '/470-ntv-hit-tv.html',
  '/469-ntv-serial-tv.html',
  '/472-hollywood-tv.html',
  '/464-kanal-shokiruyuschee-hd.html',
  '/458-kanal-dorama.html',
  '/454-kanal-lyubimoe-kino.html',
  '/303-kanal-russkiy-bestseller.html',
  '/401-kanal-sony-sci-fi.html',
  '/112-kanal-russkiy-illyuzion.html',
  '/382-kanal-nash-detektiv.html',
  '/377-kanal-evrokino.html',
  '/398-kanal-dom-kino-premium.html',
  '/345-kanal-fox_live.html',
  '/330-kanal-ostrosyuzhetnoe-hd.html',
  '/379-kanal-bollywood-tv.html',
  '/10-kanal-tnt.html',
  '/11-kanal-sts.html',
  '/29-kanal-tnt4.html',
  '/433-kanal-yu-tv.html',
  '/22-kanal-perec-dtv.html',
  '/230-kanal-sts_love.html',
  '/455-kanal-v-gostyah-u-skazki.html',
  '/272-kanal-soyuzmultfilm.html',
  '/252-kanal-tiji.html',
  '/389-kanal-eralash.html',
  '/195-kanal-gulli.html',
  '/123-kanal-karusel.html',
  '/9-kanal-nickelodeon.html',
  '/13-disney-kanal.html',
  '/288-kanal-nick-jr.html',
  '/386-kanal-msm-tor.html',
  '/106-kanal-shanson-tv.html',
  '/264-kanal-vh1-classik.html',
  '/421-kanal-ru-tv.html',
  '/57-kanal-muz-tv-onlayn.html',
  '/159-kanal-mtv-hits.html',
  '/265-kanal-vh1-europe.html',
  '/363-kanal-tnt-music.html',
  '/354-kanal-setanta_sports-tv.html',
  '/77-kanal-moskva-24.html',
  '/36-kanal-rbk-tv.html',
  '/362-kanal-krym-24.html',
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
    executablePath,
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

      // Перехватываем запрос к s.pokaz.me с индексным m3u8
      const finalUrl = await new Promise((resolve) => {
        const handler = (request) => {
          const reqUrl = request.url();
          if (reqUrl.includes('s.pokaz.me/') && reqUrl.includes('/index.m3u8')) {
            page.off('request', handler);
            resolve(reqUrl);
          }
        };
        page.on('request', handler);
        setTimeout(() => {
          page.off('request', handler);
          resolve(null);
        }, 10000);
      });

      if (!finalUrl) {
        console.log(`  ⚠️ Не удалось перехватить запрос, пробуем найти video.src...`);
        await page.waitForFunction(
          () => {
            const video = document.querySelector('video');
            return video && video.src && video.src.includes('blob:');
          },
          { timeout: 10000 }
        );
        await delay(2000);
        const blobSrc = await page.$eval('video', video => video.src);
        console.log(`  ⚠️ Получен blob: ${blobSrc.substring(0, 80)}...`);
        fs.appendFileSync(LOG_FILE, `${url} - только blob\n`);
        failCount++;
        continue;
      }

      console.log(`  ✅ Реальный стрим: ${finalUrl.substring(0, 80)}...`);

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

      // 🔥 Добавляем в плейлист БЕЗ |Referer (чистый URL)
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