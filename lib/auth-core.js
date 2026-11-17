/**
 * 鲸汐 WhaleTide · 密码注入（Workers / Pages 共用）
 * 把 index.html 里的 {{PASSWORD}} 换成真实密码的 sha256，前端只拿到哈希。
 */

export async function sha256hex(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function injectPassword(response, env) {
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
