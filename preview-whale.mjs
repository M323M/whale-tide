import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// 婵＄偞娼欓幉锟犳儓?WhaleTide 闂佸搫鐗滈崜娆忥耿鐎涙﹫绱ｉ柛鏇ㄥ櫘濞?// 闂佹椿娼块崝宥囨兜閸洘鏅慨姗嗗墯闊?whale-tv 闂佺儵鏅╅崰鏍礊瀹ュ绠ョ憸鎴︺€? node ..\whale-build\_whale-src\preview-whale.mjs
// 闂佽　鍋撴い鏍ㄧ☉閻︻噣鏌?mock=1 闂佺顑呭ú锕傚汲閻旂厧绠?/ ?style=chibi / ?autoopen=1 闂佺厧顨庢禍婊勬叏閳哄懎绠ラ柟鎯х－绾捐崵绱掑Δ濠傚幐缂佹梹娼欓锝夋偐閹绘帒鑰块梺?
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
        { id: 'mock-0-1', site: 'tyyszy', siteName: '婵犮垹鐏堥弲婊堝礉閵娧勫皫闁告洦鍓涢悥?, name: '婵炴垶鎸搁ˇ顔剧礊?缂備焦顨忛崗娑氱博鐎电硶鍋?, pic: poster, total: 30, epIndex: 5, epName: '缂?06 闂?, time: now - 3600000, progress: 0.2 },
        { id: 'mock-1-3', site: 'bfzy', siteName: '闂佸搫妫欓幐鎶剿夐幘鑸靛皫闁告洦鍓涢悥?, name: '闁瑰吋娼欏Λ鏃傜礊閹达妇宓?缂備焦顨忛崗娑氳姳閳哄啠鍋?, pic: poster, total: 36, epIndex: 11, epName: '缂?12 闂?, time: now - 86400000 * 2, progress: 0.3 },
        { id: 'mock-2-5', site: 'ruyi', siteName: '婵犵鈧啿鈧綊宕滈幍顔藉皫闁告洦鍓涢悥?, name: '濠电偛鏈悷銈囩箔?2', pic: poster, total: 1, epIndex: 0, epName: '濠殿喗绻愮徊鎸庢櫠?, time: now - 86400000 * 5, progress: 0.9 }
      ];
      var m = 'video';
      try { var raw = localStorage.getItem('wt_mode'); if (raw) m = JSON.parse(raw) === 'anime' ? 'anime' : 'video'; } catch (e) {}
      localStorage.setItem('wt_history_' + m, JSON.stringify(hist));
      var favs = [
        { id: 'mock-0-2', site: 'ruyi', siteName: '婵犵鈧啿鈧綊宕滈幍顔藉皫闁告洦鍓涢悥?, name: '濠电偟绻濋悞锕€顫濋鈧畷鐑藉箥椤旇棄鈧?2', pic: poster, year: '2021', type: '闂佸憡鏌ｉ崝瀣礊?, note: '闂佽棄鍟换鍌炲储?4K', score: '8.2', addedAt: now - 600000 },
        { id: 'mock-1-4', site: 'bfzy', siteName: '闂佸搫妫欓幐鎶剿夐幘鑸靛皫闁告洦鍓涢悥?, name: '闁哄鏅滅粙鎴﹀吹椤曗偓閹啴宕熼锝囥€婃繛?闂佸搫鐗冮崑鎾剁磽娴ｅ摜澧曟い?, pic: poster, year: '2023', type: '闂佸憡鏌ｉ崝搴ㄥ极?, note: '闂佸搫娲ら悺銊╁蓟婵犲洦鍤?24 闂?, score: '9.6', addedAt: now - 3600000 },
        { id: 'mock-2-0', site: 'ffzy', siteName: '闂傚倸鐗忛崑娑㈠吹閹烘洏浜归弶鍫亽濞?, name: '闂佸搫瀚崰鏍ь瀶椤栨粎鐭氶柤鎰佸灣妤?, pic: poster, year: '2019', type: '缂備礁顦伴崹鍨緞?, note: 'HD 婵°倕鍊硅摫缂?, score: '8.0', addedAt: now - 86400000 },
        { id: 'mock-3-6', site: 'tyyszy', siteName: '婵犮垹鐏堥弲婊堝礉閵娧勫皫闁告洦鍓涢悥?, name: '婵犻潧鍊堕崕鎻掞耿閺夋５褰掓倻閻ｅ苯绗?, pic: poster, year: '2020', type: '闂佸憡鎸嗛崟顐㈠', note: '闂佺缈伴崹褰掑储濞戙垺鍋?, score: '9.1', addedAt: now - 86400000 * 3 }
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
          history: [{ id: 'v1', site: 'ruyi', name: '閻熸粍濯界划楣冿綖鐎ｎ剚濯奸柡澶庢硶缁?, epIndex: 1, total: 8, time: Date.now() }],
          favorites: [{ id: 'vf1', site: 'ruyi', name: '閻熸粍濯界划楣冿綖鐎ｎ喖缁╅柟顖滃椤?, addedAt: Date.now() }]
        },
        anime: {
          sites: ['bfzy', 'wwzy', 'bogusKey'],
          history: [
            { id: 'a1', site: 'bfzy', name: '闂佷紮缍嗘禍婊勬櫠閻ｅ本濯奸柡澶庢硶缁?, epIndex: 3, total: 12, time: Date.now() },
            { id: 'bad', site: 'notExist', name: '闂佺鍐闁哄棛鍠栭獮? }
          ],
          favorites: [{ id: 'af1', site: 'bfzy', name: '闂佷紮缍嗘禍婊勬櫠娴犲缁╅柟顖滃椤?, addedAt: Date.now() }]
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
        localStorage.setItem('wt_shist_' + m, JSON.stringify(['婵°倖绻嗛崑鎰閸愨晝鈻曢悗锝庝簻閻?, '闁哄鏅滅粙鎴﹀吹椤曗偓閹啴宕熼锝囥€婃繛?, '闂佹垝绶￠崜鐔煎焵椤戣儻鍏屾繛鍫熷灴閹崇偛鈻庨幒鎴狀伇闂?, '闂佸憡绮嶇敮妤€锕㈤幎钘夌倞闁绘劖娼欓悘?]));
      }
      var input = document.getElementById('heroSearch') || document.getElementById('searchPageInput');
      if (!input) return;
      input.focus();
      input.value = '婵°倖绻嗛崑鎰?;
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

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);

  /* 闂佸搫鐗滈崜娆忥耿閺夋嚦鐔煎焺閸愩劎褰?Cloudflare 婵炲濯寸徊鍧楀箖婵犲洦鏅?proxy/<闂佺儵鏅╅崰妤呮偉椤ゆ被L> 闂佺儵鏅濋ˉ鎰崲濞戞瑦濮滄い鎺嗗亾鐟?*/
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
      html = html.replace(/<\/body>/i, autoOpen + testImport + seedData + suggestTest + playTest + detailTest + drawerTest + catTest + '</body>');
      body = Buffer.from(html, 'utf8');
    }
    res.writeHead(200, {
      'content-type': types[path.extname(file)] || 'application/octet-stream',
      'cache-control': 'no-store'
    });
    res.end(body);
  });
}).listen(port, '127.0.0.1', () => console.log('婵＄偞娼欓幉锟犳儓閸噦绱ｉ柛鏇ㄥ櫘濞兼棃鏌?http://127.0.0.1:' + port + '/?mock=1'));




