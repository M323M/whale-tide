/**
 * 鲸汐 WhaleTide · 代理核心（Workers / Pages 共用）
 *
 * 关键点：
 *   1. 只有 M3U8 播放列表才读成文本重写；视频分片 / 图片 / JSON 全部流式透传，
 *      保留 Range、206、Content-Length，拖进度条不卡、不损坏二进制。
 *   2. Referer 按目标域名自动补（豆瓣、片源站都需要）。
 *   3. 鉴权：?auth=sha256(PASSWORD)&t=时间戳，与原站规则一致。
 */

const MEDIA_CACHE_TTL = 3600;
const PLAYLIST_CACHE_TTL = 15;
const DEFAULT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function corsHeaders(init = {}) {
    const h = new Headers(init);
    h.set('Access-Control-Allow-Origin', '*');
    h.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
    h.set('Access-Control-Allow-Headers', '*');
    h.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
    return h;
}

function json(obj, status = 200) {
    return new Response(JSON.stringify(obj), {
        status,
        headers: corsHeaders({ 'Content-Type': 'application/json; charset=utf-8' })
    });
}

export async function sha256hex(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function validateAuth(request, env) {
    const url = new URL(request.url);
    const auth = url.searchParams.get('auth');
    const t = url.searchParams.get('t');
    const pwd = env.PASSWORD;
    /* 没配密码 = 开放模式，代理直接放行 */
    if (!pwd) return true;
    if (!auth) return false;
    const expected = await sha256hex(pwd);
    if (auth !== expected) return false;
    if (t) {
        const age = Date.now() - Number(t);
        if (!Number.isFinite(age) || Math.abs(age) > 6 * 60 * 60 * 1000) return false;
    }
    return true;
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

function ua(env) {
    try {
        if (env.USER_AGENTS_JSON) {
            const arr = JSON.parse(env.USER_AGENTS_JSON);
            if (Array.isArray(arr) && arr.length) return arr[Math.floor(Math.random() * arr.length)];
        }
    } catch (e) { /* 用默认 */ }
    return DEFAULT_UA;
}

function upstreamHeaders(targetUrl, request, env) {
    const headers = new Headers();
    let host = '';
    try { host = new URL(targetUrl).hostname; } catch (e) { /* noop */ }

    /* AniCh 系接口只校验 UA（无签名），这里按客户端格式注入 */
    if (/emmmm\.eu\.org$/i.test(host)) {
        headers.set('User-Agent', 'cx.xs.open Android 1.0.0');
    } else {
        headers.set('User-Agent', ua(env));
    }
    headers.set('Accept', '*/*');
    headers.set('Accept-Language', 'zh-CN,zh;q=0.9,en;q=0.8');

    let referer = '';
    if (/douban\.com$|doubanio\.com$/i.test(host)) referer = 'https://movie.douban.com/';
    else {
        try { referer = new URL(targetUrl).origin + '/'; } catch (e) { /* noop */ }
    }
    if (referer) headers.set('Referer', referer);

    const range = request.headers.get('range');
    if (range) headers.set('Range', range);
    const ifRange = request.headers.get('if-range');
    if (ifRange) headers.set('If-Range', ifRange);

    return headers;
}

function proxyPath(targetUrl) {
    return '/proxy/' + encodeURIComponent(targetUrl);
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
    try { return new URL(rel, base).toString(); }
    catch (e) {
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

function looksM3u8(content, contentType) {
    if (contentType && /mpegurl|x-mpegurl|audio\/mpegurl/i.test(contentType)) return true;
    return typeof content === 'string' && content.trimStart().startsWith('#EXTM3U');
}

/**
 * 统一的代理入口，签名兼容 Pages 的 onRequest(context)。
 * context 需要：request、env、waitUntil（可选）。
 */
export async function onRequest(context) {
    const { request, env } = context;
    const waitUntil = typeof context.waitUntil === 'function' ? context.waitUntil.bind(context) : (p) => { };
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
    if (request.method !== 'GET' && request.method !== 'HEAD') return json({ ok: false, error: 'method not allowed' }, 405);

    if (!(await validateAuth(request, env))) {
        return json({ ok: false, error: '代理访问未授权：检查 PASSWORD 或 auth 参数' }, 401);
    }

    const target = targetFromPath(url.pathname);
    if (!target) {
        return new Response('用法：/proxy/<encodeURIComponent(目标URL)>', {
            status: 400,
            headers: corsHeaders({ 'Content-Type': 'text/plain; charset=utf-8' })
        });
    }

    const isPlaylist = /\.m3u8(\?|$)/i.test(target);
    const cacheKey = url.origin + '/proxy/' + encodeURIComponent(target) + (isPlaylist ? '?p=1' : '?m=1');

    if (isPlaylist) {
        try {
            const hit = await caches.default.match(cacheKey);
            if (hit) {
                return new Response(await hit.text(), {
                    status: 200,
                    headers: corsHeaders({
                        'Content-Type': 'application/vnd.apple.mpegurl',
                        'Cache-Control': `public, max-age=${PLAYLIST_CACHE_TTL}`
                    })
                });
            }
        } catch (e) { /* 缓存不可用就跳过 */ }
    }

    let upstream;
    try {
        upstream = await fetch(target, {
            method: request.method,
            headers: upstreamHeaders(target, request, env),
            redirect: 'follow',
            cf: {
                cacheTtl: isPlaylist ? PLAYLIST_CACHE_TTL : MEDIA_CACHE_TTL,
                cacheEverything: !isPlaylist
            }
        });
    } catch (e) {
        return new Response('上游请求失败：' + e.message, {
            status: 502,
            headers: corsHeaders({ 'Content-Type': 'text/plain; charset=utf-8' })
        });
    }

    const ct = upstream.headers.get('content-type') || '';

    if (isPlaylist || /mpegurl/i.test(ct)) {
        const text = await upstream.text();
        if (!looksM3u8(text, ct)) {
            return new Response(text, { status: upstream.status, headers: corsHeaders({ 'Content-Type': ct || 'text/plain; charset=utf-8' }) });
        }
        const rewritten = rewritePlaylist(target, text);
        const resp = new Response(rewritten, {
            status: 200,
            headers: corsHeaders({
                'Content-Type': 'application/vnd.apple.mpegurl',
                'Cache-Control': `public, max-age=${PLAYLIST_CACHE_TTL}`
            })
        });
        try { waitUntil(caches.default.put(cacheKey, resp.clone())); } catch (e) { /* noop */ }
        return resp;
    }

    const out = new Headers();
    for (const key of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']) {
        const v = upstream.headers.get(key);
        if (v) out.set(key, v);
    }
    const headers = corsHeaders(out);
    headers.set('Cache-Control', `public, max-age=${MEDIA_CACHE_TTL}`);

    return new Response(request.method === 'HEAD' ? null : upstream.body, {
        status: upstream.status,
        headers
    });
}
