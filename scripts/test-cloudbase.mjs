import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const fn = require('../cloudbase/functions/app/index.js');

const m3u8 = 'https://v.fengbao14.com/video/mofashaonvyuchengjihuarestart/5574fd893e7c/index.m3u8';

const r1 = await fn.main({ path: '/', httpMethod: 'GET', headers: {}, queryString: {} });
console.log('GET /                ->', r1.statusCode, (r1.body || '').length, 'chars | 占位符残留:', (r1.body || '').includes('{{PASSWORD}}'), '| PASSWORD字段:', /__ENV__\.PASSWORD\s*=\s*"([^"]*)"/.exec(r1.body || '')?.[1] ?? 'n/a');

const r2 = await fn.main({ path: '/assets/js/app.js', httpMethod: 'GET', headers: {}, queryString: {} });
console.log('GET /assets/js/app.js ->', r2.statusCode, r2.headers['Content-Type'], Math.round((r2.body || '').length / 1024), 'KB (base64)');

const r3 = await fn.main({ path: '/assets/css/site.css', httpMethod: 'GET', headers: {}, queryString: {} });
console.log('GET /assets/css/site.css ->', r3.statusCode, r3.headers['Content-Type']);

const r4 = await fn.main({ path: '/proxy/' + encodeURIComponent(m3u8), httpMethod: 'GET', headers: {}, queryString: {} });
console.log('GET /proxy/m3u8      ->', r4.statusCode, (r4.body || '').length, 'chars');
console.log('  首行:', (r4.body || '').split('\n')[0]);
const seg = (r4.body || '').split('\n').find(l => l.trim() && !l.trim().startsWith('#'));
console.log('  首个分片:', (seg || '').slice(0, 70));

const r5 = await fn.main({ path: '/nope.html', httpMethod: 'GET', headers: {}, queryString: {} });
console.log('GET /nope.html       ->', r5.statusCode, r5.body);
