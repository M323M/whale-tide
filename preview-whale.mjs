import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// 濠碉紕鍋炲娆撳箟閿熺姵鍎?WhaleTide 闂備礁鎼悧婊堝礈濞嗗骏鑰块悗娑欙公缁憋綁鏌涢弴銊ユ珮婵?// 闂備焦妞垮鍧楀礉瀹ュ洦鍏滈柛顐ｆ礃閺咁剚鎱ㄥ鍡楀闂?whale-tv 闂備胶鍎甸弲鈺呭窗閺嶎偆绀婄€广儱顦粻銉ф喐閹达负鈧? node ..\whale-build\_whale-src\preview-whale.mjs
// 闂備浇銆€閸嬫挻銇勯弽銊р槈闁伙富鍣ｉ弻?mock=1 闂備胶顭堥鍛洪敃鍌氭辈闁绘梻鍘х粻?/ ?style=chibi / ?autoopen=1 闂備胶鍘ч〃搴㈢濠婂嫭鍙忛柍鍝勬噹缁犮儵鏌熼幆褏锛嶇痪鎹愬吹缁辨帒螖婵犲倸骞愮紓浣规⒐濞兼瑩顢氶敐澶嬪亹闁圭粯甯掗懓鍧楁⒑?
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
        { id: 'mock-0-1', site: 'tyyszy', siteName: '濠电姰鍨归悘鍫ュ疾濠婂牆绀夐柕濞у嫬鐨梺鍛婃处閸撴盯鎮?, name: '濠电偞鍨堕幐鎼佀囬鍓х?缂傚倷鐒﹂〃蹇涘礂濞戞氨鍗氶悗鐢电《閸?, pic: poster, total: 30, epIndex: 5, epName: '缂?06 闂?, time: now - 3600000, progress: 0.2 },
        { id: 'mock-1-3', site: 'bfzy', siteName: '闂備礁鎼Λ娆撳箰閹跺壙澶愬箻閼搁潧鐨梺鍛婃处閸撴盯鎮?, name: '闂佺懓鍚嬪娆徫涢弮鍌滅闁硅揪濡囧畵?缂傚倷鐒﹂〃蹇涘礂濞戞俺濮抽柍鍝勫暊閸?, pic: poster, total: 36, epIndex: 11, epName: '缂?12 闂?, time: now - 86400000 * 2, progress: 0.3 },
        { id: 'mock-2-5', site: 'ruyi', siteName: '濠电姷顣介埀顒€鍟块埀顒€缍婂畷婊堝箥椤旇棄鐨梺鍛婃处閸撴盯鎮?, name: '婵犵數鍋涢張顒勬偡閵堝洨绠?2', pic: poster, total: 1, epIndex: 0, epName: '婵犳鍠楃换鎰緤閹稿孩娅?, time: now - 86400000 * 5, progress: 0.9 }
      ];
      var m = 'video';
      try { var raw = localStorage.getItem('wt_mode'); if (raw) m = JSON.parse(raw) === 'anime' ? 'anime' : 'video'; } catch (e) {}
      localStorage.setItem('wt_history_' + m, JSON.stringify(hist));
      var favs = [
        { id: 'mock-0-2', site: 'ruyi', siteName: '濠电姷顣介埀顒€鍟块埀顒€缍婂畷婊堝箥椤旇棄鐨梺鍛婃处閸撴盯鎮?, name: '婵犵數鍋熺换婵嬫倿閿曗偓椤繈顢氶埀顒€鐣烽悜钘夌妞ゆ棁妫勯埀?2', pic: poster, year: '2021', type: '闂備礁鎲￠弻锝夊礉鐎ｎ剛绀?, note: '闂備浇妫勯崯顖滄崲閸岀偛鍌?4K', score: '8.2', addedAt: now - 600000 },
        { id: 'mock-1-4', site: 'bfzy', siteName: '闂備礁鎼Λ娆撳箰閹跺壙澶愬箻閼搁潧鐨梺鍛婃处閸撴盯鎮?, name: '闂佸搫顦弲婊呯矙閹达箑鍚规い鏇楀亾闁诡垰鍟村畷鐔碱敃閿濆洢鈧﹥绻?闂備礁鎼悧鍐磻閹惧墎纾藉ù锝呮憸婢ф洘銇?, pic: poster, year: '2023', type: '闂備礁鎲￠弻锝夊礉鎼淬劌鏋?, note: '闂備礁鎼ú銈夋偤閵娾晛钃熷┑鐘叉处閸?24 闂?, score: '9.6', addedAt: now - 3600000 },
        { id: 'mock-2-0', site: 'ffzy', siteName: '闂傚倸鍊搁悧蹇涘磻濞戙垹鍚归柟鐑樻磸娴滃綊寮堕崼顐航婵?, name: '闂備礁鎼€氼噣宕伴弽褜鐎舵い鏍ㄧ矌閻岸鏌ら幇浣哥仯濡?, pic: poster, year: '2019', type: '缂傚倷绀侀ˇ浼村垂閸偄绶?, note: 'HD 濠德板€曢崐纭呮懌缂?, score: '8.0', addedAt: now - 86400000 },
        { id: 'mock-3-6', site: 'tyyszy', siteName: '濠电姰鍨归悘鍫ュ疾濠婂牆绀夐柕濞у嫬鐨梺鍛婃处閸撴盯鎮?, name: '濠电娀娼ч崐鍫曞磿閹绘帪鑰块柡澶嬶紩瑜版帗鍊婚柣锝呰嫰缁?, pic: poster, year: '2020', type: '闂備礁鎲￠幐鍡涘礋椤愩垹顥?, note: '闂備胶顢婄紙浼村垂瑜版帒鍌ㄦ繛鎴欏灪閸?, score: '9.1', addedAt: now - 86400000 * 3 }
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
          history: [{ id: 'v1', site: 'ruyi', name: '闁荤喐绮嶆刊鐣屽垝妤ｅ喛缍栭悗锝庡墯婵ジ鏌℃径搴㈢《缂?, epIndex: 1, total: 8, time: Date.now() }],
          favorites: [{ id: 'vf1', site: 'ruyi', name: '闁荤喐绮嶆刊鐣屽垝妤ｅ喛缍栭悗锝庡枛缂佲晠鏌熼婊冾暭妞?, addedAt: Date.now() }]
        },
        anime: {
          sites: ['bfzy', 'wwzy', 'bogusKey'],
          history: [
            { id: 'a1', site: 'bfzy', name: '闂備椒绱紞鍡樼濠婂嫭娅犻柣锝呮湰婵ジ鏌℃径搴㈢《缂?, epIndex: 3, total: 12, time: Date.now() },
            { id: 'bad', site: 'notExist', name: '闂備胶顫嬮崘顏嗩唹闂佸搫妫涢崰鏍嵁? }
          ],
          favorites: [{ id: 'af1', site: 'bfzy', name: '闂備椒绱紞鍡樼濠婂嫭娅犲ù鐘差儏缂佲晠鏌熼婊冾暭妞?, addedAt: Date.now() }]
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
        localStorage.setItem('wt_shist_' + m, JSON.stringify(['濠德板€栫换鍡涘磻閹邦厼顕遍柛鎰ㄦ櫇閳绘洟鎮楅敐搴濈盎闁?, '闂佸搫顦弲婊呯矙閹达箑鍚规い鏇楀亾闁诡垰鍟村畷鐔碱敃閿濆洢鈧﹥绻?, '闂備焦鍨濈欢锟犲礈閻旂厧鐒垫い鎴ｅ劵閸忓本绻涢崼鐔风伌闁瑰磭鍋涢埢搴ㄥ箳閹寸媭浼囬梻?, '闂備礁鎲＄划宥囨暜濡も偓閿曘垽骞庨挊澶屽€為梺缁樺姈濞兼瑩鎮?]));
      }
      var input = document.getElementById('heroSearch') || document.getElementById('searchPageInput');
      if (!input) return;
      input.focus();
      input.value = '濠德板€栫换鍡涘磻閹邦厼顕?;
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

const catTest = `<script>
window.addEventListener('load', function () {
  if (!/[?&]cattest=1/.test(location.search)) return;
  setTimeout(function () {
    var chips = document.querySelectorAll('[data-cat]');
    document.title = 'CHIPS=' + chips.length;
    if (chips.length > 4) {
      chips[4].click();
      setTimeout(function () {
        var cards = document.querySelectorAll('#searchResultSection .card');
        var head = document.querySelector('#searchResultSection .section-head h2');
        document.title = 'CHIPS=' + chips.length + ' PICKED=' + (head ? head.textContent : 'none') + ' CARDS=' + cards.length;
      }, 8000);
    }
  }, 1500);
});
</script>`;

const favTest = `<script>
window.addEventListener('load', function () {
  if (!/[?&]favtest=1/.test(location.search)) return;
  var tries = 0;
  (function waitStars() {
    var stars = document.querySelectorAll('[data-fav]');
    if (stars.length < 3) {
      if (++tries > 60) { document.title = 'STARS=0 timeout'; return; }
      setTimeout(waitStars, 250);
      return;
    }
    stars[0].click();
    setTimeout(function () {
      stars[1].click();
      setTimeout(function () {
        stars[2].click();
        setTimeout(function () {
          var list = JSON.parse(localStorage.getItem('wt_favs_video') || '[]');
          document.title = 'STARS=' + stars.length + ' SAVED=' + list.length +
            ' NAMES=' + list.map(function (x) { return x.name; }).join('|');
        }, 250);
      }, 250);
    }, 250);
  })();
});
</script>`;

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);

  /* 闂備礁鎼悧婊堝礈濞嗗骏鑰块柡澶嬪殾閻旂厧鐒洪柛鎰╁妿瑜?Cloudflare 濠电偛顕刊瀵稿緤閸ф绠栧┑鐘叉处閺?proxy/<闂備胶鍎甸弲鈺呭窗濡ゅ懏鍋夋い銈嗚L> 闂備胶鍎甸弲婵嬎夐幇顔藉床婵炴垶鐟︽慨婊勩亜閹哄棗浜鹃悷?*/
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
      html = html.replace(/<\/body>/i, autoOpen + testImport + seedData + suggestTest + playTest + detailTest + drawerTest + catTest + favTest + '</body>');
      body = Buffer.from(html, 'utf8');
    }
    res.writeHead(200, {
      'content-type': types[path.extname(file)] || 'application/octet-stream',
      'cache-control': 'no-store'
    });
    res.end(body);
  });
}).listen(port, '127.0.0.1', () => console.log('濠碉紕鍋炲娆撳箟閿熺姵鍎撻柛顐ゅ櫐缁憋綁鏌涢弴銊ユ珮婵炲吋妫冮弻?http://127.0.0.1:' + port + '/?mock=1'));





