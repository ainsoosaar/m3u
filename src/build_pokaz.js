import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const channels = [
  { name: 'Первый канал', url: 'https://pokaz.me/336-tv_pervyy_kanal_online.html' },
  { name: 'Россия 24', url: 'https://pokaz.me/62-kanal-rossiya-24.html' }
  // добавьте остальные каналы по аналогии
];

const OUTPUT_FILE = path.join(__dirname, '..', 'playlists', 'pokaz_playlist.m3u8');
const ERROR_LOG = path.join(__dirname, '..', 'playlists', 'error_log.txt');

async function getStreamUrl(page, channelUrl) {
  try {
    console.log(`📺 ${channelUrl}`);
    await page.goto(channelUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Ждём появления video-элемента (до 30 секунд)
    await page.waitForSelector('video', { timeout: 30000 });
    
    // Извлекаем src
    const src = await page.$eval('video', el => el.src);
    if (!src) throw new Error('src not found');
    console.log(`  ✅ Найден поток`);
    return src;
  } catch (error) {
    console.error(`  ❌ Ошибка: ${error.message}`);
    return null;
  }
}

async function buildPlaylist() {
  console.log('🚀 Запуск сборки плейлиста...');
  console.log('==================================================');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const errors = [];
  const playlist = ['#EXTM3U'];

  try {
    const page = await browser.newPage();
    // Устанавливаем фиксированный User-Agent (замените на свой, если нужно)
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    for (let i = 0; i < channels.length; i++) {
      const ch = channels[i];
      console.log(`📺 [${i+1}/${channels.length}] ${ch.url}`);
      
      const streamUrl = await getStreamUrl(page, ch.url);
      
      if (streamUrl) {
        // Формируем запись плейлиста
        const logo = `https://pokaz.me/posts/2017-11/...`; // тут нужно вытаскивать logo из страницы, либо генерировать.
        // Упростим: используем ch.name для tvg-id и tvg-name
        playlist.push(`#EXTINF:-1 tvg-id="${ch.name}" tvg-name="${ch.name}" tvg-logo="https://pokaz.me/...",${ch.name}`);
        playlist.push(streamUrl);
      } else {
        errors.push(`❌ ${ch.name}: не удалось получить поток`);
      }
      
      // Небольшая пауза между запросами, чтобы не нагружать сервер
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    await page.close();
  } finally {
    await browser.close();
  }

  // Запись плейлиста
  fs.writeFileSync(OUTPUT_FILE, playlist.join('\n'), 'utf8');
  console.log('==================================================');
  console.log(`📊 Статистика:`);
  console.log(`   ✅ Успешно: ${playlist.length - 1}`);
  console.log(`   ❌ Ошибок: ${errors.length}`);
  console.log(`   📁 Плейлист сохранён: ${OUTPUT_FILE}`);

  // Запись ошибок в лог
  if (errors.length > 0) {
    fs.writeFileSync(ERROR_LOG, errors.join('\n'), 'utf8');
  } else {
    // Если ошибок нет, удаляем пустой лог (или оставляем пустым)
    if (fs.existsSync(ERROR_LOG)) fs.unlinkSync(ERROR_LOG);
  }
}

buildPlaylist().catch(console.error);
