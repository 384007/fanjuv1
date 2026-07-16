# 运行 AI SEO Lab

本文档说明如何在本地或 CI 中启动 Fanju AI SEO Lab 的完整链路：
Cloudflare Worker（`workers/lab-api`）+ Modal Worker（`modal/lab_worker.py`）。

---

## 环境变量说明

### Modal Worker（`modal/lab_worker.py`）

在 Modal 控制台的 **Secrets → custom-secret** 中配置以下 key：

| 变量名 | 是否必填 | 说明 |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ 必填 | Claude API Key，用于文章生成、SEO 质检、平台改写 |
| `GITHUB_TOKEN` | ✅ 必填 | GitHub Personal Access Token（需要 repo 读写权限） |
| `GITHUB_REPOSITORY` | ✅ 必填（推荐） | 内容仓库，格式 `owner/repo`，例如 `384007/fanjuv1` |
| `GITHUB_CONTENT_OWNER` | 二选一 | 与 `GITHUB_REPO` 配合使用的旧格式（如已设置 `GITHUB_REPOSITORY` 则忽略） |
| `GITHUB_REPO` | 二选一 | 仓库名（不含 owner），与 `GITHUB_CONTENT_OWNER` 配合使用 |
| `CF_WORKER_URL` | ✅ 必填 | Cloudflare Worker 地址，例如 `https://fanju.app` |
| `CF_ADMIN_TOKEN` | ✅ 必填 | 与 Cloudflare Worker `ADMIN_TOKEN` 保持一致 |
| `ZHIHU_COOKIES` | 按需 | 知乎 Cookie，base64 编码的 JSON 数组 |
| `CSDN_COOKIES` | 按需 | CSDN Cookie，base64 编码的 JSON 数组 |
| `JUEJIN_COOKIES` | 按需 | 掘金 Cookie |
| `JIANSHU_COOKIES` | 按需 | 简书 Cookie |
| `WEIBO_COOKIES` | 按需 | 微博 Cookie |
| `XIAOHONGSHU_COOKIES` | 按需 | 小红书 Cookie |
| `DOUBAN_COOKIES` | 按需 | 豆瓣 Cookie |
| `TOUTIAO_COOKIES` | 按需 | 头条 Cookie |
| `BAIJIAHAO_COOKIES` | 按需 | 百家号 Cookie |
| `BILIBILI_COOKIES` | 按需 | B站 Cookie |
| `DEVTO_API_KEY` | 按需 | Dev.to API Key |
| `HASHNODE_API_KEY` | 按需 | Hashnode API Key |
| `MEDIUM_API_KEY` | 按需 | Medium Integration Token |
| `BLUESKY_IDENTIFIER` | 按需 | Bluesky handle，例如 `user.bsky.social` |
| `REDDIT_CLIENT_ID` | 按需 | Reddit OAuth Client ID |

> **GITHUB_REPOSITORY vs 旧格式**
>
> 推荐只设置 `GITHUB_REPOSITORY=384007/fanjuv1`。
> 若沿用旧配置，则需同时设置 `GITHUB_CONTENT_OWNER=384007` 和 `GITHUB_REPO=fanjuv1`。
> 两种格式不能混用——只要 `GITHUB_REPOSITORY` 包含 `/`，旧格式就会被忽略。

---

### Cloudflare Worker（`workers/lab-api`）

在 `wrangler.toml` 的 `[vars]` 中设置明文变量，敏感值通过 `wrangler secret put` 写入：

| 变量名 | 类型 | 说明 |
|---|---|---|
| `MODAL_BASE_URL` | `[vars]` | Modal Web Endpoint，格式为 `https://fanju-lab-worker--lab-worker-web.modal.run` |
| `ADMIN_TOKEN` | secret | Admin API 鉴权 Token，与 Modal 端 `CF_ADMIN_TOKEN` 保持一致 |

---

## 部署步骤

### 1. 部署 Modal Worker

```bash
# 确认 Python 语法正确
python3 -m py_compile modal/__init__.py modal/__main__.py modal_growth_agent.py modal/lab_worker.py

# 部署到 Modal（首次需要 modal token new）
modal deploy modal/lab_worker.py

# 健康检查
modal run modal_growth_agent.py::check_keys
modal run modal_growth_agent.py::health_check
```

部署成功后，Modal 会打印出 Web Endpoint URL，格式类似：
```
https://fanju-lab-worker--lab-worker-web.modal.run
```
将该地址填入 `workers/lab-api/wrangler.toml` 的 `MODAL_BASE_URL`。

### 2. 部署 Cloudflare Worker

```bash
cd workers/lab-api

# 写入 secret
wrangler secret put ADMIN_TOKEN

# 部署
wrangler deploy
```

### 3. 前端构建验证

```bash
pnpm lint
pnpm build
pnpm seo:routes
pnpm seo:prompt-bank:check
```

---

## 发布文章的前置条件

`POST /api/lab/publish-jobs` 在 Worker 侧有强校验，以下两个条件必须同时满足，否则返回 `422`：

1. `lab_articles.status = 'ready'`（文章已通过 SEO 质检并被标记为就绪）
2. `lab_articles.seo_score >= 90`

前端的"发布"按钮禁用逻辑仅作 UI 提示，后端会独立拒绝不达标的请求。

---

## Cookie 格式说明

各平台 Cookie 需编码为 Playwright 兼容的 JSON 数组，再做 base64 编码：

```json
[
  { "name": "...", "value": "...", "domain": ".zhihu.com", "path": "/", "httpOnly": true, "secure": true }
]
```

编码命令：
```bash
echo '<上述JSON>' | base64
```

将 base64 字符串填入对应的 `PLATFORM_COOKIES` Secret。
