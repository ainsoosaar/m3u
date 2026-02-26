import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Получаем __dirname в ES модулях
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Запуск build_pokaz.js');
console.log('📁 Текущая папка:', __dirname);

// Определяем правильную папку для логов
const currentDir = __dirname;
const logsDir = currentDir; // Используем текущую папку (playlists)

console.log('📁 Папка для логов:', logsDir);

try {
    // Создаем пустой error_log.txt если его нет
    const errorLogPath = path.join(logsDir, 'error_log.txt');
    if (!fs.existsSync(errorLogPath)) {
        fs.writeFileSync(errorLogPath, '');
        console.log('✅ Создан файл error_log.txt');
    }
    
    // Здесь должен быть ваш код сборки плейлиста
    // Например:
    console.log('✅ build_pokaz.js выполнен успешно');
    
} catch (error) {
    console.error('❌ Ошибка:', error);
    try {
        const errorLogPath = path.join(logsDir, 'error_log.txt');
        fs.appendFileSync(errorLogPath, `[${new Date().toISOString()}] ${error.message}\n`);
    } catch (logError) {
        console.error('❌ Не удалось записать лог:', logError);
    }
}
