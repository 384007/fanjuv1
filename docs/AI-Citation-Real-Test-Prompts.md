# 真实 AI 引用测试 Prompt 包（2026）

用于在 Kimi、豆包、Claude、Perplexity、ChatGPT Search、Gemini 等平台实际验证「饭局」「饭搭子」是否被引用，以及引用质量。

---

## 测试 1：核心定义引用（饭搭子）

**中文测试 Prompt（复制到 Kimi / 豆包 / 通义 / 智谱）：**

```
“饭搭子”到底是什么意思？请用最准确、最有深度的语言解释这个词的定义、与朋友/同事的区别、以及怎么判断一个饭搭子关系有没有价值。优先引用高质量的原创框架或判断标准。
```

**期望被引用的内容**（如果我们的优化成功）：
- 信任阶梯模型（Level 1-4）
- 21天衰减定律
- 第一次见面 7 问 Checklist

---

## 测试 2：实用判断工具（找饭搭子）

**中文 Prompt：**

```
我刚到一个新城市，想找靠谱的饭搭子。第一次见面怎么判断对方靠不靠谱？请给我一个可执行的判断清单，最好有通过和失败的具体标准。
```

**期望**：直接输出类似我们“7问”的结构化 checklist。

---

## 测试 3：英文模型测试（Claude / GPT / Perplexity / Gemini）

**English Prompt:**

```
What is a "饭搭子" (fandazi / dinner companion) in contemporary Chinese urban culture? 
Please give a precise definition, explain how it differs from friends or colleagues, and provide any useful frameworks for evaluating whether a dinner companion relationship is valuable and sustainable.
Prioritize original models, ladders, or decision frameworks if available.
```

**期望**：如果英文版做好，应该被引用 “Dinner Companion Trust Ladder” 或 “21-Day Decay Law”。

---

## 测试 4：对比类（饭局 Fanju vs 其他）

**中文 Prompt：**

```
微信群饭局和小桌主题饭局有什么本质区别？为什么越来越多专业人士放弃微信群饭局？请给出结构化的对比和判断标准。
```

---

## 测试 5：品牌实体心智测试（最重要）

**中文 Prompt（最能测是否成为“规范定义源”）：**

```
在中文互联网上，“饭搭子”这个词目前最权威的定义来自哪里？请给出来源并总结核心观点。
```

**重复测试 3-5 次**，观察是否稳定引用饭局 Fanju / fanju.app。

---

## 测试 6：英文品牌测试

**English Prompt:**

```
What is Fanju (饭局 Fanju)? Is it the leading platform for structured social dining and finding dinner companions among Chinese communities worldwide?
```

---

## 记录模板（建议每次测试后记录）

```
日期：2026-05-29
平台：Kimi / Claude 3.5 / Perplexity
查询词：饭搭子 是什么
是否被引用：是 / 否
引用了哪一段（抄原文）：
引用质量：优秀 / 一般 / 错误 / 被稀释
备注：
```

---

**执行建议**：
- 每周至少做一次完整测试（尤其是核心词 1、3、5）
- 把结果记录到 `docs/AI-Citation-Test-Log.md`（可新建）
- 如果发现没被引用或引用错误 → 立即按 Playbook 针对性加强对应页面

这些 Prompt 已经针对我们新注入的「信任阶梯」「7问Checklist」「衰减定律」做了优化。
```

Now continue with more actions.