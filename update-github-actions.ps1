# update-github-actions.ps1 - исправленная версия
Write-Host "🚀 Обновление GitHub Actions файлов..." -ForegroundColor Cyan

$currentBranch = git branch --show-current

# Функция для обновления файла
function Update-File {
    param($Branch, $FilePath, $Content)
    
    Write-Host "📝 Обновление $FilePath в ветке $Branch..." -ForegroundColor Yellow
    git checkout $Branch 2>$null
    
    # Создаем папку
    $dir = Split-Path $FilePath -Parent
    if (!(Test-Path $dir)) { 
        New-Item -ItemType Directory -Path $dir -Force | Out-Null 
    }
    
    # Сохраняем файл
    $Content | Out-File -FilePath $FilePath -Encoding UTF8 -Force
    git add $FilePath
    Write-Host "✅ Файл $FilePath обновлен" -ForegroundColor Green
}

# Функция для коммита
function Commit-Push {
    param($Branch, $Message)
    
    Write-Host "🔄 Коммит в $Branch..." -ForegroundColor Yellow
    git commit -m "$Message" 2>$null
    if ($LASTEXITCODE -eq 0) {
        git push origin $Branch
        Write-Host "✅ Изменения отправлены" -ForegroundColor Green
    } else {
        Write-Host "ℹ️ Нет изменений для коммита" -ForegroundColor Gray
    }
}

# build.yml
$buildYml = @'
name: Build Playlist
on:
  schedule:
    - cron: '0 */6 * * *'
  workflow_dispatch:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    - name: Install dependencies
      run: npm install puppeteer axios
    - name: Run build
      run: node src/build_pokaz.js
    - name: Commit and push
      run: |
        git config user.name 'GitHub Actions'
        git config user.email 'actions@github.com'
        git add playlists/pokaz_playlist.m3u8
        git diff --quiet && git diff --staged --quiet || git commit -m "Update playlist"
        git push
'@

# final_test.yml
$finalTestYml = @'
name: Final Test
on:
  push:
    branches: [ main, feature/* ]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Check playlists
      run: |
        ls -la playlists/
        if [ -f "playlists/pokaz_playlist.m3u8" ]; then
          echo "✅ Pokaz.me playlist exists"
        fi
        if [ -f "playlists/vsetv_playlist.m3u8" ]; then
          echo "✅ Vsetv.click playlist exists"
        fi
        if [ -f "playlists/ontivi_playlist.m3u8" ]; then
          echo "✅ Ontivi.net playlist exists"
        fi
'@

# trigger-build.yml
$triggerBuildYml = @'
name: Trigger Build
on:
  schedule:
    - cron: '0 */6 * * *'
  workflow_dispatch:
jobs:
  trigger:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        project: [pokaz, vsetv, ontivi]
    steps:
    - uses: actions/checkout@v3
    - name: Create trigger
      run: echo "Triggered at $(date)" > trigger-${{ matrix.project }}.txt
    - name: Push trigger
      run: |
        git config user.name 'GitHub Actions'
        git config user.email 'actions@github.com'
        git add trigger-${{ matrix.project }}.txt
        git commit -m "Trigger ${{ matrix.project }}"
        git push
'@

# update_final.yml
$updateFinalYml = @'
name: Update Final
on:
  schedule:
    - cron: '0 */12 * * *'
jobs:
  update:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Update all branches
      run: |
        git fetch --all
        git checkout main && git pull
        git checkout feature/vsetv-click && git pull
        git checkout feature/ontivi && git pull
'@

# update_new.yml
$updateNewYml = @'
name: Update New
on:
  push:
    branches: [ feature/* ]
jobs:
  update:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    - name: Run build
      run: |
        if [[ "${{ github.ref_name }}" == "feature/vsetv-click" ]]; then
          node src/build_vsetv.js
        elif [[ "${{ github.ref_name }}" == "feature/ontivi" ]]; then
          node src/build_ontivi.js
        fi
    - name: Commit and push
      run: |
        git config user.name 'GitHub Actions'
        git config user.email 'actions@github.com'
        git add playlists/
        git diff --quiet && git diff --staged --quiet || git commit -m "Update playlist"
        git push
'@

# update_playlist.yml
$updatePlaylistYml = @'
name: Update Playlist
on:
  schedule:
    - cron: '0 */6 * * *'
  workflow_dispatch:
jobs:
  update:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        branch: [main, feature/vsetv-click, feature/ontivi]
    steps:
    - uses: actions/checkout@v3
      with:
        ref: ${{ matrix.branch }}
    - name: Check playlist
      run: |
        if [ -f "playlists/pokaz_playlist.m3u8" ] || [ -f "playlists/vsetv_playlist.m3u8" ] || [ -f "playlists/ontivi_playlist.m3u8" ]; then
          echo "✅ Playlist exists"
        fi
'@

# Обновляем ветки
Write-Host "`n📦 Обновление main..." -ForegroundColor Magenta
Update-File -Branch "main" -FilePath ".github/workflows/build.yml" -Content $buildYml
Update-File -Branch "main" -FilePath ".github/workflows/final_test.yml" -Content $finalTestYml
Update-File -Branch "main" -FilePath ".github/workflows/trigger-build.yml" -Content $triggerBuildYml
Update-File -Branch "main" -FilePath ".github/workflows/update_final.yml" -Content $updateFinalYml
Update-File -Branch "main" -FilePath ".github/workflows/update_new.yml" -Content $updateNewYml
Update-File -Branch "main" -FilePath ".github/workflows/update_playlist.yml" -Content $updatePlaylistYml
Commit-Push -Branch "main" -Message "Обновление GitHub Actions"

Write-Host "`n📦 Обновление feature/vsetv-click..." -ForegroundColor Magenta
Update-File -Branch "feature/vsetv-click" -FilePath ".github/workflows/update_new.yml" -Content $updateNewYml
Update-File -Branch "feature/vsetv-click" -FilePath ".github/workflows/update_playlist.yml" -Content $updatePlaylistYml
Commit-Push -Branch "feature/vsetv-click" -Message "Обновление GitHub Actions"

Write-Host "`n📦 Обновление feature/ontivi..." -ForegroundColor Magenta
Update-File -Branch "feature/ontivi" -FilePath ".github/workflows/update_new.yml" -Content $updateNewYml
Update-File -Branch "feature/ontivi" -FilePath ".github/workflows/update_playlist.yml" -Content $updatePlaylistYml
Commit-Push -Branch "feature/ontivi" -Message "Обновление GitHub Actions"

# Возвращаемся в исходную ветку
git checkout $currentBranch

Write-Host "`n✅ Готово! Все GitHub Actions файлы обновлены." -ForegroundColor Green