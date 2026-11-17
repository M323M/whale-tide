# 部署到腾讯云 CloudBase（国内直连，免费额度）

> 为什么选它：`*.workers.dev` 和 `*.pages.dev` 在国内被 SNI 阻断，手机不翻墙打不开。
> CloudBase 的默认域名 `*.service.tcloudbase.com` 国内直连可访问，而且有免费额度。

## 一、准备

1. 打开 https://tcb.cloud.tencent.com/ ，微信扫码登录
2. **创建环境** → 选「免费版 / 按量计费」→ 地域选**上海**（国内访问最快）
3. 记下环境 ID，形如 `whale-tide-3g9x8b2c1d4e5f`

## 二、打包云函数

云函数里要自带静态文件，所以打包前先同步：

```powershell
cd $HOME\Documents\deepseek-harness\default-workspace\whale-tv
node scripts\sync-cloudbase.mjs          # 把 public/ 复制进云函数目录
powershell -ExecutionPolicy Bypass -File scripts\pack-cloudbase.ps1
```

生成：`C:\Users\M323M\Desktop\cloudbase-app.zip`（约 1.76 MB）
结构：`index.js` + `package.json` + `public/**`

## 三、上传云函数

```
云开发控制台 → 云函数 → 新建云函数
  函数名称：app
  运行环境：Nodejs 18.15
  创建方式：本地上传代码 → 选 cloudbase-app.zip
  超时时间：20 秒（代理 m3u8 需要）
  内存：256 MB
```

上传完成后在函数详情里点「测试」，用默认模板跑一次，返回 `statusCode: 404` 属正常（因为没传 path）。

## 四、开 HTTP 访问

```
云开发控制台 → HTTP 访问服务 → 开通（免费）
  → 添加路径
      路径：/
      云函数：app
      方法：GET / POST / HEAD / OPTIONS
```

开好后会给你地址：

```
https://<你的环境ID>.service.tcloudbase.com/
```

浏览器直接打开，就是站点首页。

## 五、前端不用改任何东西

站点里所有请求都是相对路径：

| 请求 | 落到 |
|---|---|
| `/` | 云函数返回 `public/app.html` |
| `/assets/js/app.js` | 云函数读静态文件 |
| `/proxy/<编码后的 m3u8>` | 云函数拉流 + 重写播放列表 |

所以同一个前端包在 Cloudflare Workers 和 CloudBase 上都能跑，不需要区分环境。

## 六、密码（可选）

云函数环境变量里加：

```
PASSWORD = 你的密码
```

加了之后：首页会注入 sha256 哈希、前端出现密码页、`/proxy` 校验 `auth` 参数。
不加就是开放站点（当前默认）。

## 七、免费额度够不够

| 资源 | 免费额度（个人站够用） |
|---|---|
| 云函数调用 | 每月百万次级 |
| 出流量 | 每月几 GB（看片会吃，重度使用需升级） |
| 存储 | GB 级 |

看视频的流量是大头，自己看问题不大，分享给很多人就要买资源包了。

## 八、更新站点

```powershell
# 改完代码后
git add -A && git commit -m "update" && git push     # 推 GitHub（存档用）
node scripts\sync-cloudbase.mjs                      # 重新同步静态文件
powershell -ExecutionPolicy Bypass -File scripts\pack-cloudbase.ps1
# 控制台重新上传 zip 即可
```

## 九、踩坑记录

| 现象 | 原因 | 处理 |
|---|---|---|
| 访问 `/` 返回 404 | HTTP 访问服务没绑 `/` 路径 | 添加路径 `/` 绑到 `app` |
| 播放一直转圈 | 云函数超时设太短 | 调到 20 秒 |
| 图片/JS 404 | 打包时漏了 `public/` | 先跑 `sync-cloudbase.mjs` 再打包 |
| 静态文件更新不生效 | zip 没重新打 | 重新执行第二步 |
