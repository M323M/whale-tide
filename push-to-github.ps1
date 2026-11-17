# 一键建仓库 + 推送 WhaleTide 到 GitHub
#
# 用法（PowerShell，在 whale-tv 目录下）：
#   $env:GITHUB_TOKEN = 'ghp_xxxxxxxxxxxxxxxx'      # 去 https://github.com/settings/tokens 生成，勾 repo 权限
#   .\push-to-github.ps1 -Repo whale-tide
#
# 可选参数：
#   -Repo        仓库名，默认 whale-tide
#   -Description 仓库简介
#   -Private     建私有仓库（默认公开）
#   -Branch      推送分支，默认 main

param(
    [string]$Repo = 'whale-tide',
    [string]$Description = '鲸汐 WhaleTide · 鲸鱼娘主题的免费影视 / 番剧聚合站（Cloudflare Pages）',
    [string]$Branch = 'main',
    [switch]$Private
)

$ErrorActionPreference = 'Stop'
$Token = $env:GITHUB_TOKEN
if (-not $Token) { $Token = $env:GH_TOKEN }
if (-not $Token) {
    Write-Host "缺少 token：先设置环境变量 GITHUB_TOKEN" -ForegroundColor Yellow
    Write-Host "  `$env:GITHUB_TOKEN = 'ghp_...'" -ForegroundColor Gray
    Write-Host "  生成地址：https://github.com/settings/tokens （勾选 repo 权限）" -ForegroundColor Gray
    exit 1
}

$apiHeaders = @{
    Authorization          = "Bearer $Token"
    Accept                 = 'application/vnd.github+json'
    'X-GitHub-Api-Version' = '2022-11-28'
    'User-Agent'           = 'WhaleTide-Deployer'
}

Write-Host "== 读取账号信息 ==" -ForegroundColor Cyan
$me = Invoke-RestMethod -Uri 'https://api.github.com/user' -Headers $apiHeaders -Method Get
$owner = $me.login
Write-Host "账号：$owner"

Write-Host "== 检查 / 创建仓库 $owner/$Repo ==" -ForegroundColor Cyan
$exists = $true
try {
    Invoke-RestMethod -Uri "https://api.github.com/repos/$owner/$Repo" -Headers $apiHeaders -Method Get | Out-Null
} catch {
    $exists = $false
}

if ($exists) {
    Write-Host "仓库已存在，直接推送" -ForegroundColor DarkYellow
} else {
    $body = @{
        name        = $Repo
        description = $Description
        private     = [bool]$Private
        has_issues  = $true
        has_wiki    = $false
        auto_init   = $false
    } | ConvertTo-Json
    $created = Invoke-RestMethod -Uri 'https://api.github.com/user/repos' -Headers $apiHeaders -Method Post -Body $body -ContentType 'application/json'
    Write-Host "已创建：$($created.html_url)" -ForegroundColor Green
}

Write-Host "== 初始化本地 git ==" -ForegroundColor Cyan
if (-not (Test-Path .git)) {
    git init -b $Branch | Out-Null
}
git add -A
$staged = git diff --cached --name-only
if ($staged) {
    git -c user.name="$owner" -c user.email="$owner@users.noreply.github.com" commit -m "feat: 鲸汐 WhaleTide 初始版本（双模式 / 番剧分类 / 多源换源测速）" | Out-Null
    Write-Host "已提交 $((git diff --cached --name-only | Measure-Object).Count) 个文件" -ForegroundColor Green
} else {
    Write-Host "没有新改动需要提交" -ForegroundColor DarkYellow
}

Write-Host "== 推送到 GitHub ==" -ForegroundColor Cyan
$remoteUrl = "https://x-access-token:$Token@github.com/$owner/$Repo.git"
$hasOrigin = (git remote 2>$null) -contains 'origin'
if ($hasOrigin) { git remote set-url origin $remoteUrl } else { git remote add origin $remoteUrl }

git push -u origin $Branch 2>&1 | ForEach-Object { Write-Host "  $_" }

$cleanUrl = "https://github.com/$owner/$Repo"
Write-Host ""
Write-Host "完成 -> $cleanUrl" -ForegroundColor Green
Write-Host "网页版部署：仓库 Settings 里不需要额外配置；要自动部署到 Cloudflare Pages 的话，加两个 Secret：" -ForegroundColor Gray
Write-Host "  CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID" -ForegroundColor Gray
