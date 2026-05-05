#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';

const root = new URL('..', import.meta.url).pathname;

function fail(message) {
  console.error(`docs smoke failed: ${message}`);
  process.exit(1);
}

function read(relPath) {
  return readFileSync(resolve(root, relPath), 'utf8');
}

if (existsSync(resolve(root, 'CALIBRATION.md'))) {
  const index = read('.cortex/index.md');
  if (index.includes('CALIBRATION.md가 없어')) {
    fail('.cortex/index.md가 현재 존재하는 CALIBRATION.md를 부재로 설명합니다.');
  }
}

const markdownFiles = [
  'README.md',
  'CALIBRATION.md',
  'docs/README.md',
  'docs/PRD.md',
  'docs/GAPS.md',
  'docs/DESIGN-PHILOSOPHY.md',
  'docs/WRONG-ANSWER-LOG.md',
  'data/references/color-system.md',
  'data/references/compliance.md',
  'data/references/components.md',
  'data/references/layouts.md',
  'data/references/platforms.md',
  'data/references/rules.md',
  'data/references/templates.md',
  'data/references/tokens.md',
  'skills/SKILL.md',
  '.cortex/index.md',
  '.cortex/state.md',
  '.docsys/STATUS.md',
].filter(relPath => existsSync(resolve(root, relPath)));

for (const relPath of markdownFiles) {
  const source = read(relPath);
  const linkRe = /\[[^\]]+\]\((?!https?:|mailto:|#)([^)]+)\)/g;
  for (const match of source.matchAll(linkRe)) {
    const target = match[1].split('#')[0].replace(/^<|>$/g, '');
    if (!target) continue;
    const abs = resolve(dirname(resolve(root, relPath)), decodeURIComponent(target));
    if (!existsSync(abs)) fail(`${relPath}: 깨진 로컬 링크 ${match[1]}`);
  }
}

const platforms = read('data/references/platforms.md');
for (const forbidden of [
  'transform: translateY(-2px);',
  'box-shadow: 0 4px 16px rgba(0,0,0,0.12);',
  'transform 0.15s var(--duvu-ease-spring);',
  '.duvu-btn:active { transform: scale(0.97); }',
  '.duvu-chat__send:active { transform: scale(0.92); }',
]) {
  if (platforms.includes(forbidden)) {
    fail(`platforms.md CSS 예시에 토큰 밖 직접값이 남아 있습니다: ${forbidden}`);
  }
}

console.log(`docs smoke ok (${markdownFiles.length} markdown files)`);
