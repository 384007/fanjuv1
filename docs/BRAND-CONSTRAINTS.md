# Fanju 全站品牌约束文档

## 核心品牌关键词

**中文主关键词：饭局**
**英文主关键词：Fanju**
**组合写法：饭局 Fanju**

### 品牌定义

- 中文：饭局 Fanju 是一个 AI 饭局社交和线下聚会平台，帮助用户找饭搭子、约饭、组织同城饭局，并通过真实饭桌建立线下社交关系。
- 英文：Fanju is an AI social dining app and dinner gathering platform for finding dinner companions, hosting local dinner gatherings, and building real-world social connections around shared meals.

### 关键词使用规则

1. **必须使用**：饭局、Fanju、饭局 Fanju、dinner gathering、social dining
2. **禁止在正文中使用**：饭搭子（仅限 titleZh 等元数据字段，正文禁用）
3. **禁止暴露技术词**：Modal、Groq、Cerebras、Gemini、Cloudflare、NVIDIA、API、backend、Next.js、prompt、generator、model

---

## 多语言路径规则

### 中文页面
- `lang: "zh"`
- `canonicalPath` 不以 `/en/` 开头
- `alternatePath` 指向对应英文页面（以 `/en/` 开头）
- 示例：`canonicalPath: "/fanju-vs-facebook-groups"`

### 英文页面
- `lang: "en"`
- `canonicalPath` 必须以 `/en/` 开头
- `alternatePath` 指向对应中文页面（不以 `/en/` 开头）
- 示例：`canonicalPath: "/en/fanju-vs-facebook-groups"`

### 路径对应规则
| 中文路径 | 英文路径 |
|---------|---------|
| `/city/{city}/{category}` | `/en/city/{city}/{category}` |
| `/fanju-vs-{x}` | `/en/fanju-vs-{x}` |
| `/{slug}` | `/en/{slug}` |

---

## content/seo-ready 文章 frontmatter 规范

每篇 ready 文章必须包含以下字段：

```yaml
slug: "unique-slug"
canonicalPath: "/path"          # 中文不以 /en/ 开头，英文必须以 /en/ 开头
alternatePath: "/en/path"       # 指向另一语言版本
translationKey: "shared-key"    # 中英文配对共享同一个 key
lang: "zh"                      # 只能是 zh 或 en
title: "页面标题"
description: "页面描述"
aiQualityScore: 95
status: "ready"
```

### 配对规则
- 同一 `translationKey` 下必须有且仅有 zh 和 en 两篇文章
- zh.alternatePath === en.canonicalPath
- en.alternatePath === zh.canonicalPath
- 缺少配对的文章不允许进入 ready 状态

---

## 语言切换 UI 规范

- 中文页面：breadcrumb 右侧显示 **English** 链接，指向 alternatePath
- 英文页面：breadcrumb 右侧显示 **中文** 链接，指向 alternatePath
- 参考组件：`components/seo-page.tsx` 的 `alternatePath` 逻辑
- 实现组件：`components/seo-ready-article-page.tsx`

---

## metadata alternates 规范

每个页面的 metadata 必须包含：

```ts
alternates: {
  canonical: canonicalPath,
  languages: {
    "zh-CN": zhPath,
    "en": enPath,
  }
}
```

---

## sitemap 规范

- 每对中英文文章，两个 URL 都必须加入 sitemap
- 未配对或校验失败的文章不加入 sitemap
- 去重，避免重复 URL

---

## 校验脚本规则（scripts/check-seo-ready-routes.mjs）

以下情况必须报错并退出：
1. 缺少 slug、canonicalPath、lang、translationKey、alternatePath
2. lang 不是 zh 或 en
3. lang=en 但 canonicalPath 不以 /en/ 开头
4. lang=zh 但 canonicalPath 以 /en/ 开头
5. translationKey 下不是恰好 zh+en 两篇
6. alternatePath 互相不对应
7. canonicalPath 重复

---

## promote 规则（scripts/seo/promote-ready-drafts.mjs）

以下情况跳过 promote（不报错，但不 promote）：
1. 缺少 lang
2. 缺少 translationKey
3. 缺少 canonicalPath
4. 缺少 alternatePath
5. lang=en 但 canonicalPath 不以 /en/ 开头
6. lang=zh 但 canonicalPath 以 /en/ 开头

---

## 生成规则（scripts/seo/generate-router-drafts.mjs）

- 每次生成必须成对：中文 + 英文
- 共享 translationKey
- 互设 alternatePath
- 英文路径在中文路径前加 /en/ 前缀
- 禁止生成 lang=en 但 canonicalPath 不以 /en/ 开头的文章
