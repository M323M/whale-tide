import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// 濡炴潙鎲￠惈?WhaleTide 闁哄牜鍓欏﹢瀛橈紣閸曨噮娼?// 闁活潿鍔嶇涵鍫曟晬濮橆剚韬?whale-tv 闁烩晩鍠栫紞宥夊箥瑜戦、? node ..\whale-build\_whale-src\preview-whale.mjs
// 闁衡偓椤栨稑鐦柨?mock=1 闁稿娲﹂弳鐔煎箲?/ ?style=chibi / ?autoopen=1 闁煎浜滄慨鈺呭箥閹惧磭纾荤紒妤婂厸缁旀潙顕ｉ悩鎻掑耿闁?
const root = path.resolve(process.env.WT_ROOT || (process.cwd() + '/public'));
const port = Number(process.env.PORT || 8231);
const HASH = crypto.createHash('sha256').update('whale').digest('hex');

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

const boot = `<script>
(function(){
  try {
    localStorage.setItem('wt_gate', JSON.stringify({ok:true, hash:'${HASH}', at: Date.now()}));
    var m = String(location.search||'').match(/style=(mature|chibi)/);
    if (m) localStorage.setItem('wt_style', '"'+m[1]+'"');
    var b = String(location.search||'').match(/bg=(deep|aurora|dawn|lagoon|paper|sakura|candy|neon|retro)/);
    if (b) localStorage.setItem('wt_bg', '"'+b[1]+'"');
    var md = String(location.search||'').match(/mode=(video|anime)/);
    if (md) localStorage.setItem('wt_mode', '"'+md[1]+'"');
  } catch(e){}
  if (/[?&]debug=1/.test(location.search)) {
    window.addEventListener('error', function (e) {
      document.title = 'ERR ' + (e.message || '?') + ' @ ' + String(e.filename || '').split('/').pop() + ':' + e.lineno;
    });
    window.addEventListener('unhandledrejection', function (e) {
      document.title = 'REJ ' + ((e.reason && e.reason.message) || e.reason);
    });
  }
})();
</script>`;

const autoOpen = `<script>
window.addEventListener('load', function(){
  if (!/[?&]autoopen=1/.test(location.search)) return;
  setTimeout(function(){
    var c = document.querySelector('.card[data-open]');
    if (c) c.click();
  }, 1200);
});
</script>`;

