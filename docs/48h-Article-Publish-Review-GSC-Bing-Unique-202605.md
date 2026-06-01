# 最近48小时 origin/main 文章发布审查报告
**目标**：GSC/Bing 索引合规 + 彻底去模板化 + 确保「饭局」「饭搭子」及 aiseo/传统seo 相关关键词可稳定前三 + 每个文章（尤其是🇺🇸文章）唯一、不被降权

**审查范围**：2026-05-29 ~ 05-30 origin/main `production-cloudflare-20260530T*` / `production-cloudflare-20260529T*` 系列提交（每小时一批 round 1）
- 新增/更新 `content/seo-ready/en-*.md` 英文国际文章约 **1220 篇**（Abu Dhabi、Accra、Berlin、Boston、Khartoum、Milan、Phoenix 等全球城市 + 主题组合）
- 同期 `content/articles/ready/index/*.json` 约 120 篇元数据批次
- 对应 Cloudflare Pages 生产发布

**审查日期**：2026-05-30  
**审查人**：Grok 4.3（基于 git、文件采样、现有 audit 脚本、Checklist 对照）

---

## 1. 总体结论：**高风险，不符合发布标准**

| 维度              | 状态     | 风险等级 | 说明 |
|-------------------|----------|----------|------|
| GSC/Bing 索引合规 | 不合格   | 🔴 高    | 大规模模板化 + 英文低搜索量城市页面稀释网站质量信号 |
| 去模板化          | 不合格   | 🔴 高    | 跨 1220 篇存在明显元模板（H2 结构、免责声明、边界语言 70-80% 重复） |
| 饭局/饭搭子 前三支持 | 弱     | 🟠 中    | 实体桥接存在，但低质规模内容会反噬品牌权威 |
| aiseo + 传统seo 双赢 | 不足   | 🟠 中    | 声称 aiQualityScore=100，但实际可引用单元弱、结构雷同 |
| 🇺🇸文章唯一性    | 不合格   | 🔴 高    | Boston/Phoenix 等美城市页面与 Berlin/Accra 使用同一生成骨架，本地化深度不足，非美国用户视角 |
| 内容唯一性/防降权 | 不合格   | 🔴 高    | translationKey + 高度相似内容 + en/zh 对照对，易触发 duplicate content / helpful content 信号 |

**一句话总结**：这批发布严重违反《SEO-Content-Remediation-Checklist v2》、《AI-Citation-Optimization-Playbook》、《饭局-饭搭子-永久前三作战手册》核心铁律。继续放任会直接伤害「饭局 Fanju」在 Google/Bing + 中美 AI 中的实体心智和排名。

---

## 2. 模板化问题（核心违规）

### 2.1 元模板证据（从最新 commit 6f0d4efc 采样 30 篇 en-*.md）

- **核心免责声明重复**（多篇完全一致）：
  > "It is important to clarify that this platform is not a dating guarantee, not a random group chat, and not an endless profile feed. ... Known in Chinese as “饭局 / 饭局app / Fanju饭局”"

- **高频僵尸 H2 结构**（不同城市/主题间高度重合）：
  - `## [City] clues that keep this dinner from feeling interchangeable`
  - `## Exit cues and follow-up pace after a [City] shared meal`
  - `## One practical question to ask before choosing this [Topic] Dinner table`
  - `## The listing sentence that makes this [City] [Topic] Dinner worth a second look`
  - `## How Fanju app explains this [City] table before anyone commits`
  - `## Host notes and venue clarity around [Topic] Dinner in [City]`
  - `## The [Topic] Dinner reader who will enjoy this table, and the one who should wait`

- 采样统计（30 篇）：超过 70% 文章共享 3 个以上上述 H2 骨架。即使 H2 文字略有变化，**段落逻辑、边界语言、安全措辞、结尾句式** 高度雷同。

### 2.2 与 Checklist 对照（零容忍项全部触发）

- [x] 彻底移除跨城市重复的僵尸 H2/H3 → **未做**
- [x] 禁止“先模板后填城”的写法 → **系统性存在**
- [x] 每篇文章必须有明显独特的结构（至少 40% 小节和标题与其他城市不同）→ **远未达到**（估计 <15% 真正独特）
- [x] 严禁结尾出现硬广段 → 部分仍有 "How Fanju app explains..." 推广味 H2

