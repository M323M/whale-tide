# 部署到腾讯云 EdgeOne Pages（长期免费 + 国内节点）

> 为什么选它：静态加速流量与请求数**不限量**、免费版长期保留、节点在腾讯边缘网络（亚太 2500+ 节点），
> 而且支持 `edge-functions/` 目录跑边缘函数——我们的 m3u8 代理可以直接搬过去。

## 一、入口

| 用途 | 地址 |
|---|---|
| 控制台 | https://console.cloud.tencent.com/edgeone/pages |
| 文档 | https://edgeone.cloud.tencent.com/pages/document/162936635171454976 |
| 直接上传说明 | https://edgeone.ai/document/173731777484574720 |

## 二、打包

```powershell
cd $HOME\Documents\deepseek-harness\default-workspace\whale-tv
node scripts\build-edgeone.mjs                  # 生成 edgeone/dist
powershell -ExecutionPolicy Bypass -File scripts\pack-edgeone.ps1
```

产物：`C:\Users\M323M\Desktop\whale-tide-edgeone.zip`（约 1.76 MB）

包内结构：

```
index.html                        ← 前端入口（原 public/app.html）
manifest.json
assets/css|js|img|vendor/**       ← 全部静态资源
edge-functions/proxy/[[path]].js  ← m3u8 代理函数
edgeone.json                      ← 缓存配置
```

## 三、部署（4 步）

```
1. 控制台 → 创建项目 → 选「直接上传」
2. 项目名称：whale-tide
   加速区域：先选「全球（不含中国大陆）」← 见下方说明
3. 把 whale-tide-edgeone.zip 拖进上传区
4. 点「开始部署」，等 1 分钟
```

部署完成会给你一个 `*.edgeone.app` 的预览地址。

## 四、验证代理是否生效

打开控制台里的访问地址，把下面这段里的 `<你的域名>` 换掉，浏览器直接粘：

```
https://<你的域名>/proxy/https%3A%2F%2Fv.fengbao14.com%2Fvideo%2Fmofashaonvyuchengjihuarestart%2F5574fd893e7c%2Findex.m3u8
```

期望：返回以 `#EXTM3U` 开头的文本，且里面的分片地址都是 `/proxy/https%3A%2F%2F...` 形式。

> 函数路由说明：`edge-functions/proxy/[[path]].js` 会匹配 `/proxy/` 之后任意子路径；
> 也兼容 `/proxy?url=<编码后的URL>` 的 query 形式。

## 五、加速区域怎么选（重要）

| 选项 | 国内访问 | 备案要求 |
|---|---|---|
| **全球（不含中国大陆）** | 走海外/亚太节点，可用但延迟一般 | 不需要 |
| **中国大陆** | 走国内节点，速度最好 | **必须备案**（自定义域名需 ICP 备案） |

建议：

1. 先选「全球（不含中国大陆）」跑起来，确认功能正常
2. 想在国内提速 → 绑自定义域名 + 备案（备案在腾讯云办，约 10–20 个工作日）
3. 用 `*.edgeone.app` 默认域名做国内加速，平台一般要求绑定已备案域名

## 六、更新站点

```powershell
cd $HOME\Documents\deepseek-harness\default-workspace\whale-tv
# 改完 public/ 里的东西后
node scripts\build-edgeone.mjs
powershell -ExecutionPolicy Bypass -File scripts\pack-edgeone.ps1
# 控制台 → 项目 → 新建部署 → 重新拖 zip
```

## 七、密码（可选）

现在是开放站点。想加密码：

```
控制台 → 项目 → 设置 → 环境变量
  PASSWORD = 你的密码
```

`edge-functions/proxy/[[path]].js` 会自动开始校验 `auth` 参数；前端 `assets/js/core.js`
在没拿到 64 位哈希时就是开放模式，拿到后自动出现密码页。

## 八、踩坑记录

| 现象 | 原因 | 处理 |
|---|---|---|
| 访问 `/proxy/...` 返回 404 | 函数目录名不对 | 必须是 `edge-functions/`（不是 `functions/`） |
| 播放一直转圈 | 函数没生效，分片直连被防盗链 | 先验证 `/proxy/` 是否返回 `#EXTM3U` |
| 上传报文件过多 | 单项目上限 1000 个文件 | 我们只有 17 个，不会触发 |
| 国内访问慢 | 加速区域选了「不含中国大陆」 | 绑已备案域名并切区域 |