const seedData = `<script>
window.addEventListener('load', function () {
  if (!/[?&]seed=1/.test(location.search)) return;
  try { if (sessionStorage.getItem('wt_seeded') === '1') return; } catch (e) {}
  try { sessionStorage.setItem('wt_seeded', '1'); } catch (e) {}
  setTimeout(function () {
    try {
      var img = document.querySelector('.card img');
      var poster = img ? img.getAttribute('src') : '';
      var now = Date.now();
      var hist = [
        { id: 'mock-0-1', site: 'tyyszy', siteName: '濠㈠灈鏅滈崝銊ф導閸曨剛鐖?, name: '濞戞挸顦紞?缂佹鍏涚粩瀵糕偓?, pic: poster, total: 30, epIndex: 5, epName: '缂?06 闂?, time: now - 3600000, progress: 0.2 },
        { id: 'mock-1-3', site: 'bfzy', siteName: '闁哄棙鎸抽ˉ鎾舵導閸曨剛鐖?, name: '閹兼潙妫旂紞鎴︾嵁?缂佹鍏涚花鈺冣偓?, pic: poster, total: 36, epIndex: 11, epName: '缂?12 闂?, time: now - 86400000 * 2, progress: 0.3 },
        { id: 'mock-2-5', site: 'ruyi', siteName: '濠碘€冲€归崜鎵導閸曨剛鐖?, name: '婵炲本鐟ょ粭?2', pic: poster, total: 1, epIndex: 0, epName: '婵繐绲挎晶?, time: now - 86400000 * 5, progress: 0.9 }
      ];
      var m = 'video';
      try { var raw = localStorage.getItem('wt_mode'); if (raw) m = JSON.parse(raw) === 'anime' ? 'anime' : 'video'; } catch (e) {}
      localStorage.setItem('wt_history_' + m, JSON.stringify(hist));
      var favs = [
        { id: 'mock-0-2', site: 'ruyi', siteName: '濠碘€冲€归崜鎵導閸曨剛鐖?, name: '婵炵繝鐒﹀顕€宕烽幍顔藉€?2', pic: poster, year: '2021', type: '闁告柣鍔嬬紞?, note: '闁藉啯绻傞崢?4K', score: '8.2', addedAt: now - 600000 },
        { id: 'mock-1-4', site: 'bfzy', siteName: '闁哄棙鎸抽ˉ鎾舵導閸曨剛鐖?, name: '閺夆晜绋戦崵顕€鎯冮崟顐ｇ《濞?闁哄牃鍋撶紓浣哥墕椤?, pic: poster, year: '2023', type: '闁告柣鍔庨弫?, note: '闁哄洤鐡ㄩ弻濠囨嚊?24 闂?, score: '9.6', addedAt: now - 3600000 },
        { id: 'mock-2-0', site: 'ffzy', siteName: '闂傚牏鍋涢崵鎺曘亹鏉堫偒娼?, name: '闁哄嫮鍠栧顖滅矚閼愁垳楔', pic: poster, year: '2019', type: '缂佸鍨垫径?, note: 'HD 濡ゅ倹蓱缁?, score: '8.0', addedAt: now - 86400000 },
        { id: 'mock-3-6', site: 'tyyszy', siteName: '濠㈠灈鏅滈崝銊ф導閸曨剛鐖?, name: '濠靛倶鍎插﹢鏉棵归悜鐣屽笡', pic: poster, year: '2020', type: '闁告挆鍕壈', note: '闁硅翰鍨归崢娑㈡偋?, score: '9.1', addedAt: now - 86400000 * 3 }
      ];
      localStorage.setItem('wt_favs_' + m, JSON.stringify(favs));
      setTimeout(function () { location.reload(); }, 500);
    } catch (e) { document.title = 'SEED ERR ' + e.message; }
  }, 1500);
});
</script>`;
const testImport = `<script>
window.addEventListener('load', function () {
  if (!/[?&]testimport=1/.test(location.search)) return;
  setTimeout(function () {
    try {
      var cfg = {
        app: 'WhaleTide', version: '2.1.0', exportedAt: new Date().toISOString(),
        style: 'chibi', bg: 'neon', mode: 'anime',
        video: {
          sites: ['ruyi', 'dbzy'],
          history: [{ id: 'v1', site: 'ruyi', name: '鐟滄媽绮鹃～瀣媼閺夎法绉?, epIndex: 1, total: 8, time: Date.now() }],
          favorites: [{ id: 'vf1', site: 'ruyi', name: '鐟滄媽绮鹃～瀣绩閹増顥?, addedAt: Date.now() }]
        },
        anime: {
          sites: ['bfzy', 'wwzy', 'bogusKey'],
          history: [
            { id: 'a1', site: 'bfzy', name: '闁伙綆浜滄晶鐣屾媼閺夎法绉?, epIndex: 3, total: 12, time: Date.now() },
            { id: 'bad', site: 'notExist', name: '闁秆冪箲閺嗙喖骞? }
          ],
          favorites: [{ id: 'af1', site: 'bfzy', name: '闁伙綆浜滄晶浠嬪绩閹増顥?, addedAt: Date.now() }]
        }
      };
      var file = new File([JSON.stringify(cfg)], 'test.json', { type: 'application/json' });
      var dt = new DataTransfer();
      dt.items.add(file);
      var input = document.getElementById('cfgFile');
      input.files = dt.files;
      input.dispatchEvent(new Event('change'));
      setTimeout(function () {
        var h = [];
        try { h = JSON.parse(localStorage.getItem('wt_history') || '[]'); } catch (e) {}
        document.title = 'IMP mode=' + localStorage.getItem('wt_mode') +
          ' style=' + localStorage.getItem('wt_style') +
          ' bg=' + localStorage.getItem('wt_bg') +
          ' vSites=' + localStorage.getItem('wt_sites') +
          ' aSites=' + localStorage.getItem('wt_sites_anime') +
          ' vHist=' + (JSON.parse(localStorage.getItem('wt_history_video') || '[]').length) +
          ' aHist=' + (JSON.parse(localStorage.getItem('wt_history_anime') || '[]').length) +
          ' vFav=' + (JSON.parse(localStorage.getItem('wt_favs_video') || '[]').length) +
          ' aFav=' + (JSON.parse(localStorage.getItem('wt_favs_anime') || '[]').length);
      }, 900);
    } catch (e) {
      document.title = 'IMP ERR ' + e.message;
    }
  }, 1200);
});
</script>`;

