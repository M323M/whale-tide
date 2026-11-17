/**
 * 鲸汐 WhaleTide · Workers 入口（静态资源 + 代理 + 密码注入）
 *
 * 路由：
 *   /proxy/*   → 代理（lib/proxy-core.js）
 *   / 和 /index.html → 取 public/app.html 并注入密码哈希（改名是为了绕开 CDN 旧缓存）
 *   其它       → env.ASSETS 静态资源
 */

import { onRequest as handleProxy } from './lib/proxy-core.js';
import { injectPassword } from './lib/auth-core.js';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        if (url.pathname.startsWith('/proxy/')) {
            return handleProxy({ request, env, waitUntil: ctx.waitUntil.bind(ctx) });
        }

        /* 入口：统一走 app.html，避免根路径被 CDN 缓存成旧版 */
        if (url.pathname === '/' || url.pathname === '/index.html') {
            const entry = new URL('/app.html', url.origin);
            const asset = await env.ASSETS.fetch(new Request(entry.toString(), request));
            return injectPassword(asset, env);
        }

        const asset = await env.ASSETS.fetch(request);
        const contentType = asset.headers.get('content-type') || '';

        if (contentType.includes('text/html')) {
            return injectPassword(asset, env);
        }

        return asset;
    }
};
