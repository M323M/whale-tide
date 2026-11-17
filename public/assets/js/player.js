/* 鲸汐 WhaleTide · 播放器（ArtPlayer + hls.js） */

(function () {
    'use strict';

    const U = WT.util;
    const { $, el, esc, ICONS, toast, Data } = U;

    let art = null;
    let ctx = null;
    let switching = false;

    function proxySync(url) {
        if (!url) return '';
        if (!/^https?:\/\//i.test(url)) return url;
        const hash = U.Auth.getSync();
        const base = WT.CONFIG.proxy + encodeURIComponent(url);
        return hash ? base + '?auth=' + encodeURIComponent(hash) + '&t=' + Date.now() : base;
    }

    function destroyArt() {
        if (art) {
            try { art.destroy(false); } catch (e) { /* noop */ }
            art = null;
        }
    }

    function renderSide() {
        const side = $('#cinemaEps');
        if (!side) return;
        side.innerHTML = (ctx.episodes || []).map((ep, i) =>
            `<button class="ep ${i === ctx.index ? 'is-playing' : ''}" data-ep="${i}" title="${esc(ep.name)}">${esc(ep.name)}</button>`
        ).join('');
        side.querySelectorAll('[data-ep]').forEach(btn => {
            btn.addEventListener('click', () => playIndex(Number(btn.dataset.ep)));
        });
        const cur = side.querySelector('.ep.is-playing');
        if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    function setHead() {
        const ep = ctx.episodes[ctx.index];
        const nameEl = $('#cinemaName');
        const subEl = $('#cinemaSub');
        const cntEl = $('#cinemaCount');
        if (nameEl) nameEl.textContent = ctx.title || '未命名';
        if (subEl) subEl.textContent = [ctx.siteName, ep ? ep.name : ''].filter(Boolean).join(' · ');
        if (cntEl) cntEl.textContent = (ctx.index + 1) + ' / ' + ctx.episodes.length + ' 集';
        const prev = $('#cinemaPrev');
        const next = $('#cinemaNext');
        if (prev) prev.disabled = ctx.index <= 0;
        if (next) next.disabled = ctx.index >= ctx.episodes.length - 1;
        updateSourceBtn();
    }

    function updateSourceBtn() {
        const btn = $('#cinemaSource');
        if (!btn) return;
        const n = (ctx.sources || []).length;
        const label = btn.querySelector('.src-label');
        if (label) label.textContent = n > 1 ? ('换源 · ' + n) : '换源';
        btn.title = n > 1 ? '卡了就切到别的源' : '搜一下这部还有哪些源';
    }

    function stageTip(html) {
        const stage = $('#cinemaStage');
        if (!stage) return;
        const old = stage.querySelector('.stage-tip');
        if (old) old.remove();
        if (!html) return;
        stage.appendChild(el('div', { class: 'stage-tip', html }));
    }

    /* ---------- 分享页解析：/play/xxx 或 /share/xxx → 真实 m3u8 ---------- */
    const resolveCache = new Map();

    async function resolvePlayUrl(raw) {
        if (!raw) return raw;
        if (/\.m3u8(\?|$)/i.test(raw)) return raw;

        const cached = resolveCache.get(raw);
        if (cached && Date.now() - cached.t < 600000) return cached.v;

        try {
            const res = await fetch(proxySync(raw), { cache: 'no-store' });
            if (!res.ok) return raw;
            const html = await res.text();

            let abs = '';
            const absMatch = html.match(/https?:\/\/[^"'\s\\<>]+?\.m3u8[^"'\s\\<>]*/i);
            if (absMatch) abs = absMatch[0];

            if (!abs) {
                const relMatch = html.match(/["']([^"']+\.m3u8[^"']*)["']/i);
                if (relMatch) {
                    try { abs = new URL(relMatch[1], raw).toString(); } catch (e) { abs = ''; }
                }
            }

            if (abs) {
                resolveCache.set(raw, { t: Date.now(), v: abs });
                return abs;
            }
        } catch (e) { /* 解析失败就把原地址交给播放器 */ }
        return raw;
    }

    function playIndex(index) {
        if (!ctx || !ctx.episodes || !ctx.episodes.length) return;
        index = Math.max(0, Math.min(index, ctx.episodes.length - 1));
        ctx.index = index;
        const ep = ctx.episodes[index];

        destroyArt();
        renderSide();
        setHead();
        if (typeof ctx.onEpisodeChange === 'function') {
            try { ctx.onEpisodeChange(index, ep); } catch (e) { /* noop */ }
        }

        const stage = $('#cinemaStage');
        if (!stage) return;
        stage.querySelectorAll('.artplayer-app, .art-video-player').forEach(n => n.remove());

        stageTip('<div class="spin"></div><p>正在把片子捞上来…</p>');

        const seqToken = ++ctx.seq;
        resolvePlayUrl(ep.url).then((resolved) => {
            if (!ctx || ctx.seq !== seqToken) return;   // 期间又切了集/源
            bootPlayer(resolved, ep);
        }).catch(() => {
            if (!ctx || ctx.seq !== seqToken) return;
            bootPlayer(ep.url, ep);
        });
    }

    function bootPlayer(rawUrl, ep) {
        const stage = $('#cinemaStage');
        if (!stage) return;

        const isM3u8 = /\.m3u8(\?|$)/i.test(rawUrl) || /m3u8/i.test(rawUrl);
        const finalUrl = proxySync(rawUrl);

        if (typeof Artplayer === 'undefined') {
            stageTip('<div class="spin"></div><p>播放器加载中…</p>');
            setTimeout(() => playIndex(ctx ? ctx.index : 0), 600);
            return;
        }

        stageTip('<div class="spin"></div><p>正在把片子捞上来…</p>');

        try {
            art = new Artplayer({
                container: stage,
                url: finalUrl,
                type: isM3u8 ? 'm3u8' : 'auto',
                poster: ctx.poster || '',
                autoplay: true,
                muted: false,
                volume: 0.8,
                setting: true,
                playbackRate: true,
                aspectRatio: true,
                fullscreen: true,
                fullscreenWeb: true,
                pip: true,
                miniProgressBar: true,
                airplay: true,
                theme: '#5ee7f0',
                lang: 'zh-cn',
                hotkey: true,
                autoOrientation: true,
                moreVideoAttr: { crossOrigin: 'anonymous', playsInline: true },
                customType: {
                    m3u8: function (video, url, player) {
                        if (window.Hls && Hls.isSupported()) {
                            const hls = new Hls({
                                maxBufferLength: 24,
                                maxMaxBufferLength: 48,
                                backBufferLength: 30,
                                maxBufferHole: 0.5,
                                manifestLoadingMaxRetry: 3,
                                levelLoadingMaxRetry: 3,
                                fragLoadingMaxRetry: 6,
                                abrEwmaDefaultEstimate: 800000,
                                startLevel: -1
                            });
                            hls.loadSource(url);
                            hls.attachMedia(video);
                            hls.on(Hls.Events.ERROR, (evt, data) => {
                                if (!data || !data.fatal) return;
                                if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                                    hls.startLoad();
                                } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                                    hls.recoverMediaError();
                                } else {
                                    autoSwitch('这个源播不动');
                                }
                            });
                            player.hls = hls;
                            player.once('destroy', () => { try { hls.destroy(); } catch (e) { } });
                        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                            video.src = url;
                        } else {
                            toast('这个浏览器不支持 HLS 播放', 'error');
                        }
                    }
                }
            });

            art.on('ready', () => {
                const tip = stage.querySelector('.stage-tip');
                if (tip) tip.remove();
            });

            art.on('video:error', () => {
                autoSwitch('信号断在深海里了');
            });

            art.on('video:ended', () => {
                if (ctx.index + 1 < ctx.episodes.length) {
                    toast('这集看完了，自动播下一集');
                    setTimeout(() => playIndex(ctx.index + 1), 800);
                } else {
                    toast('全部看完啦，鲸～');
                }
            });
        } catch (e) {
            console.error('[player]', e);
            stageTip('<p>播放器启动失败，换个源试试。</p>');
        }
    }

    /* 卡住/报错时自动换下一个源 */
    async function autoSwitch(reason) {
        if (switching) return;
        const n = (ctx && ctx.sources || []).length;
        if (!ctx || n < 2) {
            stageTip(`<p>${esc(reason)}了…这个源只有一条线路，试试选集里换个集数。</p>`);
            return;
        }
        const nextIdx = ((ctx.sourceIdx || 0) + 1) % n;
        toast(reason + '，自动切到「' + (ctx.sources[nextIdx].siteName || '另一个源') + '」');
        await switchSource(nextIdx, true);
    }

    /* 切源：拉新源的选集，尽量停在同一个集序号 */
    async function switchSource(idx, keepIndex) {
        if (!ctx || !ctx.sources || !ctx.sources[idx]) return;
        if (switching) return;
        switching = true;
        const target = ctx.sources[idx];
        const oldIndex = ctx.index;
        const oldSite = ctx.siteName;

        /* 防串片：名字规范化后对不上就拒绝 */
        const norm = WT.normTitle || (s => String(s || ''));
        if (target.name && ctx.title && norm(target.name) !== norm(ctx.title)) {
            switching = false;
            toast('这个源不是同一部片子，已跳过');
            return;
        }

        ctx.siteName = target.siteName || target.site;
        setHead();
        stageTip('<div class="spin"></div><p>正在换到 ' + esc(ctx.siteName) + ' …</p>');
        try {
            const d = await Data.detail(target);
            if (!d.episodes || !d.episodes.length) {
                toast('这个源没有可用播放地址，换一个试试', 'error');
                ctx.siteName = oldSite;
                setHead();
                stageTip('<p>这个源没有可用播放地址。</p>');
                return;
            }
            ctx.episodes = d.episodes;
            ctx.sourceIdx = idx;
            ctx.index = keepIndex === false ? 0 : Math.min(oldIndex, d.episodes.length - 1);
            ctx.poster = d.pic || ctx.poster;
            renderSide();
            playIndex(ctx.index);
        } catch (e) {
            toast('这个源打不开，换一个试试', 'error');
            ctx.siteName = oldSite;
            setHead();
        } finally {
            switching = false;
        }
    }

    /* ---------- 源延迟测速 ---------- */
    const speedCache = new Map();   // site+id -> { ms, ok, t }

    function speedClass(ms) {
        if (ms == null) return 'bad';
        if (ms < 350) return 'good';
        if (ms < 900) return 'mid';
        return 'bad';
    }

    async function probeSource(source) {
        const key = source.site + '::' + source.id;
        const cached = speedCache.get(key);
        if (cached && Date.now() - cached.t < 300000) return cached;

        const started = performance.now();
        try {
            const d = await Data.detail(source);
            const ep = (d.episodes || [])[0];
            if (!ep || !ep.url) return { ms: null, ok: false, t: Date.now() };

            const t1 = performance.now();
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 4500);
            const res = await fetch(proxySync(ep.url), { signal: ctrl.signal, cache: 'no-store' });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            await res.arrayBuffer();          // m3u8 很小，读完顺便测完整 RTT
            clearTimeout(timer);
            const ms = Math.round(performance.now() - t1);
            const rec = { ms, ok: true, t: Date.now() };
            speedCache.set(key, rec);
            return rec;
        } catch (e) {
            const rec = { ms: null, ok: false, t: Date.now() };
            speedCache.set(key, rec);
            return rec;
        }
    }

    function speedText(rec) {
        if (!rec) return '测速中';
        if (!rec.ok || rec.ms == null) return '超时';
        return rec.ms + ' ms';
    }

    /* 换源菜单 */
    async function openSourceMenu() {
        if (!ctx) return;
        const old = document.querySelector('.source-menu');
        if (old) { old.remove(); return; }

        let sources = (ctx.sources || []).slice();

        /* 只有一个源时，现场按标题再搜一遍（只认同名，绝不兜底到别的片子） */
        if (sources.length <= 1) {
            toast('正在搜这部还有哪些源…');
            try {
                const list = await Data.search(ctx.title, WT.CONFIG.defaultSites);
                const merged = (WT.app && WT.app.mergeByTitle) ? WT.app.mergeByTitle(list) : [];
                const norm = WT.normTitle || (s => String(s || ''));
                const want = norm(ctx.title);
                const hits = merged.filter(m => norm(m.name) === want && m.sources && m.sources.length);
                if (hits.length) {
                    const union = [];
                    hits.forEach(m => m.sources.forEach(s => {
                        if (!union.some(x => x.site === s.site)) union.push(s);
                    }));
                    if (union.length > 1) {
                        sources = union;
                        ctx.sources = sources;
                    }
                }
            } catch (e) { /* noop */ }
        }

        if (!sources.length) {
            toast('没找到其它源', 'error');
            return;
        }

        const current = ctx.sources[ctx.sourceIdx || 0];
        const menu = el('div', { class: 'source-menu' });
        menu.innerHTML = `
            <div class="source-menu-head">
                <span>选一个源（${sources.length}）</span>
                <button class="sm-recheck" type="button" data-recheck>
                    ${ICONS.refresh}<span>重测</span>
                </button>
            </div>
            <div class="source-menu-list">
                ${sources.map(s => `
                    <button class="source-menu-item ${s === current ? 'is-current' : ''}" data-site="${esc(s.site)}" data-id="${esc(s.id)}">
                        <span class="sm-left">
                            <span class="sm-name">${esc(s.siteName || U.siteLabel(s.site))}</span>
                            <span class="sm-meta">${esc([s.year, s.note].filter(Boolean).join(' · '))}</span>
                        </span>
                        <span class="sm-speed testing">测速中</span>
                    </button>`).join('')}
            </div>`;

        const head = $('#cinemaHead') || $('.cinema-head');
        if (head && head.parentElement) head.parentElement.appendChild(menu);
        else document.body.appendChild(menu);

        menu.querySelectorAll('[data-site]').forEach(btn => {
            btn.addEventListener('click', () => {
                const site = btn.dataset.site;
                const id = btn.dataset.id;
                const i = ctx.sources.findIndex(x => x.site === site && String(x.id) === String(id));
                menu.remove();
                switchSource(i >= 0 ? i : 0, true);
            });
        });

        /* 测速 + 校验：没播放地址或不是同一部片的源直接踢出列表 */
        let probeRun = 0;
        function runProbe(force) {
            const myRun = ++probeRun;
            let done = 0;
            const wantTitle = (WT.normTitle || (s => String(s || '')))(ctx.title);
            let alive = sources.length;
            sources.forEach(s => {
                if (force) speedCache.delete(s.site + '::' + s.id);
                const node = menu.querySelector(`[data-site="${s.site}"][data-id="${s.id}"] .sm-speed`);
                if (node) { node.textContent = '测速中'; node.className = 'sm-speed testing'; }
                probeSource(s).then(rec => {
                    if (myRun !== probeRun) return;

                    /* 校验：必须有播放地址，且名字对得上 */
                    const d = rec && rec.detail;
                    const good = d ? ((d.episodes || []).length > 0 && (WT.normTitle || (x => x))(d.name) === wantTitle) : true;
                    if (!good) {
                        const item = menu.querySelector(`[data-site="${s.site}"][data-id="${s.id}"]`);
                        if (item) item.remove();
                        alive--;
                        const headSpan = menu.querySelector('.source-menu-head > span');
                        if (headSpan) headSpan.textContent = `选一个源（${alive}）`;
                        return;
                    }

                    const n2 = menu.querySelector(`[data-site="${s.site}"][data-id="${s.id}"] .sm-speed`);
                    if (n2) {
                        n2.textContent = speedText(rec);
                        n2.className = 'sm-speed ' + speedClass(rec.ms);
                    }
                    done++;
                    const btnLabel = menu.querySelector('[data-recheck] span');
                    if (btnLabel) btnLabel.textContent = done < sources.length ? `测速 ${done}/${sources.length}` : '重测';
                });
            });
        }

        const recheck = menu.querySelector('[data-recheck]');
        if (recheck) recheck.addEventListener('click', (e) => {
            e.stopPropagation();
            runProbe(true);
        });

        runProbe(false);

        setTimeout(() => {
            document.addEventListener('click', function onDoc(e) {
                if (!menu.contains(e.target) && !e.target.closest('#cinemaSource')) {
                    menu.remove();
                    document.removeEventListener('click', onDoc);
                }
            });
        }, 0);
    }

    function open(opts) {
        ctx = Object.assign({
            title: '',
            siteName: '',
            poster: '',
            episodes: [],
            index: 0,
            sources: [],
            sourceIdx: 0,
            seq: 0,
            onEpisodeChange: null
        }, opts || {});
        if (ctx.siteName && ctx.sources.length) {
            const i = ctx.sources.findIndex(s => (s.siteName || '') === ctx.siteName);
            if (i >= 0) ctx.sourceIdx = i;
        }

        const layer = $('#playerLayer');
        const cinema = $('#cinema');
        layer.hidden = false;
        document.body.classList.add('no-scroll');

        cinema.innerHTML = `
            <header class="cinema-head" id="cinemaHead">
                <button class="cinema-back" id="cinemaBack" type="button">
                    ${ICONS.back}<span>返回</span>
                </button>
                <div class="cinema-title">
                    <h2 id="cinemaName">${esc(ctx.title)}</h2>
                    <p><span id="cinemaSub"></span><span class="dot-sep">·</span><span id="cinemaCount"></span></p>
                </div>
                <span class="spacer"></span>
                <button class="cinema-btn" id="cinemaSource" type="button">
                    ${ICONS.swap}<span class="src-label">换源</span>
                </button>
                <button class="cinema-icon" id="cinemaPrev" type="button" title="上一集">${ICONS.back}</button>
                <button class="cinema-icon" id="cinemaNext" type="button" title="下一集">${ICONS.play}</button>
            </header>
            <div class="cinema-body">
                <div class="cinema-stage" id="cinemaStage"></div>
                <aside class="cinema-side">
                    <div class="cinema-side-head">
                        <span>选集</span>
                        <em id="cinemaSideCount"></em>
                    </div>
                    <div class="ep-list" id="cinemaEps"></div>
                </aside>
            </div>`;

        const sideCount = $('#cinemaSideCount');
        if (sideCount) sideCount.textContent = (ctx.episodes || []).length + ' 集';

        $('#cinemaBack').addEventListener('click', close);
        $('#cinemaSource').addEventListener('click', (e) => { e.stopPropagation(); openSourceMenu(); });
        $('#cinemaPrev').addEventListener('click', () => playIndex(ctx.index - 1));
        $('#cinemaNext').addEventListener('click', () => playIndex(ctx.index + 1));

        playIndex(ctx.index || 0);
    }

    function close() {
        destroyArt();
        if (ctx && typeof ctx.onClose === 'function') {
            try { ctx.onClose(); } catch (e) { }
        }
        const menu = document.querySelector('.source-menu');
        if (menu) menu.remove();
        $('#playerLayer').hidden = true;
        document.body.classList.remove('no-scroll');
        $('#cinema').innerHTML = '';
        ctx = null;
    }

    window.WT.player = {
        open,
        close,
        playIndex: (i) => playIndex(i),
        switchSource: (i) => switchSource(i, true),
        get context() { return ctx; }
    };
})();
