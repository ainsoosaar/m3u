import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { execSync } from 'child_process';

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

// Функция для отправки изменений в GitHub
function pushToGithub() {
  try {
    console.log('📤 Отправка изменений в GitHub...');
    
    // Добавляем плейлист
    execSync('git add playlists/pokaz_playlist.m3u8', { stdio: 'inherit' });
    
    // Проверяем есть ли изменения
    const status = execSync('git status --porcelain').toString();
    if (status.trim()) {
      // Коммит с датой
      const date = new Date().toISOString();
      execSync(`git commit -m "Авто-обновление плейлиста ${date}"`, { stdio: 'inherit' });
      
      // Пуш в удаленный репозиторий
      execSync('git push origin main', { stdio: 'inherit' });
      console.log('✅ Успешно отправлено в GitHub!');
    } else {
      console.log('📝 Нет изменений для отправки');
    }
  } catch (error) {
    console.error('❌ Ошибка при отправке в GitHub:', error.message);
    // Если ошибка из-за рассинхронизации, пробуем pull + push
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
  console.log('\n🚀 Запуск сборки плейлиста...');
  console.log('==================================================\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null
  });
  const page = await browser.newPage();
  
  // Устанавливаем User-Agent как у реального браузера
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  let playlist = '#EXTM3U\n';
  fs.writeFileSync(LOG_FILE, ''); // очистка лога

  let successCount = 0;
  let totalCount = channels.length;

  for (let i = 0; i < channels.length; i++) {
    const ch = channels[i];
    const url = BASE + ch;
    console.log(`📺 [${i+1}/${totalCount}] ${url}`);

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
        console.log(`  ✅ Найден поток: ${stream}`);
      } catch {
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
  console.log(`❌ Ошибок: ${totalCount - successCount}`);
  console.log('='.repeat(50));

  await browser.close();
  
  // Отправляем изменения в GitHub
  pushToGithub();
  
  console.log('\n✅ Сборка завершена!');
}

// Для запуска через npm run build
if (process.argv[1].endsWith('build_pokaz.js')) {
  build();
}

export { build };