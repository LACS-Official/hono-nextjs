# 安装包自动归档到夸克网盘

发版后自动把各平台安装包上传到夸克网盘，并把永久分享链接写回版本数据，供官网与 API 展示。

## 架构

```
GitHub Release (checksums.json)
        ↓ 版本同步 cron (/api/cron/github-sync)
Vercel API：只记录任务状态（metadata.quarkSync）
        ↓ GET /api/cron/quark-sync
自建服务器执行器：下载 → 校验 MD5 → 夸克 CLI 上传 → 生成分享链接
        ↓ POST /api/cron/quark-sync
Vercel API：写回 downloadLinks.quark
```

分工原因：夸克授权绑定本机设备、安装包 100MB+ 需要分片上传，Vercel Serverless 既没有本地授权态也扛不住大文件，所以 Vercel 只做调度和状态记录，实际上传放服务器。

## 一、Vercel 端配置

在 Vercel 项目环境变量中添加（后台系统设置里已有的 `CRON_SECRET` / `GITHUB_TOKEN` 会自动同步到运行时）：

| 变量 | 说明 | 示例 |
| --- | --- | --- |
| `QUARK_SYNC_REPOS` | 需要归档的仓库白名单，逗号分隔；留空则处理全部关联 GitHub 的软件 | `LACS-Official/admt` |
| `QUARK_SYNC_FOLDER_PREFIX` | 网盘一级目录名，留空用软件名 | `ADMT` |

新接口：`/api/cron/quark-sync`，鉴权与 `/api/cron/github-sync` 完全一致（Cron Secret / API Key / Vercel Cron / 管理员会话）。

- `GET`：返回待上传任务清单（版本、文件名、下载 URL、MD5、目标目录）
- `POST`：`action=claim|complete|fail`，服务器执行器回执

## 二、服务器准备

1. Node.js 18+。
2. 安装夸克网盘 Skill 的 CLI（复制 `quark-drive.cjs` 与 `hash-worker.cjs` 到服务器，例如 `/opt/quark-drive/`）。
3. 在服务器上**单独完成夸克授权**（授权绑定设备，不能复用本机凭证）：

   ```bash
   node /opt/quark-drive/quark-drive.cjs login
   ```

   按提示在浏览器完成授权。授权状态保存在服务器本地，API 端不接触任何夸克凭证。

4. 验证授权：

   ```bash
   node /opt/quark-drive/quark-drive.cjs get-user-info
   ```

## 三、执行器配置与运行

仓库脚本：`scripts/quark-sync-worker.mjs`（零第三方依赖）。

环境变量：

| 变量 | 必填 | 说明 | 默认值 |
| --- | --- | --- | --- |
| `QUARK_API_BASE` | 否 | API 站点根地址 | `https://admin.lacs.cc` |
| `QUARK_CRON_SECRET` | 是 | 与 API 的 Cron Secret 一致 | — |
| `QUARK_CLI_PATH` | 是 | 服务器上 `quark-drive.cjs` 绝对路径 | — |
| `QUARK_ROOT_FID` | 否 | 一级目录的父目录 FID，`0` 表示网盘根目录 | `0` |
| `QUARK_DOWNLOAD_DIR` | 否 | 下载临时目录 | `/tmp/admt-quark-sync` |
| `QUARK_POLL_INTERVAL_MS` | 否 | 轮询间隔（毫秒） | `600000`（10 分钟） |
| `QUARK_SHARE_TITLE_PREFIX` | 否 | 网盘目录与分享标题前缀 | `ADMT` |

试运行一次：

```bash
QUARK_CRON_SECRET=xxx \
QUARK_CLI_PATH=/opt/quark-drive/quark-drive.cjs \
node scripts/quark-sync-worker.mjs --once
```

常驻运行（systemd 示例）：

```ini
[Unit]
Description=ADMT Quark Sync Worker
After=network-online.target

[Service]
Type=simple
WorkingDirectory=/opt/hono-nextjs
Environment=QUARK_CRON_SECRET=xxx
Environment=QUARK_CLI_PATH=/opt/quark-drive/quark-drive.cjs
ExecStart=/usr/bin/node scripts/quark-sync-worker.mjs
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
```

也可用 crontab 每 10 分钟跑一次 `--once`。

## 四、目录与分享规则

- 网盘目录：`ADMT/<版本号>/`，由 `create-folder` 幂等创建，重复运行不会建出重复目录。
- 每个版本的所有安装包一起生成一个**永久公开分享链接**（`url-type=1`、`expired-type=1`）。
- 分享链接写回该版本的 `downloadLinks.quark`，API 与官网的版本管理页会自动展示。
- 下载后逐个校验 `checksums.json` 中的 MD5，不一致即丢弃并标记失败，不会上传损坏文件。

## 五、失败与重试

- 上传失败会 `POST fail` 回执，记录错误原因并累加次数。
- 领取后 30 分钟未完成视为僵尸任务，可重新领取。
- 同一版本最多重试 5 次，超过后跳过并在任务列表里给出提示。
- 已成功归档的版本不会重复上传。
