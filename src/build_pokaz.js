import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const BASE = 'https://pokaz.me';
const PLAYLIST_FILE = path.resolve('./playlists/pokaz_playlist.m3u8');
const LOG_FILE = path.resolve('./playlists/error_log.txt');

// Список каналов
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

// Очистка текста названия
function cleanName(name) {
  return name.replace(/^Телеканал\s+/i, '').trim();
}

// Главная сборка плейлиста
async function build() {
  const browser = await puppeteer.launch({
    headless: 'new',   // используем новый headless режим
    defaultViewport: null,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  });
  const page = await browser.newPage();

  let playlist = '#EXTM3U\n';
  fs.writeFileSync(LOG_FILE, ''); // очистка лога

  for (const ch of channels) {
    const url = BASE + ch;
    console.log('➡', url);

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Получаем название
      const title = await page.$eval('article.block.story h1', el => el.textContent.trim());
      const name = cleanName(title);

      // Логотип
      const logo = await page.$eval('article.block.story img', img =>
        img.src.startsWith('http') ? img.src : 'https://pokaz.me' + img.src
      );

      // Поток
      let stream = '';
      try {
        stream = await page.$eval('video', vid => vid.src);
      } catch {
        console.warn('⚠ Play-кнопка/поток не найден, пропускаем');
        fs.appendFileSync(LOG_FILE, `${url} - поток не найден\n`);
        continue;
      }

      playlist += `#EXTINF:-1 tvg-id="${name}" tvg-name="${name}" tvg-logo="${logo}",${name}\n${stream}\n`;
      console.log('✅', name);

    } catch (err) {
      console.error('❌ Ошибка на канале', ch, err.message);
      fs.appendFileSync(LOG_FILE, `${url} - ${err.message}\n`);
    }
  }

  fs.writeFileSync(PLAYLIST_FILE, playlist);
  console.log('📄 Плейлист собран:', PLAYLIST_FILE);

  await browser.close();
}

// Для запуска через npm run build
if (process.argv[1].endsWith('build_pokaz.js')) {
  build();
}

export { build };