const suggestTest = `<script>
window.addEventListener('load', function () {
  if (!/[?&]suggesttest=1/.test(location.search)) return;
  setTimeout(function () {
    try {
      var hist = localStorage.getItem('wt_shist_anime') || localStorage.getItem('wt_shist_video');
      var m = (localStorage.getItem('wt_mode') || 'video').replace(/"/g, '');
      if (!hist) {
        localStorage.setItem('wt_shist_' + m, JSON.stringify(['濡ゆ繆鍋愭导鍐╃▕鐎ｎ亜鐎?, '閺夆晜绋戦崵顕€鎯冮崟顐ｇ《濞?, '闁戒緡鍓熼埀顑胯兌濞堟垿鎳炲▎鎺戠闁?, '闁告粍甯楀﹢鎶藉炊閻愭潙鐏?]));
      }
      var input = document.getElementById('heroSearch') || document.getElementById('searchPageInput');
      if (!input) return;
      input.focus();
      input.value = '濡ゆ繆鍋愭导?;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } catch (e) { document.title = 'SUG ERR ' + e.message; }
  }, 1500);
});
</script>`;

const playTest = `<script>
window.addEventListener('load', function () {
  if (!/[?&]playtest=1/.test(location.search)) return;
  setTimeout(function () {
    var c = document.querySelector('.card[data-open]');
    if (c) c.click();
    setTimeout(function () {
      var p = document.querySelector('[data-play-ep="0"]');
      if (p) p.click();
      setTimeout(function () {
        var sb = document.getElementById('cinemaSource');
        if (sb) sb.click();
      }, 3500);
    }, 2600);
  }, 1600);
});
</script>`;

const detailTest = `<script>
window.addEventListener('load', function () {
  if (!/[?&]detailtest=1/.test(location.search)) return;
  setTimeout(function () {
    var c = document.querySelector('.card[data-open]');
    if (c) c.click();
    setTimeout(function () {
      var btn = document.querySelector('[data-swap-source]');
      document.title = 'BTN=' + (btn ? btn.textContent.trim() : 'none');
      if (btn) btn.click();
      setTimeout(function () {
        var m = document.querySelectorAll('.source-menu').length;
        var s = document.querySelectorAll('.source-scrim').length;
        document.title = 'MENU=' + m + ' SCRIM=' + s + ' BTN=' + (btn ? btn.textContent.trim() : 'none');
      }, 1200);
    }, 8000);
  }, 1200);
});
</script>`;

