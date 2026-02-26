import fs from 'fs';
import path from 'path';

export function savePlaylist(filename, content) {
    const folder = path.resolve('playlists');
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(path.join(folder, filename), content, 'utf-8');
    console.log(`📄 Плейлист собран: ${folder}/${filename}`);
}

export function cleanName(name) {
    return name.replace(/^Телеканал\s+/i, '').trim();
}

export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
