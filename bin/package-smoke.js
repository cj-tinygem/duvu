#!/usr/bin/env node

import { execFileSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const root = new URL('..', import.meta.url).pathname;
const tmp = mkdtempSync(join(tmpdir(), 'duvu-pack-'));

function fail(message) {
  console.error(`package smoke failed: ${message}`);
  process.exit(1);
}

function extractJsonBlock(output) {
  const start = output.indexOf('{');
  const end = output.lastIndexOf('}');
  if (start < 0 || end < start) fail('JSON 출력 블록을 찾을 수 없습니다.');
  return JSON.parse(output.slice(start, end + 1));
}

try {
  const packJson = execFileSync('npm', ['pack', '--json', '--pack-destination', tmp], {
    cwd: root,
    encoding: 'utf8',
  });
  const [pack] = JSON.parse(packJson);
  const files = new Set(pack.files.map(file => file.path));
  const disallowed = [
    'demo/clones/osmo/index.html',
    'duvu-v18.6-source.zip',
    'duvu-v18.6-source/',
    'IDEA.md',
    'docs/PRD.md',
  ];
  for (const path of disallowed) {
    if ([...files].some(file => file === path || file.startsWith(path))) {
      fail(`배포 제외 파일이 tarball에 포함됨: ${path}`);
    }
  }
  for (const required of ['bin/duvu.js', 'bin/screenshot.js', 'data/presets.json', 'demo/index.html', 'skills/SKILL.md']) {
    if (!files.has(required)) fail(`필수 파일이 tarball에 없음: ${required}`);
  }

  const tgz = join(tmp, pack.filename);
  execFileSync('tar', ['-xzf', tgz, '-C', tmp], { stdio: 'ignore' });
  const duvu = join(tmp, 'package', 'bin', 'duvu.js');

  const cloneOutput = execFileSync('node', [duvu, 'show', 'clone', 'osmo'], {
    encoding: 'utf8',
  });
  const clone = extractJsonBlock(cloneOutput);
  if (clone.archive?.available !== false) fail('패키지 설치본 clone archive.available이 false가 아님');
  if (clone.archive?.status !== 'metadata-only') fail('패키지 설치본 clone archive.status가 metadata-only가 아님');
  for (const key of ['demoPath', 'localPath', 'absolutePath']) {
    if (Object.prototype.hasOwnProperty.call(clone.archive || {}, key)) {
      fail(`패키지 설치본 clone archive에 로컬 경로 필드가 노출됨: ${key}`);
    }
  }

  const listOutput = execFileSync('node', [duvu, 'list', 'clones'], {
    encoding: 'utf8',
  });
  if (!listOutput.includes('metadata-only')) {
    fail('패키지 설치본 list clones가 metadata-only 상태를 표시하지 않음');
  }

  console.log('package smoke ok');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
