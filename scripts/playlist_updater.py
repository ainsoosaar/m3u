#!/usr/bin/env python3
# scripts/playlist_updater.py

import os
import json
import requests
from datetime import datetime
import hashlib
import sys
import re
from bs4 import BeautifulSoup

class PlaylistUpdater:
    def __init__(self):
        self.playlist_file = 'playlist.m3u8'
        self.version_file = 'version.json'
        self.main_url = 'https://pokaz.me'
        self.channels_url = 'https://pokaz.me/channels'
        
    def parse_pokaz(self):
        """Парсинг pokaz.me через HTML"""
        print("🌐 Парсинг pokaz.me...")
        
        try:
            # Заголовки для запроса
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
            
            # Пробуем разные URL
            urls_to_try = [
                'https://pokaz.me',
                'https://pokaz.me/channels',
                'https://pokaz.me/playlist.m3u8',
                'https://api.pokaz.tech/v1/channels',
                'https://pokaz.cc/playlist.m3u'
            ]
            
            channels = []
            
            for url in urls_to_try:
                try:
                    print(f"   Пробуем: {url}")
                    response = requests.get(url, headers=headers, timeout=10, allow_redirects=True)
                    
                    if response.status_code == 200:
                        print(f"   ✅ Успешно: {url}")
                        
                        # Проверяем, не является ли ответ сразу плейлистом
                        if '#EXTM3U' in response.text:
                            print("   📥 Получен готовый M3U плейлист")
                            return response.text
                        
                        # Парсим HTML
                        soup = BeautifulSoup(response.text, 'html.parser')
                        
                        # Ищем ссылки на каналы
                        channel_links = soup.find_all('a', href=re.compile(r'(channel|stream|watch|play)'))
                        
                        for link in channel_links:
                            name = link.get_text().strip()
                            href = link.get('href', '')
                            
                            if name and href:
                                if not href.startswith('http'):
                                    href = requests.compat.urljoin(url, href)
                                
                                channels.append({
                                    'name': name,
                                    'url': href,
                                    'logo': ''
                                })
                        
                        # Ищем элементы с классами каналов
                        channel_divs = soup.find_all('div', class_=re.compile(r'(channel|item|card)'))
                        
                        for div in channel_divs:
                            name_elem = div.find(['h3', 'h4', 'span', 'div'], class_=re.compile(r'(name|title)'))
                            link_elem = div.find('a', href=True)
                            
                            if name_elem and link_elem:
                                name = name_elem.get_text().strip()
                                href = link_elem.get('href', '')
                                
                                if not href.startswith('http'):
                                    href = requests.compat.urljoin(url, href)
                                
                                # Ищем логотип
                                img = div.find('img')
                                logo = img.get('src', '') if img else ''
                                if logo and not logo.startswith('http'):
                                    logo = requests.compat.urljoin(url, logo)
                                
                                channels.append({
                                    'name': name,
                                    'url': href,
                                    'logo': logo
                                })
                        
                        if channels:
                            print(f"   Найдено {len(channels)} каналов")
                            break
                            
                except Exception as e:
                    print(f"   ⚠️ Ошибка при запросе {url}: {e}")
                    continue
            
            if not channels:
                print("❌ Не удалось найти каналы ни по одному URL")
                return None
            
            # Генерируем M3U8 плейлист
            m3u_content = self.generate_m3u8(channels)
            return m3u_content
            
        except Exception as e:
            print(f"❌ Критическая ошибка: {e}")
            return None
    
    def generate_m3u8(self, channels):
        """Генерация M3U8 плейлиста из списка каналов"""
        print("   Генерация M3U8 плейлиста...")
        
        # Удаляем дубликаты
        unique_channels = {}
        for ch in channels:
            if ch['name'] not in unique_channels:
                unique_channels[ch['name']] = ch
        
        channels = list(unique_channels.values())
        channels.sort(key=lambda x: x['name'])
        
        m3u_content = "#EXTM3U\n"
        m3u_content += f'#EXTINF:-1 tvg-name="Обновлено" group-title="Pokaz.me",Обновлено: {datetime.now().strftime("%Y-%m-%d %H:%M")}\n\n'
        
        for ch in channels:
            if ch['logo']:
                m3u_content += f'#EXTINF:-1 tvg-logo="{ch["logo"]}",{ch["name"]}\n'
            else:
                m3u_content += f'#EXTINF:-1,{ch["name"]}\n'
            m3u_content += f'{ch["url"]}\n'
        
        print(f"   Сгенерировано {len(channels)} уникальных каналов")
        return m3u_content
    
    def calculate_hash(self, content):
        return hashlib.sha256(content.encode()).hexdigest()
    
    def get_current_version(self):
        try:
            with open(self.version_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {'hash': '', 'updated': None, 'version': 0}
    
    def update_playlist(self, new_content):
        current = self.get_current_version()
        new_hash = self.calculate_hash(new_content)
        
        print(f"📊 Текущий хеш: {current['hash'][:8] if current['hash'] else 'Нет'}")
        print(f"📊 Новый хеш: {new_hash[:8]}")
        
        if new_hash == current['hash']:
            print("✅ Плейлист не изменился")
            return False
        
        version_info = {
            'hash': new_hash,
            'updated': datetime.now().isoformat(),
            'version': current['version'] + 1
        }
        
        with open(self.playlist_file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        with open(self.version_file, 'w', encoding='utf-8') as f:
            json.dump(version_info, f, indent=2)
        
        print(f"✅ Плейлист обновлен до версии {version_info['version']}")
        return True

def main():
    print("=" * 60)
    print("🚀 ЗАПУСК ОБНОВЛЕНИЯ ПЛЕЙЛИСТА POKAZ.ME")
    print("=" * 60)
    
    try:
        updater = PlaylistUpdater()
        new_playlist = updater.parse_pokaz()
        
        if new_playlist:
            if updater.update_playlist(new_playlist):
                print("✨ Плейлист успешно обновлен!")
            else:
                print("✨ Изменений нет, плейлист актуален")
        else:
            print("❌ Не удалось получить плейлист")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Критическая ошибка: {e}")
        sys.exit(1)
    
    print("=" * 60)

if __name__ == "__main__":
    main()