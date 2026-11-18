# 用免费域名接上 EdgeOne（不备案，5 分钟）

> 目标：把 `whale-tide-xxxx.edgeone.cool` 这种又长又会被污染、还只有 3 小时预览的临时地址，
> 换成一个稳定、能长期用的免费域名。

## 为什么必须绑域名

| 问题 | 说明 |
|---|---|
| 默认域名被 DNS 污染 | `*.edgeone.cool` 在国内解析到假 IP，经常打不开 |
| 3 小时预览限制 | 默认域名带 `?eo_token=` 才放行，过期就废 |
| 链接太长 | 没法发给别人 |

绑上自定义域名后这三点全部消失，而且**不需要备案**（加速区域保持「全球，不含中国大陆」）。

## 第一步：申请免费域名（3 分钟）

打开 **https://dash.domain.digitalplat.org/**

1. 用邮箱注册（Gmail/QQ 都行，收验证码）
2. 登录后点 **Register a new domain**
3. 选一个后缀：`dpdns.org`（永久免费、自动续期、支持自定义 NS）
4. 填名字，例如 `whale-tide` → 完整域名就是 `whale-tide.dpdns.org`
5. 提交，一般**几秒到几分钟**就批下来（无需审核）

> 备选平台（同样免费）：
> - ClouDNS → `你的名字.abrdns.com`
> - register.us.kg → 支持表情符号的域名
> - EU.org → `你的名字.eu.org`（人工审核，可能要等几天）

## 第二步：在 EdgeOne 添加域名（2 分钟）

```
EdgeOne Makers → 项目 whale-tide → 域名管理 → 添加自定义域名
  填：whale-tide.dpdns.org
  加速区域：全球（不含中国大陆）
```

EdgeOne 会给出**两类信息**，记下来：

| 类型 | 用途 |
|---|---|
| ① 归属验证（TXT 记录） | 证明域名是你的 |
| ② CNAME 目标（形如 `xxx.edgeone.cool` 或一串英数字） | 实际指向 |

## 第三步：回 dpdns.org 加解析

回到 DigitalPlat 的域名面板 → 选中你的域名 → **DNS Records**：

**① 加 TXT（归属验证）**

| 字段 | 填 |
|---|---|
| Type | `TXT` |
| Name | EdgeOne 给的主机记录（通常是 `_dnsauth` 或 `@`） |
| Value | EdgeOne 给的那串校验值 |

**② 加 CNAME（实际指向）**

| 字段 | 填 |
|---|---|
| Type | `CNAME` |
| Name | `@`（根域）或 `www` |
| Value | EdgeOne 给的 CNAME 目标 |

保存。生效时间一般 **1–10 分钟**（dpdns.org 的 NS 全球同步很快）。

## 第四步：回 EdgeOne 完成验证

```
域名管理 → 找到刚才那个域名 → 点「验证」/「下一步」
```

验证通过后状态变成 **已生效 / Active**，同时 EdgeOne 会**自动签发免费 SSL 证书**（一般几分钟）。

## 第五步：验证

浏览器打开：

```
https://whale-tide.dpdns.org/
```

应该直接看到鲸汐首页，没有 3 小时限制、没有 token。

再验一下代理是否通（把下面整段粘到地址栏）：

```
https://whale-tide.dpdns.org/proxy/https%3A%2F%2Fv.fengbao14.com%2Fvideo%2Fmofashaonvyuchengjihuarestart%2F5574fd893e7c%2Findex.m3u8
```

期望：返回以 `#EXTM3U` 开头的文本。

## 常见问题

| 现象 | 原因 | 处理 |
|---|---|---|
| EdgeOne 提示「域名未备案」 | 加速区域选了「中国大陆」 | 改成「全球（不含中国大陆）」 |
| 域名添加后一直「验证中」 | TXT 记录没生效 | 等 10 分钟，用 `nslookup -type=TXT _dnsauth.你的域名` 查 |
| 打开是 404 | CNAME 还没生效 | 等 10 分钟；用 `nslookup 你的域名` 看是否指到 EdgeOne |
| 浏览器报证书错误 | SSL 还在签发 | 等 5 分钟，或手动在域名管理里点「申请证书」 |
| 国内访问仍然慢 | 加速区域是非大陆 | 这是不备案的代价（见下） |

## 速度说明（别期待太高）

绑域名解决的是「能不能稳定访问」，**不解决速度**：

```
手机 → EdgeOne 香港/新加坡节点（约 600-1000ms 国际出口）
     → 回源国内片源站（再 +几百 ms）
```

想真正快只有两条：

1. **备案 + 切大陆区域**（¥14/年域名 + 1-3 周备案）→ 100-300ms
2. **不备案 + 香港 VPS**（¥24/月起）→ 30-100ms

## 顺带：把 Cloudflare 版也绑上

`workers.dev` 在国内被 SNI 阻断，同样可以用这个免费域名救活：

```
Cloudflare → Workers & Pages → whale-tide → 设置 → 触发器 → 添加自定义域
  填：cf.dpdns.org
  → 回 dpdns.org 加 CNAME，指向 Cloudflare 给的 xxx.workers.dev
```

这样你有两个可用地址：

| 地址 | 用途 |
|---|---|
| `whale-tide.dpdns.org` | EdgeOne 版（国内直连，慢） |
| `cf.dpdns.org` | Cloudflare 版（需要梯子，但功能全） |
