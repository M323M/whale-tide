/**
 * 鲸汐 WhaleTide · EdgeOne Pages 代理函数
 *
 * 目录：functions/proxy/[[path]].js  →  匹配 /proxy/<任意子路径>
 * 运行时：Edge Functions（V8，Web API 风格，无 Node 内置模块）
 *
 * 行为：
 *   /proxy/<encodeURIComponent(目标URL)>  →  拉流并返回
 *   M3U8 播放列表 → 重写里面的分片/KEY 地址，让它们继续走本代理
 *   其它（分片 .ts / 图片 / JSON）→ 原样透传，保留 Range / 206
 */

const DEFAULT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function corsHeaders(init) {
    const h = new Headers(init || {});
    h.set('Access-Control-Allow-Origin', '*');
    h.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
    h.set('Access-Control-Allow-Headers', '*');
    h.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
    return h;
}

function json(obj, status) {
    return new Response(JSON.stringify(obj), {
        status: status || 200,
        headers: corsHeaders({ 'Content-Type': 'application/json; charset=utf-8' })
    });
}

async function sha256hex(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function targetFromPath(pathname) {
    const raw = pathname.replace(/^\/proxy\//, '');
    if (!raw) return null;
    let decoded;
    try { decoded = decodeURIComponent(raw); } catch (e) { return null; }
    if (!/^https?:\/\//i.test(decoded)) {
        if (/^https?:\/\//i.test(raw)) decoded = raw;
        else return null;
    }
    return decoded;
}

function upstreamHeaders(target, request) {
    const headers = new Headers();
    let host = '';
    try { host = new URL(target).hostname; } catch (e) { /* noop */ }
    headers.set('User-Agent', DEFAULT_UA);
    headers.set('Accept', '*/*');
    headers.set('Accept-Language', 'zh-CN,zh;q=0.9,en;q=0.8');

    let referer = '';
    if (/douban\.com$|doubanio\.com$/i.test(host)) referer = 'https://movie.douban.com/';
    else {
        try { referer = new URL(target).origin + '/'; } catch (e) { /* noop */ }
    }
    if (referer) headers.set('Referer', referer);

    const range = request.headers.get('range');
    if (range) headers.set('Range', range);
    const ifRange = request.headers.get('if-range');
    if (ifRange) headers.set('If-Range', ifRange);
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

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const password = (env && env.PASSWORD) || '';

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return json({ ok: false, error: 'method not allowed' }, 405);
    }

    /* 支持两种调用方式：/proxy/<编码> 和 /proxy?url=<编码> */
    let target = targetFromPath(url.pathname);
    if (!target) {
        const q = url.searchParams.get('url') || url.searchParams.get('target');
        if (q && /^https?:\/\//i.test(q)) target = q;
    }
    if (!target) {
        return new Response('用法：/proxy/<encodeURIComponent(目标URL)> 或 /proxy?url=<编码后的URL>', {
            status: 400,
            headers: corsHeaders({ 'Content-Type': 'text/plain; charset=utf-8' })
        });
    }

    /* 配了 PASSWORD 才校验；没配则开放 */
    if (password) {
        const auth = url.searchParams.get('auth');
        if (!auth) return json({ ok: false, error: '代理访问未授权：缺少 auth' }, 401);
        if (auth !== await sha256hex(password)) return json({ ok: false, error: '代理访问未授权：auth 不对' }, 401);
        const t = url.searchParams.get('t');
        if (t) {
            const age = Date.now() - Number(t);
            if (!Number.isFinite(age) || Math.abs(age) > 6 * 60 * 60 * 1000) return json({ ok: false, error: '签名过期' }, 401);
        }
    }

    let upstream;
    try {
        upstream = await fetch(target, {
            method: request.method,
            headers: upstreamHeaders(target, request),
            redirect: 'follow'
        });
    } catch (e) {
        return new Response('上游请求失败：' + e.message, {
            status: 502,
            headers: corsHeaders({ 'Content-Type': 'text/plain; charset=utf-8' })
        });
    }

    const ct = upstream.headers.get('content-type') || '';
    const isPlaylist = /\.m3u8(\?|$)/i.test(target) || /mpegurl/i.test(ct);

    if (isPlaylist) {
        const text = await upstream.text();
        if (!text.trimStart().startsWith('#EXTM3U')) {
            return new Response(text, {
                status: upstream.status,
                headers: corsHeaders({ 'Content-Type': ct || 'text/plain; charset=utf-8' })
            });
        }
        return new Response(rewritePlaylist(target, text), {
            status: 200,
            headers: corsHeaders({
                'Content-Type': 'application/vnd.apple.mpegurl',
                'Cache-Control': 'public, max-age=15'
            })
        });
    }

    const out = new Headers();
    for (const key of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']) {
        const v = upstream.headers.get(key);
        if (v) out.set(key, v);
    }
    const headers = corsHeaders(out);
    headers.set('Cache-Control', 'public, max-age=3600');

    return new Response(request.method === 'HEAD' ? null : upstream.body, {
        status: upstream.status,
        headers
    });
}

export default onRequest;