### 2.3 之前 JSON 批次（content/articles/ready/index/）遗留问题更严重
- 几乎所有 120 篇都有**段内重复 boilerplate**（"Keep the plan concrete: name the table purpose..." 每篇文章重复 6-10 次；中文版对应长句重复）。
- 质量审计平均分仅 50/100，AntiTemplateScore 被拉低。

---

## 3. GSC / Bing 索引风险（真实可被触发）

1. **Helpful Content / SpamBrain 类信号**：1220 篇英文页面在 48 小时内集中发布，主题高度模式化，针对低搜索量城市（Khartoum baking dinner、Accra fantasy dinner 等英文几乎无搜索），极易被识别为“大规模生成内容”。
2. **Duplicate Content / Canonical 混乱**：多数有 `alternatePath` 指向中文版 + `translationKey`，但内容相似度高，Google 可能选择错误版本或整体降权。
3. **E-E-A-T 缺失**：无真实作者、无真实用户故事、无可验证本地来源引用，仅靠“neighborhood name drop”（Back Bay、Prenzlauer Berg、Silom）制造本地感。
4. **用户行为信号风险**：短篇（多数 <600 词）、结构雷同 → 高跳出、低停留 → 进一步确认“低价值”。
5. **Bing（+Copilot/Perplexity 依赖）特别敏感**：对模板化英文内容惩罚更直接，会影响 AI 引用路径。
6. **站点整体质量稀释**：大量低相关国际页面会拖累 Tier-1 城市（北京、上海、旧金山、纽约）和 Pillar 页（what-is-fanju/what-is-fandazi）的权威传递。

**GSC 预判**：新 URL Inspection 可能显示 “Discovered - currently not indexed” 或 “Crawled - currently not indexed”；已索引者 2-4 周内排名/印象下滑。

---

## 4. 🇺🇸 文章唯一性专项审查（Boston / Phoenix / 其他美城市）

已发现的 en- 美城市页面（Boston media/semiconductor、Phoenix tennis/small-table 等）：

**优点**（相对全球模板）：
- 提到了 Back Bay、Cambridge、South End、Seaport、Scottsdale、Ahwatukee、summer heat、T 地铁、drive distances 等真实地理/生活细节。
- 部分 H2 尝试本地化（“Phoenix clues...”）。

**致命问题**（仍不唯一、不够美国）：
- 生成骨架与 en-berlin-keto、en-bangkok-founder **完全一致**（同一 promptSeed / deterministic-brief-v1）。
- 语气是“全球中立偏中国视角”的英文，而非美国人写美国人社交的自然语气（缺少美国式 dry humor、networking 文化 critique、class/visa/immigration 真实痛点、founder house dinner 等本土洞察）。
- 搜索意图覆盖不足：美国人搜 “dinner buddy Boston”、“small group dinners Phoenix”、“no networking pressure dinner Seattle” 时的真实顾虑（parking、tipping、political talk taboos、remote worker isolation 等）几乎未覆盖。
- 与中文版 san-francisco-*.json / en- 其他城市高度结构同源，duplicate content 风险高。
- **结论**：目前这些“🇺🇸文章”只是“带美国地名的全球模板”，**不具备在美国搜索市场独立竞争力**，也无法为品牌在英语世界建立独特心智，反而可能成为累赘。

---

## 5. 对「饭局 饭搭子 + aiseo/传统seo 前三」目标的影响

- **正面**：每篇都强制桥接 “Fanju app = 饭局 / 饭局app / Fanju饭局”，对全球 AI 实体关联有帮助。
- **负面（主导）**：
  - 低质规模内容会让 Google 把 “Fanju” 与 “mass generated city pages” 关联，伤害 E-E-A-T。
  - AI Citation Playbook 要求的「可引用单元」（原创框架、精确 checklist、高精度判断标准、本页独创观察）**极度缺乏**。这些页面只有通用安全边界 + 城市名掉落，无第一性原理洞察、无中美差异对比表格、无可被 Kimi/Claude/Perplexity 主动引用的原子。
  - 传统 SEO：内链虽指向 pillar，但 pillar 本身若被稀释，整体前三概率大幅下降。
  - 长期主义铁律违反：为了“数量”（每小时一批）牺牲了“极致质量 + 真实本地化 + 边界感”。

**作战手册第 7 章铁律几乎全部触发**。

---

## 6. 立即行动建议（优先级排序）

