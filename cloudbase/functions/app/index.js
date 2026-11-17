/**
 * 鲸汐 WhaleTide · 腾讯云 CloudBase 云函数（单函数全栈）
 *
 * 一个函数同时负责：
 *   /            → 返回 public/app.html（注入密码哈希）
 *   /assets/*    → 静态资源
 *   /proxy/<url> → 代理 m3u8 / 分片（重写播放列表）
 *
 * 部署：CloudBase 控制台 → HTTP 访问服务 → 路径 / → 绑定本函数
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PUBLIC_DIR = path.join(__dirname, 'public');
const DEFAULT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.txt': 'text/plain; charset=utf-8'
};

function sha256hex(text) {
    return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function corsHeaders(extra) {
    return Object.assign({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges'
    }, extra || {});
}

function jsonResponse(obj, status) {
    return {
        statusCode: status || 200,
        headers: corsHeaders({ 'Content-Type': 'application/json; charset=utf-8' }),
        body: JSON.stringify(obj)
    };
}

/* ---------- 静态资源 ---------- */
function serveStatic(relPath, passwordHash) {
    let filePath = path.normalize(path.join(PUBLIC_DIR, relPath));
    if (!filePath.startsWith(PUBLIC_DIR)) return jsonResponse({ error: 'forbidden' }, 403);

    if (relPath === '/' || relPath === '/index.html' || relPath === '') {
        filePath = path.join(PUBLIC_DIR, 'app.html');
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        return jsonResponse({ error: 'not found', path: relPath }, 404);
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    const buf = fs.readFileSync(filePath);

    if (ext === '.html') {
        let html = buf.toString('utf8');
        if (html.includes('{{PASSWORD}}')) {
            html = html.split('{{PASSWORD}}').join(passwordHash);
        }
        return {
            statusCode: 200,
            headers: corsHeaders({ 'Content-Type': mime, 'Cache-Control': 'no-store' }),
            body: html
        };
    }

    return {
        statusCode: 200,
        headers: corsHeaders({
            'Content-Type': mime,
            'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=86400'
        }),
        body: buf.toString('base64'),
        isBase64Encoded: true
    };
}

/* ---------- 代理 ---------- */
function targetFromPath(p) {
    const raw = p.replace(/^\/proxy\//, '');
    if (!raw) return null;
    let decoded;
    try { decoded = decodeURIComponent(raw); } catch (e) { return null; }
    if (!/^https?:\/\//i.test(decoded)) {
        if (/^https?:\/\//i.test(raw)) decoded = raw;
        else return null;
    }
    return decoded;
}

function upstreamHeaders(target, event) {
    let host = '';
    try { host = new URL(target).hostname; } catch (e) { /* noop */ }
    const headers = {
        'User-Agent': DEFAULT_UA,
        'Accept': '*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
    };
    if (/douban\.com$|doubanio\.com$/i.test(host)) headers['Referer'] = 'https://movie.douban.com/';
    else {
        try { headers['Referer'] = new URL(target).origin + '/'; } catch (e) { /* noop */ }
    }
    const range = (event.headers && (event.headers.range || event.headers.Range)) || '';
    if (range) headers['Range'] = range;
    return headers;
}

function proxyPath(url) {
    return '/proxy/' + encodeURIComponent(url);
}

function baseOf(urlStr) {
    try {
        const u = new URL(urlStr);
        if (!u.pathname || u.pathname === '/') return u.origin + '/';
        const parts = u.pathname.split('/');
        parts.pop();
        return u.origin + parts.join('/') + '/';
    } catch (e) {
        const i = urlStr.lastIndexOf('/');
        return i > urlStr.indexOf('://') + 2 ? urlStr.slice(0, i + 1) : urlStr + '/';
    }
}

function absolute(base, rel) {
    if (/^https?:\/\//i.test(rel)) return rel;
    try { return new URL(rel, base).toString(); } catch (e) {
        if (rel.startsWith('/')) {
            try { return new URL(base).origin + rel; } catch (e2) { return base + rel; }
        }
        return base.replace(/\/[^/]*$/, '/') + rel;
    }
}

function rewritePlaylist(url, content) {
    const base = baseOf(url);
    return content.split(/\r?\n/).map(raw => {
        const line = raw.trim();
        if (!line) return raw;
        if (line.startsWith('#EXT-X-KEY') || line.startsWith('#EXT-X-MAP') ||
            line.startsWith('#EXT-X-MEDIA') || line.startsWith('#EXT-X-I-FRAME-STREAM-INF')) {
            return line.replace(/URI="([^"]+)"/g, (m, uri) => `URI="${proxyPath(absolute(base, uri))}"`);
        }
        if (line.startsWith('#')) return raw;
        return proxyPath(absolute(base, line));
    }).join('\n');
}

async function handleProxy(event, password) {
    const p = event.path || '';
    const target = targetFromPath(p);
    if (!target) return jsonResponse({ ok: false, error: '用法：/proxy/<encodeURIComponent(目标URL)>' }, 400);

    /* 配了 PASSWORD 才校验；没配则开放 */
    if (password) {
        const qs = event.queryString || {};
        const auth = qs.auth || (event.queryStringParameters && event.queryStringParameters.auth);
        const t = qs.t || (event.queryStringParameters && event.queryStringParameters.t);
        if (!auth) return jsonResponse({ ok: false, error: '代理访问未授权：缺少 auth' }, 401);
        if (auth !== sha256hex(password)) return jsonResponse({ ok: false, error: '代理访问未授权：auth 不对' }, 401);
        if (t) {
            const age = Date.now() - Number(t);
            if (!Number.isFinite(age) || Math.abs(age) > 6 * 60 * 60 * 1000) return jsonResponse({ ok: false, error: '签名过期' }, 401);
        }
    }

    const method = (event.httpMethod || 'GET').toUpperCase();
    if (method === 'OPTIONS') return { statusCode: 204, headers: corsHeaders(), body: '' };
    if (method !== 'GET' && method !== 'HEAD') return jsonResponse({ ok: false, error: 'method not allowed' }, 405);

    let res;
    try {
        res = await fetch(target, { method, headers: upstreamHeaders(target, event), redirect: 'follow' });
    } catch (e) {
        return { statusCode: 502, headers: corsHeaders({ 'Content-Type': 'text/plain; charset=utf-8' }), body: '上游请求失败：' + e.message };
    }

    const ct = res.headers.get('content-type') || '';
    const isPlaylist = /\.m3u8(\?|$)/i.test(target) || /mpegurl/i.test(ct);

    if (isPlaylist) {
        const text = await res.text();
        if (!text.trimStart().startsWith('#EXTM3U')) {
            return {
                statusCode: res.status,
                headers: corsHeaders({ 'Content-Type': ct || 'text/plain; charset=utf-8' }),
                body: text
            };
        }
        return {
            statusCode: 200,
            headers: corsHeaders({
                'Content-Type': 'application/vnd.apple.mpegurl',
                'Cache-Control': 'public, max-age=15'
            }),
            body: rewritePlaylist(target, text)
        };
    }

    const buf = Buffer.from(await res.arrayBuffer());
    const headers = corsHeaders({
        'Content-Type': ct || 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600'
    });
    for (const k of ['content-range', 'accept-ranges', 'content-length']) {
        const v = res.headers.get(k);
        if (v) headers[k] = v;
    }

    return {
        statusCode: res.status,
        headers,
        body: method === 'HEAD' ? '' : buf.toString('base64'),
        isBase64Encoded: method !== 'HEAD'
    };
}

/* ---------- 入口 ---------- */
exports.main = async (event) => {
    const password = (process.env && process.env.PASSWORD) || '';
    const hash = password ? sha256hex(password) : '';
    const p = event.path || '/';

    if (p.startsWith('/proxy/')) {
        return handleProxy(event, password);
    }

    return serveStatic(p, hash);
};
