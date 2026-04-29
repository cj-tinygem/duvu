#!/usr/bin/env node

/**
 * DUVU 시각적 검증 도구
 *
 * duvu demo 페이지를 다양한 화면비로 캡처하고,
 * 뷰포트 단위로 잘라서 디테일을 놓치지 않도록 한다.
 *
 * 사용법:
 *   node bin/screenshot.js                    # 기본 (6개 화면비)
 *   node bin/screenshot.js --port 8080        # 포트 지정
 *   node bin/screenshot.js --out /tmp/shots   # 출력 경로 지정
 *   node bin/screenshot.js --audit            # 6개 화면비 렌더 품질 게이트 실행
 *   node bin/screenshot.js --quick --audit    # 빠른 데스크톱+모바일 감사
 */

import { execSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import { createServer as createNetServer } from 'net';
import { dirname, resolve, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);

function readFlagValue(flag) {
  const idx = args.indexOf(flag);
  if (idx < 0) return null;
  const value = args[idx + 1];
  if (!value || value.startsWith('--')) {
    console.error(`${flag} 옵션에는 값이 필요합니다.`);
    process.exit(1);
  }
  return value;
}

const portValue = readFlagValue('--port');
let PORT = portValue ? Number.parseInt(portValue, 10) : 3399;
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  console.error('--port 옵션에는 1~65535 사이의 정수가 필요합니다.');
  process.exit(1);
}

const outValue = readFlagValue('--out');
const OUT_DIR = outValue ? resolve(outValue) : '/tmp/duvu-screenshots';
const QUICK = args.includes('--quick');
const LIGHT = args.includes('--light');
const AUDIT = args.includes('--audit');