### Phase 0（今天必须）
1. **暂停同类生产发布**：停止或严格限制 production-cloudflare 类似 hourly 大批量 en- 全球城市生成。
2. **对已发布 1220 篇 en- 进行紧急 noindex 评估**：
   - 低搜索量/非英语母语城市（Accra、Khartoum、Abu Dhabi 大部分、Milan 大部分等）建议临时 robots: noindex 或 sitemap 移除，保护站点质量。
   - US/UK/AU/CA 英语母语城市（Boston、Phoenix、Seattle、Austin、NYC、London、Toronto、Sydney 等）保留但必须在 7 天内重写。
3. **运行严格审计**：
   ```bash
   STRICT_AUDIT=1 ARTICLE_LIMIT=200 node scripts/seo/audit-anti-template.mjs
   node scripts/seo/audit-article-quality.mjs
   node scripts/seo/audit-sitemap-indexability.mjs
   ```

### Phase 1（3-7 天）
4. **批量修复这批 en- 文章**（优先 US + Tier-1 英语城市）：
   - 使用/扩展 `surgical-fix-md-v3.mjs` 或新建 `remediate-en-batch.mjs`，强制每篇满足：
     - 至少 40% H2/内容与其他 50 篇随机样本不同
     - 每个 US 文章增加 5-7 个**可验证的美国本地细节**（真实餐厅、季节、停车文化、tipping、founder visa 痛点、remote worker 现实等）
     - 制造 1-2 个本页独有的「可引用单元」（checklist / 框架 / 对比表）
     - 品牌露出 ≤ 3 次，自然语气
   - 所有 en- 必须通过人工 + AI 双重 review 后才 re-publish。
5. **🇺🇸 文章专项重建计划**（最重要）：
   - 选 8-12 个美国核心城市（SF, NYC, LA, Seattle, Austin, Boston, Chicago, Denver, Miami, DC, Portland, Atlanta）。
   - 每城市 3-5 篇**真正原创英文长文**（不是 500 词模板），由懂美国社交/ founder 文化的人（或高质量 prompt + 重度人工编辑）撰写。
   - 目标：让这些页面成为英语世界 “small table dinner / dinner buddy” 垂直的权威参考，被 Claude/GPT/Perplexity 主动引用。
6. **Hreflang + Canonical 清理**：确保所有 en- / zh 对应页面正确标注，避免 self-duplicate。

### Phase 2（2-4 周）
7. **Pillar 页 + 核心对比页优先级升级**（what-is-fanju / what-is-fandazi / fanju-vs-xxx），按 AI-Citation-Playbook 制造 3-5 个顶级可引用单元。
8. **真实产品信号补强**：这是唯一能让前三“永久”的东西。内容再好，没有真实饭局发生、用户评价、复购，排名无法稳。
9. **重新提交 IndexNow + GSC URL Inspection**（仅修复后的页面）。

---

## 7. 验证与追踪

- 7 天后复审同一批 en- 文章的 antiTemplateScore / originalityScore（目标：单篇 < 2 个跨文章重复 H2，原创性人工抽检 >85%）。
- GSC 监控：新页面 14 天内 “Average position” 和 “Impressions” 曲线。
- AI 引用测试：在 Claude、Perplexity、ChatGPT Search、Kimi、豆包 中搜索 “Boston small table dinner” / “饭局 Fanju” / “找饭搭子 美国”，看是否被引用 + 引用是否准确。
- 核心关键词排名周报（饭局、饭搭子、Fanju dinner buddy 等）。

---

## 8. 附：本次审查采样文件（可直接复审）

- `content/seo-ready/en-boston-media-dinner.md`
- `content/seo-ready/en-phoenix-tennis-dinner.md`
- `content/seo-ready/en-berlin-keto-dinner.md`
- `content/seo-ready/en-bangkok-founder-dinner.md`
- `content/seo-ready/en-abu-dhabi-luxury-dinner.md`（低搜索量代表）
- `content/articles/ready/index/en-chengdu-ai-founder-guide.json`（旧模板批次）

---

**最终裁定**：这批文章**不符合上线条件**。必须按以上 Phase 执行补救，否则对「饭局 饭搭子 永久前三」目标是净负面贡献。

需要我立刻：
- A. 生成具体 10 篇 US 城市英文重写样本（高质量、非模板）
- B. 编写 `remediate-en-48h-batch.mjs` 脚本 + prompt 改造建议
- C. 起草给 Cloudflare/production 发布的暂停/限流 PR
- D. 其他

请直接指示下一步。
