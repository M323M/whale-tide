import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// 妞村憡鐫?WhaleTide 閺堫剙婀存０鍕潔
// 閻劍纭堕敍姘躬 whale-tv 閻╊喖缍嶉幍褑顢? node ..\whale-build\_whale-src\preview-whale.mjs
// 閺€顖涘瘮閿?mock=1 閸嬪洦鏆熼幑?/ ?style=chibi / ?autoopen=1 閼奉亜濮╅幍鎾崇磻缁楊兛绔村鐘插幢閻?
const root = process.env.WT_ROOT || (process.cwd() + '/public');
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
        { id: 'mock-0-1', site: 'tyyszy', siteName: '婢垛晜鍔ㄧ挧鍕爱', name: '娑撳缍?缁楊兛绔寸€?, pic: poster, total: 30, epIndex: 5, epName: '缁?06 闂?, time: now - 3600000, progress: 0.2 },
        { id: 'mock-1-3', site: 'bfzy', siteName: '閺嗘挳顥撶挧鍕爱', name: '鎼村棔缍戦獮?缁楊兛绨╃€?, pic: poster, total: 36, epIndex: 11, epName: '缁?12 闂?, time: now - 86400000 * 2, progress: 0.3 },
        { id: 'mock-2-5', site: 'ruyi', siteName: '婵″倹鍓扮挧鍕爱', name: '濞屾瑤绗?2', pic: poster, total: 1, epIndex: 0, epName: '濮濓絿澧?, time: now - 86400000 * 5, progress: 0.9 }
      ];
      var m = 'video';
      try { var raw = localStorage.getItem('wt_mode'); if (raw) m = JSON.parse(raw) === 'anime' ? 'anime' : 'video'; } catch (e) {}
      localStorage.setItem('wt_history_' + m, JSON.stringify(hist));
      var favs = [
        { id: 'mock-0-2', site: 'ruyi', siteName: '婵″倹鍓扮挧鍕爱', name: '濞翠焦姘崷鎵倖 2', pic: poster, year: '2021', type: '閸斻劋缍?, note: '閽冩繂鍘?4K', score: '8.2', addedAt: now - 600000 },
        { id: 'mock-1-4', site: 'bfzy', siteName: '閺嗘挳顥撶挧鍕爱', name: '鏉╂稑鍤惃鍕硶娴?閺堚偓缂佸牆顒?, pic: poster, year: '2023', type: '閸斻劎鏁?, note: '閺囧瓨鏌婇懛?24 闂?, score: '9.6', addedAt: now - 3600000 },
        { id: 'mock-2-0', site: 'ffzy', siteName: '闂堢偛鍤掕ぐ杈潒', name: '閺勭喖妾粚鑳Ш', pic: poster, year: '2019', type: '缁夋垵澶?, note: 'HD 妤傛ɑ绔?, score: '8.0', addedAt: now - 86400000 },
        { id: 'mock-3-6', site: 'tyyszy', siteName: '婢垛晜鍔ㄧ挧鍕爱', name: '婵傘儲婀板ù鐑界帛', pic: poster, year: '2020', type: '閸撗勫剰', note: '閹躲垹鍘涢悧?, score: '9.1', addedAt: now - 86400000 * 3 }
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
          history: [{ id: 'v1', site: 'ruyi', name: '瑜拌精顫嬬拋鏉跨秿', epIndex: 1, total: 8, time: Date.now() }],
          favorites: [{ id: 'vf1', site: 'ruyi', name: '瑜拌精顫嬮弨鎯版', addedAt: Date.now() }]
        },
        anime: {
          sites: ['bfzy', 'wwzy', 'bogusKey'],
          history: [
            { id: 'a1', site: 'bfzy', name: '閻ｎ亜澧界拋鏉跨秿', epIndex: 3, total: 12, time: Date.now() },
            { id: 'bad', site: 'notExist', name: '閸у繑鏆熼幑? }
          ],
          favorites: [{ id: 'af1', site: 'bfzy', name: '閻ｎ亜澧介弨鎯版', addedAt: Date.now() }]
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
        localStorage.setItem('wt_shist_' + m, JSON.stringify(['妤濊偐浼冩稊瀣瀴', '鏉╂稑鍤惃鍕硶娴?, '閽侇剟鈧胶娈戦懞娆掑竴閼?, '閸滄帗婀抽崶鐐村灛']));
      }
      var input = document.getElementById('heroSearch') || document.getElementById('searchPageInput');
      if (!input) return;
      input.focus();
      input.value = '妤濊偐浼?;
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

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);

  /* 閺堫剙婀村Ο鈩冨珯 Cloudflare 娴狅絿鎮婇敍?proxy/<閻╊喗鐖RL> 閻╃绻涙潪顒€褰?*/
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

  if (p === '/') p = '/index.html';
  const file = path.join(root, p);
  if (!file.startsWith(root)) { res.writeHead(403).end('forbidden'); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('404 ' + p); return; }
    let body = buf;
    if (file.endsWith('.html')) {
      let html = buf.toString('utf8').replaceAll('{{PASSWORD}}', HASH);
      html = html.replace(/<head>/i, '<head>' + boot);
      html = html.replace(/<\/body>/i, autoOpen + testImport + seedData + suggestTest + playTest + detailTest + '</body>');
      body = Buffer.from(html, 'utf8');
    }
    res.writeHead(200, {
      'content-type': types[path.extname(file)] || 'application/octet-stream',
      'cache-control': 'no-store'
    });
    res.end(body);
  });
}).listen(port, '127.0.0.1', () => console.log('妞村憡鐫堟０鍕潔閿?http://127.0.0.1:' + port + '/?mock=1'));


