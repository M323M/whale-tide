/* 鲸汐 WhaleTide · 界面与交互 */

(function () {
    'use strict';

    const U = WT.util;
    const { $, $$, el, esc, ICONS, Store, Auth, Data, History, Favorites, SearchHistory, Mode, toast, Router } = U;
    const CFG = WT.CONFIG;

    /* 片源按模式分开存 */
    function sitesKey(mode) { return mode === 'anime' ? 'wt_sites_anime' : 'wt_sites'; }
    function loadSites(mode) {
        const fallback = mode === 'anime' ? WT.ANIME_DEFAULT_SITES : CFG.defaultSites;
        const list = (Store.get(sitesKey(mode), fallback) || []).filter(k => WT.SITES[k]);
        return list.length ? list : fallback.slice();
    }

    /* ---------- 全局状态 ---------- */
    const BG_THEMES = [
        { key: 'deep', name: '深海夜', mode: 'dark', swatch: 'linear-gradient(150deg,#0a2038,#061424 72%)' },
        { key: 'aurora', name: '极光湾', mode: 'dark', swatch: 'linear-gradient(150deg,#0b2340,#22467f 52%,#0a1a2e)' },
        { key: 'dawn', name: '晨雾海面', mode: 'dark', swatch: 'linear-gradient(150deg,#20364f,#4a7391 48%,#efb98c)' },
        { key: 'lagoon', name: '浅海潟湖', mode: 'dark', swatch: 'linear-gradient(150deg,#083843,#27a3a6 55%,#05222c)' },
        { key: 'sakura', name: '樱粉', mode: 'light', swatch: 'linear-gradient(150deg,#fff8fb,#ffd9e6 52%,#f488ae)' },
        { key: 'candy', name: '糖果玻璃', mode: 'light', swatch: 'linear-gradient(150deg,#e6f6ff,#d8b8ff 52%,#ffc2e2)' },
        { key: 'paper', name: '月白', mode: 'light', swatch: 'linear-gradient(150deg,#f6fcff,#dcebf6 58%,#bfe0f0)' },
        { key: 'neon', name: '赛博霓虹', mode: 'dark', swatch: 'linear-gradient(150deg,#0b0520,#1a0a34 52%,#57f7ff 92%)' },
        { key: 'retro', name: '复古胶片', mode: 'light', swatch: 'linear-gradient(150deg,#faf3e6,#e6d8c0 58%,#b0793a)' }
    ];

    const state = {
        style: Store.get('wt_style', 'mature'),
        bg: Store.get('wt_bg', 'deep'),
        mode: Mode.get(),
        sites: loadSites(Mode.get()),
        douban: { type: Store.get('wt_douban_type', 'movie'), tag: '热门', items: [], start: 0, loading: false },
        search: { q: '', items: [], raw: [], loading: false, filter: 'all' },
        bubble: '',
        searching: null
    };
    if (!state.sites.length) state.sites = CFG.defaultSites.slice();
    if (!BG_THEMES.some(t => t.key === state.bg)) state.bg = 'deep';
    if (state.mode === 'anime') state.douban.type = 'tv';

    /* 页面加载时刻，用于图片代理签名（同一秒复用，减少重复请求） */
    const T0 = Date.now();

    /* ---------- 小工具 ---------- */
    function proxySync(url) {
        if (!url) return '';
        if (!/^https?:\/\//i.test(url)) return url;
        const hash = Auth.getSync();
        const base = CFG.proxy + encodeURIComponent(url);
        return hash ? base + '?auth=' + encodeURIComponent(hash) + '&t=' + T0 : base;
    }

    function imgFallback(img) {
        if (!img) return;
        const src = img.getAttribute('src') || '';
        if (!img.dataset.retried && /^https?:\/\//i.test(src)) {
            img.dataset.retried = '1';
            img.src = proxySync(src);
            return;
        }
        img.onerror = null;
        img.src = CFG.imageFallback;
    }
    window.WT.imgFallback = imgFallback;

    function pic(url) {
        if (!url) return CFG.imageFallback;
        return esc(url);
    }

    function card(item, index) {
        const delay = Math.min(index * 18, 260);
        const meta = [item.year, item.type].filter(Boolean).slice(0, 2);
        const score = item.score && Number(item.score) > 0 ? `<span class="card-score">${esc(Number(item.score).toFixed(1))}</span>` : '';
        const srcCount = item.sources ? item.sources.length : 1;
        const badge = srcCount > 1
            ? `<span class="card-badge multi">${srcCount} 源</span>`
            : (item.siteName ? `<span class="card-badge ghost">${esc(item.siteName)}</span>` : '');
        const faved = Favorites.has(item.id, item.site);
        return `
        <button class="card" style="animation-delay:${delay}ms" data-open="${esc(item.key || item.id)}" title="${esc(item.name)}">
            <div class="card-poster">
                <img src="${pic(item.pic)}" alt="${esc(item.name)}" loading="lazy" onerror="WT.imgFallback(this)">
                ${badge}${score}
                <span class="card-fav ${faved ? 'is-on' : ''}" role="button" tabindex="0"
                      data-fav="${esc(item.id)}" data-fav-site="${esc(item.site)}"
                      data-fav-name="${esc(item.name)}" data-fav-pic="${esc(item.pic)}"
                      title="${faved ? '取消收藏' : '收藏'}">${ICONS.star}</span>
                <span class="card-play">${ICONS.play}</span>
                <div class="card-info">
                    <h3>${esc(item.name)}</h3>
                    <div class="meta">
                        ${meta.map((m, i) => (i ? '<span class="dot"></span>' : '') + `<span>${esc(m)}</span>`).join('')}
                    </div>
                    ${item.note ? `<div class="note-line">${esc(item.note)}</div>` : ''}
                </div>
            </div>
        </button>`;
    }

    function skeletonGrid(n = 12) {
        return `<div class="grid">${Array.from({ length: n }, () => '<div class="skeleton skeleton-card"></div>').join('')}</div>`;
    }

    function emptyState(title, desc) {
        return `<div class="empty">
            <img src="assets/img/chibi.png" alt="">
            <h3>${esc(title)}</h3>
            <p>${esc(desc)}</p>
        </div>`;
    }

    function setStyle(style, persist = true) {
        if (style !== 'chibi') style = 'mature';
        state.style = style;
        document.body.setAttribute('data-whale-style', style);
        $$('[data-style-btn]').forEach(b => b.classList.toggle('is-active', b.dataset.styleBtn === style));
        $$('[data-art]').forEach(img => { img.src = style === 'chibi' ? 'assets/img/chibi.png' : 'assets/img/girl.png'; });
        if (persist) Store.set('wt_style', style);
    }

    function ensurePetals() {
        const layer = document.getElementById('petals');
        if (!layer || layer.childElementCount) return;
        for (let i = 0; i < 26; i++) {
            const p = document.createElement('span');
            p.className = 'petal';
            const size = 20 + Math.random() * 16;
            p.style.left = (Math.random() * 100).toFixed(2) + '%';
            p.style.top = (Math.random() * 96).toFixed(2) + '%';
            p.style.width = size.toFixed(1) + 'px';
            p.style.height = (size * 0.88).toFixed(1) + 'px';
            p.style.animationDelay = (Math.random() * 9).toFixed(2) + 's';
            p.style.animationDuration = (10 + Math.random() * 9).toFixed(2) + 's';
            p.style.opacity = (0.78 + Math.random() * 0.22).toFixed(2);
            layer.appendChild(p);
        }
    }

    function setBg(key, persist = true) {
        if (!BG_THEMES.some(t => t.key === key)) key = 'deep';
        state.bg = key;
        const theme = BG_THEMES.find(t => t.key === key) || BG_THEMES[0];
        document.body.setAttribute('data-bg', key);
        document.documentElement.setAttribute('data-bg', key);
        document.body.setAttribute('data-bg-mode', theme.mode || 'dark');
        $$('[data-bg-key]').forEach(b => b.classList.toggle('is-active', b.dataset.bgKey === key));
        if (key === 'sakura') ensurePetals();
        if (persist) Store.set('wt_bg', key);
    }

    /* ---------- 影视 / 动漫 切换 ---------- */
    function updateModeUI() {
        const info = Mode.info(state.mode);
        const btn = $('#modeSwitch');
        if (btn) {
            const txt = btn.querySelector('.mode-text');
            const ico = btn.querySelector('.mode-ico');
            if (txt) txt.textContent = info.name;
            if (ico) ico.innerHTML = state.mode === 'anime' ? ICONS.sparkle : ICONS.film;
            btn.classList.toggle('is-anime', state.mode === 'anime');
            btn.setAttribute('title', '点击切换到' + (state.mode === 'anime' ? '影视' : '动漫'));
        }
        document.body.setAttribute('data-mode', state.mode);
    }

    function setMode(mode, persist = true) {
        mode = mode === 'anime' ? 'anime' : 'video';
        const changed = mode !== state.mode;
        state.mode = mode;
        if (persist) Mode.set(mode);
        state.sites = loadSites(mode);
        state.douban.start = 0;
        state.douban.tag = mode === 'anime' ? WT.ANIME_DOUBAN_TAGS[0] : '热门';
        state.douban.type = mode === 'anime' ? 'tv' : (Store.get('wt_douban_type', 'movie') || 'movie');
        updateModeUI();
        if (changed) Router.render();
    }

    function toggleMode() {
        setMode(state.mode === 'anime' ? 'video' : 'anime');
        toast(state.mode === 'anime' ? '切到动漫模式，片单/收藏也换成番剧那套' : '切回影视模式');
    }

    /* ---------- 搜索联想 + 搜索历史面板 ---------- */
    function attachSearchSuggest(input, submit) {
        if (!input) return;
        const form = input.closest('form');
        if (!form) return;
        const wrap = form.parentElement;
        if (!wrap) return;

        wrap.classList.add('search-wrap');
        const old = wrap.querySelector('.suggest-panel');
        if (old) old.remove();

        const panel = el('div', { class: 'suggest-panel' });
        panel.hidden = true;
        wrap.appendChild(panel);

        let items = [];
        let active = -1;
        let seq = 0;
        let isOpen = false;

        function open() { panel.hidden = false; isOpen = true; wrap.classList.add('is-open'); }
        function close() { panel.hidden = true; isOpen = false; active = -1; wrap.classList.remove('is-open'); }

        function doSubmit(q) {
            q = String(q || '').trim();
            if (!q) return;
            input.value = q;
            SearchHistory.add(q);
            close();
            input.blur();
            if (typeof submit === 'function') submit(q);
            else if (form.requestSubmit) form.requestSubmit();
            else form.dispatchEvent(new Event('submit', { cancelable: true }));
        }

        function paint() {
            if (!items.length) { close(); return; }
            panel.innerHTML = items.map((it, i) => `
                <button class="suggest-item ${i === active ? 'is-active' : ''}" data-idx="${i}" type="button">
                    <span class="suggest-ico">${it.type === 'hist' ? ICONS.clock : (it.type === 'hot' ? ICONS.trend : ICONS.search)}</span>
                    <span class="suggest-text">${esc(it.text)}</span>
                    ${it.type === 'hist' ? `<span class="suggest-del" data-del="${i}" title="删除这条记录">${ICONS.close}</span>` : ''}
                </button>`).join('');
            open();
        }

        function hotWords() {
            return state.mode === 'anime' ? WT.ANIME_HOT : WT.HOT_WORDS;
        }

        function showHistory() {
            const hist = SearchHistory.all();
            items = hist.map(t => ({ type: 'hist', text: t }));
            hotWords().forEach(t => { if (!items.some(x => x.text === t)) items.push({ type: 'hot', text: t }); });
            items = items.slice(0, 12);
            active = -1;
            paint();
        }

        /* 本地即时匹配：历史 + 热词 + 已加载过的片名（0 延迟） */
        function localMatches(q) {
            const low = q.toLowerCase();
            const out = [];
            const push = (text, type) => {
                if (!text || out.some(x => x.text === text)) return;
                out.push({ type, text });
            };
            SearchHistory.all().filter(t => t.toLowerCase().includes(low)).forEach(t => push(t, 'hist'));
            hotWords().filter(t => t.toLowerCase().includes(low)).forEach(t => push(t, 'hot'));
            Array.from(titleIndex)
                .filter(t => t.toLowerCase().includes(low))
                .slice(0, 6)
                .forEach(t => push(t, 'sug'));
            return out.slice(0, 12);
        }

        function paintLoading(text) {
            panel.innerHTML = `<div class="suggest-loading"><span class="spin-mini"></span>${esc(text || ('正在找「' + input.value.trim() + '」…'))}</div>`;
            open();
        }

        function paintHint(text) {
            panel.innerHTML = `<div class="suggest-loading suggest-hint">${esc(text)}</div>`;
            open();
        }

        let remoteTimer = null;
        function scheduleRemote(q, mySeq) {
            clearTimeout(remoteTimer);
            remoteTimer = setTimeout(async () => {
                const remote = await Data.suggest(q, state.sites);
                if (mySeq !== seq) return;
                remote.forEach(t => { if (!items.some(x => x.text === t)) items.push({ type: 'sug', text: t }); });
                items = items.slice(0, 12);
                if (items.length) paint(); else close();
            }, 60);
        }

        function showSuggest(q) {
            const mySeq = ++seq;
            items = localMatches(q);
            active = -1;
            if (items.length) {
                paint();
            } else if (q.length < 2) {
                paintHint('再输入一个字，汐就去源里找');
            } else {
                paintLoading();
            }
            if (q.length >= 2) scheduleRemote(q, mySeq);
        }

        input.addEventListener('focus', () => {
            const q = input.value.trim();
            if (q) showSuggest(q); else showHistory();
        });

        input.addEventListener('input', () => {
            const q = input.value.trim();
            if (!q) showHistory(); else showSuggest(q);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                if (!isOpen) {
                    e.preventDefault();
                    const q = input.value.trim();
                    if (q) showSuggest(q); else showHistory();
                    return;
                }
                e.preventDefault();
                if (!items.length) return;
                active = e.key === 'ArrowDown'
                    ? (active + 1) % items.length
                    : (active - 1 + items.length) % items.length;
                paint();
            } else if (e.key === 'Enter') {
                if (isOpen && active >= 0 && items[active]) {
                    e.preventDefault();
                    doSubmit(items[active].text);
                }
            } else if (e.key === 'Escape') {
                close();
            }
        });

        panel.addEventListener('mousedown', (e) => {
            const del = e.target.closest('[data-del]');
            const item = e.target.closest('[data-idx]');
            if (del) {
                e.preventDefault();
                const text = items[Number(del.dataset.del)] && items[Number(del.dataset.del)].text;
                if (text) { SearchHistory.remove(text); showHistory(); }
                return;
            }
            if (item) {
                e.preventDefault();
                doSubmit((items[Number(item.dataset.idx)] || {}).text);
            }
        });

        form.addEventListener('submit', () => {
            const q = input.value.trim();
            if (q) SearchHistory.add(q);
            close();
        });

        document.addEventListener('click', (e) => {
            if (!wrap.contains(e.target)) close();
        });
    }

    /* 标题规范化：用来判断「是不是同一部片」 */
    function normTitle(s) {
        return String(s || '')
            .replace(/（[^）]*）|\([^)]*\)|【[^】]*】|\[[^\]]*\]/g, '')
            .replace(/第[一二三四五六七八九十百零\d]+[季部篇]/g, '')
            .replace(/[\s·・\-—_.,，。:：;；!！?？'"“”‘’、|/\\]/g, '')
            .replace(/(国语版|粤语版|中字版|高清版|蓝光版|完整版|未删减版|无删减|HD|TC|BD|杜比|官方版)/gi, '')
            .toLowerCase();
    }
    window.WT.normTitle = normTitle;

    /* ---------- 卡片点击（事件委托） ---------- */
    const cardIndex = new Map();
    /* 已见过的片名，用来做零延迟本地联想 */
    const titleIndex = new Set();

    function registerCards(items) {
        items.forEach((item, i) => {
            const key = (item.site || 'x') + '::' + item.id + '::' + i;
            item.key = key;
            cardIndex.set(key, item);
            const n = String(item.name || '').trim();
            if (n && n.length <= 40) titleIndex.add(n);
        });
    }

    document.addEventListener('click', (e) => {
        /* 卡片上的收藏星标：先拦掉，别打开详情 */
        const favEl = e.target.closest('[data-fav]');
        if (favEl) {
            e.preventDefault();
            e.stopPropagation();
            const item = {
                id: favEl.getAttribute('data-fav'),
                site: favEl.getAttribute('data-fav-site'),
                name: favEl.getAttribute('data-fav-name'),
                pic: favEl.getAttribute('data-fav-pic')
            };
            const added = Favorites.toggle(item);
            favEl.classList.toggle('is-on', added);
            favEl.setAttribute('title', added ? '取消收藏' : '收藏');
            toast(added ? '已收藏，在「片单 → 我的收藏」里' : '已取消收藏');
            return;
        }

        const btn = e.target.closest('[data-open]');
        if (btn) {
            const key = btn.getAttribute('data-open');
            const item = cardIndex.get(key);
            if (item) openDetail(item);
        }
    });

    /* ---------- 详情 / 源合并 ---------- */
    function normName(name) {
        return String(name || '').replace(/[\s·・:：\-—_()（）\[\]【】]/g, '').toLowerCase();
    }

    function mergeByTitle(items) {
        const map = new Map();
        items.forEach(item => {
            const key = normName(item.name);
            if (!map.has(key)) {
                map.set(key, Object.assign({}, item, { sources: [item] }));
            } else {
                const exist = map.get(key);
                exist.sources.push(item);
                if (!exist.pic && item.pic) exist.pic = item.pic;
                if (!exist.year && item.year) exist.year = item.year;
                if (!exist.score && item.score) exist.score = item.score;
            }
        });
        return Array.from(map.values());
    }

    /* 同一部片在一个源里只留一条（避免「暴风资源」出现两次） */
    function dedupeBySite(list) {
        const out = [];
        (list || []).forEach(s => {
            if (!s) return;
            if (!out.some(x => x.site === s.site)) out.push(s);
        });
        return out;
    }

    async function openDetail(item) {
        if (!item) return;

        /* 豆瓣卡片只有标题/海报，没有片源 id —— 先按标题搜一次 */
        if (item.douban || !item.site) {
            const q = item.name || '';
            if (!q) return;
            toast('正在找「' + q + '」…');
            try {
                const list = await Data.search(q, state.sites);
                const merged = mergeByTitle(list || []);
                if (!merged.length) {
                    toast('片源里没搜到「' + q + '」，换个名字试试', 'error');
                    Router.go('#/search?q=' + encodeURIComponent(q));
                    return;
                }
                const want = normTitle(q);
                const exact = merged.find(m => normTitle(m.name) === want);
                if (exact) return openDetail(exact);
                /* 没有精确匹配就跳到搜索页，让用户自己挑，绝不乱开一部 */
                Router.go('#/search?q=' + encodeURIComponent(q));
                return;
            } catch (e) {
                toast('搜索超时了，去搜索页再试一次', 'error');
                Router.go('#/search?q=' + encodeURIComponent(q));
                return;
            }
        }

        const sheet = $('#sheet');
        const layer = $('#sheetLayer');
        layer.hidden = false;
        document.body.classList.add('no-scroll');
        sheet.innerHTML = `<div class="detail">${skeletonGrid(3)}</div>`;

        const sources = dedupeBySite(item.sources && item.sources.length ? item.sources.slice() : [item]);
        let activeSource = sources[0];
        const detailCache = new Map();
        let currentDetail = null;

        function renderDetail(data) {
            currentDetail = data;
            const eps = data.episodes || [];
            sheet.innerHTML = `
            <button class="sheet-close" data-close-sheet aria-label="关闭">${ICONS.close}</button>
            <div class="detail">
                <div class="detail-top">
                    <div class="detail-poster"><img src="${pic(data.pic)}" alt="${esc(data.name)}" onerror="WT.imgFallback(this)"></div>
                    <div class="detail-head">
                        <h2>${esc(data.name)}</h2>
                        <div class="detail-meta">
                            ${data.score && Number(data.score) > 0 ? `<span class="tag pink">★ ${esc(Number(data.score).toFixed(1))}</span>` : ''}
                            ${data.year ? `<span class="tag">${esc(data.year)}</span>` : ''}
                            ${data.type ? `<span class="tag">${esc(data.type)}</span>` : ''}
                            ${data.area ? `<span class="tag">${esc(data.area)}</span>` : ''}
                            ${data.note ? `<span class="tag pink">${esc(data.note)}</span>` : ''}
                        </div>
                        ${data.desc ? `<p class="detail-desc">${esc(data.desc)}</p>` : `<p class="detail-desc">这个片源没有给简介，鲸鱼娘只能抱着小鲸鱼发呆了……</p>`}
                        ${data.actor ? `<p class="detail-desc" style="margin-top:8px;max-height:3.4em">主演：${esc(data.actor).slice(0, 120)}</p>` : ''}
                        <div class="detail-actions">
                            <button class="btn btn-primary" data-play-ep="0" ${eps.length ? '' : 'disabled'}>
                                ${ICONS.play} ${eps.length ? '播放第一集' : '暂无片源'}
                            </button>
                            <button class="btn fav-toggle ${Favorites.has(data.id, data.site) ? 'is-on' : ''}" id="detailFav">
                                <span class="fav-ico">${Favorites.has(data.id, data.site) ? ICONS.starFill : ICONS.star}</span>
                                <span class="fav-text">${Favorites.has(data.id, data.site) ? '已收藏' : '收藏'}</span>
                            </button>
                            <button class="btn btn-ghost" data-swap-source>${ICONS.swap} 换源（${sources.length}）</button>
                        </div>
                    </div>
                </div>

                ${sources.length > 1 ? `<div class="source-tabs">
                    ${sources.map((s, i) => `<button class="source-tab ${s === activeSource ? 'is-active' : ''}" data-src="${i}">
                        ${esc(s.siteName || U.siteLabel(s.site))}${s.note ? `<span class="count">${esc(String(s.note).slice(0, 6))}</span>` : ''}
                    </button>`).join('')}
                </div>` : ''}

                <div class="ep-block">
                    <div class="ep-head">
                        <h3>选集</h3>
                        <span class="hint">共 ${eps.length} 集 · 来源：${esc(data.siteName || '')}</span>
                    </div>
                    <div class="ep-list">
                        ${eps.length ? eps.map((ep, i) => `<button class="ep" data-play-ep="${i}" title="${esc(ep.name)}">${esc(ep.name)}</button>`).join('')
                    : `<div class="hint" style="grid-column:1/-1;text-align:center;padding:18px 0;color:var(--ink-3)">这个源没有可用播放地址，换一个源试试～</div>`}
                    </div>
                </div>
            </div>`;

            sheet.querySelectorAll('[data-play-ep]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = Number(btn.getAttribute('data-play-ep'));
                    const ep = eps[idx];
                    if (!ep) return;
                    closeSheet();
                    playEpisode(data, eps, idx, sources);
                });
            });

            sheet.querySelectorAll('[data-src]').forEach(btn => {
                btn.addEventListener('click', () => {
                    switchTo(Number(btn.getAttribute('data-src')));
                });
            });

            const swap = sheet.querySelector('[data-swap-source]');
            if (swap) {
                swap.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openDetailSources();
                });
            }

            const favBtn = sheet.querySelector('#detailFav');
            if (favBtn) {
                favBtn.addEventListener('click', () => {
                    const added = Favorites.toggle({
                        id: data.id || activeSource.id,
                        site: data.site || activeSource.site,
                        siteName: data.siteName || activeSource.siteName,
                        name: data.name,
                        pic: data.pic,
                        year: data.year,
                        type: data.type,
                        note: data.note,
                        score: data.score
                    });
                    favBtn.classList.toggle('is-on', added);
                    const ico = favBtn.querySelector('.fav-ico');
                    const txt = favBtn.querySelector('.fav-text');
                    if (ico) ico.innerHTML = added ? ICONS.starFill : ICONS.star;
                    if (txt) txt.textContent = added ? '已收藏' : '收藏';
                    toast(added ? '已收藏到「片单 → 我的收藏」' : '已取消收藏');
                });
            }
        }

        async function switchTo(i) {
            if (!sources[i]) return;
            const target = sources[i];
            /* 防串片：名字对不上就不切 */
            if (target.name && currentDetail && normTitle(target.name) !== normTitle(currentDetail.name)) {
                toast('这个源不是同一部片子，已跳过');
                return;
            }
            activeSource = target;
            const cached = detailCache.get(activeSource.site + activeSource.id);
            if (cached) { renderDetail(cached); return; }
            toast('正在换到 ' + (activeSource.siteName || U.siteLabel(activeSource.site)) + ' …');
            try {
                const d = await Data.detail(activeSource);
                detailCache.set(activeSource.site + activeSource.id, d);
                renderDetail(d);
            } catch (err) {
                toast('这个源打不开，换别的试试', 'error');
            }
        }

        /* 详情页换源：列源 + 每源延迟 + 重测 */
        async function openDetailSources() {
            const old = document.querySelector('.source-menu');
            if (old) { old.remove(); return; }

            let list = sources.slice();

            if (list.length <= 1) {
                toast('正在搜这部还有哪些源…');
                try {
                    const found = await Data.search(item.name, state.sites);
                    const merged = mergeByTitle(found || []);
                    const want = normTitle(item.name);
                    /* 只认标题规范化后完全相同的条目；绝不兜底到别的片子 */
                    const hits = merged.filter(m => normTitle(m.name) === want && m.sources && m.sources.length);
                    hits.forEach(m => {
                        m.sources.forEach(s => {
                            if (!list.some(x => x.site === s.site)) list.push(s);
                        });
                    });
                    if (list.length > 1) {
                        sources.length = 0;
                        list.forEach(s => sources.push(s));
                        if (currentDetail) renderDetail(currentDetail);
                    }
                } catch (e) { /* noop */ }
            }

            if (list.length <= 1) {
                toast('这部确实只有一个源，鲸～');
                return;
            }

            const scrim = el('div', { class: 'source-scrim' });
            const menu = el('div', { class: 'source-menu in-sheet' });
            menu.innerHTML = `
                <div class="source-menu-head">
                    <span>换源（${list.length}）</span>
                    <button class="sm-recheck" type="button" data-recheck>${ICONS.refresh}<span>重测</span></button>
                </div>
                <div class="source-menu-list">
                    ${list.map(s => `
                        <button class="source-menu-item ${s === activeSource ? 'is-current' : ''}" data-site="${esc(s.site)}" data-id="${esc(s.id)}">
                            <span class="sm-left">
                                <span class="sm-name">${esc(s.siteName || U.siteLabel(s.site))}</span>
                                <span class="sm-meta">${esc([s.year, s.note].filter(Boolean).join(' · '))}</span>
                            </span>
                            <span class="sm-speed testing">测速中</span>
                        </button>`).join('')}
                </div>`;

            document.body.appendChild(scrim);
            document.body.appendChild(menu);

            const closeMenu = () => { menu.remove(); scrim.remove(); };
            scrim.addEventListener('click', closeMenu);

            let run = 0;
            function probeAll(force) {
                const myRun = ++run;
                let done = 0;
                list.forEach(s => {
                    Data.probeSpeed(s, !!force).then(rec => {
                        if (myRun !== run) return;
                        const n = menu.querySelector(`[data-site="${s.site}"][data-id="${s.id}"] .sm-speed`);
                        if (n) {
                            n.textContent = Data.speedText(rec);
                            n.className = 'sm-speed ' + Data.speedClass(rec.ms);
                        }
                        done++;
                        const lbl = menu.querySelector('[data-recheck] span');
                        if (lbl) lbl.textContent = done < list.length ? `测速 ${done}/${list.length}` : '重测';
                    });
                });
            }

            const recheck = menu.querySelector('[data-recheck]');
            if (recheck) recheck.addEventListener('click', (e) => { e.stopPropagation(); probeAll(true); });

            menu.querySelectorAll('[data-site]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const site = btn.dataset.site;
                    const id = btn.dataset.id;
                    const idx = sources.findIndex(x => x.site === site && String(x.id) === String(id));
                    closeMenu();
                    if (idx >= 0) switchTo(idx);
                });
            });

            /* 校验每个源是否真的有这部片（没播放地址 / 不是同一部 → 直接从列表里去掉） */
            const headLabel = menu.querySelector('.source-menu-head > span');
            const wantTitle = normTitle(currentDetail ? currentDetail.name : item.name);
            let validCount = list.length;
            const dropItem = (s) => {
                const node = menu.querySelector(`[data-site="${s.site}"][data-id="${s.id}"]`);
                if (!node) return;
                node.remove();
                validCount--;
                if (headLabel) headLabel.textContent = `换源（${validCount}）`;
            };
            list.forEach(s => {
                Data.detail(s).then(d => {
                    const good = (d.episodes || []).length > 0 && normTitle(d.name) === wantTitle;
                    if (!good) dropItem(s);
                }).catch(() => dropItem(s));
            });

            probeAll(false);
        }

        try {
            const data = await Data.detail(activeSource);
            detailCache.set(activeSource.site + activeSource.id, data);
            renderDetail(data);
            History.add({
                id: activeSource.id,
                site: activeSource.site,
                siteName: activeSource.siteName || U.siteLabel(activeSource.site),
                name: data.name,
                pic: data.pic,
                note: data.note,
                total: (data.episodes || []).length,
                epIndex: -1,
                epName: '',
                time: Date.now(),
                progress: 0
            });

            /* 只有一个源时后台补齐，让「换源（N）」的数字是真实的 */
            if (sources.length <= 1) {
                Data.search(item.name, state.sites).then(found => {
                    const merged = mergeByTitle(found || []);
                    const want = normTitle(item.name);
                    const hits = merged.filter(m => normTitle(m.name) === want && m.sources && m.sources.length);
                    if (!hits.length) return;
                    let added = false;
                    hits.forEach(m => m.sources.forEach(s => {
                        if (!sources.some(x => x.site === s.site)) { sources.push(s); added = true; }
                    }));
                    if (added && sources.length > 1 && currentDetail) renderDetail(currentDetail);
                }).catch(() => { });
            }
        } catch (err) {
            sheet.innerHTML = `<button class="sheet-close" data-close-sheet aria-label="关闭">${ICONS.close}</button>
                <div class="detail">${emptyState('这部片子的海域断线了', '详情接口没有响应，回搜索页换个片源再试一次吧。')}
                <div style="text-align:center;margin-top:14px"><button class="btn" data-close-sheet>关闭</button></div></div>`;
        }
    }

    function closeSheet() {
        $('#sheetLayer').hidden = true;
        document.body.classList.remove('no-scroll');
        $('#sheet').innerHTML = '';
    }

    document.addEventListener('click', (e) => {
        if (e.target.closest('[data-close-sheet]') || e.target.closest('[data-close="sheet"]')) {
            closeSheet();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!$('#playerLayer').hidden) { WT.player.close(); return; }
            if (!$('#sheetLayer').hidden) closeSheet();
        }
        if (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) {
            const input = $('#heroSearch') || $('#searchPageInput');
            if (input) { e.preventDefault(); input.focus(); }
        }
    });

    /* ---------- 播放 ---------- */
    function playEpisode(data, eps, index, sources) {
        if (!WT.player) { toast('播放器还在加载，请稍候再点', 'error'); return; }
        WT.player.open({
            title: data.name,
            siteName: data.siteName,
            poster: data.pic,
            episodes: eps,
            index,
            sources: sources || data.sources || [],
            onEpisodeChange: (i, ep) => {
                History.add({
                    id: data.id || '',
                    site: data.site || '',
                    siteName: data.siteName || '',
                    name: data.name,
                    pic: data.pic,
                    total: eps.length,
                    epIndex: i,
                    epName: ep ? ep.name : '',
                    time: Date.now(),
                    progress: 0
                });
            }
        });
    }

    /* ---------- 发现页 ---------- */
    function heroBlock() {
        const info = Mode.info(state.mode);
        const isAnime = state.mode === 'anime';
        const hotWords = isAnime ? WT.ANIME_HOT : WT.HOT_WORDS;
        const chips = hotWords.slice(0, 6).map(w =>
            `<button class="chip" data-hot="${esc(w)}">${esc(w)}</button>`).join('');
        const eyebrow = isAnime ? 'WHALE TIDE · 动漫番剧' : 'WHALE TIDE · 免费影视';
        const lead = isAnime
            ? '14 个片源一起下水找番，番剧、剧场版、OVA 都能捞到。不用注册，点开就看。'
            : '14 个片源一起下水，搜一次就有结果。不用注册，不用会员，点开就看。';
        return `
        <section class="hero">
            <div class="hero-copy">
                <span class="hero-eyebrow">${eyebrow}</span>
                <h1>${esc(info.h1)}<br><span class="grad">${esc(info.h1b)}</span></h1>
                <p class="lead">${esc(lead)}</p>
                <form class="search-hero" id="heroForm">
                    <span class="s-ico">${ICONS.search}</span>
                    <input id="heroSearch" type="search" placeholder="${isAnime ? '输入番名，鲸～' : '输入片名，鲸～'}" autocomplete="off" aria-label="搜索">
                    <button class="go" type="submit">搜 索</button>
                </form>
                <div class="chips">
                    <span class="chip-label">${esc(info.hot)}</span>
                    ${chips}
                </div>
            </div>
            <div class="hero-art">
                <img data-art src="assets/img/${state.style === 'chibi' ? 'chibi' : 'girl'}.png" alt="鲸鱼娘 汐">
                <div class="hero-bubble" id="heroBubble">${esc(state.bubble || U.pickLine())}</div>
            </div>
        </section>`;
    }

    function doubanSection() {
        const isAnime = state.mode === 'anime';
        const tags = (isAnime ? WT.ANIME_DOUBAN_TAGS : (WT.DOUBAN_TAGS[state.douban.type] || [])).slice(0, 10);
        const title = isAnime ? '汐替你挑的番' : '汐替你挑的';
        const sub = isAnime ? '豆瓣动画' : ('豆瓣热门 · ' + (state.douban.type === 'movie' ? '电影' : '剧集'));
        return `
        <section class="section">
            <div class="section-head">
                <h2>${title}</h2>
                <span class="sub">${esc(sub)}</span>
                <span class="spacer"></span>
                <div class="head-actions">
                    ${isAnime ? '' : `<button class="chip ghost" data-douban-type="${state.douban.type === 'movie' ? 'tv' : 'movie'}">
                        ${state.douban.type === 'movie' ? '看剧集' : '看电影'}
                    </button>`}
                    <button class="chip ghost" data-douban-refresh>${ICONS.refresh}换一批</button>
                </div>
            </div>
            <div class="chips" style="margin:0 0 14px">
                ${tags.map(t => `<button class="chip ${t === state.douban.tag ? 'is-active' : ''}" data-douban-tag="${esc(t)}">${esc(t)}</button>`).join('')}
            </div>
            <div id="doubanGrid">${skeletonGrid(12)}</div>
        </section>`;
    }

    function historyRail() {
        const list = History.all().slice(0, 10);
        if (!list.length) return '';
        return `
        <section class="section">
            <div class="section-head">
                <h2>继续看</h2>
                <span class="sub">上次看到哪儿了</span>
                <span class="spacer"></span>
                <a class="chip ghost" href="#/history">查看全部</a>
            </div>
            <div class="rail">
                ${list.map((h, i) => `
                <button class="card" style="animation-delay:${i * 20}ms" data-resume="${esc(h.site)}::${esc(h.id)}">
                    <div class="card-poster">
                        <img src="${pic(h.pic)}" alt="${esc(h.name)}" loading="lazy" onerror="WT.imgFallback(this)">
                        <div class="card-info">
                            <h3>${esc(h.name)}</h3>
                            <div class="meta"><span>${esc(h.epName || (h.epIndex >= 0 ? '第 ' + (h.epIndex + 1) + ' 集' : '未开始'))}</span></div>
                        </div>
                    </div>
                </button>`).join('')}
            </div>
        </section>`;
    }

    async function loadDouban() {
        const grid = $('#doubanGrid');
        if (!grid) return;
        state.douban.loading = true;
        grid.innerHTML = skeletonGrid(12);
        try {
            const items = await Data.douban(state.douban.type, state.douban.tag, state.douban.start, 24);
            if (!items.length) {
                grid.innerHTML = emptyState('豆瓣这片海域今天很安静', '换个标签或者点「换一批」看看。');
                return;
            }
            items.forEach((it, i) => { it.key = 'douban::' + i; cardIndex.set(it.key, it); });
            grid.innerHTML = `<div class="grid">${items.map((it, i) => card(Object.assign({}, it, {
                site: 'douban', siteName: '豆瓣', year: it.eps ? '' : ''
            }), i).replace(/data-open="[^"]*"/, `data-open="${esc(it.key)}"`)).join('')}</div>`;
        } catch (e) {
            grid.innerHTML = emptyState('豆瓣热门没捞上来', '接口暂时不通，直接在上面搜片名更快。');
        } finally {
            state.douban.loading = false;
        }
    }

    async function renderDiscover(query, view) {
        const animeBlock = state.mode === 'anime' ? `
        <section class="section">
            <div class="section-head">
                <h2>本季番剧</h2>
                <span class="sub">直接按源里的「日韩动漫」分类拉，更新中的新番</span>
                <span class="spacer"></span>
                <button class="chip ghost" data-anime-refresh>${ICONS.refresh}换一批</button>
            </div>
            <div id="animeGrid">${skeletonGrid(12)}</div>
        </section>` : '';

        view.innerHTML = heroBlock() + historyRail() + animeBlock + doubanSection() + `
        <section class="section">
            <div class="section-head"><h2>片源状态</h2><span class="sub">共 ${Object.keys(WT.SITES).length} 个采集站，当前启用 ${state.sites.length} 个</span></div>
            <div class="stat-grid">
                <div class="stat"><b>${state.sites.length}</b><span>启用片源</span></div>
                <div class="stat"><b>${WT.CONFIG.searchTimeout / 1000}s</b><span>单源超时</span></div>
                <div class="stat"><b>${History.all().length}</b><span>我的片单</span></div>
                <div class="stat"><b>${Favorites.all().length}</b><span>我的收藏</span></div>
            </div>
        </section>`;

        /* hero 交互 */
        const form = $('#heroForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const q = $('#heroSearch').value.trim();
            if (!q) { toast('先告诉汐想看什么呀'); return; }
            Router.go('#/search?q=' + encodeURIComponent(q));
        });
        attachSearchSuggest($('#heroSearch'));
        $$('[data-hot]').forEach(b => b.addEventListener('click', () => {
            Router.go('#/search?q=' + encodeURIComponent(b.dataset.hot));
        }));

        const bubble = $('#heroBubble');
        if (bubble) {
            bubble.addEventListener('click', () => {
                state.bubble = U.pickLine(bubble.textContent);
                bubble.textContent = state.bubble;
                bubble.style.animation = 'none';
                void bubble.offsetWidth;
                bubble.style.animation = 'bubbleIn .5s cubic-bezier(.22,1,.36,1) both';
            });
        }

        /* 豆瓣交互 */
        $$('[data-douban-tag]').forEach(b => b.addEventListener('click', () => {
            state.douban.tag = b.dataset.doubanTag;
            state.douban.start = 0;
            $$('[data-douban-tag]').forEach(x => x.classList.toggle('is-active', x === b));
            loadDouban();
        }));
        const typeBtn = $('[data-douban-type]');
        if (typeBtn) typeBtn.addEventListener('click', () => {
            state.douban.type = state.douban.type === 'movie' ? 'tv' : 'movie';
            Store.set('wt_douban_type', state.douban.type);
            state.douban.tag = '热门';
            state.douban.start = 0;
            renderDiscover(query, view);
        });
        const refresh = $('[data-douban-refresh]');
        if (refresh) refresh.addEventListener('click', () => {
            state.douban.start = (state.douban.start + 24) % 96;
            loadDouban();
        });

        /* 继续看 */
        $$('[data-resume]').forEach(b => b.addEventListener('click', () => {
            const [site, id] = b.dataset.resume.split('::');
            openDetail({ id, site, siteName: U.siteLabel(site), name: '', pic: '' });
        }));

        loadDouban();

        /* 动漫模式：按分类拉本季番剧 */
        if (state.mode === 'anime') {
            let page = 1;
            const grid = $('#animeGrid');
            const loadAnime = async () => {
                if (!grid) return;
                grid.innerHTML = skeletonGrid(12);
                try {
                    const list = await Data.animeList(state.sites, page);
                    if (!list.length) {
                        grid.innerHTML = emptyState('没拉到番剧列表', '这些源可能没有「日韩动漫 / 日本动漫」分类，去设置里多勾几个源试试。');
                        return;
                    }
                    registerCards(list);
                    grid.innerHTML = `<div class="grid">${list.map((it, i) => card(it, i)).join('')}</div>`;
                } catch (e) {
                    grid.innerHTML = emptyState('番剧列表没拉上来', '接口超时了，点「换一批」再试一次。');
                }
            };
            const refresh = $('[data-anime-refresh]');
            if (refresh) refresh.addEventListener('click', () => {
                page = page >= 5 ? 1 : page + 1;
                loadAnime();
            });
            loadAnime();
        }
    }

    /* ---------- 搜索页 ---------- */
    let searchSeq = 0;

    async function renderSearch(query, view) {
        const q = (query.q || '').trim();
        const hist = SearchHistory.all();
        const fallbackWords = (state.mode === 'anime' ? WT.ANIME_HOT : WT.HOT_WORDS).slice(0, 5);
        const chipsHtml = hist.length
            ? `<span class="chip-label">最近搜索</span>` + hist.slice(0, 8).map(t => `<button class="chip" data-hist="${esc(t)}">${esc(t)}</button>`).join('')
            : `<span class="chip-label">试试</span>` + fallbackWords.map(w => `<button class="chip" data-hot2="${esc(w)}">${esc(w)}</button>`).join('');

        view.innerHTML = `
        <section class="section" style="margin-top:22px">
            <form class="search-hero" id="pageForm">
                <span class="s-ico">${ICONS.search}</span>
                <input id="searchPageInput" type="search" placeholder="${state.mode === 'anime' ? '输入番名，鲸～' : '输入片名，鲸～'}" value="${esc(q)}" autocomplete="off" aria-label="搜索">
                <button class="go" type="submit">搜 索</button>
            </form>
            <div class="chips">
                ${chipsHtml}
            </div>
        </section>
        <section class="section" id="searchResultSection">
            ${q ? skeletonGrid(12) : emptyState('汐在等你说一个' + (state.mode === 'anime' ? '番名' : '片名'), '上面输入名字，源会一起下水找；输入时会给你联想词。')}
        </section>`;

        attachSearchSuggest($('#searchPageInput'));

        $('#pageForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const val = $('#searchPageInput').value.trim();
            if (!val) return;
            SearchHistory.add(val);
            Router.go('#/search?q=' + encodeURIComponent(val));
        });
        $$('[data-hot2]').forEach(b => b.addEventListener('click', () => {
            Router.go('#/search?q=' + encodeURIComponent(b.dataset.hot2));
        }));
        $$('[data-hist]').forEach(b => b.addEventListener('click', () => {
            Router.go('#/search?q=' + encodeURIComponent(b.dataset.hist));
        }));
        if (!q) return;
        SearchHistory.add(q);

        const seq = ++searchSeq;
        const section = $('#searchResultSection');
        const isAnime = state.mode === 'anime';
        try {
            let raw = await Data.search(q, state.sites);
            if (seq !== searchSeq) return;
            if (isAnime) {
                const hits = raw.filter(x => WT.ANIME_RE.test(String(x.type || '')) || WT.ANIME_RE.test(String(x.name || '')));
                if (hits.length) raw = hits;
            }
            state.search.raw = raw;
            const merged = mergeByTitle(raw);
            if (!merged.length) {
                section.innerHTML = emptyState(
                    isAnime ? '这部番没捞到' : '这片海域没有捞到东西',
                    isAnime
                        ? '换个番名试试（日文名/中文名都可以），或者到设置里多开几个片源。'
                        : '换个名字、去掉季数或者少打两个字再试，也可以到设置里多开几个片源。');
                return;
            }
            const bySite = {};
            raw.forEach(x => { bySite[x.site] = (bySite[x.site] || 0) + 1; });
            section.innerHTML = `
            <div class="section-head">
                <h2>「${esc(q)}」的搜索结果</h2>
                <span class="sub">${merged.length} 部作品 · ${raw.length} 条资源</span>
            </div>
            <div class="chips" style="margin:0 0 16px">
                <button class="chip is-active">全部</button>
                ${Object.keys(bySite).map(k => `<span class="chip ghost">${esc(U.siteLabel(k))} ${bySite[k]}</span>`).join('')}
            </div>
            <div class="grid" id="searchGrid"></div>`;
            const grid = $('#searchGrid');
            registerCards(merged);
            grid.innerHTML = merged.map((item, i) => card(item, i)).join('');
        } catch (err) {
            section.innerHTML = emptyState('搜索接口没回应', '可能是网络抖动，或者片源都超时了，再搜一次试试。');
        }
    }

    /* ---------- 片单（观看记录 + 我的收藏） ---------- */
    function renderHistory(query, view) {
        const tab = query.tab === 'fav' ? 'fav' : 'history';
        const hist = History.all();
        const favs = Favorites.all();

        hist.forEach((h, i) => {
            const key = 'hist::' + h.site + '::' + h.id;
            h.key = key;
            cardIndex.set(key, h);
        });

        const histHtml = hist.length ? `<div class="hist-list">${hist.map((h, i) => `
            <div class="hist" data-resume2="${esc(h.site)}::${esc(h.id)}" style="animation:rise .4s ${i * 18}ms both">
                <div class="hist-poster"><img src="${pic(h.pic)}" alt="" loading="lazy" onerror="WT.imgFallback(this)"></div>
                <div class="hist-body">
                    <h4>${esc(h.name || '未知片名')}</h4>
                    <p>${esc(h.siteName || U.siteLabel(h.site))} · ${esc(h.epName || (h.epIndex >= 0 ? '第 ' + (h.epIndex + 1) + ' 集' : '未开始'))} · ${esc(U.fmtDate(h.time))}</p>
                    ${h.total > 0 ? `<div class="hist-bar"><span style="width:${Math.max(4, Math.round(((h.epIndex + 1) / h.total) * 100))}%"></span></div>` : ''}
                </div>
                <button class="hist-del" data-del="${esc(h.site)}::${esc(h.id)}" aria-label="删除">${ICONS.trash}</button>
            </div>`).join('')}</div>`
            : emptyState('还没有观看记录', '看过的片子会自动出现在这里，方便下次接着看。');

        const favHtml = favs.length
            ? (() => {
                const list = favs.map((f, i) => Object.assign({}, f, { key: 'fav::' + f.site + '::' + f.id + '::' + i }));
                list.forEach(it => cardIndex.set(it.key, it));
                return `<div class="grid">${list.map((it, i) => card(it, i)).join('')}</div>`;
            })()
            : emptyState('收藏夹还是空的', '在卡片右上角或详情页点星标，就能把片子收进这里。');

        view.innerHTML = `
        <section class="section" style="margin-top:26px">
            <div class="section-head">
                <h2>我的</h2>
                <span class="sub">${hist.length} 条观看记录 · ${favs.length} 个收藏</span>
                <span class="spacer"></span>
                ${tab === 'history'
                ? (hist.length ? '<button class="chip ghost" id="clearHistory">清空记录</button>' : '')
                : (favs.length ? '<button class="chip ghost" id="clearFavs">清空收藏</button>' : '')}
            </div>
            <div class="tab-row">
                <button class="chip ${tab === 'history' ? 'is-active' : ''}" data-pl-tab="history">${ICONS.bookmark} 观看记录 · ${hist.length}</button>
                <button class="chip ${tab === 'fav' ? 'is-active' : ''}" data-pl-tab="fav">${ICONS.starFill} 我的收藏 · ${favs.length}</button>
            </div>
            <div id="plBody">${tab === 'history' ? histHtml : favHtml}</div>
        </section>`;

        $$('[data-pl-tab]').forEach(b => b.addEventListener('click', () => {
            const target = b.dataset.plTab;
            if (target === tab) return;
            Router.go(target === 'fav' ? '#/history?tab=fav' : '#/history');
        }));

        /* 历史：继续看 / 删除 */
        $$('[data-resume2]').forEach(node => node.addEventListener('click', (e) => {
            if (e.target.closest('[data-del]')) return;
            const [site, id] = node.dataset.resume2.split('::');
            openDetail({ id, site, siteName: U.siteLabel(site) });
        }));
        $$('[data-del]').forEach(btn => btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const [site, id] = btn.dataset.del.split('::');
            History.remove(id, site);
            renderHistory(query, view);
        }));

        const clearHist = $('#clearHistory');
        if (clearHist) clearHist.addEventListener('click', () => {
            History.clear();
            renderHistory(query, view);
            toast('观看记录已清空');
        });
        const clearFavs = $('#clearFavs');
        if (clearFavs) clearFavs.addEventListener('click', () => {
            Favorites.clear();
            renderHistory(query, view);
            toast('收藏已清空');
        });
    }

    /* ---------- 设置 ---------- */
    function renderSettings(query, view) {
        view.innerHTML = `
        <section class="section" style="margin-top:26px">
            <div class="section-head"><h2>设置</h2><span class="sub">调好了就能更顺手</span></div>

            <div class="panel">
                <h3>内容模式</h3>
                <p class="panel-hint">影视和动漫各有一套片源、观看记录和收藏，互不干扰；顶栏那个按钮也能一键切。</p>
                <div class="chips" style="margin:0">
                    <button class="chip ${state.mode === 'video' ? 'is-active' : ''}" data-set-mode="video">${ICONS.film} 影视</button>
                    <button class="chip ${state.mode === 'anime' ? 'is-active' : ''}" data-set-mode="anime">${ICONS.sparkle} 动漫</button>
                </div>
            </div>

            <div class="panel">
                <h3>启用片源${state.mode === 'anime' ? '（动漫）' : ''}</h3>
                <p class="panel-hint">勾选越多搜得越全，但也会慢一点。汐推荐留 5 个快的。</p>
                <div class="src-grid" id="srcGrid">
                    ${Object.keys(WT.SITES).map(k => `
                        <label class="src-item">
                            <input type="checkbox" value="${esc(k)}" ${state.sites.includes(k) ? 'checked' : ''}>
                            <span class="box">${ICONS.check}</span>
                            <span>${esc(WT.SITES[k].name)}</span>
                        </label>`).join('')}
                </div>
                <div class="row-actions" style="margin-top:12px">
                    <button class="chip" id="pickFast">选推荐的 5 个</button>
                    <button class="chip ghost" id="pickAll">全选</button>
                    <button class="chip ghost" id="pickNone">全不选</button>
                </div>
            </div>

            <div class="panel">
                <h3>鲸鱼娘形象</h3>
                <p class="panel-hint">首页大立绘和这里同步切换。</p>
                <div class="chips" style="margin-top:0">
                    <button class="chip ${state.style === 'mature' ? 'is-active' : ''}" data-set-style="mature">原版立绘</button>
                    <button class="chip ${state.style === 'chibi' ? 'is-active' : ''}" data-set-style="chibi">Q 版</button>
                </div>
            </div>

            <div class="panel">
                <h3>背景主题</h3>
                <p class="panel-hint">五套海底光线，点一下就换；文字、卡片、浮层都会自动适配。</p>
                <div class="bg-grid">
                    ${BG_THEMES.map(t => `
                        <button class="bg-item ${state.bg === t.key ? 'is-active' : ''}" data-bg-key="${t.key}" title="${esc(t.name)}">
                            <span class="bg-swatch" style="background:${t.swatch}"></span>
                            <span class="bg-name">${esc(t.name)}</span>
                        </button>`).join('')}
                </div>
            </div>

            <div class="panel" id="dataPanel">
                <h3>数据迁移</h3>
                <p class="panel-hint">片源选择、形象、片单都只存在这台设备的浏览器里。换设备就导出成 json 再导入。</p>
                <div class="row-actions">
                    <button class="btn btn-primary" id="importCfg">导入配置</button>
                    <button class="btn btn-ghost" id="exportCfg">导出配置</button>
                    <button class="btn btn-ghost" id="clearAll" style="color:var(--pink)">清空全部数据</button>
                </div>
                <label class="drop-zone" id="dropZone" for="cfgFile">
                    <span class="drop-ico">${ICONS.upload || ''}</span>
                    <span class="drop-title">把 whaletide-config.json 拖到这里</span>
                    <span class="drop-sub">或点「导入配置」选择文件 · 导入会覆盖当前的片源选择与片单</span>
                </label>
                <input type="file" id="cfgFile" accept="application/json,.json" hidden>
            </div>

            <div class="panel">
                <h3>关于</h3>
                <p class="panel-hint">鲸汐 WhaleTide v${esc(CFG.version)}</p>
                <div class="stat-grid">
                    <div class="stat"><b>${Object.keys(WT.SITES).length}</b><span>内置片源</span></div>
                    <div class="stat"><b>${CFG.searchTimeout / 1000}s</b><span>单源超时</span></div>
                    <div class="stat"><b>${History.all().length}</b><span>观看记录</span></div>
                    <div class="stat"><b>${Favorites.all().length}</b><span>我的收藏</span></div>
                </div>
            </div>
        </section>`;

        const grid = $('#srcGrid');
        grid.addEventListener('change', () => {
            const picked = $$('input:checked', grid).map(i => i.value);
            state.sites = picked;
            Store.set(sitesKey(state.mode), picked);
        });
        $('#pickFast').addEventListener('click', () => {
            state.sites = (state.mode === 'anime' ? WT.ANIME_DEFAULT_SITES : CFG.defaultSites).slice();
            Store.set(sitesKey(state.mode), state.sites);
            renderSettings(query, view);
        });
        $('#pickAll').addEventListener('click', () => {
            state.sites = Object.keys(WT.SITES);
            Store.set(sitesKey(state.mode), state.sites);
            renderSettings(query, view);
        });
        $('#pickNone').addEventListener('click', () => {
            state.sites = [];
            Store.set(sitesKey(state.mode), []);
            renderSettings(query, view);
            toast('至少留一个吧，鲸鱼娘会哭的', 'error');
        });

        $$('[data-set-mode]').forEach(b => b.addEventListener('click', () => {
            if (b.dataset.setMode === state.mode) return;
            setMode(b.dataset.setMode);
            toast('已切到' + (b.dataset.setMode === 'anime' ? '动漫' : '影视') + '模式');
        }));
        $$('[data-set-style]').forEach(b => b.addEventListener('click', () => {
            setStyle(b.dataset.setStyle);
            renderSettings(query, view);
        }));

        $$('[data-bg-key]').forEach(b => b.addEventListener('click', () => {
            const key = b.dataset.bgKey;
            setBg(key);
            const item = BG_THEMES.find(t => t.key === key);
            toast('背景已换成「' + (item ? item.name : key) + '」');
        }));
        $('#exportCfg').addEventListener('click', () => {
            const data = {
                app: 'WhaleTide',
                version: CFG.version,
                exportedAt: new Date().toISOString(),
                style: state.style,
                bg: state.bg,
                mode: state.mode,
                video: {
                    sites: loadSites('video'),
                    history: History.all('video'),
                    favorites: Favorites.all('video')
                },
                anime: {
                    sites: loadSites('anime'),
                    history: History.all('anime'),
                    favorites: Favorites.all('anime')
                }
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            const stamp = new Date().toISOString().slice(0, 10);
            a.download = 'whaletide-config-' + stamp + '.json';
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 3000);
            toast('已导出，文件在浏览器的「下载」里');
        });

        /* ---------- 导入配置 ---------- */
        function cleanHistory(list) {
            if (!Array.isArray(list)) return [];
            return list
                .filter(h => h && h.id && h.site && WT.SITES[h.site])
                .map(h => ({
                    id: String(h.id),
                    site: String(h.site),
                    siteName: h.siteName ? String(h.siteName) : U.siteLabel(h.site),
                    name: h.name ? String(h.name) : '',
                    pic: h.pic ? String(h.pic) : '',
                    total: Number(h.total) || 0,
                    epIndex: Number.isFinite(Number(h.epIndex)) ? Number(h.epIndex) : -1,
                    epName: h.epName ? String(h.epName) : '',
                    time: Number(h.time) || Date.now(),
                    progress: Number(h.progress) || 0
                }))
                .slice(0, CFG.historyLimit);
        }

        async function applyConfig(text, fileName) {
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                toast('导入失败：这不是有效的 JSON 文件', 'error');
                return;
            }
            if (!data || typeof data !== 'object' || Array.isArray(data)) {
                toast('导入失败：文件结构不对', 'error');
                return;
            }
            if (data.app && data.app !== 'WhaleTide') {
                toast('导入失败：这不是鲸汐导出的配置文件', 'error');
                return;
            }

            const applied = [];

            if (data.style === 'mature' || data.style === 'chibi') {
                setStyle(data.style);
                applied.push('形象=' + (data.style === 'chibi' ? 'Q 版' : '原版'));
            }

            if (data.bg && BG_THEMES.some(t => t.key === data.bg)) {
                setBg(data.bg);
                const bgItem = BG_THEMES.find(t => t.key === data.bg);
                applied.push('背景=' + (bgItem ? bgItem.name : data.bg));
            }

            if (data.mode === 'anime' || data.mode === 'video') {
                if (data.mode !== state.mode) setMode(data.mode);
                applied.push('模式=' + (data.mode === 'anime' ? '动漫' : '影视'));
            }

            /* 新格式：video / anime 两个分块；旧格式：顶层 sites/history/favorites 归到当前模式 */
            const blocks = {};
            if (data.video && typeof data.video === 'object') blocks.video = data.video;
            if (data.anime && typeof data.anime === 'object') blocks.anime = data.anime;
            if (!Object.keys(blocks).length) {
                blocks[state.mode] = {
                    sites: data.sites,
                    history: data.history,
                    favorites: data.favorites
                };
            }

            const label = m => (m === 'anime' ? '动漫' : '影视');

            Object.keys(blocks).forEach(mode => {
                const block = blocks[mode] || {};

                if (Array.isArray(block.sites)) {
                    const valid = block.sites.filter(k => WT.SITES[k]);
                    if (valid.length) {
                        Store.set(sitesKey(mode), valid);
                        if (mode === state.mode) state.sites = valid;
                        applied.push(label(mode) + '源 ' + valid.length);
                    }
                }

                if (Array.isArray(block.history)) {
                    const clean = cleanHistory(block.history);
                    if (clean.length) {
                        Store.set(History.key(mode), clean);
                        applied.push(label(mode) + '记录 ' + clean.length);
                    }
                }

                if (Array.isArray(block.favorites)) {
                    const cleanFavs = block.favorites
                        .filter(f => f && f.id && f.site && WT.SITES[f.site])
                        .map(f => ({
                            id: String(f.id),
                            site: String(f.site),
                            siteName: f.siteName ? String(f.siteName) : U.siteLabel(f.site),
                            name: f.name ? String(f.name) : '',
                            pic: f.pic ? String(f.pic) : '',
                            year: f.year ? String(f.year) : '',
                            type: f.type ? String(f.type) : '',
                            note: f.note ? String(f.note) : '',
                            score: f.score ? String(f.score) : '',
                            addedAt: Number(f.addedAt) || Date.now()
                        }))
                        .slice(0, 200);
                    if (cleanFavs.length) {
                        Store.set(Favorites.key(mode), cleanFavs);
                        applied.push(label(mode) + '收藏 ' + cleanFavs.length);
                    }
                }
            });

            if (!applied.length) {
                toast('导入失败：文件里没有可用的片源/片单/形象设置', 'error');
                return;
            }

            toast('导入成功：' + applied.join('、'));
            renderSettings(query, view);
        }

        function readAndImport(file) {
            if (!file) return;
            const maxSize = 4 * 1024 * 1024;
            if (file.size > maxSize) {
                toast('文件太大了，配置一般只有几十 KB', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = () => applyConfig(String(reader.result || ''), file.name);
            reader.onerror = () => toast('读取文件失败，再试一次', 'error');
            reader.readAsText(file, 'utf-8');
        }

        $('#importCfg').addEventListener('click', () => $('#cfgFile').click());
        $('#cfgFile').addEventListener('change', (e) => {
            readAndImport(e.target.files && e.target.files[0]);
            e.target.value = '';
        });

        const dz = $('#dropZone');
        if (dz) {
            ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, (e) => {
                e.preventDefault();
                dz.classList.add('is-over');
            }));
            ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, (e) => {
                e.preventDefault();
                dz.classList.remove('is-over');
            }));
            dz.addEventListener('drop', (e) => {
                const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
                readAndImport(file);
            });
        }
        $('#clearAll').addEventListener('click', () => {
            ['video', 'anime'].forEach(m => {
                Store.del('wt_history_' + m);
                Store.del('wt_favs_' + m);
                Store.del(m === 'anime' ? 'wt_sites_anime' : 'wt_sites');
            });
            Store.del('wt_style');
            Store.del('wt_bg');
            Store.del('wt_douban_type');
            state.sites = loadSites(state.mode);
            setBg('deep');
            toast('数据清空，汐把鱼缸洗干净了');
            renderSettings(query, view);
        });
    }

    /* ---------- 密码门 ---------- */
    function showGate(mode) {
        const gate = $('#gate');
        const layer = $('#gateLayer');
        layer.hidden = false;
        if (mode === 'nopass') {
            gate.innerHTML = `
                <img src="assets/img/chibi.png" alt="">
                <h2>还没设访问密码</h2>
                <p>请在 Cloudflare Pages 的环境变量里加上 <b>PASSWORD</b>，再刷新这个页面。</p>`;
            return;
        }
        gate.innerHTML = `
            <img src="assets/img/chibi.png" alt="">
            <h2>报上暗号</h2>
            <p>鲸鱼娘守着呢，说对了才放你进深海～</p>
            <form id="gateForm">
                <input id="gateInput" type="password" placeholder="访问密码" autocomplete="current-password">
                <button class="btn btn-primary" type="submit" style="justify-content:center">进 入</button>
                <div class="err" id="gateErr"></div>
            </form>`;
        $('#gateForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const val = $('#gateInput').value;
            const ok = await Auth.verify(val);
            if (ok) {
                layer.hidden = true;
                boot();
            } else {
                $('#gateErr').textContent = '暗号不对，再想想～';
                $('#gateInput').value = '';
                $('#gateInput').focus();
            }
        });
        setTimeout(() => $('#gateInput') && $('#gateInput').focus(), 200);
    }

    /* ---------- 启动 ---------- */
    /* ---------- 设置抽屉 ---------- */
    function openSettings() {
        const layer = $('#settingsLayer');
        const body = $('#settingsBody');
        if (!layer || !body) return;
        renderSettings({}, body);
        layer.hidden = false;
        document.body.classList.add('no-scroll');
    }

    function closeSettings() {
        const layer = $('#settingsLayer');
        if (!layer) return;
        layer.hidden = true;
        document.body.classList.remove('no-scroll');
    }

    function bindChrome() {
        /* 顶栏滚动状态 */
        const topbar = $('#topbar');
        const progress = $('#scrollProgress');
        const onScroll = () => {
            const y = window.scrollY || document.documentElement.scrollTop;
            topbar.classList.toggle('is-scrolled', y > 6);
            const max = document.documentElement.scrollHeight - window.innerHeight;
            progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        /* 形象切换按钮 */
        $$('[data-style-btn]').forEach(b => b.addEventListener('click', () => {
            setStyle(b.dataset.styleBtn);
        }));
        $('#settingsBtn').innerHTML = ICONS.cog;
        $('#settingsBtn').addEventListener('click', openSettings);
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-close-settings]')) closeSettings();
        });

        /* 移动端 tab 图标 */
        $$('[data-ico]').forEach(node => {
            const key = node.dataset.ico;
            if (ICONS[key]) node.innerHTML = ICONS[key];
        });

        setStyle(state.style, false);
        setBg(state.bg, false);
        updateModeUI();
        const modeBtn = $('#modeSwitch');
        if (modeBtn) modeBtn.addEventListener('click', toggleMode);
    }

    function registerRoutes() {
        Router.on('/', renderDiscover);
        Router.on('/search', renderSearch);
        Router.on('/history', renderHistory);
        Router.on('/settings', (query, view) => {
        /* 老链接 #/settings 也走抽屉：先回首页再打开 */
        if (Router.current && Router.current.name === 'settings') Router.go('#/');
        openSettings();
    });
    }

    let booted = false;
    function boot() {
        if (booted) { Router.render(); return; }
        booted = true;
        registerRoutes();
        Router.start();
    }

    function init() {
        bindChrome();
        if (Auth.disabled()) { boot(); return; }
        if (!Auth.ready()) { showGate('nopass'); return; }
        if (!Auth.verified()) { showGate('pass'); return; }
        boot();
    }

    /* 播放层关闭时的资源清理由 player.js 负责，这里只暴露入口 */
    window.WT.app = { openDetail, closeSheet, setStyle, state, mergeByTitle };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
