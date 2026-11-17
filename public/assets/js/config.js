/* 鲸汐 WhaleTide · 配置
   源站列表 / 超时 / 默认值都在这里改 */

window.WT = window.WT || {};

WT.CONFIG = {
    proxy: '/proxy/',
    searchTimeout: 4500,     // 单个源超时（毫秒），越小出结果越快
    doubanTimeout: 6000,
    maxPages: 50,
    defaultSites: ['ffzy', 'hongniu', 'huya', 'guangsu', 'bfzy', 'jisu', 'xigua'],
    historyLimit: 60,
    imageFallback: 'assets/img/chibi.png',
    version: '2.0.0'
};

/* 片源：均为标准苹果 CMS V10 采集接口 */
WT.SITES = {
    ruyi: { name: '如意资源', api: 'https://cj.rycjapi.com/api.php/provide/vod' },
    bfzy: { name: '暴风资源', api: 'https://bfzyapi.com/api.php/provide/vod' },
    ffzy: { name: '非凡影视', api: 'http://ffzy5.tv/api.php/provide/vod' },
    tyyszy: { name: '天涯资源', api: 'https://tyyszy.com/api.php/provide/vod' },
    jisu: { name: '极速资源', api: 'https://jszyapi.com/api.php/provide/vod' },
    mozhua: { name: '魔爪资源', api: 'https://mozhuazy.com/api.php/provide/vod' },
    wolong: { name: '卧龙资源', api: 'https://wolongzyw.com/api.php/provide/vod' },
    hwba: { name: '华为吧资源', api: 'https://cjhwba.com/api.php/provide/vod' },
    zuid: { name: '最大资源', api: 'https://api.zuidapi.com/api.php/provide/vod' },
    xiaomaomi: { name: '小猫咪资源', api: 'https://zy.xiaomaomi.cc/api.php/provide/vod' },
    heimuer: { name: '黑木耳', api: 'https://json.heimuer.xyz/api.php/provide/vod' },
    dyttzy: { name: '电影天堂', api: 'http://caiji.dyttzyapi.com/api.php/provide/vod' },
    dbzy: { name: '豆瓣资源', api: 'https://dbzy.com/api.php/provide/vod' },
    wwzy: { name: '旺旺短剧', api: 'https://wwzy.tv/api.php/provide/vod' },

    /* ---- 2026-11 实测可用的新源（都有「日韩动漫 / 日本动漫」分类） ---- */
    liangzi: { name: '量子资源', api: 'https://cj.lziapi.com/api.php/provide/vod' },
    guangsu: { name: '光速资源', api: 'https://api.guangsuapi.com/api.php/provide/vod' },
    hongniu: { name: '红牛资源', api: 'https://www.hongniuzy2.com/api.php/provide/vod' },
    huya: { name: '虎牙资源', api: 'https://www.huyaapi.com/api.php/provide/vod' },
    xigua: { name: '西瓜资源', api: 'https://caiji.xgzyapi.com/api.php/provide/vod' },
    subo: { name: '速播资源', api: 'https://subocaiji.com/api.php/provide/vod' },
    modu: { name: '魔都资源', api: 'https://www.mdzyapi.com/api.php/provide/vod' },
    jinying: { name: '金鹰资源', api: 'https://jyzyapi.com/api.php/provide/vod' },
    yingju: { name: '影剧资源', api: 'https://caiji.maotaizy.cc/api.php/provide/vod' }
};

/* 首页热搜词 */
WT.HOT_WORDS = ['三体', '流浪地球', '庆余年', '进击的巨人', '蜡笔小新', '奥特曼', '周星驰', '沙丘'];

/* ---------- 双模式：影视 / 动漫 ---------- */
WT.MODE_INFO = {
    video: { key: 'video', name: '影视', label: '电影 · 剧集 · 综艺', h1: '今晚看什么，', h1b: '交给汐来捞。', hot: '汐的私藏' },
    anime: { key: 'anime', name: '动漫', label: '番剧 · 剧场版 · OVA', h1: '今晚看哪部番，', h1b: '汐替你去捞。', hot: '汐的番单' }
};

/* 动画/番剧分类关键词（用于动漫模式过滤结果） */
WT.ANIME_RE = /动漫|动画|番剧|日漫|国漫|新番|剧场版|OVA|OAD|TV版|TV动画|里番|動畫|动漫电影/i;

/* 动漫模式热搜 */
WT.ANIME_HOT = ['进击的巨人', '鬼灭之刃', '咒术回战', '海贼王', '火影忍者', '间谍过家家', '葬送的芙莉莲', '名侦探柯南'];

/* 动漫模式默认启用的片源（这几个源的「日韩动漫 / 日本动漫」分类里有真新番，实测能解析出 m3u8） */
WT.ANIME_DEFAULT_SITES = ['ffzy', 'hongniu', 'huya', 'guangsu', 'bfzy', 'jisu'];

/* 番剧分类的优先顺序（按名字匹配源的分类表） */
WT.ANIME_CLASS_PRIORITY = ['日韩动漫', '日本动漫', '番剧', '日本动画', '动漫', '动画片'];

/* 动漫模式豆瓣标签（豆瓣的动画归在 tv 类型里） */
WT.ANIME_DOUBAN_TAGS = ['日本动画', '动画', '番剧', 'OVA', '剧场版', '国产动画'];

/* 豆瓣热门标签 */
WT.DOUBAN_TAGS = {
    movie: ['热门', '最新', '豆瓣高分', '经典', '华语', '欧美', '韩国', '日本', '动作', '喜剧', '爱情', '科幻', '悬疑', '恐怖', '治愈'],
    tv: ['热门', '美剧', '英剧', '韩剧', '日剧', '国产剧', '港剧', '日本动画', '综艺', '纪录片']
};

/* 鲸鱼娘台词 */
WT.LINES = [
    '鲸～想找什么片？汐帮你捞上来！',
    '全部免费的哦，放心看～',
    '搜不到就换个名字，或者少打几个字～',
    '深海信号有点慢，等汐一小会儿呀。',
    '片中的广告不要信哦，汐可提醒过了。',
    '播放卡住？点一下换源，尾巴一摆就好啦。',
    '今天的海流很稳，适合连看好几集。',
    '看太久了记得起来喝水呀。',
    '汐的片库很大的，随便翻～',
    '找不到的话，鲸鱼娘也在努力游呢…'
];

/* 番剧专用源（预留：找到可用的日番 CMS 就加在这里，key 不要和上面重复） */
WT.ANIME_SITES = {};
WT.ALL_SITES = Object.assign({}, WT.SITES, WT.ANIME_SITES);
