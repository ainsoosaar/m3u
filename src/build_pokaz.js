import fs from 'fs';
import path from 'path';
import https from 'https';

const BASE = 'https://pokaz.me';
const PLAYLIST_FILE = path.resolve('./playlists/pokaz_playlist.m3u8');
const LOG_FILE = path.resolve('./playlists/error_log.txt');

// Список каналов (ваш список)
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

// Функция для HTTP запроса с таймаутом
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 15000
    }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Извлечение данных из HTML
function parseChannelPage(html, channelUrl) {
  try {
    // Название канала
    let name = '';
    const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) || 
                     html.match(/<title>([^<]+)<\/title>/i);
    if (nameMatch) {
      name = nameMatch[1]
        .replace(/смотреть онлайн/i, '')
        .replace(/телеканал/i, '')
        .trim();
    }
    
    // Логотип
    let logo = '';
    const logoMatch = html.match(/<img[^>]*src="([^"]*)"[^>]*class="[^"]*logo[^"]*"[^>]*>/i) ||
                     html.match(/<img[^>]*src="([^"]*)"[^>]*alt="[^"]*логотип[^"]*"[^>]*>/i);
    if (logoMatch) {
      logo = logoMatch[1].startsWith('http') ? logoMatch[1] : 'https://pokaz.me' + logoMatch[1];
    }
    
    // Поток (ищем video src или ссылку на .m3u8)
    let stream = '';
    
    // Сначала ищем video тег
    const videoMatch = html.match(/<video[^>]*src="([^"]*\.m3u8[^"]*)"[^>]*>/i);
    if (videoMatch) {
      stream = videoMatch[1];
    } else {
      // Ищем прямую ссылку на .m3u8
      const m3u8Match = html.match(/"(https?:\/\/[^"]*\.m3u8[^"]*)"/i) ||
                       html.match(/'([^']*\.m3u8[^']*)'/i);
      if (m3u8Match) {
        stream = m3u8Match[1];
      }
    }
    
    return { name, logo, stream };
  } catch (err) {
    return { name: '', logo: '', stream: '' };
  }
}

// Главная функция
async function build() {
  console.log('🚀 Запуск сборки плейлиста...');
  
  let playlist = '#EXTM3U\n';
  fs.writeFileSync(LOG_FILE, '');
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < channels.length; i++) {
    const channelPath = channels[i];
    const url = BASE + channelPath;
    
    console.log(`📺 [${i + 1}/${channels.length}] ${url}`);
    
    try {
      // Получаем HTML страницы
      const html = await fetchUrl(url);
      
      // Парсим данные
      const { name, logo, stream } = parseChannelPage(html, url);
      
      if (!name || !stream) {
        console.warn(`  ❌ Не удалось найти название или поток`);
        fs.appendFileSync(LOG_FILE, `${url} - данные не найдены\n`);
        failCount++;
        continue;
      }
      
      // Добавляем в плейлист
      playlist += `#EXTINF:-1 tvg-id="${name}" tvg-name="${name}" tvg-logo="${logo}",${name}\n${stream}\n`;
      console.log(`  ✅ ${name}`);
      successCount++;
      
    } catch (err) {
      console.error(`  ❌ Ошибка: ${err.message}`);
      fs.appendFileSync(LOG_FILE, `${url} - ${err.message}\n`);
      failCount++;
    }
    
    // Небольшая задержка между запросами
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Сохраняем плейлист
  fs.writeFileSync(PLAYLIST_FILE, playlist);
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Статистика:`);
  console.log(`   ✅ Успешно: ${successCount}`);
  console.log(`   ❌ Ошибок: ${failCount}`);
  console.log(`   📁 Плейлист сохранён: ${PLAYLIST_FILE}`);
  console.log('='.repeat(50));
}

// Запуск
build().catch(err => {
  console.error('❌ Критическая ошибка:', err);
  process.exit(1);
});
