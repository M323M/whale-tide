/**
 * 鲸汐 WhaleTide · Cloudflare Pages 代理入口
 * 真正的逻辑在 lib/proxy-core.js，Workers 入口（_worker.js）共用同一份。
 */
export { onRequest } from '../../lib/proxy-core.js';
