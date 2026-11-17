/**
 * 鲸汐 WhaleTide · Pages 中间件
 * 作用：把 index.html 里的 {{PASSWORD}} 占位替换成真实密码的 sha256，前端只拿到哈希。
 * 逻辑在 lib/auth-core.js，Workers 入口（_worker.js）共用。
 */

import { injectPassword } from '../lib/auth-core.js';

export async function onRequest(context) {
    const response = await context.next();
    return injectPassword(response, context.env);
}
