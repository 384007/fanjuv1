# CUSTOM-SECRET 强约束文档

> **⚠️ 铁律：所有密钥和 Cookie 只能存在于 Modal `custom-secret` 中。**
> **禁止在代码、.env、GitHub Secrets、Cloudflare 环境变量中重复存储。**
> **禁止删除、重命名任何已有 key。只能新增。**

---

## 一、custom-secret 完整 Key 清单

### 1. AI / LLM

| Key | 用途 | 使用位置 |
|-----|------|----------|
| `ANTHROPIC_API_KEY` | Claude 文章生成、SEO 质检、验证码识别 | `modal/lab_worker.py`, `modal/captcha_solver.py` |

### 2. GitHub

| Key | 用途 | 使用位置 |
|-----|------|----------|
| `GITHUB_TOKEN` | 读写文章 Markdown 到私有 content repo | `modal/lab_worker.py`, `modal_growth_agent.py` |
| `GH_TOKEN` | 同上，备用 key 名（两者取其一） | `modal_growth_agent.py` |
| `GITHUB_REPO` | 仓库名，如 `fanjuv1` | `modal/lab_worker.py`, `modal_growth_agent.py` |
| `GITHUB_REPOSITORY` | 完整仓库路径，如 `384007/fanjuv1`（备用） | `modal_growth_agent.py` |
| `GITHUB_CONTENT_OWNER` | 仓库 owner，如 `384007` | `modal/lab_worker.py` |
| `GIT_AUTHOR_NAME` | git commit 署名（可选，默认 `Fanju Modal Publisher`） | `modal_growth_agent.py` |
| `GIT_AUTHOR_EMAIL` | git commit 邮箱（可选，默认 `modal-publisher@fanju.app`） | `modal_growth_agent.py` |

### 3. Cloudflare Worker 通信

| Key | 用途 | 使用位置 |
|-----|------|----------|
| `CF_WORKER_URL` | Lab API Worker 的 base URL，如 `https://lab.fanju.app` | `modal/lab_worker.py` |
| `CF_ADMIN_TOKEN` | 与 Cloudflare Worker 通信的 Bearer token（同 `ADMIN_TOKEN`） | `modal/lab_worker.py` |

### 4. 平台 Cookie（Playwright 登录态）

> **格式：base64(JSON array of Playwright cookie objects)**
> 
> 生成方式：`python scripts/save_session.py <platform>`
> 
> 命名规则：`<PLATFORM_UPPER>_COOKIES`，由 `modal/platforms/base_adapter.py` 的 `_load_cookies()` 自动读取。

| Key | 平台 | 适配器 |
|-----|------|--------|
| `ZHIHU_COOKIES` | 知乎 | `modal/platforms/zhihu.py` |
| `CSDN_COOKIES` | CSDN | `modal/platforms/csdn.py` |
| `JUEJIN_COOKIES` | 掘金 | `modal/platforms/juejin.py` |
| `JIANSHU_COOKIES` | 简书 | `modal/platforms/jianshu.py` |
| `WEIBO_COOKIES` | 微博 | `modal/platforms/weibo.py` |
| `XIAOHONGSHU_COOKIES` | 小红书 | `modal/platforms/xiaohongshu.py` |
| `DOUBAN_COOKIES` | 豆瓣 | `modal/platforms/douban.py` |
| `TOUTIAO_COOKIES` | 今日头条 | `modal/platforms/toutiao.py` |
| `BAIJIAHAO_COOKIES` | 百家号 | `modal/platforms/baijiahao.py` |
| `BILIBILI_COOKIES` | B站专栏 | `modal/platforms/bilibili.py` |

### 5. 平台 API Key（非 Cookie 平台）

| Key | 平台 | 使用位置 |
|-----|------|----------|
| `DEVTO_API_KEY` | Dev.to | `modal/platforms/devto.py` |
| `HASHNODE_API_KEY` | Hashnode | `modal/platforms/hashnode.py` |
| `HASHNODE_PUBLICATION_ID` | Hashnode 发布目标 | `modal/platforms/hashnode.py` |
| `MEDIUM_API_KEY` | Medium | `modal/platforms/medium.py` |
| `BLUESKY_IDENTIFIER` | Bluesky handle，如 `fanju.bsky.social` | `modal/platforms/bluesky.py` |
| `BLUESKY_APP_PASSWORD` | Bluesky App Password | `modal/platforms/bluesky.py` |
| `REDDIT_CLIENT_ID` | Reddit OAuth client id | `modal/platforms/reddit.py` |
| `REDDIT_CLIENT_SECRET` | Reddit OAuth client secret | `modal/platforms/reddit.py` |
| `REDDIT_USERNAME` | Reddit 账号 | `modal/platforms/reddit.py` |
| `REDDIT_PASSWORD` | Reddit 密码 | `modal/platforms/reddit.py` |
| `REDDIT_SUBREDDIT` | 发布目标 subreddit（默认 `test`） | `modal/platforms/reddit.py` |

### 6. 运行控制

| Key | 用途 | 使用位置 |
|-----|------|----------|
| `FANJU_DISABLE_MODAL_SCHEDULE` | 设为 `1` 禁用每小时 cron | `modal_growth_agent.py` |

---

## 二、Cookie 健康检测规则

`modal/lab_worker.py` 的 `/validate-cookies` 端点：

1. 读取 `<PLATFORM>_COOKIES` 环境变量
2. base64 解码 → Playwright 注入 → 访问平台登录态页面
3. 检测是否跳转到登录页 → 返回 `{ "platform": { "valid": bool, "configured": bool } }`
4. 结果写回 Cloudflare D1 `lab_platform_accounts.session_valid`

**前端 `/admin/lab/platform-accounts` 显示：**
- `cookie_configured = false` → 灰色 "Not Set / 未配置"（custom-secret 中无此 key）
- `session_valid = false` → 红色 "Expired / 已过期"（cookie 存在但失效）
- `session_valid = true` → 绿色 "Valid / 有效"

---

## 三、禁止事项

```
❌ 禁止在 .env / .env.local 存储任何 key
❌ 禁止在 GitHub Actions Secrets 存储 cookie
❌ 禁止在 Cloudflare Pages / Worker 环境变量存储 cookie
❌ 禁止在代码中硬编码任何 token / key / cookie
❌ 禁止删除或重命名 custom-secret 中已有的 key
❌ 禁止在 git 历史中提交 cookie 文件（.gitignore 已排除 *_COOKIES.txt）
```

---

## 四、新增平台 Cookie 流程

```bash
# 1. 用 Playwright 录制登录态
python scripts/save_session.py <platform>
# 输出 base64 字符串

# 2. 在 Modal Dashboard → Secrets → custom-secret 新增：
#    Key: <PLATFORM_UPPER>_COOKIES
#    Value: <base64 字符串>

# 3. 在 D1 lab_platform_accounts 确认该平台行存在

# 4. 在 Admin → Platforms 页面点击 "Test Cookie" 验证
```

---

## 五、Modal App 与 Secret 绑定关系

| Modal App | Secret 绑定 |
|-----------|-------------|
| `fanju-lab-worker` (`modal/lab_worker.py`) | `custom-secret` |
| `fanju-growth-agent` (`modal_growth_agent.py`) | `custom-secret` |
| `fanju-backend` (`modal_app.py`) | `custom-secret` |

所有 Modal function 必须声明 `secrets=[modal.Secret.from_name("custom-secret")]`。
