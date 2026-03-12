import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { execSync } from 'child_process';

const BASE = 'https://vsetv.click';
const PLAYLIST_FILE = path.resolve('./playlists/vsetv_playlist.m3u8');
const LOG_FILE = path.resolve('./playlists/error_log.txt');

// Функция для извлечения каналов из HTML
function extractChannelsFromHTML() {
  return [
    '/2x2', '/8-kanal', '/amedia-1', '/amedia-2', '/amedia-hit', '/amedia-premium',
    '/ani', '/black', '/bollywood', '/bridge-tv', '/cinema', '/da-vinci-learning',
    '/discovery-science', '/english-club-tv', '/euronews', '/europa-plus-tv',
    '/eurosport-1', '/fashion-tv', '/food-network', '/fox-hd', '/galaxy-tv',
    '/gulli-girl', '/history', '/mezzo', '/national-geographic', '/ocean-tv',
    '/red', '/rtg-hd', '/rtg-tv', '/ru-tv', '/russia-today', '/russia-today-doc',
    '/sci-fi', '/shopping-live', '/tiji', '/travel-adventure-hd', '/tv-xxi',
    '/viju-explore', '/viju-history', '/viju-nature', '/viju-tv1000',
    '/viju-tv1000-action', '/viju-tv1000-russkoe-kino', '/viju-comedy-hd',
    '/viju-megahit-hd', '/viju-premiere-hd', '/viju-serial-hd', '/viju-sport',
    '/zoopark-tv', '/avto-24', '/belarus-24', '/belarus-5', '/bober-tv',
    '/v-gostyah-u-skazki', '/v-mire-zhivotnyh-hd', '/vmeste-rf', '/voprosy-i-otvety',
    '/vremya', '/detskiy-mir', '/dikaya-rybalka-hd', '/doktor-tv', '/dom-kino',
    '/dom-kino-premium', '/domashnie-zhivotnye', '/domashniy', '/dorama', '/drayv',
    '/evrokino', '/zhara-tv', '/zhivaya-planeta', '/zhivaya-priroda',
    '/zagorodnaya-zhizn', '/zagorodnyy', '/zvezda', '/zdorovoe-tv', '/zoo-tv',
    '/izvestiya', '/illyuzion', '/istoriya', '/kaleydoskop-tv', '/karusel',
    '/kino-tv', '/kinopokaz', '/mama', '/mir', '/mir-24', '/mir-seriala',
    '/moskva-24', '/moskva-doverie', '/mosfilm-zolotaya-kollekciya', '/moya-planeta',
    '/muzhskoy', '/muz-tv', '/muzyka-pervogo', '/mult-tv', '/multilandiya',
    '/multimuzyka', '/nano-tv', '/nauka-2-0', '/lyubimoe-kino', '/nst', '/ntv',
    '/ntv-pravo', '/ntv-stil', '/ntv-hit', '/otr', '/ohota-i-rybalka',
    '/ohotnik-i-rybolov', '/pervyy-kanal', '/pobeda', '/poehali', '/priklyucheniya-hd',
    '/psihologiya', '/pyatnica', '/pyatyy-kanal', '/radost-moya', '/rbk-tv',
    '/ren-tv', '/retro-tv', '/rossiya-1', '/rossiya-24', '/rossiya-kultura',
    '/russkaya-komediya', '/russkiy-bestseller', '/russkiy-detektiv',
    '/russkiy-illyuzion', '/russkiy-roman', '/sarafan', '/top-secret', '/soyuz-tv',
    '/spas-tv', '/sts', '/sts-kids', '/sts-love', '/subbota', '/tv3', '/tv-centr',
    '/teatr', '/telekafe', '/teleputeshestviya', '/tehno-24', '/tnt', '/tnt-music',
    '/tnt4', '/tochka-tv', '/unikum', '/usadba-tv', '/futbol', '/che', '/shanson',
    '/kanal-yu'
  ];
}

// Очистка текста названия
function cleanName(name) {
  return name.replace(/^Телеканал\s+/i, '').trim();
}

// Функция для отправки изменений в GitHub
function pushToGithub() {
  try {
    console.log('📤 Отправка изменений в GitHub...');
    
    execSync('git add playlists/vsetv_playlist.m3u8', { stdio: 'inherit' });
    
    const status = execSync('git status --porcelain').toString();
    if (status.trim()) {
      const date = new Date().toISOString();
      execSync(`git commit -m "Авто-обновление плейлиста vsetv.click ${date}"`, { stdio: 'inherit' });
      execSync('git push origin main', { stdio: 'inherit' });
      console.log('✅ Успешно отправлено в GitHub!');
    } else {
      console.log('📝 Нет изменений для отправки');
    }
  } catch (error) {
    console.error('❌ Ошибка при отправке в GitHub:', error.message);
    try {
      console.log('🔄 Пробуем pull + push...');
      execSync('git pull origin main', { stdio: 'inherit' });
      execSync('git push origin main', { stdio: 'inherit' });
      console.log('✅ Успешно после pull!');
    } catch (retryError) {
      console.error('❌ Повторная попытка не удалась:', retryError.message);
    }
  }
}

