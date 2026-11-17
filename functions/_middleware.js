/**
 * 鲸汐 WhaleTide · Pages 中间件
 * 作用：把 index.html 里的 {{PASSWORD}} 占位替换成真实密码的 sha256，前端只拿到哈希。
 */

async function sha256hex(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequest(context) {
    const { request, env, next } = context;
    const response = await next();
    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('text/html')) return response;

    const password = env.PASSWORD || '';
    const hash = password ? await sha256hex(password) : '';

    let html = await response.text();
    if (html.includes('{{PASSWORD}}')) {
        html = html.replaceAll('{{PASSWORD}}', hash);
    }

    const headers = new Headers(response.headers);
    headers.set('content-type', 'text/html; charset=utf-8');
    headers.set('cache-control', 'no-store');

    return new Response(html, {
        status: response.status,
        statusText: response.statusText,
        headers
    });
}
