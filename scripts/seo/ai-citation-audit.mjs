#!/usr/bin/env node
/**
 * AI Citation Audit Script (v1)
 * 
 * 用途：对核心 Pillar 页和 Tier 1 页面进行 AI 引用友好度快速检查。
 * 重点检查是否包含高价值「可引用单元」（框架、精确 checklist、独特观察）。
 * 
 * 运行方式：
 *   node scripts/seo/ai-citation-audit.mjs --pages what-is-fandazi,what-is-fanju
 * 
 * 注意：这只是静态结构检查，最终引用质量仍需人工 + 真实 AI 搜索测试。
 */

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const pagesArg = args.find(a => a.startsWith('--pages='))?.split('=')[1] || 'what-is-fandazi,what-is-fanju';
const pages = pagesArg.split(',').map(p => p.trim());

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, 'app');

console.log('=== AI Citation Audit (v1) ===\n');

let totalScore = 0;
let checked = 0;

for (const page of pages) {
  const zhPath = path.join(APP_DIR, page, 'page.tsx');
  const enPath = path.join(APP_DIR, 'en', page, 'page.tsx');

  console.log(`\n--- ${page} ---`);

  const results = {
    hasNamedFramework: false,
    hasPreciseChecklist: false,
    hasFirstPrincipleObservation: false,
    hasStrongContrast: false,
    structureUniquenessHint: 'unknown',
  };

  const contentZh = fs.existsSync(zhPath) ? fs.readFileSync(zhPath, 'utf8') : '';
  const contentEn = fs.existsSync(enPath) ? fs.readFileSync(enPath, 'utf8') : '';

  // 简单启发式检测（可大幅增强）
  if (/信任阶梯|信任模型|密度模型|衰减定律|四层|五种边界|阶梯模型/i.test(contentZh)) {
    results.hasNamedFramework = true;
  }
  if (/通过标准|失败|精确判断|7 问|Checklist|通过.*失败/i.test(contentZh)) {
    results.hasPreciseChecklist = true;
  }
  if (/第一性原理|只有.*才能|长期观察|不可逆|残酷但真实/i.test(contentZh)) {
    results.hasFirstPrincipleObservation = true;
  }
  if (/对比表格|vs |区别在于|微信群 vs|小红书 vs/i.test(contentZh)) {
    results.hasStrongContrast = true;
  }

  const score = Object.values(results).filter(Boolean).length;
  totalScore += score;
  checked++;

  console.log(`  中文版存在: ${!!contentZh}`);
  console.log(`  英文版存在: ${!!contentEn}`);
  console.log(`  检测到原创命名框架: ${results.hasNamedFramework ? '✓' : '✗'}`);
  console.log(`  检测到精确判断 Checklist: ${results.hasPreciseChecklist ? '✓' : '✗'}`);
  console.log(`  检测到第一性原理观察: ${results.hasFirstPrincipleObservation ? '✓' : '✗'}`);
  console.log(`  检测到强对比结构: ${results.hasStrongContrast ? '✓' : '✗'}`);
  console.log(`  本页 AI 引用得分（满分 4）: ${score}/4`);

  if (score < 2) {
    console.log(`  → 建议：按《AI-Citation-Optimization-Playbook》立即加强`);
  }
}

console.log(`\n=== 汇总 ===`);
console.log(`检查页面数: ${checked}`);
console.log(`平均 AI 引用结构得分: ${(totalScore / checked).toFixed(1)} / 4`);
console.log(`\n提示：此脚本仅做静态启发式检查。最终效果请在 Kimi / Claude / Perplexity 中实际搜索验证。`);
console.log(`完整规范见 docs/AI-Citation-Optimization-Playbook.md`);