// Главная сборка плейлиста
async function build() {
  console.log('\n🚀 Запуск сборки плейлиста с vsetv.click...');
  console.log('==================================================\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--ignore-certificate-errors',
      '--ignore-ssl-errors',
      '--allow-running-insecure-content',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-gpu',
      '--disable-dev-shm-usage'
    ],
    ignoreHTTPSErrors: true
  });
  
  const page = await browser.newPage();
  
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  await page.setExtraHTTPHeaders({
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none'
  });

  const channels = extractChannelsFromHTML();
  
  let playlist = '#EXTM3U\n';
  fs.writeFileSync(LOG_FILE, '');

  let successCount = 0;
  let totalCount = channels.length;

  for (let i = 0; i < channels.length; i++) {
    const ch = channels[i];
    const url = BASE + ch;
    console.log(`📺 [${i+1}/${totalCount}] ${url}`);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', 
        timeout: 60000
      });

      // Получаем название канала
      let name = '';
      try {
        name = await page.$eval('h1.page-header__title', el => el.textContent.trim());
      } catch {
        name = ch.replace('/', '').replace(/-/g, ' ');
      }

      // Получаем логотип
      let logo = '';
      try {
        logo = await page.$eval('img.img-responsive', img => {
          const src = img.getAttribute('src');
          return src.startsWith('http') ? src : 'https://vsetv.click' + src;
        });
      } catch {}

      // Ищем поток в скриптах Playerjs
      let stream = '';

      stream = await page.evaluate(() => {
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
          const content = script.textContent || script.innerHTML;
          if (content && content.includes('Playerjs')) {
            const match = content.match(/file:\s*["']([^"']+)["']/);
            if (match) {
              return match[1];
            }
          }
        }
        return null;
      });

      if (stream) {
        console.log(`  ✅ Найден поток через Playerjs: ${stream}`);
      } else {
        // Если не нашли в скриптах, проверяем iframe
        const iframeSrc = await page.evaluate(() => {
          const iframe = document.querySelector('iframe');
          return iframe ? iframe.src : null;
        });

        if (iframeSrc) {
          console.log(`  🎬 Найден iframe: ${iframeSrc}`);
          
          try {
            const iframeElement = await page.$('iframe');
            const frame = await iframeElement.contentFrame();
            
            if (frame) {
              await frame.waitForSelector('video', { timeout: 15000 }).catch(() => null);
              
              stream = await frame.evaluate(() => {
                const video = document.querySelector('video');
                return video ? video.src : null;
              });
            }
          } catch (frameError) {
            console.log(`  ⚠️ Ошибка доступа к iframe: ${frameError.message}`);
          }
        }
        
        // Если все еще нет потока, ищем видео прямо на странице
        if (!stream) {
          stream = await page.evaluate(() => {
            const video = document.querySelector('video');
            return video ? video.src : null;
          });
        }
      }

      if (!stream) {
        console.warn('  ⚠️ Поток не найден');
        fs.appendFileSync(LOG_FILE, `${url} - поток не найден\n`);
        continue;
      }

      playlist += `#EXTINF:-1 tvg-id="${name}" tvg-name="${name}" tvg-logo="${logo}",${name}\n${stream}\n`;
      successCount++;
      console.log(`  ✅ ${name}`);

    } catch (err) {
      console.error(`  ❌ Ошибка: ${err.message}`);
      fs.appendFileSync(LOG_FILE, `${url} - ${err.message}\n`);
    }
  }

  fs.writeFileSync(PLAYLIST_FILE, playlist);
  
  console.log('\n' + '='.repeat(50));
  console.log('🎉 ПЛЕЙЛИСТ СОБРАН!');
  console.log('='.repeat(50));
  console.log(`📁 Сохранен: ${PLAYLIST_FILE}`);
  console.log(`📊 Успешно: ${successCount} из ${totalCount}`);
  console.log('='.repeat(50));

  await browser.close();
  pushToGithub();
  console.log('\n✅ Сборка завершена!');
}

if (process.argv[1].endsWith('build_vsetv.js')) {
  build();
}

export { build };