const drawerTest = `<script>
window.addEventListener('load', function () {
  if (!/[?&]drawertest=1/.test(location.search)) return;
  setTimeout(function () {
    var btn = document.getElementById('settingsBtn');
    document.title = 'BTN=' + (btn ? 'yes' : 'no');
    if (btn) btn.click();
    setTimeout(function () {
      var layer = document.getElementById('settingsLayer');
      var body = document.getElementById('settingsBody');
      document.title = 'LAYER=' + (layer ? (layer.hidden ? 'hidden' : 'shown') : 'none') +
        ' BODY=' + (body ? body.innerHTML.length : 0);
    }, 800);
  }, 1500);
});
</script>`;

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);

  /* 闁哄牜鍓欏﹢鏉懳熼埄鍐ㄧ彲 Cloudflare 濞寸媴绲块幃濠囨晬?proxy/<闁烩晩鍠楅悥顤汻L> 闁烩晝顥愮换娑欐姜椤掆偓瑜?*/
  /* local proxy: /proxy/<encoded target>, rewrites m3u8 segment urls */
  if (p.startsWith('/proxy/')) {
    let target;
    try { target = decodeURIComponent(p.slice(7)); } catch (e) { res.writeHead(400).end('bad target'); return; }
    if (!/^https?:\/\//i.test(target)) { res.writeHead(400).end('bad target'); return; }

    const upHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Referer': new URL(target).origin + '/'
    };
    if (req.headers.range) upHeaders['Range'] = req.headers.range;

    fetch(target, { headers: upHeaders }).then(async (up) => {
      const ct = up.headers.get('content-type') || '';
      const looksM3u8 = /mpegurl|x-mpegurl|audio\/mpegurl/i.test(ct) || /\.m3u8(\?|$)/i.test(target);

      if (looksM3u8) {
        const text = await up.text();
        const base = new URL(target);
        const dir = base.origin + base.pathname.replace(/\/[^/]*$/, '/');
        const rewritten = text.split(/\r?\n/).map((line) => {
          const t = line.trim();
          if (!t) return line;
          if (t.startsWith('#')) {
            return t.replace(/URI="([^"]+)"/g, (m, uri) => {
              const abs = /^https?:\/\//i.test(uri) ? uri : new URL(uri, dir).toString();
              return 'URI="/proxy/' + encodeURIComponent(abs) + '"';
            });
          }
          const abs = /^https?:\/\//i.test(t) ? t : new URL(t, dir).toString();
          return '/proxy/' + encodeURIComponent(abs);
        }).join('\n');

        res.writeHead(200, {
          'content-type': 'application/vnd.apple.mpegurl',
          'access-control-allow-origin': '*',
          'cache-control': 'no-store'
        });
        res.end(rewritten);
        return;
      }

      const buf = Buffer.from(await up.arrayBuffer());
      const out = {
        'content-type': ct || 'application/octet-stream',
        'access-control-allow-origin': '*',
        'cache-control': 'no-store'
      };
      for (const k of ['content-range', 'accept-ranges', 'content-length']) {
        const v = up.headers.get(k);
        if (v) out[k] = v;
      }
      res.writeHead(up.status, out);
      res.end(buf);
    }).catch(err => {
      res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' }).end('proxy error: ' + err.message);
    });
    return;
  }

  if (p === '/') p = '/app.html';
  const file = path.join(root, p);
  if (!file.startsWith(root)) { res.writeHead(403).end('forbidden'); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('404 ' + p); return; }
    let body = buf;
    if (file.endsWith('.html')) {
      let html = buf.toString('utf8').replaceAll('{{PASSWORD}}', HASH);
      html = html.replace(/<head>/i, '<head>' + boot);
      html = html.replace(/<\/body>/i, autoOpen + testImport + seedData + suggestTest + playTest + detailTest + drawerTest + '</body>');
      body = Buffer.from(html, 'utf8');
    }
    res.writeHead(200, {
      'content-type': types[path.extname(file)] || 'application/octet-stream',
      'cache-control': 'no-store'
    });
    res.end(body);
  });
}).listen(port, '127.0.0.1', () => console.log('濡炴潙鎲￠惈鍫燂紣閸曨噮娼旈柨?http://127.0.0.1:' + port + '/?mock=1'));



