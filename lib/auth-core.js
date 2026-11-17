/**
 * 鲸汐 WhaleTide · 密码注入（Workers / Pages 共用）
 * 把 index.html 里的 {{PASSWORD}} 换成真实密码的 sha256，前端只拿到哈希。
 * 没有配置 PASSWORD 时替换为空串（前端会当作「未设密码」的开放站点）。
 */

export async function sha256hex(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function injectPassword(response, env) {
    /* 先 clone 再读，原 response 要留给「不需要注入」的分支 */
    const probe = response.clone();
    const original = await probe.text();
    if (!original.includes('{{PASSWORD}}')) return response;

    const password = env.PASSWORD || '';
    const hash = password ? await sha256hex(password) : '';
    const html = original.replaceAll('{{PASSWORD}}', hash);

    const headers = new Headers(response.headers);
    headers.set('content-type', 'text/html; charset=utf-8');
    headers.set('cache-control', 'no-store');
    headers.delete('content-length');

    return new Response(html, {
        status: response.status,
        statusText: response.statusText,
        headers
    });
}
