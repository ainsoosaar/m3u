// ... (весь предыдущий код до момента добавления в плейлист)

// Добавляем в плейлист с Referer
const streamWithReferer = `${stream}|Referer=https://pokaz.me/`;
playlist += `#EXTINF:-1 tvg-id="${name}" tvg-name="${name}" tvg-logo="${logo}",${name}\n${streamWithReferer}\n`;
console.log(`  ✅ ${name}`);
console.log(`     🔗 ${stream.substring(0, 60)}... + Referer`);

// ... (остальной код)
