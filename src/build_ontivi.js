import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { execSync } from 'child_process';

const BASE = 'https://ip.ontivi.net';
const PLAYLIST_FILE = path.resolve('./playlists/ontivi_playlist.m3u8');
const LOG_FILE = path.resolve('./playlists/error_log.txt');

const NAVIGATION_TIMEOUT = 30000;
const WAIT_BETWEEN_REQUESTS = 2000;
const CAPTURE_TIMEOUT = 5000;

async function getChannelsFromMainPage(page) {
  console.log('🔍 Сканирование главной страницы...');
  
  try {
    await page.goto(BASE, { 
      waitUntil: 'networkidle2',
      timeout: NAVIGATION_TIMEOUT 
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const channels = await page.evaluate(() => {
      const channelLinks = [];
      const channelDivs = document.querySelectorAll('div.gltv');
      
      channelDivs.forEach(div => {
        const link = div.querySelector('a');
        if (link) {
          const href = link.getAttribute('href');
          const title = div.getAttribute('title');
          if (href) {
            channelLinks.push({
              url: href,
              title: title || ''
            });
          }
        }
      });
      
      return channelLinks;
    });
    
    console.log(`✅ Найдено каналов: ${channels.length}`);
    return channels;
  } catch (error) {
    console.error('❌ Ошибка при сканировании главной страницы:', error.message);
    return [];
  }
}

async function captureStreamFromNetwork(browser, url, channelName) {
  const page = await browser.newPage();
  let streamUrl = null;
  
  try {
    // Включаем перехват сетевых запросов
    const client = await page.target().createCDPSession();
    await client.send('Network.enable');
    
    // Слушаем все ответы от сервера
    client.on('Network.responseReceived', (params) => {
      const responseUrl = params.response.url;
      if (responseUrl.includes('.m3u8') || responseUrl.includes('.mp4') || responseUrl.includes('.ts')) {
        console.log(`  📥 Найден поток: ${responseUrl}`);
        streamUrl = responseUrl;
      }
    });

    // Слушаем запросы
    page.on('request', request => {
      const requestUrl = request.url();
      if (requestUrl.includes('.m3u8') || requestUrl.includes('.mp4') || requestUrl.includes('.ts')) {
        console.log(`  📤 Запрос потока: ${requestUrl}`);
        streamUrl = requestUrl;
      }
    });

    // Загружаем страницу
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT 
    });

    // Ждем появления плеера и потока
    let attempts = 0;
    while (!streamUrl && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
      
      // Пробуем найти видео элемент
      const videoSrc = await page.evaluate(() => {
        const video = document.querySelector('video');
        return video ? video.src : null;
      }).catch(() => null);
      
      if (videoSrc && videoSrc.includes('http')) {
        streamUrl = videoSrc;
        console.log(`  📺 Найден video src: ${videoSrc}`);
        break;
      }
    }

    // Если не нашли, пробуем кликнуть по плееру
    if (!streamUrl) {
      try {
        await page.click('video, .player, #player, .vjs-big-play-button').catch(() => {});
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {}
    }

    return streamUrl;
    
  } catch (error) {
    console.log(`  ⚠️ Ошибка при загрузке ${channelName}: ${error.message}`);
    return null;
  } finally {
    await page.close().catch(() => {});
  }
}

async function build() {
  console.log('\n🚀 Запуск сборки с перехватом сетевых запросов...');
  console.log('==================================================\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 720 },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ],
    ignoreHTTPSErrors: true
  });

  const mainPage = await browser.newPage();
  const channels = await getChannelsFromMainPage(mainPage);
  await mainPage.close();
  
  if (channels.length === 0) {
    console.error('❌ Каналы не найдены!');
    await browser.close();
    return;
  }

  let playlist = '#EXTM3U\n';
  fs.writeFileSync(LOG_FILE, '');

  let successCount = 0;
  let totalCount = channels.length;

  for (let i = 0; i < channels.length; i++) {
    const channel = channels[i];
    const url = BASE + channel.url;
    const channelName = channel.title || channel.url.replace(/\//g, '').replace(/-/g, ' ').replace(/\.html$/, '');
    
    console.log(`\n📺 [${i+1}/${totalCount}] ${channelName} - ${url}`);

    try {
      await new Promise(resolve => setTimeout(resolve, WAIT_BETWEEN_REQUESTS));
      
      const stream = await captureStreamFromNetwork(browser, url, channelName);

      if (!stream) {
        console.log(`  ❌ Поток не найден для ${channelName}`);
        fs.appendFileSync(LOG_FILE, `${url} - поток не найден\n`);
        continue;
      }

      playlist += `#EXTINF:-1 tvg-id="${channelName}" tvg-name="${channelName}",${channelName}\n${stream}\n`;
      successCount++;
      console.log(`  ✅ Успех! Найден поток для ${channelName}`);
      
    } catch (err) {
      console.error(`  ❌ Ошибка: ${err.message}`);
      fs.appendFileSync(LOG_FILE, `${url} - ${err.message}\n`);
    }
  }

  const timestamp = new Date().toISOString();
  playlist = `#EXTM3U\n# Авто-обновление ontivi: ${timestamp}\n` + playlist.replace('#EXTM3U\n', '');
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

function pushToGithub() {
  try {
    console.log('📤 Отправка изменений в GitHub...');
    execSync('git add playlists/ontivi_playlist.m3u8', { stdio: 'inherit' });
    const status = execSync('git status --porcelain').toString();
    if (status.trim()) {
      const date = new Date().toISOString();
      execSync(`git commit -m "Авто-обновление плейлиста ontivi ${date}"`, { stdio: 'inherit' });
      execSync('git push origin feature/ontivi', { stdio: 'inherit' });
      console.log('✅ Успешно отправлено в GitHub!');
    } else {
      console.log('📝 Нет изменений для отправки');
    }
  } catch (error) {
    console.error('❌ Ошибка при отправке в GitHub:', error.message);
    try {
      execSync('git pull origin feature/ontivi', { stdio: 'inherit' });
      execSync('git push origin feature/ontivi', { stdio: 'inherit' });
      console.log('✅ Успешно после pull!');
    } catch (retryError) {
      console.error('❌ Повторная попытка не удалась:', retryError.message);
    }
  }
}

if (process.argv[1].endsWith('build_ontivi.js')) {
  build();
}

export { build };