/**
 * 鲸汐 WhaleTide · Workers 入口（静态资源 + 代理 + 密码注入）
 *
 * 路由：
 *   /proxy/*  → 代理（lib/proxy-core.js）
 *   其它      → env.ASSETS 静态资源（public/ 目录）；HTML 注入 PASSWORD 的 sha256
 */

import { onRequest as handleProxy } from './lib/proxy-core.js';
import { injectPassword } from './lib/auth-core.js';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        if (url.pathname.startsWith('/proxy/')) {
            return handleProxy({ request, env, waitUntil: ctx.waitUntil.bind(ctx) });
        }

        const asset = await env.ASSETS.fetch(request);

        const contentType = asset.headers.get('content-type') || '';
        const looksHtml =
            contentType.includes('text/html') ||
            url.pathname === '/' ||
            url.pathname.endsWith('.html') ||
            url.pathname.endsWith('/');

        if (looksHtml) {
            const patched = await injectPassword(asset, env);
            return patched;
        }

        return asset;
    }
};
