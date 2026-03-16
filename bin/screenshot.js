#!/usr/bin/env node

/**
 * DUVU 시각적 검증 도구
 *
 * duvu demo 페이지를 다양한 화면비로 캡처하고,
 * 뷰포트 단위로 잘라서 디테일을 놓치지 않도록 한다.
 *
 * 사용법:
 *   node bin/screenshot.js                    # 기본 (데스크톱 + 모바일)
 *   node bin/screenshot.js --port 8080        # 포트 지정
 *   node bin/screenshot.js --out /tmp/shots   # 출력 경로 지정
 *   node bin/screenshot.js --all              # 모든 화면비 (5종)
 */

import { execSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

const args = process.argv.slice(2);
const portIdx = args.indexOf('--port');
const PORT = portIdx >= 0 ? parseInt(args[portIdx + 1]) : 3399;
const outIdx = args.indexOf('--out');
const OUT_DIR = outIdx >= 0 ? resolve(args[outIdx + 1]) : '/tmp/duvu-screenshots';
const ALL = args.includes('--all');
const LIGHT = args.includes('--light');

const VIEWPORTS = ALL ? [
  { name: 'desktop-wide', width: 1920, height: 1080 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
] : [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

// Chromium 경로 찾기
function findChromium() {
  for (const cmd of ['chromium-browser', 'chromium', 'google-chrome']) {
    try {
      return execSync(`which ${cmd} 2>/dev/null`).toString().trim();
    } catch {}
  }
  return null;
}

async function run() {
  const chromePath = findChromium();
  if (!chromePath) {
    console.error('Chromium을 찾을 수 없습니다.');
    process.exit(1);
  }

  // puppeteer 로드: 표준 경로 → /tmp fallback
  let puppeteer;
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  const tryPaths = ['puppeteer', '/tmp/node_modules/puppeteer'];
  for (const p of tryPaths) {
    try { puppeteer = require(p); break; } catch {}
  }
  if (!puppeteer) {
    console.error('puppeteer를 찾을 수 없습니다. npm install puppeteer를 실행하세요.');
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  // 데모 서버 자동 시작
  const { spawn } = await import('child_process');
  const duvuPath = join(__dirname, 'duvu.js');
  const demoProc = spawn('node', [duvuPath, 'demo', String(PORT)], {
    stdio: 'ignore',
    detached: true,
  });
  demoProc.unref();
  // 서버가 뜰 때까지 대기
  let serverReady = false;
  for (let i = 0; i < 20; i++) {
    try {
      const { default: http } = await import('http');
      await new Promise((ok, fail) => {
        const req = http.get(`http://localhost:${PORT}`, res => { res.resume(); ok(); });
        req.on('error', fail);
        req.setTimeout(500, () => { req.destroy(); fail(); });
      });
      serverReady = true;
      break;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  if (!serverReady) {
    try { process.kill(-demoProc.pid); } catch {}
    console.error(`데모 서버가 10초 내에 시작되지 않았습니다 (포트 ${PORT}).`);
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  const manifest = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n── ${vp.name} (${vp.width}×${vp.height}) ──`);
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 3000));

    // 라이트 모드 전환
    if (LIGHT) {
      await page.evaluate(() => {
        const btn = document.querySelector('.nav-theme');
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 500));
    }

    // 페이지 내 모든 링크 수집 (다른 페이지가 있을 경우)
    const links = await page.evaluate(() => {
      const anchors = [...document.querySelectorAll('a[href]')];
      return anchors
        .map(a => a.href)
        .filter(href => href.startsWith(location.origin) && !href.includes('#'))
        .filter((v, i, arr) => arr.indexOf(v) === i);
    });
    const pages = [`http://localhost:${PORT}/`, ...links];

    for (const pageUrl of pages) {
      const pageName = new URL(pageUrl).pathname.replace(/\//g, '') || 'index';

      if (pageUrl !== `http://localhost:${PORT}/`) {
        try {
          await page.goto(pageUrl, { waitUntil: 'networkidle0', timeout: 10000 });
          await new Promise(r => setTimeout(r, 2000));
        } catch {
          console.log(`  건너뜀: ${pageUrl}`);
          continue;
        }
      }

      // 전체 높이 측정
      const totalHeight = await page.evaluate(() => document.body.scrollHeight);
      const sections = Math.ceil(totalHeight / vp.height);

      console.log(`  ${pageName}: ${totalHeight}px 높이, ${sections}섹션 캡처`);

      // 뷰포트 단위로 스크롤하며 캡처
      for (let i = 0; i < sections; i++) {
        const scrollY = i * vp.height;
        await page.evaluate(y => window.scrollTo(0, y), scrollY);
        await new Promise(r => setTimeout(r, 300));

        const filename = `${vp.name}_${pageName}_${String(i + 1).padStart(2, '0')}.png`;
        const filepath = join(OUT_DIR, filename);
        await page.screenshot({ path: filepath });

        manifest.push({
          viewport: vp.name,
          page: pageName,
          section: i + 1,
          scrollY,
          file: filename,
        });
      }

      // 주요 섹션 요소별 정밀 캡처
      const selectors = [
        { sel: '.hero', name: 'hero' },
        { sel: '.explorer', name: 'preset-explorer' },
        { sel: '.preview-section', name: 'live-preview' },
        { sel: '.templates-section', name: 'templates' },
        { sel: '.code-section', name: 'code-output' },
      ];

      for (const { sel, name } of selectors) {
        const el = await page.$(sel);
        if (el) {
          const filename = `${vp.name}_${pageName}_${name}.png`;
          const filepath = join(OUT_DIR, filename);
          await el.screenshot({ path: filepath });
          manifest.push({
            viewport: vp.name,
            page: pageName,
            section: name,
            scrollY: -1,
            file: filename,
          });
        }
      }
    }
  }

  try {
    await browser.close();
  } finally {
    // 데모 서버 종료 (에러 경로에서도 반드시 실행)
    try { process.kill(-demoProc.pid); } catch {}
  }

  // 매니페스트 저장
  writeFileSync(
    join(OUT_DIR, 'manifest.json'),
    JSON.stringify({ capturedAt: new Date().toISOString(), port: PORT, screenshots: manifest }, null, 2)
  );

  console.log(`\n✓ ${manifest.length}장 캡처 완료 → ${OUT_DIR}`);
  console.log(`  매니페스트: ${join(OUT_DIR, 'manifest.json')}`);
}

run().catch(e => { console.error(e); process.exit(1); });
