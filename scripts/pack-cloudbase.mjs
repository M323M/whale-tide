// 打包 CloudBase 云函数（含静态文件）成 zip，供控制台上传
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const fnDir = path.join(root, 'cloudbase', 'functions', 'app');
const out = path.join(root, '..', 'whale-build', 'cloudbase-app.zip');

if (!fs.existsSync(path.join(fnDir, 'public', 'app.html'))) {
    console.error('缺少 cloudbase/functions/app/public，先跑 node scripts/sync-cloudbase.mjs');
    process.exit(1);
}

const zipPath = path.resolve(out);
if (fs.existsSync(zipPath)) fs.rmSync(zipPath);

/* 用 PowerShell 的 ZipFile 打包（条目名强制正斜杠） */
const ps = `
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$src = '${fnDir.replace(/\\/g, '\\\\')}'
$dst = '${zipPath.replace(/\\/g, '\\\\')}'
if (Test-Path $dst) { Remove-Item $dst -Force }
$zip = [System.IO.Compression.ZipFile]::Open($dst, 'Create')
try {
  Get-ChildItem $src -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($src.Length + 1).Replace('\\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $rel, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
  }
} finally { $zip.Dispose() }
`;

execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${ps.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, { stdio: 'inherit' });

const size = fs.statSync(zipPath).size;
console.log(`打包完成: ${zipPath} (${(size / 1024 / 1024).toFixed(2)} MB)`);
