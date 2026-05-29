#!/usr/bin/env node
/**
 * AI Citation Upgrade Runner (v2 - 2026-05)
 * 
 * 用途：执行 AI 被引用优化流程的核心入口脚本。
 * 严格遵循《AI-Citation-Optimization-Playbook.md》。
 * 
 * 用法：
 *   node scripts/seo/run-ai-citation-upgrade.mjs --page=what-is-fandazi --mode=plan
 *   node scripts/seo/run-ai-citation-upgrade.mjs --page=what-is-fanju --mode=full
 *   node scripts/seo/run-ai-citation-upgrade.mjs --page=safety --mode=audit
 */

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const page = args.find(a => a.startsWith('--page='))?.split('=')[1];
const mode = args.find(a => a.startsWith('--mode='))?.split('=')[1] || 'plan';

if (!page) {
  console.error('Usage: node scripts/seo/run-ai-citation-upgrade.mjs --page=what-is-fandazi --mode=plan|inject');
  process.exit(1);
}

const promptPath = path.join(process.cwd(), 'docs/prompts/ai-citation-upgrade-prompt.md');
const prompt = fs.readFileSync(promptPath, 'utf8');

console.log(`\n=== AI Citation Upgrade Runner ===`);
console.log(`Target page : ${page}`);
console.log(`Mode        : ${mode}\n`);

if (mode === 'plan') {
  console.log('--- 建议做法 ---');
  console.log('1. 打开 docs/AI-Citation-Upgrade-Plan-' + page + '.md（如果存在）');
  console.log('2. 使用下面这个完整 Prompt 喂给 Claude 3.5 / GPT-4o / Kimi，生成具体改动方案：\n');
  console.log('--- Prompt 开始 ---');
  console.log(prompt.replace('[页面路径]', `app/${page}/page.tsx`).replace('[核心关键词]', page.includes('fandazi') ? '饭搭子' : '饭局 Fanju'));
  console.log('--- Prompt 结束 ---\n');
  console.log('然后把生成的方案保存到 docs/AI-Citation-Upgrade-Plan-' + page + '.md');
}

if (mode === 'inject') {
  console.log('当前为骨架模式。');
  console.log('后续版本会直接读取 plan 文件 + 页面源码，输出精确的 search_replace patch。');
  console.log('目前请手动按 plan 文件执行改动，或告诉我需要我立刻对这个页面做具体注入。');
}

if (mode === 'full') {
  console.log('【Full Mode】将依次执行：');
  console.log('1. 运行 ai-citation-audit');
  console.log('2. 读取对应 Upgrade Plan');
  console.log('3. 生成可直接应用的 patch（开发中）');
  console.log('\n推荐现在运行：');
  console.log(`node scripts/seo/ai-citation-audit.mjs --pages=${page}`);
}

console.log('\n推荐下一步：');
console.log('  node scripts/seo/ai-citation-audit.mjs --pages=' + page);
console.log('\n要执行完整 AI Citation 加强流程，推荐：');
console.log('1. 阅读 docs/AI-Citation-Optimization-Playbook.md');
console.log('2. 参考 docs/AI-Citation-Upgrade-Plan-*.md');
console.log('3. 使用 docs/prompts/ai-citation-upgrade-prompt.md 喂给模型生成 patch');
