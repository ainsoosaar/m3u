param(
    [Parameter(Mandatory=$true)]
    [string]$Target
)

function Show-Status {
    Write-Host "`n=== ТЕКУЩИЙ СТАТУС ===" -ForegroundColor Cyan
    $branch = git branch --show-current
    Write-Host "Ветка: $branch" -ForegroundColor Yellow
    Write-Host "`nАктивные задания:" -ForegroundColor Green
    Get-Job | Format-Table Id, State, Command -AutoSize
}

function Switch-ToPokaz {
    Write-Host "Переключение на pokaz.me..." -ForegroundColor Yellow
    git checkout main
    git pull origin main
    Write-Host "Готово!" -ForegroundColor Green
}

function Switch-ToVsetv {
    Write-Host "Переключение на vsetv.click..." -ForegroundColor Yellow
    git checkout feature/vsetv-click
    git pull origin feature/vsetv-click
    Write-Host "Готово!" -ForegroundColor Green
}

function Switch-ToExperimental {
    $date = Get-Date -Format "yyyy-MM-dd"
    $branch = "experimental/$date"
    Write-Host "Создание ветки $branch ..." -ForegroundColor Yellow
    git checkout -b $branch
    git push -u origin $branch
    Write-Host "Готово!" -ForegroundColor Green
}

Clear-Host
Write-Host "ПЕРЕКЛЮЧЕНИЕ ПРОЕКТОВ" -ForegroundColor Magenta
Write-Host "=====================" -ForegroundColor Magenta

if ($Target -eq "status") { Show-Status }
elseif ($Target -eq "pokaz") { Switch-ToPokaz }
elseif ($Target -eq "vsetv") { Switch-ToVsetv }
elseif ($Target -eq "experimental") { Switch-ToExperimental }
else { Write-Host "Неизвестная команда: $Target" -ForegroundColor Red }
