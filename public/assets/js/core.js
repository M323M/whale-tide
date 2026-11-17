/* 鲸汐 WhaleTide · 核心工具层
   DOM / 存储 / 鉴权 / 代理请求 / 数据接口 / 路由 / 提示 */

(function () {
    'use strict';

    const CFG = WT.CONFIG;

    /* ---------- DOM ---------- */
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    function el(tag, attrs, children) {
        const node = document.createElement(tag);
        if (attrs) {
            for (const k in attrs) {
                const v = attrs[k];
                if (v === null || v === undefined || v === false) continue;
                if (k === 'class') node.className = v;
                else if (k === 'html') node.innerHTML = v;
                else if (k === 'text') node.textContent = v;
                else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
                else node.setAttribute(k, v === true ? '' : v);
            }
        }
        if (children) {
            (Array.isArray(children) ? children : [children]).forEach(c => {
                if (c === null || c === undefined) return;
                node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
            });
        }
        return node;
    }

    const esc = (s) => String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    function debounce(fn, wait = 250) {
        let t;
        return function (...args) {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), wait);
        };
    }

    /* ---------- 图标 ---------- */
    const ICONS = {
        search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
        compass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>',
        bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z"/></svg>',
        cog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.9 19.3a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.7 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.56 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z"/></svg>',
        play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.3-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14z"/></svg>',
        close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
        trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>',
        check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>',
        back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 6-6 6 6 6"/></svg>',
        swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h13l-3-3M20 16H7l3 3"/></svg>',
        refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11A8 8 0 0 0 6.6 6.6L4 9"/><path d="M4 4v5h5"/><path d="M4 13a8 8 0 0 0 13.4 4.4L20 15"/><path d="M20 20v-5h-5"/></svg>',
        upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>',
        star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="m12 3.6 2.6 5.3 5.9.9-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.8l5.9-.9z"/></svg>',
        starFill: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 3.2 2.7 5.5 6 .9-4.4 4.3 1 6-5.3-2.9-5.3 2.9 1-6L3.3 9.6l6-.9z"/></svg>',
        film: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M8 5v14M16 5v14M3 12h18"/></svg>',
        sparkle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.4 13.6 9l5.6 1.6-5.6 1.6L12 17.8 10.4 12.2 4.8 10.6 10.4 9z"/><path d="M18.4 16.2 19 18.2l2 .6-2 .6-.6 2-.6-2-2-.6 2-.6z"/></svg>',
        clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.4"/><path d="M12 7.6V12l3 1.8"/></svg>',
        trend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17.5 9.5 12l3.5 3.5L20 8"/><path d="M20 13V8h-5"/></svg>',
        download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12"/><path d="m7 11 5 5 5-5"/><path d="M4 19h16"/></svg>'
    };

    /* ---------- 存储 ---------- */
    const Store = {
        get(key, fallback) {
            try {
                const raw = localStorage.getItem(key);
                if (raw === null) return fallback;
                return JSON.parse(raw);
            } catch (e) { return fallback; }
        },
        set(key, value) {
            try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { }
        },
        del(key) {
            try { localStorage.removeItem(key); } catch (e) { }
        }
    };

    /* ---------- 密码 / 鉴权 ---------- */
    const Auth = {
        hash: null,
        getSync() {
            return (window.__ENV__ && window.__ENV__.PASSWORD) || '';
        },
        ready() {
            const h = this.getSync();
            return typeof h === 'string' && h.length === 64 && !/^0+$/.test(h);
        },
        /* 没配密码 = 开放模式，直接进站 */
        disabled() {
            return !this.getSync();
        },
        async digest(text) {
            if (window.crypto && crypto.subtle) {
                const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
                return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
            }
            if (typeof window._jsSha256 === 'function') return window._jsSha256(text);
            throw new Error('no sha256');
        },
        verified() {
            if (this.disabled()) return true;
            const stored = Store.get('wt_gate', null);
            return !!(stored && stored.hash === this.getSync() && stored.ok);
        },
        async verify(input) {
            if (!this.ready()) return false;
            const h = await this.digest(String(input || '').trim());
            if (h === this.getSync()) {
                Store.set('wt_gate', { ok: true, hash: h, at: Date.now() });
                return true;
            }
            return false;
        },
        pass() {
            Store.set('wt_gate', { ok: true, hash: this.getSync(), at: Date.now() });
        }
    };

    /* ---------- 代理 ---------- */
    const Net = {
        async proxy(target) {
            const hash = Auth.getSync();
            const base = CFG.proxy + encodeURIComponent(target);
            if (!hash) return base;
            return base + (base.includes('?') ? '&' : '?') + 'auth=' + encodeURIComponent(hash) + '&t=' + Date.now();
        },
        async json(target, opts = {}) {
            const url = await this.proxy(target);
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), opts.timeout || CFG.searchTimeout);
            try {
                const res = await fetch(url, {
                    signal: opts.signal || ctrl.signal,
                    headers: opts.headers || { 'Accept': 'application/json' },
                    cache: 'no-store'
                });
                clearTimeout(timer);
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return await res.json();
            } finally {
                clearTimeout(timer);
            }
        },
        async img(url) {
            if (!url) return '';
            if (!/^https?:\/\//i.test(url)) return url;
            try { return await this.proxy(url); } catch (e) { return url; }
        }
    };

    /* ---------- 本地演示用的假数据（?mock=1） ---------- */
    const MOCK = /[?&]mock=1/.test(location.search);

    const MOCK_NAMES = [
        '深海迷航', '三体 第一季', '流浪地球 2', '庆余年 第二季', '进击的巨人 最终季',
        '沙丘 2', '星际穿越', '奥本海默', '繁花', '狂飙', '蜘蛛侠：纵横宇宙', '周处除三害'
    ];
    const MOCK_NOTES = ['HD 高清', '更新至 24 集', '抢先版', '全 40 集', '蓝光 4K', '完结'];
    const MOCK_TYPES = ['科幻', '剧情', '动作', '动画', '悬疑', '喜剧', '纪录片'];
    const MOCK_GRAD = [
        ['#1b4b7a', '#0a2038'], ['#2f6f8f', '#0b2a3a'], ['#4a3a7a', '#161030'],
        ['#7a2f4f', '#2a1018'], ['#2f7a5f', '#0f2a22'], ['#7a5a2f', '#241a0c']
    ];

    function mockPoster(title, i) {
        const [c1, c2] = MOCK_GRAD[i % MOCK_GRAD.length];
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
<rect width="300" height="450" fill="url(#g)"/>
<circle cx="248" cy="86" r="96" fill="#ffffff10"/>
<circle cx="52" cy="368" r="74" fill="#ffffff0a"/>
<path d="M0 322 Q75 292 150 322 T300 316 L300 450 L0 450 Z" fill="#00000022"/>
<ellipse cx="150" cy="212" rx="52" ry="30" fill="#ffffff14"/>
<circle cx="128" cy="206" r="4" fill="#ffffff55"/>
</svg>`;
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    function mockSearch(keyword, keys) {
        const sites = (keys && keys.length ? keys : Object.keys(WT.SITES)).slice(0, 4);
        const out = [];
        sites.forEach((site, si) => {
            MOCK_NAMES.forEach((name, i) => {
                const display = (i % 4 === 0) ? (keyword + ' · ' + name) : name;
                out.push({
                    id: 'mock-' + si + '-' + i,
                    name: display,
                    pic: mockPoster(display, i + si),
                    year: String(2019 + ((i + si) % 6)),
                    note: MOCK_NOTES[(i + si) % MOCK_NOTES.length],
                    type: MOCK_TYPES[(i + si) % MOCK_TYPES.length],
                    area: ['中国大陆', '美国', '日本', '韩国'][(i + si) % 4],
                    actor: '示例演员 A / 示例演员 B / 示例演员 C',
                    director: '示例导演',
                    score: (7 + ((i * 3 + si) % 30) / 10).toFixed(1),
                    desc: '这是本地演示用的假数据。部署到 Cloudflare Pages 后，这里会显示真实片源的简介。鲸鱼娘正在深海里把真正的片子捞上来～',
                    site: WT.SITES[site] ? site : Object.keys(WT.SITES)[si],
                    siteName: WT.SITES[site] ? WT.SITES[site].name : '演示源'
                });
            });
        });
        return out;
    }

    function mockDetail(item) {
        const eps = Array.from({ length: 24 }, (_, i) => ({
            name: '第 ' + String(i + 1).padStart(2, '0') + ' 集',
            url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
        }));
        return Object.assign({}, item, {
            name: item.name || '演示影片',
            pic: item.pic || mockPoster(item.name || '演示影片', 0),
            year: item.year || '2024',
            type: item.type || '科幻',
            area: item.area || '中国大陆',
            note: item.note || 'HD 高清',
            actor: item.actor || '示例演员 A / 示例演员 B',
            director: item.director || '示例导演',
            score: item.score || '8.6',
            desc: item.desc || '本地演示数据，部署后显示真实简介。',
            episodes: eps,
            site: item.site || 'ruyi',
            siteName: item.siteName || '演示源'
        });
    }

    /* ---------- 数据接口 ---------- */
    function mapVod(item, key) {
        const site = WT.SITES[key] || WT.ANIME_SITES[key] || {};
        return {
            id: String(item.vod_id || ''),
            name: item.vod_name || '未命名',
            pic: item.vod_pic || '',
            year: item.vod_year || '',
            note: item.vod_remarks || '',
            type: item.type_name || '',
            area: item.vod_area || '',
            actor: item.vod_actor || '',
            director: item.vod_director || '',
            score: item.vod_score || '',
            desc: item.vod_content || item.vod_blurb || '',
            site: key,
            siteName: site.name || key
        };
    }

    function siteOf(key) {
        return WT.SITES[key] || WT.ANIME_SITES[key] || null;
    }

    /* 分类表缓存 1 天（sessionStorage） */
    async function classes(key) {
        const ck = 'wt_cls_' + key;
        try {
            const cached = JSON.parse(sessionStorage.getItem(ck) || 'null');
            if (cached && Date.now() - cached.t < 86400000) return cached.v;
        } catch (e) { /* noop */ }
        const site = siteOf(key);
        if (!site) return [];
        const data = await Net.json(site.api + '?ac=list', { timeout: 5000 });
        const list = Array.isArray(data && data.class) ? data.class : [];
        try { sessionStorage.setItem(ck, JSON.stringify({ t: Date.now(), v: list })); } catch (e) { }
        return list;
    }

    /* 从分类表里挑出番剧分类（日韩/日本优先，跳过国产少儿向） */
    function pickAnimeClass(list) {
        const priority = ['日韩动漫', '日本动漫', '番剧', '日本动画', '动漫', '动画片'];
        for (const name of priority) {
            const hit = list.find(c => {
                const n = String(c.type_name || '');
                return n === name || n.includes(name);
            });
            if (hit) return hit;
        }
        return null;
    }

    const Data = {
        async searchSite(key, keyword) {
            const site = siteOf(key);
            if (!site) return [];
            const target = site.api + '?ac=videolist&wd=' + encodeURIComponent(keyword);
            const data = await Net.json(target, { timeout: CFG.searchTimeout });
            const list = Array.isArray(data && data.list) ? data.list : [];
            return list.map(item => mapVod(item, key)).filter(x => x.id && x.name);
        },

        /* 按分类拉番剧列表（动漫模式用） */
        async animeList(keys, page = 1) {
            const sites = (keys && keys.length ? keys : Object.keys(WT.SITES)).filter(k => siteOf(k));
            const buckets = await Promise.all(sites.map(async key => {
                try {
                    const cls = await classes(key);
                    const target = pickAnimeClass(cls);
                    if (!target) return [];
                    const site = siteOf(key);
                    const url = site.api + '?ac=videolist&t=' + encodeURIComponent(target.type_id) + '&pg=' + page;
                    const data = await Net.json(url, { timeout: 6000 });
                    const list = Array.isArray(data && data.list) ? data.list : [];
                    return list.map(item => mapVod(item, key)).filter(x => x.id && x.name);
                } catch (e) {
                    return [];
                }
            }));
            const flat = [];
            buckets.forEach(b => flat.push(...b));
            return flat;
        },

        /* 探测哪几个源有番剧分类 */
        async animeSites(keys) {
            const sites = (keys && keys.length ? keys : Object.keys(WT.SITES)).filter(k => siteOf(k));
            const ok = [];
            await Promise.all(sites.map(async key => {
                try {
                    const cls = await classes(key);
                    if (pickAnimeClass(cls)) ok.push(key);
                } catch (e) { /* noop */ }
            }));
            return ok;
        },

        /* 搜索联想：拿第一个源搜前缀，取片名 */
        async suggest(prefix, keys) {
            const p = String(prefix || '').trim();
            if (!p) return [];
            const cacheKey = p + '|' + (keys || []).slice(0, 2).join(',');
            const hit = suggestCache.get(cacheKey);
            if (hit && Date.now() - hit.t < 300000) return hit.v;

            const candidates = (keys && keys.length ? keys : CFG.defaultSites).filter(k => siteOf(k)).slice(0, 1);
            const lists = await Promise.all(candidates.map(async key => {
                try {
                    const site = siteOf(key);
                    const data = await Net.json(site.api + '?ac=videolist&wd=' + encodeURIComponent(p), { timeout: 1800 });
                    const list = Array.isArray(data && data.list) ? data.list : [];
                    return list.map(x => String(x.vod_name || '').trim()).filter(Boolean);
                } catch (e) { return []; }
            }));

            const out = [];
            lists.forEach(arr => arr.forEach(n => { if (!out.includes(n)) out.push(n); }));
            const top = out.slice(0, 8);
            suggestCache.set(cacheKey, { t: Date.now(), v: top });
            return top;
        },

        async search(keyword, keys) {
            if (MOCK) return mockSearch(keyword, keys);
            const sites = (keys && keys.length ? keys : CFG.defaultSites).filter(k => WT.SITES[k]);
            const tasks = sites.map(k => this.searchSite(k, keyword).catch(() => []));
            const groups = await Promise.all(tasks);
            const flat = [];
            groups.forEach(list => flat.push(...list));
            return flat;
        },

        async detail(item) {
            if (MOCK) return mockDetail(item);
            const ck = item.site + '::' + item.id;
            const cachedDetail = detailCacheCore.get(ck);
            if (cachedDetail && Date.now() - cachedDetail.t < 600000) return cachedDetail.v;

            const site = siteOf(item.site);
            if (!site) throw new Error('片源不存在');
            const target = site.api + '?ac=videolist&ids=' + encodeURIComponent(item.id);
            const data = await Net.json(target, { timeout: CFG.searchTimeout + 1500 });
            const first = data && Array.isArray(data.list) ? data.list[0] : null;
            if (!first) throw new Error('接口没有返回详情');
            const episodes = parsePlayUrl(first.vod_play_url || '', first.vod_play_from || '');
            const result = {
                id: String(item.id),
                name: first.vod_name || item.name,
                pic: first.vod_pic || item.pic,
                year: first.vod_year || item.year,
                type: first.type_name || item.type,
                area: first.vod_area || item.area,
                note: first.vod_remarks || item.note,
                actor: first.vod_actor || item.actor,
                director: first.vod_director || item.director,
                score: first.vod_score || item.score,
                desc: (first.vod_content || first.vod_blurb || item.desc || '').replace(/<[^>]+>/g, ''),
                episodes,
                playFrom: first.vod_play_from || '',
                site: item.site,
                siteName: item.siteName || site.name
            };
            detailCacheCore.set(ck, { t: Date.now(), v: result });
            return result;
        },

        /* 测一个源的播放延迟（拉 m3u8 首字节 + 读完），缓存 5 分钟 */
        async probeSpeed(source, force) {
            const key = source.site + '::' + source.id;
            const hit = speedCache.get(key);
            if (!force && hit && Date.now() - hit.t < 300000) return hit;

            const started = performance.now();
            try {
                const d = await Data.detail(source);
                const ep = (d.episodes || [])[0];
                if (!ep || !ep.url) {
                    const rec = { ms: null, ok: false, t: Date.now() };
                    speedCache.set(key, rec);
                    return rec;
                }
                const ctrl = new AbortController();
                const timer = setTimeout(() => ctrl.abort(), 4500);
                const res = await fetch(Net.proxy(ep.url), { signal: ctrl.signal, cache: 'no-store' });
                if (!res.ok) throw new Error('HTTP ' + res.status);
                await res.arrayBuffer();
                clearTimeout(timer);
                const rec = { ms: Math.round(performance.now() - started), ok: true, t: Date.now(), detail: d };
                speedCache.set(key, rec);
                return rec;
            } catch (e) {
                const rec = { ms: null, ok: false, t: Date.now() };
                speedCache.set(key, rec);
                return rec;
            }
        },

        speedClass(ms) {
            if (ms == null) return 'bad';
            if (ms < 350) return 'good';
            if (ms < 900) return 'mid';
            return 'bad';
        },

        speedText(rec) {
            if (!rec) return '测速中';
            if (!rec.ok || rec.ms == null) return '超时';
            return rec.ms + ' ms';
        },

        async douban(type, tag, start = 0, limit = 24) {
            if (MOCK) {
                const out = [];
                for (let i = 0; i < limit; i++) {
                    const name = MOCK_NAMES[(i + start) % MOCK_NAMES.length] + ' ' + (i % 5 === 0 ? 'Ⅱ' : '');
                    out.push({
                        name: name.trim(),
                        pic: mockPoster(name.trim(), i + start),
                        score: (6.8 + ((i * 7) % 30) / 10).toFixed(1),
                        eps: i % 3 === 0 ? '更新至 ' + (8 + i) + ' 集' : '',
                        douban: true
                    });
                }
                return out;
            }
            const target = 'https://movie.douban.com/j/search_subjects?type=' + type +
                '&tag=' + encodeURIComponent(tag) + '&sort=recommend&page_limit=' + limit + '&page_start=' + start;
            const data = await Net.json(target, { timeout: CFG.doubanTimeout });
            const list = Array.isArray(data && data.subjects) ? data.subjects : [];
            const out = [];
            for (const s of list) {
                out.push({
                    name: s.title,
                    rawTitle: s.title,
                    pic: s.cover || '',
                    score: s.rate || '',
                    url: s.url || '',
                    eps: s.episodes_info || '',
                    douban: true
                });
            }
            return out;
        }
    };

    /* 解析播放列表：第01集$https://a.m3u8#第02集$https://b.m3u8 */
    function parsePlayUrl(raw, from) {
        if (!raw) return [];
        const groups = String(raw).split('$$$');
        const sources = String(from || '').split('$$$');
        const primary = groups[0] || '';
        const eps = [];
        primary.split('#').forEach((chunk, i) => {
            const part = chunk.split('$');
            let name, url;
            if (part.length >= 2) {
                name = part[0].trim();
                url = part[1].trim();
            } else {
                name = '第 ' + (i + 1) + ' 集';
                url = part[0].trim();
            }
            if (!url) return;
            if (!/^https?:\/\//i.test(url)) return;
            eps.push({ name: name || ('第 ' + (i + 1) + ' 集'), url });
        });
        if (sources.length > 1) eps.forEach(e => { e.from = sources[0]; });
        return eps;
    }

    /* ---------- 历史（按模式隔离） ---------- */
    const History = {
        key(m) { return 'wt_history_' + (m || Mode.get()); },
        all(m) { return Store.get(this.key(m), []) || []; },
        add(rec, m) {
            const k = this.key(m);
            const list = this.all(m).filter(x => !(x.id === rec.id && x.site === rec.site));
            list.unshift(rec);
            Store.set(k, list.slice(0, CFG.historyLimit));
        },
        remove(id, site, m) {
            Store.set(this.key(m), this.all(m).filter(x => !(x.id === id && x.site === site)));
        },
        clear(m) { Store.set(this.key(m), []); }
    };

    /* ---------- 模式（影视 / 动漫） ---------- */
    const Mode = {
        get() {
            return Store.get('wt_mode', 'video') === 'anime' ? 'anime' : 'video';
        },
        set(m) {
            Store.set('wt_mode', m === 'anime' ? 'anime' : 'video');
        },
        info(m) {
            return WT.MODE_INFO[(m || this.get())] || WT.MODE_INFO.video;
        }
    };

    /* ---------- 收藏（按模式隔离） ---------- */
    const Favorites = {
        key(m) { return 'wt_favs_' + (m || Mode.get()); },
        all(m) { return Store.get(this.key(m), []) || []; },
        has(id, site, m) {
            return this.all(m).some(x => String(x.id) === String(id) && x.site === site);
        },
        add(item, m) {
            const k = this.key(m);
            const list = this.all(m).filter(x => !(String(x.id) === String(item.id) && x.site === item.site));
            list.unshift({
                id: String(item.id),
                site: item.site,
                siteName: item.siteName || siteLabel(item.site),
                name: item.name || '',
                pic: item.pic || '',
                year: item.year || '',
                type: item.type || '',
                note: item.note || '',
                score: item.score || '',
                addedAt: Date.now()
            });
            Store.set(k, list.slice(0, 200));
        },
        remove(id, site, m) {
            Store.set(this.key(m), this.all(m).filter(x => !(String(x.id) === String(id) && x.site === site)));
        },
        toggle(item, m) {
            if (this.has(item.id, item.site, m)) {
                this.remove(item.id, item.site, m);
                return false;
            }
            this.add(item, m);
            return true;
        },
        clear(m) { Store.set(this.key(m), []); }
    };

    /* ---------- 搜索历史（按模式隔离） ---------- */
    const suggestCache = new Map();
    const speedCache = new Map();
    const detailCacheCore = new Map();

    const SearchHistory = {
        key(m) { return 'wt_shist_' + (m || Mode.get()); },
        all(m) { return Store.get(this.key(m), []) || []; },
        add(q, m) {
            q = String(q || '').trim();
            if (!q) return;
            const list = this.all(m).filter(x => x !== q);
            list.unshift(q);
            Store.set(this.key(m), list.slice(0, 12));
        },
        remove(q, m) {
            Store.set(this.key(m), this.all(m).filter(x => x !== q));
        },
        clear(m) { Store.set(this.key(m), []); }
    };

    /* ---------- 提示 ---------- */
    function toast(msg, type = 'info') {
        const wrap = $('#toastWrap');
        if (!wrap) return;
        const node = el('div', { class: 'toast' + (type === 'error' ? ' err' : ''), text: msg });
        wrap.appendChild(node);
        setTimeout(() => {
            node.style.transition = 'opacity .3s, transform .3s';
            node.style.opacity = '0';
            node.style.transform = 'translateY(-8px)';
            setTimeout(() => node.remove(), 320);
        }, 2600);
    }

    /* ---------- 路由 ---------- */
    const Router = {
        routes: [],
        on(pattern, handler) { this.routes.push({ pattern, handler }); },
        parse() {
            const raw = location.hash.replace(/^#/, '') || '/';
            const [pathPart, queryPart] = raw.split('?');
            const path = pathPart || '/';
            const query = {};
            (queryPart || '').split('&').filter(Boolean).forEach(pair => {
                const [k, v] = pair.split('=');
                query[decodeURIComponent(k)] = decodeURIComponent(v || '');
            });
            return { path, query };
        },
        go(hash) {
            if (location.hash === hash) this.render();
            else location.hash = hash;
        },
        start() {
            window.addEventListener('hashchange', () => this.render());
            this.render();
        },
        render() {
            const { path, query } = this.parse();
            let matched = null;
            for (const r of this.routes) {
                if (r.pattern === path) { matched = r; break; }
            }
            if (!matched && this.routes.length) matched = this.routes[0];
            if (!matched) return;

            /* 导航高亮 */
            const activeKey = path.startsWith('/search') ? 'search'
                : path.startsWith('/history') ? 'history'
                : path.startsWith('/settings') ? 'settings' : 'discover';
            $$('[data-nav]').forEach(a => a.classList.toggle('is-active', a.dataset.nav === activeKey));

            const view = $('#view');
            view.classList.remove('view-enter');
            void view.offsetWidth;
            view.classList.add('view-enter');
            window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
            matched.handler(query, view);
        }
    };

    /* ---------- 杂项 ---------- */
    function siteLabel(key) { return (WT.SITES[key] && WT.SITES[key].name) || key; }

    function pickLine(except) {
        const list = WT.LINES.filter(l => l !== except);
        return list[Math.floor(Math.random() * list.length)];
    }

    function fmtDate(ts) {
        const d = new Date(ts);
        const diff = Date.now() - ts;
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前';
        if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前';
        if (diff < 7 * 86400000) return Math.floor(diff / 86400000) + ' 天前';
        return (d.getMonth() + 1) + '月' + d.getDate() + '日';
    }

    window.WT.util = { $, $$, el, esc, debounce, ICONS, Store, Auth, Net, Data, History, Favorites, SearchHistory, Mode, toast, Router, siteLabel, pickLine, fmtDate, parsePlayUrl };
})();
