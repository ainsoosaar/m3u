import express from 'express';
import axios from 'axios';
import cors from 'cors';
import fs from 'fs';
import os from 'os';

const app = express();
const PORT = 3000;

// Абсолютный путь к плейлисту
const PLAYLIST_PATH = 'C:/Users/megaa/Desktop/Raschirenija/Pokaz.me-Github/m3u/playlists/pokaz_playlist.m3u8';

app.use(cors());
app.use(express.json());

// Логирование запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// Прокси для потоков с ПОЛНЫМИ ЗАГОЛОВКАМИ из браузера
app.get('/proxy', async (req, res) => {
  const url = req.query.url;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter required' });
  }
  
  try {
    const decodedUrl = decodeURIComponent(url);
    console.log(`🔄 Прокси: ${decodedUrl}`);
    
    // Отправляем запрос с теми же заголовками, что и браузер
    const response = await axios({
      method: 'get',
      url: decodedUrl,
      responseType: 'stream',
      headers: {
        'accept': '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        'connection': 'keep-alive',
        'host': 's.pokaz.me',
        'origin': 'https://pokaz.me',
        'referer': 'https://pokaz.me/',
        'sec-ch-ua': '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'
      },
      timeout: 10000,
      maxRedirects: 5,
      // Важно: не проверяем SSL строго (иногда помогает)
      httpsAgent: new (require('https').Agent)({  
        rejectUnauthorized: false
      })
    });

    // Копируем все заголовки ответа
    Object.entries(response.headers).forEach(([key, value]) => {
      // Не копируем заголовки, которые могут помешать
      if (!['content-encoding', 'content-length'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });
    
    // Добавляем CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    
    // Отправляем поток
    response.data.pipe(res);
    
  } catch (error) {
    console.error(`❌ Ошибка прокси: ${error.message}`);
    
    // Детальный вывод ошибки
    if (error.response) {
      console.error(`   Статус: ${error.response.status}`);
      console.error(`   Заголовки:`, error.response.headers);
    }
    
    res.status(500).json({ 
      error: error.message,
      status: error.response?.status,
      details: 'Проверьте заголовки запроса'
    });
  }
});

// Плейлист с прокси-ссылками
app.get('/playlist.m3u8', async (req, res) => {
  try {
    if (!fs.existsSync(PLAYLIST_PATH)) {
      console.error(`❌ Файл не найден: ${PLAYLIST_PATH}`);
      return res.status(404).send('Playlist not found');
    }
    
    let playlist = fs.readFileSync(PLAYLIST_PATH, 'utf8');
    
    // Заменяем ссылки на прокси
    playlist = playlist.replace(
      /(https:\/\/s\.pokaz\.me\/[^\s]+)/g,
      'http://localhost:3000/proxy?url=$1'
    );
    
    res.set('Content-Type', 'audio/x-mpegurl');
    res.set('Access-Control-Allow-Origin', '*');
    res.send(playlist);
    
  } catch (error) {
    console.error(`❌ Ошибка чтения плейлиста: ${error.message}`);
    res.status(500).send('Playlist error: ' + error.message);
  }
});

// Оригинальный плейлист (без прокси)
app.get('/original.m3u8', async (req, res) => {
  try {
    if (!fs.existsSync(PLAYLIST_PATH)) {
      return res.status(404).send('Playlist not found');
    }
    
    const playlist = fs.readFileSync(PLAYLIST_PATH, 'utf8');
    res.set('Content-Type', 'audio/x-mpegurl');
    res.set('Access-Control-Allow-Origin', '*');
    res.send(playlist);
  } catch (error) {
    res.status(500).send('Playlist error');
  }
});

// Статус сервера
app.get('/status', (req, res) => {
  const localIp = getLocalIp();
  const playlistExists = fs.existsSync(PLAYLIST_PATH);
  
  res.json({
    status: 'running',
    time: new Date().toISOString(),
    playlistExists: playlistExists,
    playlistPath: PLAYLIST_PATH,
    playlist: `http://${localIp}:${PORT}/playlist.m3u8`,
    original: `http://${localIp}:${PORT}/original.m3u8`,
    test: `http://${localIp}:${PORT}/test`
  });
});

// Тестовый эндпоинт
app.get('/test', (req, res) => {
  res.json({ 
    message: '✅ Сервер работает!',
    time: new Date().toISOString(),
    headers: req.headers,
    ip: req.ip
  });
});

// Обработка OPTIONS запросов для CORS
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.sendStatus(200);
});

app.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIp();
  const playlistExists = fs.existsSync(PLAYLIST_PATH);
  
  console.log('\n' + '='.repeat(60));
  console.log('🚀 ПРОКСИ-СЕРВЕР ЗАПУЩЕН');
  console.log('='.repeat(60));
  console.log(`\n📡 Локальный адрес: http://localhost:${PORT}`);
  console.log(`\n📁 Плейлист: ${PLAYLIST_PATH}`);
  console.log(`📊 Файл найден: ${playlistExists ? '✅ ДА' : '❌ НЕТ'}`);
  
  if (!playlistExists) {
    console.log(`\n⚠️  ВНИМАНИЕ: Файл плейлиста не найден!`);
    console.log(`   Сначала запустите сборку:`);
    console.log(`   node src/build_pokaz.js`);
  }
  
  console.log(`\n📺 Плейлист с прокси:`);
  console.log(`   http://localhost:${PORT}/playlist.m3u8`);
  console.log(`   http://${localIp}:${PORT}/playlist.m3u8`);
  console.log(`\n📄 Оригинальный плейлист:`);
  console.log(`   http://localhost:${PORT}/original.m3u8`);
  console.log(`\n🔧 Тест:`);
  console.log(`   http://localhost:${PORT}/test`);
  console.log(`\n📊 Статус:`);
  console.log(`   http://localhost:${PORT}/status`);
  console.log('\n' + '='.repeat(60));
  
  console.log(`\n📱 Для Apple TV используйте:`);
  console.log(`   http://${localIp}:${PORT}/playlist.m3u8`);
  console.log('');
});