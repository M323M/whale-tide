// 把 public/ 同步进 CloudBase 云函数目录（云函数要自带静态文件）
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const src = path.join(root, 'public');
const dest = path.join(root, 'cloudbase', 'functions', 'app', 'public');

function copyDir(from, to) {
    fs.mkdirSync(to, { recursive: true });
    for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
        const s = path.join(from, entry.name);
        const d = path.join(to, entry.name);
        if (entry.isDirectory()) copyDir(s, d);
        else fs.copyFileSync(s, d);
    }
}

if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
copyDir(src, dest);

let files = 0, bytes = 0;
(function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else { files++; bytes += fs.statSync(p).size; }
    }
})(dest);

console.log(`同步完成: ${files} 个文件, ${(bytes / 1024 / 1024).toFixed(2)} MB -> cloudbase/functions/app/public`);
