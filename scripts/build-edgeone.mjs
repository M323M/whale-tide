// 组装 EdgeOne Pages 上传包：静态文件 + 代理函数
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pub = path.join(root, 'public');
const out = path.join(root, 'edgeone', 'dist');

function copyDir(from, to) {
    fs.mkdirSync(to, { recursive: true });
    for (const e of fs.readdirSync(from, { withFileTypes: true })) {
        const s = path.join(from, e.name);
        const d = path.join(to, e.name);
        if (e.isDirectory()) copyDir(s, d);
        else fs.copyFileSync(s, d);
    }
}

if (fs.existsSync(out)) fs.rmSync(out, { recursive: true, force: true });

/* 静态：app.html 改名 index.html，assets/ 与 manifest 原样
   EdgeOne 静态托管不会执行注入逻辑，这里直接把密码占位符清成空串（开放模式）
   同时给 js/css 引用加版本号，避免 CDN 缓存住旧代码 */
fs.mkdirSync(out, { recursive: true });
const entry = fs.readFileSync(path.join(pub, 'app.html'), 'utf8');
const stamp = Date.now().toString(36);
let entryHtml = entry.split('{{PASSWORD}}').join('');
entryHtml = entryHtml.replace(
    /="assets\/(js|css|vendor)\/([^"?'#]+)"/g,
    (m, dir, file) => `="assets/${dir}/${file}?v=${stamp}"`
);
fs.writeFileSync(path.join(out, 'index.html'), entryHtml, 'utf8');
fs.copyFileSync(path.join(pub, 'manifest.json'), path.join(out, 'manifest.json'));
copyDir(path.join(pub, 'assets'), path.join(out, 'assets'));
console.log(`资源版本号: v=${stamp}`);

/* 函数：edge-functions/proxy/[[path]].js */
const fnSrc = path.join(root, 'edgeone', 'edge-functions');
copyDir(fnSrc, path.join(out, 'edge-functions'));

/* 站点配置由仓库根的 edgeone.json 统一管理，这里不再重复生成 */

let files = 0, bytes = 0;
(function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else { files++; bytes += fs.statSync(p).size; }
    }
})(out);

console.log(`EdgeOne 包已生成: edgeone/dist（${files} 个文件，${(bytes / 1024 / 1024).toFixed(2)} MB）`);
console.log('上传方式：控制台 → 创建项目 → 直接上传 → 把这个文件夹（或打包的 zip）拖进去');