// 기본: 6개 뷰포트 전부. --quick: 데스크톱+모바일만.
// 모든 화면비를 항상 검증하는 것이 시스템 기본.
const VIEWPORTS = QUICK ? [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
] : [
  { name: 'desktop-wide', width: 1920, height: 1080 },
  { name: 'compact-landscape', width: 844, height: 390 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
];

async function isPortAvailable(port) {
  return new Promise(resolve => {
    const server = createNetServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}

async function pickEphemeralPort() {
  return new Promise((resolve, reject) => {
    const server = createNetServer();
    server.once('error', reject);
    server.once('listening', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : null;
      server.close(() => {
        if (port) resolve(port);
        else reject(new Error('사용 가능한 임시 포트를 찾지 못했습니다.'));
      });
    });
    server.listen(0, '127.0.0.1');
  });
}

async function stabilizePage(page) {
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-delay: 0ms !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    `,
  });
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    window.scrollTo(0, 0);
  });
}

async function auditRender(page, vp, pageName) {
  const result = await page.evaluate(({ viewportName, pageName: currentPage }) => {
    const issues = [];
    const isVisible = el => {
      if (!el || el.hidden || el.getAttribute('aria-hidden') === 'true') return false;
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number(style.opacity) > 0.01
        && rect.width > 0
        && rect.height > 0;
    };
    const label = el => {
      const text = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);
      const cls = typeof el.className === 'string' && el.className ? `.${el.className.trim().split(/\s+/).slice(0, 3).join('.')}` : '';
      return `${el.tagName.toLowerCase()}${cls}${text ? ` "${text}"` : ''}`;
    };
    const rectOf = el => {
      const rect = el.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
    };
    const rowProfiles = selector => {
      const parent = document.querySelector(selector);
      if (!parent || !isVisible(parent)) return [];
      const parentRect = rectOf(parent);
      const items = [...parent.children].filter(isVisible).map(rectOf);
      const rows = [];
      for (const item of items.sort((a, b) => a.top - b.top || a.left - b.left)) {
        const row = rows.find(candidate => Math.abs(candidate.top - item.top) <= 8);
        if (row) {
          row.items.push(item);
          row.top = Math.min(row.top, item.top);
        } else {
          rows.push({ top: item.top, items: [item] });
        }
      }
      return rows.map(row => ({
        length: row.items.length,
        maxWidthRatio: parentRect.width ? Math.max(...row.items.map(item => item.width)) / parentRect.width : 0,
      }));
    };
    const rowLengths = selector => {
      return rowProfiles(selector).map(row => row.length);
    };
    const singletonLastRowCheck = selector => {
      const rows = rowProfiles(selector);
      const lengths = rows.map(row => row.length);
      const last = rows.at(-1);
      if (lengths.length > 1 && last?.length === 1 && last.maxWidthRatio < 0.72) {
        issues.push(`${currentPage}/${viewportName}: ${selector} singleton 마지막 줄 발생 (${lengths.join('/')})`);
      }
      return lengths;
    };
    const rgbaParts = value => {
      const match = String(value || '').match(/rgba?\(([^)]+)\)/);
      if (!match) return null;
      const parts = match[1].split(',').map(part => Number.parseFloat(part.trim()));
      if (parts.length < 3 || parts.slice(0, 3).some(part => !Number.isFinite(part))) return null;
      return { r: parts[0], g: parts[1], b: parts[2], a: parts.length >= 4 && Number.isFinite(parts[3]) ? parts[3] : 1 };
    };
    const luminance = ({ r, g, b }) => {
      const channels = [r, g, b].map(value => {
        const normalized = value / 255;
        return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    };
    const contrastRatio = (fg, bg) => {
      const l1 = luminance(fg);
      const l2 = luminance(bg);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    };
    const effectiveBackground = el => {
      let current = el;
      while (current && current !== document.documentElement) {
        const bg = rgbaParts(getComputedStyle(current).backgroundColor);
        if (bg && bg.a > 0.85) return bg;
        current = current.parentElement;
      }
      return rgbaParts(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
    };
    const textBounds = el => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const rects = [...range.getClientRects()].filter(rect => rect.width > 0 && rect.height > 0);
      range.detach();
      if (!rects.length) return el.getBoundingClientRect();
      return {
        top: Math.min(...rects.map(rect => rect.top)),
        bottom: Math.max(...rects.map(rect => rect.bottom)),
      };
    };

    const doc = document.documentElement;
    if (doc.scrollWidth > doc.clientWidth + 1) {
      issues.push(`${currentPage}/${viewportName}: 문서 가로 오버플로 ${doc.scrollWidth}px > ${doc.clientWidth}px`);
    }

    for (const el of [...document.body.querySelectorAll('*')]) {
      if (!isVisible(el)) continue;
      const text = (el.innerText || '').trim();
      if (!text || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH'].includes(el.tagName)) continue;
      const ownText = [...el.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
      const childTextElements = [...el.children].filter(child => isVisible(child) && (child.innerText || '').trim()).length;
      if (!ownText && childTextElements > 0) continue;
      const size = Number.parseFloat(getComputedStyle(el).fontSize);
      if (size < 16) issues.push(`${currentPage}/${viewportName}: 16px 미만 텍스트 ${size.toFixed(1)}px ${label(el)}`);
    }

    for (const textEl of [...document.querySelectorAll('.color-name, .color-cat, .tpl-name, .tpl-ref, .pill, .tab-btn, .code-tab, .p-card-label, .dc-label, .list-text')].filter(isVisible)) {
      const style = getComputedStyle(textEl);
      const clippedX = textEl.scrollWidth > textEl.clientWidth + 1;
      const clippedY = textEl.scrollHeight > textEl.clientHeight + 1;
      const hidesOverflow = ['hidden', 'clip'].includes(style.overflow)
        || ['hidden', 'clip'].includes(style.overflowX)
        || ['hidden', 'clip'].includes(style.overflowY);
      const lineClamp = style.webkitLineClamp && style.webkitLineClamp !== 'none';
      if ((clippedX || clippedY || lineClamp) && hidesOverflow) {
        issues.push(`${currentPage}/${viewportName}: 텍스트 클리핑 ${label(textEl)} scroll=${textEl.scrollWidth}x${textEl.scrollHeight} client=${textEl.clientWidth}x${textEl.clientHeight}`);
      }
    }

    const contrastSelectors = [
      '.color-swatch-hex', '.btn-primary', '.btn-secondary', '.tab-btn.active', '.code-tab.active',
      '.dc-badge', '.list-tag', '.hero-card-cta', '.tpl-card', '.pill'
    ];
    for (const textEl of [...document.querySelectorAll(contrastSelectors.join(','))].filter(isVisible)) {
      const style = getComputedStyle(textEl);
      const fg = rgbaParts(style.color);
      if (!fg || fg.a < 0.85) continue;
      const bg = effectiveBackground(textEl);
      const ratio = contrastRatio(fg, bg);
      const fontSize = Number.parseFloat(style.fontSize) || 16;
      const fontWeight = Number.parseFloat(style.fontWeight) || 400;
      const minRatio = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700) ? 3 : 4.5;
      if (ratio < minRatio) {
        issues.push(`${currentPage}/${viewportName}: 대비 부족 ${ratio.toFixed(2)} < ${minRatio} ${label(textEl)}`);
      }
    }

    const controlSelectors = [
      'button', 'a[href]', '.tab-btn', '.code-tab', '.pill', '.color-card', '.tpl-card',
      '.preview-card', '.button-primary', '.button-secondary', '.nav-link'
    ];
    for (const el of [...document.querySelectorAll(controlSelectors.join(','))].filter(isVisible)) {
      const rect = rectOf(el);
      if (rect.left < -1 || rect.right > window.innerWidth + 1) {
        issues.push(`${currentPage}/${viewportName}: 화면 밖으로 나간 요소 ${label(el)} (${rect.left.toFixed(1)}..${rect.right.toFixed(1)})`);
      }
      if ((el.matches('button, a[href], .tab-btn, .code-tab, .pill') && Math.min(rect.width, rect.height) < 36) || rect.height < 32) {
        issues.push(`${currentPage}/${viewportName}: 터치/클릭 면적 부족 ${label(el)} ${rect.width.toFixed(0)}x${rect.height.toFixed(0)}`);
      }
    }

    const codeRows = rowLengths('.code-tabs');
    if (codeRows.length && !((window.innerWidth > 980 && codeRows.length === 1 && codeRows[0] === 7) || (window.innerWidth <= 980 && codeRows.length === 2 && codeRows[0] === 4 && codeRows[1] === 3))) {
      issues.push(`${currentPage}/${viewportName}: 코드 탭 행 분산 오류 (${codeRows.join('/')})`);
    }
    for (const selector of [
      '.tab-bar', '#colorGrid', '#typoGrid', '#motionGrid', '#styleGrid', '#gradientGrid',
      '#layoutGrid', '.template-grid', '.preview-grid', '.gallery-grid', '.product-grid'
    ]) singletonLastRowCheck(selector);

    const card = document.querySelector('.color-card');
    if (card) {
      const radius = Number.parseFloat(getComputedStyle(card).borderRadius);
      const height = card.getBoundingClientRect().height;
      for (const other of [...document.querySelectorAll('.color-card')].filter(isVisible)) {
        const otherRadius = Number.parseFloat(getComputedStyle(other).borderRadius);
        if (Math.abs(otherRadius - radius) > 0.5) issues.push(`${currentPage}/${viewportName}: 컬러 카드 radius 불일치`);
        const otherHeight = other.getBoundingClientRect().height;
        if (Math.abs(otherHeight - height) > 1) issues.push(`${currentPage}/${viewportName}: 컬러 카드 높이 불일치 ${height.toFixed(1)}px/${otherHeight.toFixed(1)}px`);
      }
    }

    for (const cardEl of [...document.querySelectorAll('.color-card')].filter(isVisible)) {
      const name = cardEl.querySelector('.color-name');
      const cat = cardEl.querySelector('.color-cat');
      const swatch = cardEl.querySelector('.color-swatch');
      const info = cardEl.querySelector('.color-info');
      if (!name || !cat) continue;
      const nameText = textBounds(name);
      const catText = textBounds(cat);
      const gap = catText.top - nameText.bottom;
      const minGap = ['mobile', 'compact-landscape'].includes(viewportName) ? -0.5 : 2;
      if (gap < minGap || gap > 8) issues.push(`${currentPage}/${viewportName}: 팔레트 라벨 간격 오류 ${gap.toFixed(1)}px ${label(cardEl)}`);
      if (swatch && info) {
        const swatchHeight = swatch.getBoundingClientRect().height;
        const cardHeight = cardEl.getBoundingClientRect().height;
        const ratio = swatchHeight / cardHeight;
        if (ratio < 0.30 || ratio > 0.39) {
          issues.push(`${currentPage}/${viewportName}: 팔레트 swatch/info 비율 오류 ${(ratio * 100).toFixed(1)}% ${label(cardEl)}`);
        }
        const infoStyle = getComputedStyle(info);
        const infoBottomPad = Number.parseFloat(infoStyle.paddingBottom) || 0;
        const trailingSpace = info.getBoundingClientRect().bottom - catText.bottom - infoBottomPad;
        if (trailingSpace > 17) {
          issues.push(`${currentPage}/${viewportName}: 팔레트 정보 하단 여백 과다 ${trailingSpace.toFixed(1)}px ${label(cardEl)}`);
        }
        if (cardEl.scrollHeight > cardEl.clientHeight + 1) {
          issues.push(`${currentPage}/${viewportName}: 팔레트 카드 콘텐츠 세로 클리핑 ${cardEl.scrollHeight}px > ${cardEl.clientHeight}px ${label(cardEl)}`);
        }
      }
    }

    for (const block of [...document.querySelectorAll('.code-preview-block')].filter(isVisible)) {
      const radius = Number.parseFloat(getComputedStyle(block).borderRadius);
      if (radius > 14) issues.push(`${currentPage}/${viewportName}: 코드 표면 radius 과다 ${radius.toFixed(1)}px`);
    }

    return { viewport: viewportName, page: currentPage, issues };
  }, { viewportName: vp.name, pageName });

  return result;
}

async function auditInteractiveStates(page, vp, pageName) {
  const results = [];
  const tabCount = await page.$$eval('.tab-btn', buttons => buttons.length).catch(() => 0);
  for (let i = 0; i < tabCount; i++) {
    const tabName = await page.$$eval('.tab-btn', (buttons, index) => {
      const button = buttons[index];
      button.click();
      return button.dataset.tab || button.textContent.trim() || `tab-${index + 1}`;
    }, i);
    await stabilizePage(page);
    await new Promise(r => setTimeout(r, 80));
    results.push(await auditRender(page, vp, `${pageName}-tab-${tabName}`));
  }

  const templateCount = await page.$$eval('.tpl-card', cards => cards.length).catch(() => 0);
  for (let i = 0; i < templateCount; i++) {
    const templateName = await page.$$eval('.tpl-card', (cards, index) => {
      const card = cards[index];
      card.click();
      return card.dataset.id || card.textContent.trim() || `template-${index + 1}`;
    }, i);
    await stabilizePage(page);
    await new Promise(r => setTimeout(r, 80));
    results.push(await auditRender(page, vp, `${pageName}-template-${templateName}`));
  }

  return results;
}

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
  if (portValue) {
    if (!(await isPortAvailable(PORT))) {
      console.error(`--port ${PORT}는 이미 사용 중입니다.`);
      process.exit(1);
    }
  } else {
    PORT = await pickEphemeralPort();
  }

  const chromePath = findChromium();
  if (!chromePath) {
    console.error('Chromium을 찾을 수 없습니다.');
    process.exit(1);
  }

  // puppeteer-core는 기존 시스템 Chromium을 사용하므로 패키지 설치 시 브라우저를 내려받지 않는다.
  let puppeteer;
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  const tryPaths = ['puppeteer-core', 'puppeteer', '/tmp/node_modules/puppeteer-core', '/tmp/node_modules/puppeteer'];
  for (const p of tryPaths) {
    try { puppeteer = require(p); break; } catch {}
  }
  if (!puppeteer) {
    console.error('puppeteer-core를 찾을 수 없습니다. npm install을 실행하세요.');
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  // 데모 서버 자동 시작
  const { spawn } = await import('child_process');
  const duvuPath = join(__dirname, 'duvu.js');
  let demoProc = null;
  let browser = null;
  const manifest = [];
  const auditResults = [];

  try {
    demoProc = spawn('node', [duvuPath, 'demo', String(PORT), '--no-open'], {
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
    if (!serverReady) throw new Error(`데모 서버가 10초 내에 시작되지 않았습니다 (포트 ${PORT}).`);

    browser = await puppeteer.launch({
      browser: 'chrome',
      headless: true,
      executablePath: chromePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    });

    const page = await browser.newPage();

    for (const vp of VIEWPORTS) {
      console.log(`\n── ${vp.name} (${vp.width}×${vp.height}) ──`);
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle0', timeout: 15000 });
      await stabilizePage(page);
      await new Promise(r => setTimeout(r, AUDIT ? 500 : 3000));

      // 라이트 모드 전환
      if (LIGHT) {
        await page.evaluate(() => {
          const btn = document.querySelector('.nav-theme');
          if (btn) btn.click();
        });
        await stabilizePage(page);
        await new Promise(r => setTimeout(r, 500));
      }

      // 페이지 내에서 실제 사용자에게 보이는 내부 링크만 수집한다.
      const links = await page.evaluate(() => {
        const anchors = [...document.querySelectorAll('a[href]')];
        return anchors
          .filter(a => {
            const style = window.getComputedStyle(a);
            const rect = a.getBoundingClientRect();
            return style.display !== 'none'
              && style.visibility !== 'hidden'
              && style.opacity !== '0'
              && rect.width > 0
              && rect.height > 0
              && !a.hidden
              && a.getAttribute('aria-hidden') !== 'true';
          })
          .map(a => a.href)
          .filter(href => href.startsWith(location.origin) && !href.includes('#'))
          .filter((v, i, arr) => arr.indexOf(v) === i);
      });
      const pages = [`http://localhost:${PORT}/`, ...links];

      for (const pageUrl of pages) {
        const pageName = new URL(pageUrl).pathname.replace(/\//g, '') || 'index';

        if (pageUrl !== `http://localhost:${PORT}/`) {
          try {
            const response = await page.goto(pageUrl, { waitUntil: 'networkidle0', timeout: 10000 });
            if (!response || !response.ok()) {
              console.log(`  건너뜀: ${pageUrl}`);
              continue;
            }
            await stabilizePage(page);
            await new Promise(r => setTimeout(r, AUDIT ? 500 : 2000));
          } catch {
            console.log(`  건너뜀: ${pageUrl}`);
            continue;
          }
        }

        if (AUDIT) {
          const audit = await auditRender(page, vp, pageName);
          auditResults.push(audit);
          const stateAudits = await auditInteractiveStates(page, vp, pageName);
          auditResults.push(...stateAudits);
          const auditIssueCount = audit.issues.length + stateAudits.reduce((sum, item) => sum + item.issues.length, 0);
          if (auditIssueCount) {
            console.log(`  렌더 감사 실패: ${auditIssueCount}건`);
          } else {
            console.log(`  렌더 감사 통과 (${stateAudits.length + 1}개 상태)`);
          }
          await page.goto(pageUrl, { waitUntil: 'networkidle0', timeout: 15000 });
          await stabilizePage(page);
          if (LIGHT) {
            await page.evaluate(() => {
              const btn = document.querySelector('.nav-theme');
              if (btn) btn.click();
            });
            await stabilizePage(page);
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

    // 매니페스트 저장
    writeFileSync(
      join(OUT_DIR, 'manifest.json'),
      JSON.stringify({ capturedAt: new Date().toISOString(), port: PORT, screenshots: manifest, audits: auditResults }, null, 2)
    );

    console.log(`\n✓ ${manifest.length}장 캡처 완료 → ${OUT_DIR}`);
    console.log(`  매니페스트: ${join(OUT_DIR, 'manifest.json')}`);

    const issues = auditResults.flatMap(result => result.issues);
    if (AUDIT) {
      if (issues.length) {
        console.error(`\n렌더 품질 감사 실패: ${issues.length}건`);
        for (const issue of issues.slice(0, 80)) console.error(`- ${issue}`);
        if (issues.length > 80) console.error(`- ... ${issues.length - 80}건 추가`);
        throw new Error('렌더 품질 감사 실패');
      }
      console.log(`✓ 렌더 품질 감사 통과 (${auditResults.length}개 화면/페이지)`);
    }
  } finally {
    if (browser) {
      try { await browser.close(); } catch {}
    }
    if (demoProc?.pid) {
      try { process.kill(-demoProc.pid); } catch {}
    }
  }
}

run().catch(e => { console.error(e); process.exit(1); });
