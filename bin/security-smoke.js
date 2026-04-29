#!/usr/bin/env node

import { execFileSync, spawn } from 'child_process';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';

const root = new URL('..', import.meta.url).pathname;
const port = 36000 + (process.pid % 20000);
const probeDirName = `demo-security-probe-${process.pid}`;
const probeDir = join(root, probeDirName);
const secret = 'duvu-demo-server-boundary';
let server;

function fail(message) {
  console.error(`security smoke failed: ${message}`);
  process.exitCode = 1;
}

async function request(pathname) {
  const res = await fetch(`http://127.0.0.1:${port}${pathname}`);
  return { status: res.status, text: await res.text() };
}

async function waitForServer() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await request('/');
      if (res.status === 200) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('demo 서버가 시작되지 않았습니다.');
}

function assertInvalidDemoPort(value) {
  try {
    execFileSync('node', ['bin/duvu.js', 'demo', value], {
      cwd: root,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    fail(`잘못된 demo 포트가 성공 처리됨: ${value}`);
  } catch (error) {
    const output = `${error.stdout || ''}${error.stderr || ''}`;
    if (!output.includes('demo 포트는 1~65535 사이의 정수여야 합니다.')) {
      fail(`잘못된 demo 포트 오류 메시지가 명확하지 않음: ${value}`);
    }
  }
}

try {
  assertInvalidDemoPort('abc');
  assertInvalidDemoPort('999999');

  mkdirSync(probeDir, { recursive: true });
  writeFileSync(join(probeDir, 'secret.txt'), secret);

  server = spawn('node', ['bin/duvu.js', 'demo', String(port), '--no-open'], {
    cwd: root,
    stdio: 'ignore',
  });

  await waitForServer();

  const traversal = await request(`/%2e%2e/${probeDirName}/secret.txt`);
  if (traversal.status !== 404) {
    fail(`경로 탈출 요청이 404가 아님: ${traversal.status}`);
  }
  if (traversal.text.includes(secret)) {
    fail('데모 루트 밖의 파일 내용이 응답에 포함됨');
  }

  const malformed = await request('/%E0%A4%A');
  if (malformed.status !== 400) {
    fail(`malformed URL 요청이 400이 아님: ${malformed.status}`);
  }

  if (!process.exitCode) console.log('security smoke ok');
} finally {
  if (server && !server.killed) server.kill();
  rmSync(probeDir, { recursive: true, force: true });
}
