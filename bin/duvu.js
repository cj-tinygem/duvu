#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join, resolve, relative, isAbsolute } from 'path';
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync, statSync, appendFileSync, renameSync, unlinkSync, readdirSync } from 'fs';
import { execSync } from 'child_process';
import { createServer } from 'http';
import { homedir } from 'os';
import { buildBalanceContract } from '../lib/duvu-balance.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const DATA_DIR = join(ROOT, 'data');
const DEFAULTS_DIR = join(DATA_DIR, 'defaults');
const PRESETS_FILE = join(DATA_DIR, 'presets.json');
const SKILLS_DIR = join(ROOT, 'skills');
const DEMO_DIR = join(ROOT, 'demo');

// ─── Helpers ───
function loadPresets() {
  try {
    return JSON.parse(readFileSync(PRESETS_FILE, 'utf8'));
  } catch (e) {
    console.error(`\x1b[31mpresets.json 로드 실패: ${e.message}\x1b[0m`);
    process.exit(1);
  }
}
function savePresets(data) {
  writeFileSync(PRESETS_FILE, JSON.stringify(data, null, 2));
}
function ensureDefaults() {
  if (!existsSync(join(DEFAULTS_DIR, 'presets.json'))) {
    mkdirSync(DEFAULTS_DIR, { recursive: true });
    copyFileSync(PRESETS_FILE, join(DEFAULTS_DIR, 'presets.json'));
  }
}
const HOME = process.env.HOME || process.env.USERPROFILE || '~';
const [,, cmd, ...args] = process.argv;

// ─── Color output ───
const c = {
  r: '\x1b[0m', b: '\x1b[1m', d: '\x1b[2m',
  cyan: '\x1b[36m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', magenta: '\x1b[35m',
};

let PKG_VERSION = '0.0.0';
try { PKG_VERSION = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version; } catch {}

// ─── Usage Log ───
// 프로젝트별 .duvu/usage.jsonl에 사용 이력 기록
// 글로벌 ~/.duvu/logs/usage.jsonl에도 복제 (통합 분석용)
const LOG_MAX_BYTES = 1024 * 1024; // 1MB 로테이션

function getProjectLogDir() {
  // cwd에서 가장 가까운 git root 또는 package.json이 있는 디렉토리를 프로젝트 루트로 판단
  let dir = process.cwd();
  for (let i = 0; i < 20; i++) {
    if (existsSync(join(dir, '.git')) || existsSync(join(dir, 'package.json'))) {
      return join(dir, '.duvu');
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // 프로젝트 루트를 못 찾으면 cwd 사용
  return join(process.cwd(), '.duvu');
}

function getGlobalLogDir() {
  return join(homedir(), '.duvu', 'logs');
}

function rotateIfNeeded(logFile) {
  try {
    if (!existsSync(logFile)) return;
    const size = statSync(logFile).size;
    if (size < LOG_MAX_BYTES) return;
    // usage.jsonl → usage.1.jsonl, 기존 .1 → .2, ..., .4 → 삭제
    for (let i = 4; i >= 1; i--) {
      const old = logFile.replace('.jsonl', `.${i}.jsonl`);
      const next = logFile.replace('.jsonl', `.${i + 1}.jsonl`);
      if (i === 4 && existsSync(old)) { try { unlinkSync(old); } catch {} }
      else if (existsSync(old)) { try { renameSync(old, next); } catch {} }
    }
    try { renameSync(logFile, logFile.replace('.jsonl', '.1.jsonl')); } catch {}
  } catch {}
}

function writeLog(entry) {
  const record = {
    ts: new Date().toISOString(),
    v: PKG_VERSION,
    cwd: process.cwd(),
    ...entry,
  };
  const line = JSON.stringify(record) + '\n';

  // 프로젝트별 로그
  try {
    const projDir = getProjectLogDir();
    mkdirSync(projDir, { recursive: true });
    const projLog = join(projDir, 'usage.jsonl');
    rotateIfNeeded(projLog);
    appendFileSync(projLog, line);
  } catch {}

  // 글로벌 로그 (통합 분석용)
  try {
    const globalDir = getGlobalLogDir();
    mkdirSync(globalDir, { recursive: true });
    const globalLog = join(globalDir, 'usage.jsonl');
    rotateIfNeeded(globalLog);
    appendFileSync(globalLog, line);
  } catch {}
}

function readLogs(logFile, limit = 20) {
  if (!existsSync(logFile)) return [];
  const lines = readFileSync(logFile, 'utf8').trim().split('\n').filter(Boolean);
  return lines.slice(-limit).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

function logCmd() {
  // duvu log '{"type":"decision","domain":"saas",...}'
  const input = args.join(' ');
  if (!input) {
    console.log(`${c.yellow}사용법:${c.r} duvu log '<JSON>'`);
    console.log(`${c.d}AI 설계 결정을 기록합니다.${c.r}`);
    console.log(`\n${c.cyan}예시:${c.r}`);
    console.log(`  duvu log '{"type":"decision","domain":"saas","presets":{"color":"toss","typo":"inter"},"intent":"전문적 톤"}'`);
    console.log(`  duvu log '{"type":"eval","quality":"good","issues":[]}'`);
    return;
  }
  try {
    const data = JSON.parse(input);
    writeLog({ cmd: 'log', ...data });
    console.log(`${c.green}✓${c.r} 기록 완료`);
  } catch (e) {
    console.log(`${c.red}JSON 파싱 오류:${c.r} ${e.message}`);
  }
}

function logsCmd() {
  const flag = args[0];

  if (flag === '--clear') {
    const projLog = join(getProjectLogDir(), 'usage.jsonl');
    if (existsSync(projLog)) {
      writeFileSync(projLog, '');
      console.log(`${c.green}✓${c.r} 프로젝트 로그 초기화`);
    } else {
      console.log(`${c.d}로그 없음${c.r}`);
    }
    return;
  }

  if (flag === '--all') {
    // 글로벌 로그에서 통합 조회
    const globalLog = join(getGlobalLogDir(), 'usage.jsonl');
    const entries = readLogs(globalLog, 50);
    if (entries.length === 0) { console.log(`${c.d}글로벌 로그 없음${c.r}`); return; }
    console.log(`${c.cyan}── 글로벌 사용 이력 (최근 ${entries.length}건) ──${c.r}\n`);
    for (const e of entries) printLogEntry(e);
    return;
  }

  if (flag === '--stats') {
    const globalLog = join(getGlobalLogDir(), 'usage.jsonl');
    if (!existsSync(globalLog)) { console.log(`${c.d}로그 없음${c.r}`); return; }
    const all = readLogs(globalLog, 10000);
    printStats(all);
    return;
  }

  // 기본: 프로젝트 로그 조회
  const projLog = join(getProjectLogDir(), 'usage.jsonl');
  const entries = readLogs(projLog, parseInt(flag) || 20);
  if (entries.length === 0) { console.log(`${c.d}이 프로젝트의 로그 없음${c.r}`); return; }
  console.log(`${c.cyan}── 프로젝트 사용 이력 (최근 ${entries.length}건) ──${c.r}\n`);
  for (const e of entries) printLogEntry(e);
}

function printLogEntry(e) {
  const time = e.ts ? e.ts.replace('T', ' ').slice(0, 19) : '?';
  const cmd = e.cmd || '?';

  if (cmd === 'log') {
    const type = e.type || 'note';
    const domain = e.domain ? ` [${e.domain}]` : '';
    const presets = e.presets ? ` ${c.d}${JSON.stringify(e.presets)}${c.r}` : '';
    const intent = e.intent ? ` — ${e.intent}` : '';
    const quality = e.quality ? ` ${e.quality === 'good' ? c.green : c.yellow}${e.quality}${c.r}` : '';
    console.log(`  ${c.d}${time}${c.r} ${c.magenta}${type}${c.r}${domain}${presets}${intent}${quality}`);
  } else {
    const detail = e.args ? ` ${e.args.join(' ')}` : '';
    const result = e.result ? ` → ${c.d}${typeof e.result === 'string' ? e.result : JSON.stringify(e.result)}${c.r}` : '';
    const err = e.error ? ` ${c.red}✗ ${e.error}${c.r}` : '';
    console.log(`  ${c.d}${time}${c.r} ${c.cyan}${cmd}${c.r}${detail}${result}${err}`);
  }
}

function printStats(entries) {
  console.log(`${c.cyan}── DUVU 사용 통계 ──${c.r}\n`);
  console.log(`  총 기록: ${c.b}${entries.length}${c.r}건\n`);

  // 명령 빈도
  const cmds = {};
  entries.forEach(e => { cmds[e.cmd] = (cmds[e.cmd] || 0) + 1; });
  console.log(`  ${c.b}명령 빈도:${c.r}`);
  Object.entries(cmds).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`    ${k}: ${v}회`);
  });

  // 프리셋 사용 빈도 (generate, template, log 중 presets 필드)
  const presetUsage = { color: {}, typo: {}, style: {}, motion: {}, layout: {} };
  entries.forEach(e => {
    const p = e.presets || {};
    for (const [cat, id] of Object.entries(p)) {
      if (presetUsage[cat]) presetUsage[cat][id] = (presetUsage[cat][id] || 0) + 1;
    }
    // generate의 첫 번째 arg는 color
    if (e.cmd === 'generate' && e.args?.[0]) {
      presetUsage.color[e.args[0]] = (presetUsage.color[e.args[0]] || 0) + 1;
    }
  });
  for (const [cat, usage] of Object.entries(presetUsage)) {
    const sorted = Object.entries(usage).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      console.log(`\n  ${c.b}${cat} 사용:${c.r}`);
      sorted.slice(0, 5).forEach(([k, v]) => console.log(`    ${k}: ${v}회`));
    }
  }

  // 도메인 분포
  const domains = {};
  entries.filter(e => e.domain).forEach(e => { domains[e.domain] = (domains[e.domain] || 0) + 1; });
  if (Object.keys(domains).length > 0) {
    console.log(`\n  ${c.b}도메인:${c.r}`);
    Object.entries(domains).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`    ${k}: ${v}회`));
  }

  // 프로젝트 분포
  const projects = {};
  entries.forEach(e => {
    const p = e.cwd || '?';
    const name = p.split('/').pop() || p.split('\\').pop() || p;
    projects[name] = (projects[name] || 0) + 1;
  });
  if (Object.keys(projects).length > 1) {
    console.log(`\n  ${c.b}프로젝트:${c.r}`);
    Object.entries(projects).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`    ${k}: ${v}회`));
  }

  // 에러 통계
  const errors = entries.filter(e => e.error);
  if (errors.length > 0) {
    const errTypes = {};
    errors.forEach(e => { const key = `${e.cmd}: ${e.error}`; errTypes[key] = (errTypes[key] || 0) + 1; });
    console.log(`\n  ${c.b}${c.red}에러:${c.r}`);
    Object.entries(errTypes).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`    ${k}: ${v}회`));
  }
}

const TYPE_MAP = {
  color: 'color', colors: 'color',
  typo: 'typography', typography: 'typography',
  layout: 'layout', style: 'style', motion: 'motion',
  gradient: 'gradient', gradients: 'gradient',
  template: 'templates', templates: 'templates',
  component: 'components', components: 'components',
  clone: 'clones', clones: 'clones',
  interaction: 'interaction_patterns', interactions: 'interaction_patterns', pattern: 'interaction_patterns', patterns: 'interaction_patterns',
};

function banner() {
  const ver = `v${PKG_VERSION}`;
  console.log(`
${c.cyan}${c.b}  ╔══════════════════════════════════════╗
  ║          D U V U  ${ver.padEnd(19)}║
  ║    범용 디자인 시스템 엔진            ║
  ╚══════════════════════════════════════╝${c.r}
`);
}

// ═══════════════════════════════════════════════
// COMMANDS
// ═══════════════════════════════════════════════

function help() {
  banner();
  console.log(`${c.b}사용법:${c.r}  duvu <명령> [옵션]

${c.b}${c.cyan}── 조회 ──${c.r}
  ${c.green}list${c.r} [colors|typo|layout|style|motion|gradient|component|templates|clones]
                          프리셋 목록 조회
  ${c.green}show${c.r} <type> <id>       프리셋 상세 정보
  ${c.green}info${c.r}                   시스템 전체 통계
  ${c.green}show tokens all${c.r}        레이아웃 토큰 전체 조회
  ${c.green}tokens export${c.r} [--format dtcg|figma|figma-dtcg|figma-api] [--preset <id>|--hex <#hex>] [--mode dark|light]
                          DTCG 호환 / Figma 매핑용 / Figma import/API용 토큰 JSON 출력
  ${c.green}tokens contract${c.r} [--template <id>] [--format json|md]
                          AI 프론트엔드 생성을 위한 디자인 계약 출력
  ${c.green}tokens score${c.r} [--template <id>]  템플릿 생성 품질 점수/실패 이유 출력
  ${c.green}tokens lint${c.r} <html-file> [--format json]
                          생성된 HTML/CSS의 AI 슬롭/토큰 위반 검사
  ${c.green}tokens sync-figma${c.r} --file-key <key> [--token <token>|FIGMA_TOKEN] [--dry-run]
                          Figma Variables REST API에 figma-api payload 적용
  ${c.green}tokens audit${c.r}            토큰 그래프/alias/생성형 UI 품질 게이트 검증
  ${c.green}demo${c.r} [port] [--no-open] [--window-size 1440x1000]
                          데모 웹페이지 실행. WSL에서는 새 데스크톱 크기 Chrome 창으로 열기

${c.b}${c.cyan}── 생성 ──${c.r}
  ${c.green}generate${c.r} <preset|hex> [--platform css|tailwind|flutter|swiftui|compose|unity|react-native]
                          디자인 토큰 코드 생성
  ${c.green}template${c.r} <id>          템플릿 조합 정보 + CSS 변수 생성

${c.b}${c.cyan}── 확장 ──${c.r}
  ${c.green}match${c.r} <domain> [--tone warm|cool|neutral]
                          도메인 + 톤 기반 프리셋 매칭
                          ${c.d}도메인: saas, fintech, ecommerce, luxury, dev, creative...${c.r}
                          ${c.d}톤: warm(따뜻한), cool(차가운), neutral(중성적)${c.r}
  ${c.green}add${c.r} <type> <json>      프리셋/템플릿 추가
  ${c.green}remove${c.r} <type> <id>     프리셋/템플릿 삭제 (기본값 보호)
  ${c.green}reset${c.r} [type]           기본값으로 복원

${c.b}${c.cyan}── 스킬 설치 ──${c.r}
  ${c.green}install-skill${c.r}          모든 AI 에이전트에 스킬 설치
                          ${c.d}.claude/skills/duvu/ (Claude Code)${c.r}
                          ${c.d}.agents/skills/duvu/ (Codex+Gemini 공용)${c.r}
  ${c.green}install-skill --claude${c.r}  Claude Code만
  ${c.green}install-skill --codex${c.r}   Codex CLI만
  ${c.green}install-skill --gemini${c.r}  Gemini CLI만

${c.b}${c.cyan}── 검증 ──${c.r}
  ${c.green}screenshot${c.r}            데모 페이지 시각적 검증용 스크린샷 캡처
                          ${c.d}기본: 6종 화면비 전부 / --quick: 데스크톱+모바일만${c.r}
                          ${c.d}--light: 라이트 모드 / --out <경로>: 저장 위치${c.r}
  ${c.green}audit${c.r}                 HIG + MD3 + WCAG AA 컴플라이언스 자동 감사
                          ${c.d}컬러 대비, 터치 타겟, 타이포 스케일, 도메인 커버리지, singleton 마지막 줄, 줄바꿈${c.r}
  ${c.green}tokens audit${c.r}            DTCG 구조, alias 그래프, AI 슬롭 방지 품질 게이트
  ${c.green}tokens score${c.r}            템플릿별 hierarchy/spacing/color/responsive 품질 점수
  ${c.green}tokens lint${c.r} <html-file>  생성 결과물의 placeholder/CTA/token/reduced-motion 검사

${c.b}${c.cyan}── 사용 이력 ──${c.r}
  ${c.green}log${c.r} '<JSON>'           AI 설계 결정 기록 (프리셋 선택 근거, 평가 등)
  ${c.green}logs${c.r}                   프로젝트 사용 이력 조회 (최근 20건)
  ${c.green}logs${c.r} --all             글로벌 사용 이력 (모든 프로젝트)
  ${c.green}logs${c.r} --stats           통계 (프리셋 빈도, 도메인 분포)
  ${c.green}logs${c.r} --clear           프로젝트 로그 초기화

${c.b}${c.cyan}── 기타 ──${c.r}
  ${c.green}help${c.r}                   이 도움말
  ${c.green}version${c.r}               버전 정보
`);
}

function version() {
  console.log(`DUVU v${PKG_VERSION}`);
}

function info() {
  const data = loadPresets();
  banner();
  console.log(`${c.b}시스템 통계:${c.r}
  ${c.cyan}컬러 프리셋${c.r}     ${data.color?.length || 0}개
  ${c.cyan}타이포 프리셋${c.r}    ${data.typography?.length || 0}개
  ${c.cyan}레이아웃 프리셋${c.r}  ${data.layout?.length || 0}개
  ${c.cyan}스타일 프리셋${c.r}    ${data.style?.length || 0}개
  ${c.cyan}모션 프리셋${c.r}      ${data.motion?.length || 0}개
  ${c.cyan}그라디언트${c.r}       ${data.gradient?.length || 0}개
  ${c.cyan}컴포넌트${c.r}         ${data.components?.length || 0}개
  ${c.cyan}인터랙션 패턴${c.r}   ${data.interaction_patterns?.length || 0}개
  ${c.cyan}템플릿${c.r}           ${data.templates?.length || 0}개
  ${c.cyan}레이아웃 토큰${c.r}   ${Object.keys(data.layout_tokens || {}).length}개
  ${c.cyan}도메인${c.r}           ${new Set([...(data.color||[]),...(data.typography||[]),...(data.layout||[]),...(data.style||[]),...(data.motion||[])].flatMap(p=>p.domains||[])).size}개
  ${c.cyan}톤${c.r}               warm:${(data.color||[]).filter(c=>c.tone==='warm').length} cool:${(data.color||[]).filter(c=>c.tone==='cool').length} neutral:${(data.color||[]).filter(c=>c.tone==='neutral').length}

  ${c.d}총 프리셋: ${(data.color?.length||0) + (data.typography?.length||0) + (data.layout?.length||0) + (data.style?.length||0) + (data.motion?.length||0) + (data.gradient?.length||0) + (data.components?.length||0) + (data.templates?.length||0)}개${c.r}
  ${c.d}데이터: ${PRESETS_FILE}${c.r}
  ${c.d}기본값: ${DEFAULTS_DIR}/presets.json${c.r}
`);
}

function list(type) {
  const data = loadPresets();

  if (!type) {
    // List all categories
    for (const [key, arr] of Object.entries(data)) {
      if (Array.isArray(arr)) {
        console.log(`\n${c.b}${c.cyan}${key}${c.r} (${arr.length}개)`);
        for (const item of arr) {
          const desc = item.description || item.mood || item.name || '';
          console.log(`  ${c.green}${(item.id || '').padEnd(22)}${c.r} ${c.d}${desc.substring(0, 50)}${c.r}`);
        }
      }
    }
    writeLog({ cmd: 'list', args: ['all'] });
    return;
  }

  const key = TYPE_MAP[type];
  if (!key || !data[key]) {
    console.log(`${c.red}알 수 없는 타입: ${type}${c.r}`);
    console.log(`사용 가능: colors, typo, layout, style, motion, gradient, component, interaction, templates, clones`);
    return;
  }

  console.log(`\n${c.b}${c.cyan}${key}${c.r} (${data[key].length}개)\n`);
  for (const item of data[key]) {
    if (key === 'color') {
      console.log(`  ${c.green}${item.id.padEnd(22)}${c.r} src: ${c.yellow}${item.src}${c.r}  ${c.d}${item.name || ''}${c.r}`);
    } else if (key === 'typography') {
      console.log(`  ${c.green}${item.id.padEnd(22)}${c.r} ${item.family}  ${c.d}${item.mood || ''}${c.r}`);
    } else if (key === 'templates') {
      console.log(`  ${c.green}${item.id.padEnd(22)}${c.r} ${c.yellow}${item.color || ''}${c.r} + ${item.typography || ''}  ${c.d}${(item.description || '').substring(0, 40)}${c.r}`);
    } else if (key === 'clones') {
      const clone = withCloneArchiveStatus(item);
      const status = clone.archive.available ? 'local-archive' : clone.archive.status;
      const desc = item.description || item.name || '';
      console.log(`  ${c.green}${item.id.padEnd(22)}${c.r} ${c.yellow}${status.padEnd(14)}${c.r} ${c.d}${desc.substring(0, 50)}${c.r}`);
    } else {
      const desc = item.description || item.name || '';
      console.log(`  ${c.green}${item.id.padEnd(22)}${c.r} ${c.d}${desc.substring(0, 50)}${c.r}`);
    }
  }
  writeLog({ cmd: 'list', args: [type] });
}

function show(type, id) {
  if (!type || !id) {
    console.log(`${c.red}사용법: duvu show <type> <id>${c.r}`);
    return;
  }
  const data = loadPresets();

  // layout_tokens 특별 처리
  if (type === 'tokens' || type === 'layout-tokens') {
    if (!data.layout_tokens) return console.log(`${c.red}layout_tokens가 없습니다.${c.r}`);
    if (id === 'all') {
      console.log(`\n${c.b}${c.cyan}layout_tokens${c.r}\n`);
      Object.entries(data.layout_tokens).forEach(([k, v]) => {
        console.log(`  ${c.green}${k.padEnd(28)}${c.r} ${v}`);
      });
    } else {
      const val = data.layout_tokens[id];
      if (!val) return console.log(`${c.red}토큰 '${id}'을(를) 찾을 수 없습니다.${c.r}`);
      console.log(`${c.cyan}${id}${c.r}: ${val}`);
    }
    return;
  }

  const key = TYPE_MAP[type];
  if (!key || !data[key]) {
    console.log(`${c.red}알 수 없는 타입: ${type}${c.r}`);
    return;
  }
  const item = data[key].find(i => i.id === id);
  if (!item) {
    console.log(`${c.red}'${id}'을(를) 찾을 수 없습니다.${c.r}`);
    writeLog({ cmd: 'show', args: [type, id], error: 'not found' });
    return;
  }
  const output = key === 'clones' ? withCloneArchiveStatus(item) : item;
  console.log(`\n${c.b}${c.cyan}${key}/${id}${c.r}\n`);
  console.log(JSON.stringify(output, null, 2));
  writeLog({ cmd: 'show', args: [type, id] });
}

function withCloneArchiveStatus(item) {
  const archive = item.archive || {};
  const inferredDemoPath = join('clones', item.id, 'index.html');
  const absolutePath = join(DEMO_DIR, inferredDemoPath);
  const archiveAvailable = Boolean(absolutePath && existsSync(absolutePath));
  const baseArchive = {
    localOnly: true,
    packageIncluded: false,
    available: archiveAvailable,
    status: archiveAvailable ? 'local-archive' : 'metadata-only',
  };
  if (!archiveAvailable) {
    return {
      ...item,
      archive: {
        ...baseArchive,
        note: 'npm 패키지에는 클론 아카이브가 포함되지 않습니다. extractedTokens와 presetId만 사용하세요.',
      },
    };
  }
  return {
    ...item,
    archive: {
      ...archive,
      ...baseArchive,
      demoPath: inferredDemoPath,
      localPath: join('demo', inferredDemoPath),
      absolutePath,
      note: '로컬 demo/clones 아카이브를 사용할 수 있습니다.',
    },
  };
}

function generate(presetOrHex, platform = 'css') {
  if (!presetOrHex) {
    console.log(`${c.red}사용법: duvu generate <preset-id|#hex> [--platform css|tailwind|flutter|swiftui|compose|unity|react-native]${c.r}`);
    return;
  }
  const data = loadPresets();
  let colorPreset;
  
  if (presetOrHex.startsWith('#')) {
    if (!/^#[0-9a-fA-F]{6}$/.test(presetOrHex)) {
      console.log(`${c.red}6자리 HEX 코드가 필요합니다 (예: #3182F6)${c.r}`);
      writeLog({ cmd: 'generate', args: [presetOrHex], error: 'invalid hex' });
      return;
    }
    console.log(`${c.cyan}커스텀 색상 ${presetOrHex}에서 테마 도출 중...${c.r}`);
    colorPreset = deriveFromHex(presetOrHex);
  } else {
    colorPreset = data.color.find(c => c.id === presetOrHex);
    if (!colorPreset) {
      console.log(`${c.red}'${presetOrHex}' 컬러 프리셋을 찾을 수 없습니다.${c.r}`);
      writeLog({ cmd: 'generate', args: [presetOrHex], error: 'preset not found' });
      return;
    }
  }
  
  const platformArg = args.includes('--platform') ? args[args.indexOf('--platform') + 1] : platform;
  outputCode(colorPreset, platformArg);
  writeLog({ cmd: 'generate', args: [presetOrHex, platformArg], presets: { color: colorPreset.id || presetOrHex } });
}

function readableOnAccent(hex) {
  const r = parseInt(hex.slice(1,3), 16) / 255;
  const g = parseInt(hex.slice(3,5), 16) / 255;
  const b = parseInt(hex.slice(5,7), 16) / 255;
  const toLinear = c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const lum = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  const crWhite = (1.05) / (lum + 0.05);
  const crBlack = (lum + 0.05) / (0.05);
  return crWhite >= crBlack ? '#ffffff' : '#000000';
}

function rgbToHslParts(hex) {
  const r = parseInt(hex.slice(1,3), 16) / 255;
  const g = parseInt(hex.slice(3,5), 16) / 255;
  const b = parseInt(hex.slice(5,7), 16) / 255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h = 0, s = 0, l = (max+min)/2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    if (max === r) h = ((g-b)/d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b-r)/d + 2) / 6;
    else h = ((r-g)/d + 4) / 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1-l);
  const f = n => { const k = (n + h/30) % 12; return l - a * Math.max(Math.min(k-3, 9-k, 1), -1); };
  return '#' + [f(0), f(8), f(4)].map(x => Math.round(x*255).toString(16).padStart(2,'0')).join('');
}

function ensureContrast(accentHex, bgHex, minRatio = 3) {
  if (contrastRatio(accentHex, bgHex) >= minRatio) return accentHex;
  const [h, s, l] = rgbToHslParts(accentHex);
  const bgLum = relativeLuminanceFromHex(bgHex);
  const direction = bgLum < 0.5 ? 1 : -1;
  const limit = direction > 0 ? 95 : 5;

  for (let nextL = l; direction > 0 ? nextL <= limit : nextL >= limit; nextL += direction * 1.5) {
    const candidate = hslToHex(h, s, nextL);
    if (contrastRatio(candidate, bgHex) >= minRatio) return candidate;
  }
  return bgLum < 0.5 ? '#ffffff' : '#000000';
}

function deriveFromHex(hex) {
  // Simple HSL derivation
  const [h, s] = rgbToHslParts(hex);
  const bgSat = Math.min(s, 15);
  const darkBg = hslToHex(h, bgSat, 4.5);
  const lightBg = hslToHex(h, Math.min(s, 10), 96);
  const darkAccent = ensureContrast(hex, darkBg, 3);
  const lightAccent = ensureContrast(hex, lightBg, 3);
  return {
    id: 'custom', name: 'Custom', cat: 'custom', src: hex, radius: 16, btnText: readableOnAccent(darkAccent),
    dark: { bg: darkBg, fg: hslToHex(h, 5, 92), fg2: hslToHex(h, 5, 54), fg3: hslToHex(h, 4, 33), surface: hslToHex(h, bgSat, 7.5), surface2: hslToHex(h, bgSat, 12), accent: darkAccent, 'accent-rgb': `${parseInt(darkAccent.slice(1,3),16)}, ${parseInt(darkAccent.slice(3,5),16)}, ${parseInt(darkAccent.slice(5,7),16)}` },
    light: { bg: lightBg, fg: hslToHex(h, 8, 6), fg2: hslToHex(h, 6, 40), fg3: hslToHex(h, 4, 62), surface: '#ffffff', surface2: hslToHex(h, Math.min(s, 12), 93), accent: lightAccent, 'accent-rgb': `${parseInt(lightAccent.slice(1,3),16)}, ${parseInt(lightAccent.slice(3,5),16)}, ${parseInt(lightAccent.slice(5,7),16)}` },
  };
}

function hexToRgbParts(hex) {
  const normalized = hex.replace('#','');
  return [
    parseInt(normalized.slice(0,2),16),
    parseInt(normalized.slice(2,4),16),
    parseInt(normalized.slice(4,6),16),
  ];
}

function relativeLuminanceFromHex(hex) {
  const [r,g,b] = hexToRgbParts(hex);
  const s = [r,g,b].map(v => { v/=255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055, 2.4); });
  return 0.2126*s[0] + 0.7152*s[1] + 0.0722*s[2];
}

function contrastRatio(a,b) {
  const l1 = relativeLuminanceFromHex(a), l2 = relativeLuminanceFromHex(b);
  return (Math.max(l1,l2)+0.05) / (Math.min(l1,l2)+0.05);
}

function isHexColor(value) {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
}

function resolveActionSurface(accentHex, preferredText, minRatio = 4.5) {
  const text = preferredText || readableOnAccent(accentHex);
  if (contrastRatio(text, accentHex) >= minRatio) return { bg: accentHex, text };
  const [h, s, l] = rgbToHslParts(accentHex);
  const lighten = relativeLuminanceFromHex(text) < 0.5;
  const step = lighten ? 1.5 : -1.5;
  const limit = lighten ? 95 : 5;
  for (let nextL = l; lighten ? nextL <= limit : nextL >= limit; nextL += step) {
    const candidate = hslToHex(h, s, nextL);
    if (contrastRatio(text, candidate) >= minRatio) return { bg: candidate, text };
  }
  return { bg: accentHex, text: readableOnAccent(accentHex) };
}

function dtcgColor(hex) {
  const [r,g,b] = hexToRgbParts(hex);
  return {
    colorSpace: 'srgb',
    components: [r / 255, g / 255, b / 255],
    hex: hex.toUpperCase(),
  };
}

function dimensionToken(value, description) {
  const match = String(value).trim().match(/^(-?\d+(?:\.\d+)?)(px|rem|em|s|ms|%)?$/);
  if (!match) return { '$type': 'dimension', '$value': String(value), '$description': description };
  return {
    '$type': 'dimension',
    '$value': { value: Number(match[1]), unit: match[2] || 'px' },
    '$description': description,
  };
}

function numberToken(value, description) {
  return {
    '$type': 'number',
    '$value': Number(value),
    '$description': description,
  };
}

function stringToken(value, description) {
  return {
    '$type': 'string',
    '$value': String(value),
    '$description': description,
  };
}

function layoutToken(value, description) {
  const text = String(value).trim();
  if (/^-?\d+(?:\.\d+)?(?:px|rem)$/.test(text)) return dimensionToken(text, description);
  if (/^-?\d+(?:\.\d+)?$/.test(text)) return numberToken(text, description);
  return stringToken(text, description);
}

function colorToken(value, description, extensions = {}) {
  return {
    '$type': 'color',
    '$value': value.startsWith('{') ? value : dtcgColor(value),
    '$description': description,
    '$extensions': { duvu: extensions },
  };
}

function tokenSourceFromArgs(data) {
  const presetIdx = args.indexOf('--preset');
  const hexIdx = args.indexOf('--hex');
  if (hexIdx >= 0) {
    const hex = args[hexIdx + 1];
    if (!/^#[0-9a-fA-F]{6}$/.test(hex || '')) {
      throw new Error('--hex에는 6자리 HEX 코드가 필요합니다.');
    }
    return deriveFromHex(hex);
  }
  const id = presetIdx >= 0 ? args[presetIdx + 1] : 'toss';
  const preset = data.color.find(item => item.id === id);
  if (!preset) throw new Error(`컬러 프리셋을 찾을 수 없습니다: ${id}`);
  return preset;
}

function buildDtcgTokens(data, preset) {
  const dark = preset.dark;
  const light = preset.light;
  const radius = preset.radius || 16;
  const layoutTokens = data.layout_tokens || {};
  const preferredActionText = preset.btnText || null;
  const darkAction = resolveActionSurface(dark.accent, preferredActionText || readableOnAccent(dark.accent));
  const lightAction = resolveActionSurface(light.accent, preferredActionText || readableOnAccent(light.accent));
  return {
    '$schema': 'https://www.designtokens.org/schemas/2025.10/format.json',
    '$description': 'DUVU design tokens. DTCG-compatible export for AI UI generation, design-tool exchange, and platform translation.',
    '$extensions': {
      duvu: {
        version: PKG_VERSION,
        preset: preset.id,
        source: preset.src,
        modes: ['dark', 'light'],
        collections: ['core', 'semantic', 'component', 'quality'],
      },
    },
    core: {
      color: {
        source: colorToken(preset.src, 'Brand/source color selected by the user or domain matcher.'),
        dark: {
          bg: colorToken(dark.bg, 'Dark mode page background.'),
          surface: colorToken(dark.surface, 'Dark mode elevated surface.'),
          surface2: colorToken(dark.surface2, 'Dark mode secondary surface.'),
          fg: colorToken(dark.fg, 'Dark mode primary foreground.'),
          fg2: colorToken(dark.fg2, 'Dark mode secondary foreground.'),
          fg3: colorToken(dark.fg3, 'Dark mode disabled or placeholder foreground.'),
          accent: colorToken(dark.accent, 'Dark mode action accent.'),
          action: colorToken(darkAction.bg, 'Dark mode primary action fill adjusted for button text legibility.'),
        },
        light: {
          bg: colorToken(light.bg, 'Light mode page background.'),
          surface: colorToken(light.surface, 'Light mode elevated surface.'),
          surface2: colorToken(light.surface2, 'Light mode secondary surface.'),
          fg: colorToken(light.fg, 'Light mode primary foreground.'),
          fg2: colorToken(light.fg2, 'Light mode secondary foreground.'),
          fg3: colorToken(light.fg3, 'Light mode disabled or placeholder foreground.'),
          accent: colorToken(light.accent, 'Light mode action accent.'),
          action: colorToken(lightAction.bg, 'Light mode primary action fill adjusted for button text legibility.'),
        },
      },
      space: {
        xs: dimensionToken('4px', 'Inline gap.'),
        sm: dimensionToken('8px', 'Tight component gap.'),
        md: dimensionToken('16px', 'Default component gap.'),
        lg: dimensionToken('24px', 'Large component gap.'),
        xl: dimensionToken('32px', 'Section internal gap.'),
        '2xl': dimensionToken('48px', 'Large section gap.'),
      },
      radius: {
        sm: dimensionToken('10px', 'Small control radius.'),
        md: dimensionToken(`${Math.min(radius, 16)}px`, 'Default control radius.'),
        lg: dimensionToken(`${radius}px`, 'Card and modal radius.'),
        full: dimensionToken('9999px', 'Circular or pill radius.'),
      },
      motion: {
        duration: { '$type': 'duration', '$value': { value: 400, unit: 'ms' }, '$description': 'Default transition duration.' },
        fast: { '$type': 'duration', '$value': { value: 200, unit: 'ms' }, '$description': 'Immediate feedback duration.' },
        ease: { '$type': 'cubicBezier', '$value': [0.16, 1, 0.3, 1], '$description': 'Default expressive easing.' },
      },
    },
    semantic: {
      color: {
        dark: {
          background: colorToken('{core.color.dark.bg}', 'Dark mode app background alias.', { alias: true, mode: 'dark' }),
          surface: colorToken('{core.color.dark.surface}', 'Dark mode surface alias.', { alias: true, mode: 'dark' }),
          text: colorToken('{core.color.dark.fg}', 'Dark mode text alias.', { alias: true, mode: 'dark' }),
          textMuted: colorToken('{core.color.dark.fg2}', 'Dark mode secondary text alias.', { alias: true, mode: 'dark' }),
          action: colorToken('{core.color.dark.action}', 'Dark mode primary action alias.', { alias: true, mode: 'dark' }),
          actionText: colorToken(darkAction.text, 'Text on primary action in dark mode.'),
        },
        light: {
          background: colorToken('{core.color.light.bg}', 'Light mode app background alias.', { alias: true, mode: 'light' }),
          surface: colorToken('{core.color.light.surface}', 'Light mode surface alias.', { alias: true, mode: 'light' }),
          text: colorToken('{core.color.light.fg}', 'Light mode text alias.', { alias: true, mode: 'light' }),
          textMuted: colorToken('{core.color.light.fg2}', 'Light mode secondary text alias.', { alias: true, mode: 'light' }),
          action: colorToken('{core.color.light.action}', 'Light mode primary action alias.', { alias: true, mode: 'light' }),
          actionText: colorToken(lightAction.text, 'Text on primary action in light mode.'),
        },
        background: colorToken('{semantic.color.dark.background}', 'Default app background alias. Consumers can switch to semantic.color.light.background for light mode.', { alias: true, mode: 'default' }),
        surface: colorToken('{semantic.color.dark.surface}', 'Default surface alias. Consumers can switch to semantic.color.light.surface for light mode.', { alias: true, mode: 'default' }),
        text: colorToken('{semantic.color.dark.text}', 'Default text alias. Consumers can switch to semantic.color.light.text for light mode.', { alias: true, mode: 'default' }),
        textMuted: colorToken('{semantic.color.dark.textMuted}', 'Secondary text alias. Consumers can switch to semantic.color.light.textMuted for light mode.', { alias: true, mode: 'default' }),
        action: colorToken('{semantic.color.dark.action}', 'Primary action alias. Consumers can switch to semantic.color.light.action for light mode.', { alias: true, mode: 'default' }),
        actionText: colorToken('{semantic.color.dark.actionText}', 'Primary action text alias. Consumers can switch to semantic.color.light.actionText for light mode.', { alias: true, mode: 'default' }),
        success: colorToken('#2A9D8F', 'Success status.'),
        warning: colorToken('#F4A261', 'Warning status.'),
        error: colorToken('#E76F51', 'Error status.'),
      },
      layout: Object.fromEntries(Object.entries(layoutTokens).map(([key, value]) => [
        key,
        layoutToken(value, `DUVU layout token: ${key}.`),
      ])),
    },
    component: {
      button: {
        height: dimensionToken('44px', 'Minimum pointer target for desktop and touch.'),
        mobileHeight: dimensionToken('48px', 'Minimum mobile touch target.'),
        radius: dimensionToken('10px', 'Button radius.'),
        bg: colorToken('{semantic.color.action}', 'Primary button background alias.', { alias: true }),
        text: colorToken('{semantic.color.actionText}', 'Primary button text alias.', { alias: true }),
      },
      card: {
        radius: dimensionToken(`${radius}px`, 'Card radius aligned to preset personality.'),
        bg: colorToken('{semantic.color.surface}', 'Card background alias.', { alias: true }),
      },
    },
    quality: {
      maxPrimaryCta: { '$type': 'number', '$value': 1, '$description': 'Only one primary CTA per viewport.' },
      maxAccentAreaPercent: { '$type': 'number', '$value': 10, '$description': 'Accent usage cap to avoid AI-looking overcoloring.' },
      minTouchTarget: dimensionToken('44px', 'HIG minimum target size.'),
      minBodyContrast: { '$type': 'number', '$value': 4.5, '$description': 'WCAG AA body text contrast.' },
      minUiContrast: { '$type': 'number', '$value': 3, '$description': 'WCAG non-text/UI contrast.' },
      antiSlop: {
        '$type': 'string',
        '$value': 'no placeholder imagery, no decorative gradients, no nested cards, no unscoped borders, no viewport-scaled font sizes',
        '$description': 'Generative UI quality constraints.',
      },
    },
  };
}

function flattenDtcgTokens(node, path = [], out = []) {
  if (!node || typeof node !== 'object') return out;
  if (Object.prototype.hasOwnProperty.call(node, '$value')) {
    out.push({ path: path.join('.'), token: node });
    return out;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith('$')) continue;
    flattenDtcgTokens(value, [...path, key], out);
  }
  return out;
}

function resolveTokenReference(ref, tokenMap, seen = []) {
  const path = ref.startsWith('{') && ref.endsWith('}') ? ref.slice(1, -1) : ref;
  if (seen.includes(path)) throw new Error(`순환 alias: ${[...seen, path].join(' -> ')}`);
  const token = tokenMap.get(path);
  if (!token) throw new Error(`존재하지 않는 alias 참조: ${path}`);
  if (typeof token.$value === 'string' && token.$value.startsWith('{')) {
    return resolveTokenReference(token.$value, tokenMap, [...seen, path]);
  }
  return token.$value;
}

function validateDtcgTokenValue(path, token) {
  const issues = [];
  const supported = new Set(['color', 'dimension', 'duration', 'cubicBezier', 'number', 'string', 'fontFamily']);
  if (!supported.has(token.$type)) issues.push(`${path}: 지원하지 않는 $type ${token.$type}`);
  if (typeof token.$value === 'string' && token.$value.startsWith('{')) return issues;

  if (token.$type === 'color') {
    const value = token.$value;
    const ok = value && typeof value === 'object'
      && value.colorSpace === 'srgb'
      && Array.isArray(value.components)
      && value.components.length === 3
      && value.components.every(item => typeof item === 'number' && item >= 0 && item <= 1);
    if (!ok) issues.push(`${path}: color 값은 srgb components 객체여야 함`);
  } else if (token.$type === 'dimension') {
    const value = token.$value;
    const ok = value && typeof value === 'object'
      && typeof value.value === 'number'
      && ['px', 'rem'].includes(value.unit);
    if (!ok) issues.push(`${path}: dimension 값은 number + px/rem unit 객체여야 함`);
  } else if (token.$type === 'duration') {
    const value = token.$value;
    const ok = value && typeof value === 'object'
      && typeof value.value === 'number'
      && ['ms', 's'].includes(value.unit);
    if (!ok) issues.push(`${path}: duration 값은 number + ms/s unit 객체여야 함`);
  } else if (token.$type === 'cubicBezier') {
    const ok = Array.isArray(token.$value)
      && token.$value.length === 4
      && token.$value.every(item => typeof item === 'number');
    if (!ok) issues.push(`${path}: cubicBezier 값은 숫자 4개 배열이어야 함`);
  } else if (token.$type === 'number') {
    if (typeof token.$value !== 'number' || Number.isNaN(token.$value)) issues.push(`${path}: number 값은 숫자여야 함`);
  } else if (['string', 'fontFamily'].includes(token.$type)) {
    if (typeof token.$value !== 'string') issues.push(`${path}: ${token.$type} 값은 문자열이어야 함`);
  }
  return issues;
}

function auditSemanticModeParity(tokenMap) {
  const issues = [];
  const keys = ['background', 'surface', 'text', 'textMuted', 'action', 'actionText'];
  for (const key of keys) {
    for (const mode of ['dark', 'light']) {
      const path = `semantic.color.${mode}.${key}`;
      if (!tokenMap.has(path)) issues.push(`${path}: semantic mode alias 누락`);
    }
    const darkType = tokenMap.get(`semantic.color.dark.${key}`)?.$type;
    const lightType = tokenMap.get(`semantic.color.light.${key}`)?.$type;
    if (darkType && lightType && darkType !== lightType) issues.push(`semantic.color.${key}: dark/light $type 불일치`);
  }
  return issues;
}

function auditColorPreset(color, issues, warnings) {
  if (!isHexColor(color.btnText)) {
    issues.push(`${color.id}: btnText 6자리 HEX 누락 또는 형식 오류`);
  }

  for (const mode of ['dark', 'light']) {
    const theme = color[mode];
    if (!theme) { issues.push(`${color.id}/${mode}: theme 누락`); continue; }
    const checks = [
      ['fg/bg', theme.fg, theme.bg, 4.5],
      ['fg/surface', theme.fg, theme.surface, 4.5],
      ['accent/bg', theme.accent, theme.bg, 3],
    ];
    for (const [label, a, b, min] of checks) {
      const ratio = contrastRatio(a, b);
      if (ratio < min) issues.push(`${color.id}/${mode}: ${label} ${ratio.toFixed(2)} < ${min}`);
    }
    const surfaceRatio = contrastRatio(theme.surface, theme.bg);
    if (surfaceRatio < 1.05) warnings.push(`${color.id}/${mode}: surface/bg ${surfaceRatio.toFixed(2)} < 1.05, 표면 구분은 그림자/여백 병행 필요`);
    const actionSurface = resolveActionSurface(theme.accent, isHexColor(color.btnText) ? color.btnText : readableOnAccent(theme.accent));
    const btnContrast = contrastRatio(actionSurface.text, actionSurface.bg);
    if (btnContrast < 3) issues.push(`${color.id}/${mode}: button text ${btnContrast.toFixed(2)} < 3`);
    if (btnContrast < 4.5) warnings.push(`${color.id}/${mode}: button text ${btnContrast.toFixed(2)} < 4.5, 작은 텍스트 CTA 금지`);
  }
}

function hasCompleteColorProvenance(provenance) {
  return Boolean(
    provenance?.type?.trim?.()
    && provenance?.source?.trim?.()
    && provenance?.rationale?.trim?.()
    && Array.isArray(provenance.references)
    && provenance.references.some(ref => typeof ref === 'string' && ref.trim()),
  );
}

function colorProvenanceStats(data) {
  const colors = data.color || [];
  const complete = colors.filter(color => hasCompleteColorProvenance(data.metadata?.presets?.color?.[color.id]?.provenance));
  return { total: colors.length, complete: complete.length };
}

function auditTokenEngine(data, preset) {
  const dtcg = buildDtcgTokens(data, preset);
  const flat = flattenDtcgTokens(dtcg);
  const tokenMap = new Map(flat.map(entry => [entry.path, entry.token]));
  const issues = [];
  const warnings = [];
  const requiredProps = ['$type', '$value', '$description'];

  for (const { path, token } of flat) {
    for (const prop of requiredProps) {
      if (!Object.prototype.hasOwnProperty.call(token, prop)) issues.push(`${path}: ${prop} 누락`);
    }
    if (typeof token.$value === 'string' && token.$value.startsWith('{')) {
      try { resolveTokenReference(token.$value, tokenMap); }
      catch (e) { issues.push(`${path}: ${e.message}`); }
    }
    issues.push(...validateDtcgTokenValue(path, token));
  }
  issues.push(...auditSemanticModeParity(tokenMap));

  const colorsToAudit = [
    preset,
    ...(data.color || []).filter(color => color.id !== preset.id),
  ];
  for (const color of colorsToAudit) auditColorPreset(color, issues, warnings);
  for (const color of data.color || []) {
    const provenance = data.metadata?.presets?.color?.[color.id]?.provenance;
    if (!hasCompleteColorProvenance(provenance)) {
      issues.push(`metadata.presets.color.${color.id}.provenance: type/source/rationale/references 누락`);
    }
  }

  const requiredLayout = [
    'hero-title-size', 'section-title-size', 'body-size', 'content-max-width',
    'hero-sub-max-width', 'space-section', 'space-hero', 'card-padding',
  ];
  for (const key of requiredLayout) {
    if (!data.layout_tokens?.[key]) issues.push(`layout_tokens.${key} 누락`);
  }

  for (const component of data.components || []) {
    for (const key of ['id', 'name', 'description', 'category', 'intent', 'meaning', 'level']) {
      if (component[key] === undefined || component[key] === '') issues.push(`components.${component.id || '?'}: ${key} 누락`);
    }
  }

  for (const template of data.templates || []) {
    const ids = {
      color: data.color?.some(x => x.id === template.color),
      typography: data.typography?.some(x => x.id === template.typography),
      layout: data.layout?.some(x => x.id === template.layout),
      style: data.style?.some(x => x.id === template.style),
      motion: data.motion?.some(x => x.id === template.motion),
      gradient: !template.gradient || data.gradient?.some(x => x.id === template.gradient),
    };
    for (const [key, ok] of Object.entries(ids)) {
      if (!ok) issues.push(`templates.${template.id}: ${key} 참조 깨짐`);
    }
    if (!template.preview?.cards?.length) issues.push(`templates.${template.id}: preview.cards 누락`);
    const cardTypes = new Set((template.preview?.cards || []).map(card => card.type));
    if (cardTypes.size < 2) warnings.push(`templates.${template.id}: 카드 타입 다양성 낮음`);
  }

  const templateScores = (data.templates || []).map(template => scoreTemplateQuality(template, data));
  for (const item of templateScores.filter(result => !result.pass)) {
    issues.push(`templates.${item.template}: 생성 품질 ${item.score}/100 (${item.grade}) — ${item.reasons.join(', ')}`);
  }
  const figmaFiles = ['dark', 'light'].map(mode => {
    const tokens = buildFigmaDtcgTokens(data, preset, mode);
    const audit = auditFigmaDtcgTokens(tokens);
    return { mode, audit };
  });
  for (const file of figmaFiles) {
    for (const issue of file.audit.issues) issues.push(`figma-dtcg/${file.mode}: ${issue}`);
  }
  const figmaBundleAudit = auditFigmaDtcgBundle(figmaFiles);
  for (const issue of figmaBundleAudit.issues) issues.push(`figma-dtcg/bundle: ${issue}`);
  const figmaApiAudit = auditFigmaApiPayload(buildFigmaApiPayload(data, preset));
  for (const issue of figmaApiAudit.issues) issues.push(`figma-api: ${issue}`);
  const provenanceStats = colorProvenanceStats(data);

  const qualityGates = [
    ['DTCG 토큰 70개 이상', flat.length >= 70, flat.length],
    ['alias 토큰 5개 이상', flat.filter(entry => typeof entry.token.$value === 'string' && entry.token.$value.startsWith('{')).length >= 5, flat.filter(entry => typeof entry.token.$value === 'string' && entry.token.$value.startsWith('{')).length],
    ['DTCG 타입별 값 검증', flat.every(entry => validateDtcgTokenValue(entry.path, entry.token).length === 0), `${flat.length}/${flat.length}`],
    ['현재 프리셋 대비 검증', !issues.some(issue => issue.startsWith(`${preset.id}/`) || issue.startsWith('custom/')), preset.id],
    ['semantic dark/light parity', auditSemanticModeParity(tokenMap).length === 0, 'dark/light'],
    ['Figma DTCG dark/light import parity', figmaBundleAudit.issues.length === 0, figmaBundleAudit.issues.length],
    ['Figma REST API payload 검증', figmaApiAudit.issues.length === 0, figmaApiAudit.variables],
    ['컬러 프리셋 40개 이상', (data.color?.length || 0) >= 40, data.color?.length || 0],
    ['컬러 출처/근거/참고처 메타데이터', provenanceStats.complete === provenanceStats.total && provenanceStats.total > 0, `${provenanceStats.complete}/${provenanceStats.total}`],
    ['템플릿 20개 이상', (data.templates?.length || 0) >= 20, data.templates?.length || 0],
    ['컴포넌트 17개 이상', (data.components?.length || 0) >= 17, data.components?.length || 0],
    ['인터랙션 패턴 7개 이상', (data.interaction_patterns?.length || 0) >= 7, data.interaction_patterns?.length || 0],
    ['전체 템플릿 생성 품질 A(93점) 이상', templateScores.every(item => item.pass), `${templateScores.filter(item => item.pass).length}/${templateScores.length}`],
    ['전체 템플릿 aesthetic direction/memorability 통과', templateScores.every(item => item.aesthetic?.pass), `${templateScores.filter(item => item.aesthetic?.pass).length}/${templateScores.length}`],
    ['AI 슬롭 방지 규칙 문서화', existsSync(join(DATA_DIR, 'references', 'rules.md')) && readFileSync(join(DATA_DIR, 'references', 'rules.md'), 'utf8').includes('AI 슬롭'), 'rules.md'],
  ];
  for (const [label, ok, value] of qualityGates) {
    if (!ok) issues.push(`${label} 실패 (${value})`);
  }

  const score = Math.max(0, 100 - issues.length * 8);
  const grade = score >= 97 ? 'A+' : score >= 93 ? 'A' : score >= 90 ? 'A-' : score >= 87 ? 'B+' : 'B';
  return { dtcg, flat, issues, warnings, score, grade, qualityGates };
}

function figmaVariableValue(token) {
  if (token.$type === 'cubicBezier' && Array.isArray(token.$value)) return `cubic-bezier(${token.$value.join(', ')})`;
  return token.$value;
}

function toFigmaVariableExport(dtcg) {
  const flat = flattenDtcgTokens(dtcg);
  const variables = flat.map(({ path, token }) => ({
    name: path.replace(/\./g, '/'),
    resolvedType: token.$extensions?.['com.figma.type'] === 'boolean'
      ? 'BOOLEAN'
      : token.$type === 'color'
        ? 'COLOR'
        : ['dimension', 'duration', 'number'].includes(token.$type)
          ? 'FLOAT'
          : 'STRING',
    value: figmaVariableValue(token),
    description: token.$description || '',
    scopes: token.$extensions?.duvu?.alias ? ['ALL_SCOPES'] : undefined,
  }));
  return {
    name: 'DUVU',
    format: 'figma-variables-json',
    version: PKG_VERSION,
    collections: [
      { name: 'core', modes: ['dark', 'light'] },
      { name: 'semantic', modes: ['dark', 'light'] },
      { name: 'component', modes: ['default'] },
      { name: 'quality', modes: ['default'] },
    ],
    variables,
  };
}

function figmaDurationToken(seconds, description) {
  return {
    '$type': 'duration',
    '$value': { value: seconds, unit: 's' },
    '$description': description,
  };
}

function figmaNumberToken(value, description, extensions = null) {
  const token = {
    '$type': 'number',
    '$value': value,
    '$description': description,
  };
  if (extensions) token.$extensions = extensions;
  return token;
}

function buildFigmaDtcgTokens(data, preset, mode) {
  const theme = preset[mode];
  if (!theme) throw new Error(`Figma DTCG export mode를 찾을 수 없습니다: ${mode}`);
  const layoutTokens = data.layout_tokens || {};
  const px = key => {
    const value = String(layoutTokens[key] || '').trim();
    const match = value.match(/^(\d+(?:\.\d+)?)px$/);
    return match ? Number(match[1]) : null;
  };
  return {
    '$schema': 'https://www.designtokens.org/schemas/2025.10/format.json',
    '$description': `DUVU ${preset.id} ${mode} tokens for native Figma Variables DTCG import.`,
    '$extensions': {
      duvu: {
        version: PKG_VERSION,
        preset: preset.id,
        mode,
        figmaImportReady: true,
        source: preset.src,
      },
    },
    color: {
      bg: colorToken(theme.bg, `${mode} background.`),
      surface: colorToken(theme.surface, `${mode} surface.`),
      surface2: colorToken(theme.surface2, `${mode} secondary surface.`),
      fg: colorToken(theme.fg, `${mode} primary foreground.`),
      fg2: colorToken(theme.fg2, `${mode} secondary foreground.`),
      fg3: colorToken(theme.fg3, `${mode} muted foreground.`),
      accent: colorToken(theme.accent, `${mode} action accent.`),
      action: colorToken(resolveActionSurface(theme.accent, preset.btnText || readableOnAccent(theme.accent)).bg, `${mode} primary action fill.`),
      actionText: colorToken(resolveActionSurface(theme.accent, preset.btnText || readableOnAccent(theme.accent)).text, `${mode} action text.`),
    },
    semantic: {
      background: colorToken('{color.bg}', 'Default background alias.', { alias: true }),
      surface: colorToken('{color.surface}', 'Default surface alias.', { alias: true }),
      text: colorToken('{color.fg}', 'Default text alias.', { alias: true }),
      textMuted: colorToken('{color.fg2}', 'Secondary text alias.', { alias: true }),
      action: colorToken('{color.action}', 'Primary action alias.', { alias: true }),
      actionText: colorToken('{color.actionText}', 'Primary action text alias.', { alias: true }),
      success: colorToken('#2A9D8F', 'Success status.'),
      warning: colorToken('#F4A261', 'Warning status.'),
      error: colorToken('#E76F51', 'Error status.'),
    },
    space: {
      xs: dimensionToken('4px', 'Inline gap.'),
      sm: dimensionToken('8px', 'Tight component gap.'),
      md: dimensionToken('16px', 'Default component gap.'),
      lg: dimensionToken('24px', 'Large component gap.'),
      xl: dimensionToken('32px', 'Section internal gap.'),
      section: dimensionToken(`${px('space-section') || 96}px`, 'Section spacing.'),
      hero: dimensionToken(`${px('space-hero') || 160}px`, 'Hero spacing.'),
    },
    radius: {
      control: dimensionToken('10px', 'Control radius.'),
      card: dimensionToken(`${preset.radius || 16}px`, 'Card radius.'),
      full: dimensionToken('9999px', 'Pill radius.'),
    },
    size: {
      touch: dimensionToken('44px', 'Minimum touch target.'),
      touchMobile: dimensionToken('48px', 'Minimum mobile touch target.'),
    },
    typography: {
      fontFamily: {
        '$type': 'fontFamily',
        '$value': 'Inter',
        '$description': 'Default UI font family for Figma import.',
      },
      bodySize: dimensionToken('16px', 'Body font size.'),
    },
    motion: {
      duration: figmaDurationToken(0.4, 'Default transition duration.'),
      fast: figmaDurationToken(0.2, 'Fast feedback duration.'),
    },
    quality: {
      maxPrimaryCta: figmaNumberToken(1, 'Only one primary CTA per viewport.'),
      maxAccentAreaPercent: figmaNumberToken(10, 'Accent usage cap.'),
      minBodyContrast: figmaNumberToken(4.5, 'WCAG AA body contrast.'),
      minUiContrast: figmaNumberToken(3, 'WCAG UI contrast.'),
      reducedMotionRequired: figmaNumberToken(1, 'Boolean: reduced motion support required.', { 'com.figma.type': 'boolean' }),
    },
  };
}

function auditFigmaDtcgTokens(tokens) {
  const flat = flattenDtcgTokens(tokens);
  const names = flat.map(entry => entry.path.replace(/\./g, '/'));
  const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);
  const issues = [];
  const supported = new Set(['color', 'dimension', 'fontFamily', 'duration', 'number', 'string']);
  const tokenMap = new Map(flat.map(entry => [entry.path, entry.token]));

  for (const { path, token } of flat) {
    if (!supported.has(token.$type)) issues.push(`${path}: Figma import 미지원 타입 ${token.$type}`);
    if (token.$type === 'dimension' && token.$value?.unit !== 'px') issues.push(`${path}: Figma dimension unit은 px만 지원`);
    if (token.$type === 'duration' && token.$value?.unit !== 's') issues.push(`${path}: Figma duration unit은 s만 지원`);
    if (token.$type === 'fontFamily' && typeof token.$value !== 'string') issues.push(`${path}: Figma fontFamily는 단일 문자열이어야 함`);
    if (typeof token.$value === 'string' && token.$value.startsWith('{')) {
      try { resolveTokenReference(token.$value, tokenMap); }
      catch (e) { issues.push(`${path}: ${e.message}`); }
    }
  }
  for (const name of duplicateNames) issues.push(`Figma normalized duplicate token name: ${name}`);
  return { flat, issues };
}

function figmaValueShape(token) {
  if (typeof token.$value === 'string' && token.$value.startsWith('{')) return 'alias';
  if (token.$type === 'dimension' || token.$type === 'duration') return token.$value?.unit || 'invalid-unit';
  if (token.$type === 'color') return token.$value?.colorSpace || 'invalid-color';
  return typeof token.$value;
}

function auditFigmaDtcgBundle(files) {
  const issues = [];
  if (!Array.isArray(files) || files.length < 2) return { issues: ['Figma bundle은 최소 dark/light 2개 파일이 필요합니다.'] };
  const entries = files.map(file => ({
    mode: file.mode,
    map: new Map((file.audit?.flat || []).map(({ path, token }) => [
      path.replace(/\./g, '/'),
      { type: token.$type, shape: figmaValueShape(token) },
    ])),
  }));
  const canonical = entries[0];
  for (const entry of entries.slice(1)) {
    for (const [name, meta] of canonical.map.entries()) {
      const other = entry.map.get(name);
      if (!other) {
        issues.push(`${entry.mode}: Figma multi-file import parity 누락 ${name}`);
        continue;
      }
      if (other.type !== meta.type) issues.push(`${entry.mode}: ${name} $type 불일치 (${meta.type} != ${other.type})`);
      if (other.shape !== meta.shape) issues.push(`${entry.mode}: ${name} value shape 불일치 (${meta.shape} != ${other.shape})`);
    }
    for (const name of entry.map.keys()) {
      if (!canonical.map.has(name)) issues.push(`${entry.mode}: Figma multi-file import parity 초과 토큰 ${name}`);
    }
  }
  return { issues };
}

function figmaApiTempId(prefix, name) {
  return `${prefix}_${String(name).replace(/[^a-zA-Z0-9_]/g, '_')}`;
}

function figmaApiResolvedType(token) {
  if (token.$extensions?.['com.figma.type'] === 'boolean') return 'BOOLEAN';
  if (token.$type === 'color') return 'COLOR';
  if (['dimension', 'duration', 'number'].includes(token.$type)) return 'FLOAT';
  return 'STRING';
}

function figmaApiPrimitiveValue(token, tokenIdByPath) {
  if (typeof token.$value === 'string' && token.$value.startsWith('{')) {
    const ref = token.$value.slice(1, -1);
    return { type: 'VARIABLE_ALIAS', id: tokenIdByPath.get(ref) };
  }
  if (token.$extensions?.['com.figma.type'] === 'boolean') return Boolean(token.$value);
  if (token.$type === 'color') {
    const [r,g,b] = token.$value.components;
    return { r, g, b, a: 1 };
  }
  if (token.$type === 'dimension' || token.$type === 'duration') return token.$value.value;
  if (token.$type === 'number') return token.$value;
  return String(token.$value);
}

function buildFigmaApiPayload(data, preset) {
  const collectionId = 'duvu_collection';
  const modeIds = { dark: 'duvu_mode_dark', light: 'duvu_mode_light' };
  const modeTokens = Object.fromEntries(['dark', 'light'].map(mode => [
    mode,
    flattenDtcgTokens(buildFigmaDtcgTokens(data, preset, mode)),
  ]));
  const canonical = modeTokens.dark;
  const tokenIdByPath = new Map(canonical.map(({ path }) => [path, figmaApiTempId('duvu_var', path)]));

  const variables = canonical.map(({ path, token }) => ({
    action: 'CREATE',
    id: tokenIdByPath.get(path),
    variableCollectionId: collectionId,
    name: path.replace(/\./g, '/'),
    resolvedType: figmaApiResolvedType(token),
    description: token.$description || '',
  }));
  const variableModeValues = [];
  for (const mode of ['dark', 'light']) {
    for (const { path, token } of modeTokens[mode]) {
      variableModeValues.push({
        variableId: tokenIdByPath.get(path),
        modeId: modeIds[mode],
        value: figmaApiPrimitiveValue(token, tokenIdByPath),
      });
    }
  }
  return {
    variableCollections: [{
      action: 'CREATE',
      id: collectionId,
      name: `DUVU ${preset.id}`,
      initialModeId: modeIds.dark,
    }],
    variableModes: [{
      action: 'CREATE',
      id: modeIds.light,
      variableCollectionId: collectionId,
      name: 'light',
    }],
    variables,
    variableModeValues,
  };
}

function auditFigmaApiPayload(payload) {
  const issues = [];
  const collections = payload.variableCollections || [];
  const modes = [
    ...collections.flatMap(collection => collection.initialModeId ? [{ id: collection.initialModeId, name: 'dark' }] : []),
    ...(payload.variableModes || []),
  ];
  const variables = payload.variables || [];
  const values = payload.variableModeValues || [];
  const names = variables.map(variable => variable.name);
  const ids = variables.map(variable => variable.id);
  const modeIds = new Set(modes.map(mode => mode.id));
  const variableIds = new Set(ids);

  if (collections.length !== 1) issues.push(`collection 수가 1개가 아님: ${collections.length}`);
  if (modes.length > 40) issues.push(`Figma mode 제한 초과: ${modes.length}/40`);
  if (variables.length > 5000) issues.push(`Figma variable 제한 초과: ${variables.length}/5000`);
  if (new Set(ids).size !== ids.length) issues.push('Figma API temp id 중복');
  if (new Set(names).size !== names.length) issues.push('Figma variable name 중복');
  for (const name of names) {
    if (/[.{}]/.test(name)) issues.push(`Figma variable name 금지 문자 포함: ${name}`);
  }
  for (const variable of variables) {
    if (!['COLOR', 'FLOAT', 'STRING', 'BOOLEAN'].includes(variable.resolvedType)) issues.push(`${variable.name}: Figma resolvedType 오류`);
  }
  for (const value of values) {
    if (!variableIds.has(value.variableId)) issues.push(`mode value variableId 없음: ${value.variableId}`);
    if (!modeIds.has(value.modeId)) issues.push(`mode value modeId 없음: ${value.modeId}`);
    if (value.value?.type === 'VARIABLE_ALIAS') {
      if (!variableIds.has(value.value.id)) issues.push(`alias 대상 variableId 없음: ${value.value.id}`);
      if (value.value.id === value.variableId) issues.push(`self alias 금지: ${value.variableId}`);
    }
  }
  const valueKeySet = new Set(values.map(value => `${value.variableId}:${value.modeId}`));
  for (const id of variableIds) {
    for (const modeId of modeIds) {
      if (!valueKeySet.has(`${id}:${modeId}`)) issues.push(`${id}/${modeId}: mode value 누락`);
    }
  }
  if (!variables.some(variable => variable.resolvedType === 'BOOLEAN')) issues.push('BOOLEAN variable 누락');
  const bytes = Buffer.byteLength(JSON.stringify({
    variableCollections: payload.variableCollections,
    variableModes: payload.variableModes,
    variables: payload.variables,
    variableModeValues: payload.variableModeValues,
  }), 'utf8');
  if (bytes > 4 * 1024 * 1024) issues.push(`Figma API payload 4MB 제한 초과: ${bytes}`);
  return { issues, variables: variables.length, modes: modes.length, bytes };
}

async function postFigmaVariables({ fileKey, token, payload }) {
  const endpoint = `https://api.figma.com/v1/files/${encodeURIComponent(fileKey)}/variables`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Figma-Token': token,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text }; }
  return { ok: res.ok, status: res.status, statusText: res.statusText, body };
}

function getArgValue(flag, fallback = null) {
  const idx = args.indexOf(flag);
  return idx >= 0 ? args[idx + 1] : fallback;
}

function templateFromArgs(data) {
  const id = getArgValue('--template', data.templates?.[0]?.id || 'saas');
  const template = data.templates?.find(item => item.id === id);
  if (!template) throw new Error(`템플릿을 찾을 수 없습니다: ${id}`);
  return template;
}

function resolveContractPreset(data, template, fallbackPreset) {
  if (args.includes('--preset') || args.includes('--hex')) return fallbackPreset;
  const templatePreset = data.color?.find(item => item.id === template.color);
  if (!templatePreset) throw new Error(`템플릿 ${template.id}의 컬러 프리셋을 찾을 수 없습니다: ${template.color}`);
  return templatePreset;
}

function countPrimaryCta(template) {
  let explicit = 0;
  let buttonGroups = 0;
  for (const card of template.preview?.cards || []) {
    if (card.type === 'buttons') buttonGroups += 1;
    if (card.cta) explicit += 1;
  }
  return explicit > 0 ? explicit : buttonGroups;
}

function hasBannedPlaceholderText(template) {
  const raw = JSON.stringify(template).toLowerCase();
  return ['lorem ipsum', 'placeholder', 'dummy text', 'sample image'].some(term => raw.includes(term));
}

function hasSingletonLastRowPreviewGrid(template) {
  for (const card of template.preview?.cards || []) {
    if (card.type === 'gallery' && (card.count || 6) % 3 === 1) return true;
    if (card.type === 'product' && Array.isArray(card.items) && card.items.length > 1 && card.items.length % 3 === 1) return true;
  }
  return false;
}

const AESTHETIC_PROFILES = [
  {
    id: 'refined-saas',
    keywords: ['saas', 'b2b', 'webapp', 'admin', 'professional'],
    direction: '정제된 제품 신뢰감: 명확한 계층, 조용한 표면, 하나의 행동만 전면에 둔다.',
    signatureMove: 'metric + action + operational table을 첫 화면에서 하나의 product proof로 묶는다.',
    antiPattern: '둥근 카드만 반복하는 무표정한 SaaS 랜딩',
  },
  {
    id: 'warm-editorial',
    keywords: ['editorial', 'blog', 'magazine', 'media', 'content'],
    direction: '따뜻한 에디토리얼 리듬: 넓은 호흡, 읽기 우선, 인용구로 정서를 고정한다.',
    signatureMove: 'article lead와 quote를 큰 여백 안에서 서로 다른 무게로 충돌시킨다.',
    antiPattern: '본문보다 카드 장식이 먼저 보이는 블로그 템플릿',
  },
  {
    id: 'commerce-campaign',
    keywords: ['ecommerce', 'shop', 'store', 'marketplace', 'product'],
    direction: '캠페인형 커머스: 제품보다 먼저 제안의 에너지를 느끼게 한다.',
    signatureMove: 'marquee + full hero + product rail로 구매 욕구의 속도를 만든다.',
    antiPattern: '상품 카드만 균등하게 나열한 쇼핑몰 그리드',
  },
  {
    id: 'dense-data',
    keywords: ['dashboard', 'analytics', 'data', 'monitoring'],
    direction: '밀도 높은 운영 화면: 장식보다 신호, 큰 숫자보다 비교 가능한 패턴을 우선한다.',
    signatureMove: '동일 계층 metric을 압축 배치하고 table/task 흐름으로 판단을 닫는다.',
    antiPattern: 'KPI 카드만 많은 의미 없는 대시보드',
  },
  {
    id: 'asymmetric-portfolio',
    keywords: ['portfolio', 'agency', 'personal', 'showcase'],
    direction: '비대칭 포트폴리오: 정렬은 엄격하되 무게 중심은 일부러 치우친다.',
    signatureMove: '큰 hero statement와 gallery grid의 스케일 차이로 작가성을 만든다.',
    antiPattern: '프로젝트 썸네일만 안전하게 배열한 평균적 포트폴리오',
  },
  {
    id: 'fintech-trust',
    keywords: ['fintech', 'finance', 'payment', 'investment', 'banking'],
    direction: '금융 신뢰감: 숫자를 과장하지 않고 안정적인 간격과 차가운 타이포로 설득한다.',
    signatureMove: '자산, 수익률, 신용/거래 지표를 하나의 재무 상태 문장처럼 읽히게 한다.',
    antiPattern: '보라색 그라디언트와 돈 이모지만 있는 핀테크',
  },
  {
    id: 'expressive-creative',
    keywords: ['creative', 'design', 'art', 'experimental'],
    direction: '표현적 크리에이티브: 모자이크, marquee, quote로 리듬을 깨고 기억점을 만든다.',
    signatureMove: 'hero 이후 움직이는 언어 조각과 gallery를 충돌시켜 에너지를 만든다.',
    antiPattern: '보라색 카드와 blob만 있는 디자인 도구',
  },
  {
    id: 'code-industrial',
    keywords: ['developer', 'tool', 'cli', 'code', 'api'],
    direction: '코드 친화적 산업미: 불필요한 감성을 빼고 실행 가능한 proof를 전면화한다.',
    signatureMove: 'code block을 장식이 아니라 제품 데모의 주인공으로 둔다.',
    antiPattern: '터미널 흉내만 내는 개발자 도구 랜딩',
  },
  {
    id: 'soft-wellness',
    keywords: ['health', 'wellness', 'medical', 'care', 'fitness'],
    direction: '부드러운 웰니스: 낮은 자극, 둥근 리듬, 숫자의 안정감으로 몸의 상태를 표현한다.',
    signatureMove: 'progress와 vital metric을 같은 호흡으로 배치해 돌봄의 감각을 만든다.',
    antiPattern: '파스텔 카드만 반복하는 헬스 앱',
  },
  {
    id: 'luxury-noir',
    keywords: ['luxury', 'premium', 'fashion', 'exclusive', 'noir'],
    direction: '럭셔리 누아르: 말수를 줄이고 어둠, 금속성 accent, 큰 여백으로 값어치를 만든다.',
    signatureMove: '짧은 hero word와 heritage stats만 남겨 브랜드의 침묵을 설계한다.',
    antiPattern: '골드 색상만 칠한 가짜 럭셔리',
  },
  {
    id: 'organic-calm',
    keywords: ['nature', 'environment', 'organic', 'eco', 'green'],
    direction: '유기적 고요함: 자연색을 과시하지 않고 낮은 대비와 느린 읽기 흐름을 만든다.',
    signatureMove: 'hero와 article을 붙여 캠페인보다 삶의 태도로 보이게 한다.',
    antiPattern: '초록색과 잎사귀 장식에 의존하는 에코 UI',
  },
  {
    id: 'social-play',
    keywords: ['social', 'community', 'chat', 'messaging', 'network'],
    direction: '사회적 생동감: 대화, 숫자, 행동이 같은 순간에 살아 움직이게 한다.',
    signatureMove: 'chat bubble과 follower metric을 같은 화면에 두어 관계의 즉시성을 만든다.',
    antiPattern: '프로필 카드만 있는 소셜 앱',
  },
  {
    id: 'pop-bold',
    keywords: ['pop', 'bold', 'museumofmoney', 'motion'],
    direction: '팝 볼드: 색과 움직임을 크게 쓰되 CTA는 하나로 압축한다.',
    signatureMove: '큰 색면과 캠페인형 hero로 첫 화면을 포스터처럼 만든다.',
    antiPattern: '밝은 색만 많고 구조가 없는 팝 디자인',
  },
  {
    id: 'cinematic-dark',
    keywords: ['cinematic', 'film', 'adambricker', 'dark', 'minimal'],
    direction: '시네마틱 다크: 순수 블랙, 낮은 정보량, 강한 focal plane으로 장면을 만든다.',
    signatureMove: '왼쪽 정렬 hero와 거의 비어 있는 표면으로 영화적 긴장을 만든다.',
    antiPattern: '검은 배경 위에 글로우 카드만 쌓은 다크 UI',
  },
  {
    id: 'editorial-brutalist',
    keywords: ['brutalist', 'oci', 'contrast'],
    direction: '에디토리얼 브루탈리즘: 거친 대비와 비대칭으로 질서를 일부러 노출한다.',
    signatureMove: '0px에 가까운 곡률, 강한 색 대비, 큰 타이포를 한 화면에서 충돌시킨다.',
    antiPattern: '못 만든 것처럼 보이는 무근거 브루탈리즘',
  },
  {
    id: 'neon-tech',
    keywords: ['neon', 'futuristic', 'energy', 'on.energy'],
    direction: '네온 테크: 형광색은 면이 아니라 신호로 쓰고 검은 공간으로 절제한다.',
    signatureMove: '네온 accent 하나를 전체 화면의 에너지 원천처럼 제한해 쓴다.',
    antiPattern: '형광 글로우를 아무 곳에나 바르는 미래풍 UI',
  },
  {
    id: 'vintage-warm',
    keywords: ['vintage', 'retro', 'classic', 'griflan'],
    direction: '빈티지 웜: 오래된 인쇄물 같은 온도와 현대적 정렬을 동시에 유지한다.',
    signatureMove: '아이보리 배경과 강한 레드 accent로 한 장의 포스터 같은 화면을 만든다.',
    antiPattern: '세피아 색만 입힌 복고풍',
  },
  {
    id: 'quantum-glow',
    keywords: ['quantum', 'glow', 'ai', 'haiqu'],
    direction: '퀀텀 글로우: 빛은 장식이 아니라 깊이와 집중을 만드는 장치다.',
    signatureMove: '차가운 블루 계열을 낮은 표면 위에 쌓아 기술적 깊이를 만든다.',
    antiPattern: '무의미한 orb/blob/glow 장식',
  },
  {
    id: 'museum-modern',
    keywords: ['museum', 'culture', 'modern', 'rom.on.ca'],
    direction: '뮤지엄 모던: 작품보다 UI가 앞서지 않도록 흰 공간과 비대칭을 절제한다.',
    signatureMove: 'monochrome hero와 gallery를 큰 간격으로 분리해 전시실의 호흡을 만든다.',
    antiPattern: '작품 카드만 나열한 갤러리 페이지',
  },
  {
    id: 'architectural-luxury',
    keywords: ['architecture', 'arch', 'luxuryarchitecture'],
    direction: '건축적 럭셔리: 수직/수평 질서, 재료감 있는 색, 느린 모션으로 공간감을 만든다.',
    signatureMove: '중앙 hero와 stat row를 건축 도면처럼 정제된 축으로 묶는다.',
    antiPattern: '건물 사진 없이도 성립하지 않는 건축 UI',
  },
  {
    id: 'east-minimal',
    keywords: ['east', 'japanese', 'zen', 'minimal', 'muji'],
    direction: '동아시아 미니멀: 거의 없는 장식, 낮은 채도, 빈 공간 자체를 콘텐츠로 만든다.',
    signatureMove: '짧은 문장, 큰 여백, 작은 행동 하나만 남긴다.',
    antiPattern: '흰 배경과 얇은 선만 있는 무성격 미니멀',
  },
  {
    id: 'osmo-toolkit',
    keywords: ['osmo', 'toolkit', 'resource'],
    direction: '리소스 툴킷: 다채로운 카드가 무질서하지 않게 리듬과 기능을 동시에 드러낸다.',
    signatureMove: 'mosaic grid와 pill geometry로 탐색의 재미를 만든다.',
    antiPattern: '자료 카드만 많은 디렉터리 UI',
  },
];

function templateAestheticText(template) {
  return [
    template.id,
    template.name,
    template.desc,
    template.description,
    template.ref,
    template.references,
    template.gridStyle,
    template.style,
    template.motion,
    ...(template.tags || []),
    ...(template.domainTags || []),
  ].filter(Boolean).join(' ').toLowerCase();
}

function matchAestheticProfile(template) {
  const haystack = templateAestheticText(template);
  const ranked = AESTHETIC_PROFILES
    .map(profile => ({
      profile,
      hits: profile.keywords.filter(keyword => haystack.includes(keyword)).length,
    }))
    .filter(item => item.hits > 0)
    .sort((a, b) => b.hits - a.hits);
  return ranked[0] || null;
}

function scoreAestheticDirection(template, cardTypes) {
  const match = matchAestheticProfile(template);
  const profile = match?.profile || null;
  const direction = profile
    ? Math.min(10, 7 + Math.min(match.hits, 3))
    : 0;
  let memorabilitySignals = profile ? 4 : 0;
  if (template.isClone || template.ref || template.references) memorabilitySignals += 2;
  if (template.customColor) memorabilitySignals += 1;
  if (['asymmetric', 'mosaic', 'featured', 'editorial'].includes(template.gridStyle)) memorabilitySignals += 1;
  if (['expressive', 'cinematic'].includes(template.motion)) memorabilitySignals += 1;
  if (['brutalist', 'pill', 'sharp', 'flat'].includes(template.style)) memorabilitySignals += 1;
  if (cardTypes.size >= 3) memorabilitySignals += 1;
  if (template.heroAlign === 'left') memorabilitySignals += 1;

  const memorability = Math.min(8, memorabilitySignals);
  return {
    profile: profile ? {
      id: profile.id,
      direction: profile.direction,
      signatureMove: profile.signatureMove,
      antiPattern: profile.antiPattern,
      keywordHits: match.hits,
    } : null,
    direction,
    memorability,
    score: direction + memorability,
    pass: direction >= 8 && memorability >= 4,
  };
}

function scoreTemplateQuality(template, data) {
  const cards = template.preview?.cards || [];
  const cardTypes = new Set(cards.map(card => card.type));
  const primaryCtaCount = countPrimaryCta(template);
  const aesthetic = scoreAestheticDirection(template, cardTypes);
  const reasons = [];
  const warnings = [];
  const subscores = {
    hierarchy: template.heroAlign && cards.some(card => ['hero', 'metric', 'article'].includes(card.type)) ? 14 : 9,
    spacing: data.layout_tokens?.['space-section'] && data.layout_tokens?.['card-padding'] ? 12 : 8,
    color: template.color && data.color?.some(item => item.id === template.color) ? 12 : 0,
    typography: (template.typography || template.typo) && data.typography?.some(item => item.id === (template.typography || template.typo)) ? 12 : 0,
    responsive: cards.every(card => typeof card.span === 'string' || cards.length <= 3) ? 10 : 7,
    motion: template.motion && data.motion?.some(item => item.id === template.motion) ? 6 : 0,
    fidelity: cardTypes.size >= 3 ? 10 : cardTypes.size >= 2 ? 7 : 3,
    restraint: primaryCtaCount <= 1 ? 6 : 0,
    aestheticDirection: aesthetic.direction,
    memorability: aesthetic.memorability,
  };

  if (!cards.length) reasons.push('preview.cards가 없어 생성 품질을 판단할 수 없습니다.');
  if (primaryCtaCount > 1) reasons.push(`Primary CTA가 ${primaryCtaCount}개입니다. 한 viewport에는 1개만 허용합니다.`);
  if (hasBannedPlaceholderText(template)) reasons.push('placeholder/lorem/dummy 텍스트가 포함되어 있습니다.');
  if (hasSingletonLastRowPreviewGrid(template)) reasons.push('그리드 마지막 줄에 singleton 항목이 생깁니다.');
  if (cardTypes.size < 2) reasons.push('카드 타입 다양성이 부족합니다.');
  if (!aesthetic.profile) reasons.push('aesthetic profile이 없습니다. 템플릿은 명확한 미학 방향을 가져야 합니다.');
  if (aesthetic.direction < 8) reasons.push(`aesthetic direction 점수 ${aesthetic.direction}/10입니다. 강한 시각 방향이 부족합니다.`);
  if (aesthetic.memorability < 4) reasons.push(`memorability 점수 ${aesthetic.memorability}/8입니다. 기억에 남는 signature move가 부족합니다.`);
  if (!template.tags?.length && !template.domainTags?.length) warnings.push('도메인/태그 메타데이터가 부족합니다.');
  if (aesthetic.memorability < 6) warnings.push('signature move가 약합니다. 안전한 정합성을 넘어 기억점을 더 강화하세요.');

  const score = Math.max(0, Math.min(100, Object.values(subscores).reduce((sum, value) => sum + value, 0) - reasons.length * 12));
  const grade = score >= 97 && reasons.length === 0 ? 'A+' : score >= 93 && reasons.length === 0 ? 'A' : score >= 90 ? 'A-' : score >= 87 ? 'B+' : 'B';
  return {
    template: template.id,
    score,
    grade,
    pass: score >= 93 && reasons.length === 0,
    primaryCtaCount,
    cardTypes: [...cardTypes],
    aesthetic,
    subscores,
    reasons,
    warnings,
  };
}

function buildGenerationContract(data, template, preset) {
  const score = scoreTemplateQuality(template, data);
  const typo = data.typography?.find(item => item.id === (template.typography || template.typo));
  const layout = data.layout?.find(item => item.id === template.layout);
  const style = data.style?.find(item => item.id === template.style);
  const motion = data.motion?.find(item => item.id === template.motion);
  const pagePattern = (template.domainTags || template.tags || []).map(tag => data.page_patterns?.[tag]).find(Boolean);
  const balance = buildBalanceContract({
    layout,
    template,
    components: data.components || [],
    pagePattern,
    layoutTokens: data.layout_tokens || {},
  });
  return {
    version: PKG_VERSION,
    kind: 'duvu-generation-contract',
    template: {
      id: template.id,
      name: template.name,
      description: template.description || template.desc,
      tags: template.tags || [],
      domainTags: template.domainTags || [],
    },
    presets: {
      color: { id: preset.id, source: preset.src, dark: preset.dark, light: preset.light },
      typography: typo ? { id: typo.id, family: typo.family, mood: typo.mood } : { id: template.typography || template.typo },
      layout: layout ? { id: layout.id, multiplier: layout.multiplier, mood: layout.mood } : { id: template.layout },
      style: style ? { id: style.id, radius: style.radius, mood: style.mood } : { id: template.style },
      motion: motion ? { id: motion.id, duration: motion.duration, mood: motion.mood } : { id: template.motion },
    },
    composition: {
      heroAlign: template.heroAlign || 'center',
      gridStyle: template.gridStyle || 'default',
      previewCards: template.preview?.cards || [],
      pagePattern: pagePattern || null,
    },
    aesthetic: score.aesthetic,
    balance,
    quality: {
      score,
      hardRules: [
        '먼저 하나의 강한 aesthetic direction을 정하고 모든 배치/색/타이포/모션을 그 방향에 종속시킨다.',
        '각 화면에는 기억에 남는 signature move가 하나 이상 있어야 한다.',
        'Primary CTA는 한 viewport에 1개만 둔다.',
        'placeholder, lorem ipsum, stock-like blank block을 금지한다.',
        '장식용 gradient/glow/orb와 중첩 카드를 금지한다.',
        '모든 색상/간격/반경/모션은 DUVU 토큰 또는 alias에서 파생한다.',
        '모바일에서는 level이 낮은 장식 요소부터 생략하고 핵심 콘텐츠는 숨기지 않는다.',
        'prefers-reduced-motion과 44px 터치 타겟을 반드시 유지한다.',
      ],
      rubric: {
        hierarchy: '한 화면의 정보 계층은 4단계 이하, 가장 중요한 행동은 1개.',
        spacing: '그룹 내 간격보다 그룹 간 간격을 최소 2배 크게 잡는다.',
        balance: 'intent, layout restraint, page flow를 읽고 전역 rhythm/density/alignment/wrapping을 먼저 정한 뒤 컴포넌트 기하를 배치한다.',
        color: 'accent는 CTA/활성/링크에만 쓰고 화면 면적 10% 이하로 제한한다.',
        typography: 'viewport width 기반 폰트 스케일링을 피하고 토큰 스케일을 사용한다.',
        fidelity: '도메인에 맞는 실제 콘텐츠 구조를 사용하고 무의미한 카드 나열을 피한다.',
        aesthetic: '평균적 AI UI가 아니라 profile.direction과 signatureMove가 즉시 읽히는 화면을 만든다.',
      },
    },
    prompt: [
      `Build a ${template.name} interface using DUVU tokens only.`,
      score.aesthetic.profile ? `Aesthetic direction: ${score.aesthetic.profile.direction}` : 'Choose one explicit aesthetic direction before drawing the UI.',
      score.aesthetic.profile ? `Signature move: ${score.aesthetic.profile.signatureMove}` : 'Create one memorable signature move.',
      `Use ${preset.id} color, ${template.typography || template.typo} typography, ${template.layout} layout, ${template.style} style, and ${template.motion} motion.`,
      `Honor the global balance contract: ${balance.journeyMode} journey, ${balance.densityMode} density, ${balance.alignmentMode} alignment, ${balance.wrapMode} text wrapping, ${balance.separationMode} surface separation.`,
      'Do not create generic AI-looking card grids, decorative gradient blobs, placeholder copy, or nested cards.',
      'Make the first viewport show a clear product/domain signal, a strong hierarchy, and exactly one primary action.',
      'Use the previewCards as structural intent, not as decorative filler.',
    ].join(' '),
  };
}

function printContractMarkdown(contract) {
  console.log(`# DUVU Generation Contract: ${contract.template.id}

## Presets
- color: ${contract.presets.color.id} (${contract.presets.color.source})
- typography: ${contract.presets.typography.id}
- layout: ${contract.presets.layout.id}
- style: ${contract.presets.style.id}
- motion: ${contract.presets.motion.id}

## Quality
- score: ${contract.quality.score.score}/100 (${contract.quality.score.grade})
- pass: ${contract.quality.score.pass}
- primary CTA count: ${contract.quality.score.primaryCtaCount}

## Aesthetic Direction
- profile: ${contract.aesthetic.profile?.id || 'none'}
- direction: ${contract.aesthetic.profile?.direction || '명시적 미학 방향을 먼저 정해야 함'}
- signature move: ${contract.aesthetic.profile?.signatureMove || '기억에 남는 구조적 장면을 하나 만든다'}
- avoid: ${contract.aesthetic.profile?.antiPattern || 'generic AI-looking UI'}

## Balance
- journey: ${contract.balance.journeyMode}
- restraint: ${contract.balance.restraint}
- density: ${contract.balance.densityMode}
- alignment: ${contract.balance.alignmentMode}
- wrapping: ${contract.balance.wrapMode}
- separation: ${contract.balance.separationMode}
- palette bias: ${contract.balance.paletteBias}

## Hard Rules
${contract.quality.hardRules.map(rule => `- ${rule}`).join('\n')}

## Prompt
${contract.prompt}
`);
}

function countMatches(input, re) {
  return [...input.matchAll(re)].length;
}

function readCssPxCustomProperty(source, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`${escaped}\\s*:\\s*(\\d+(?:\\.\\d+)?)px\\b`, 'i'));
  return match ? Number(match[1]) : null;
}

function lintGeneratedHtml(filePath) {
  const absolutePath = resolve(process.cwd(), filePath || '');
  if (!filePath || !existsSync(absolutePath) || statSync(absolutePath).isDirectory()) {
    throw new Error(`검사할 HTML 파일을 찾을 수 없습니다: ${filePath || '(없음)'}`);
  }
  const size = statSync(absolutePath).size;
  if (size > 2 * 1024 * 1024) throw new Error('tokens lint는 2MB 이하 HTML/CSS 파일만 검사합니다.');

  const source = readFileSync(absolutePath, 'utf8');
  const htmlSurface = source.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  const tokenAwareSurface = htmlSurface
    .replace(/--duvu-[\w-]+\s*:\s*#[0-9a-fA-F]{3,8}\b\s*;?/g, '--duvu-token: var(--duvu-token);');
  const fontTokenViolations = [
    ['--duvu-font-size-xs', 16],
    ['--duvu-font-size-sm', 16],
    ['--duvu-font-size-base', 17],
  ].flatMap(([name, min]) => {
    const value = readCssPxCustomProperty(htmlSurface, name);
    return value !== null && value < min ? [`${name} ${value}px < ${min}px`] : [];
  });
  const hasPaletteCards = /class=["'][^"']*\bcolor-card\b/i.test(htmlSurface) || /\.color-card\b/i.test(htmlSurface);
  const paletteLabelGap = readCssPxCustomProperty(htmlSurface, '--duvu-space-card-label-gap');
  const paletteMobileTwoColumn = /@media\s*\([^)]*max-width\s*:\s*640px[^)]*\)[\s\S]{0,1200}\.color-grid\s*\{[^}]*grid-template-columns\s*:\s*repeat\(\s*2\s*,/i.test(htmlSurface);
  const singletonPronePillWrap = /\.pill-grid\s*\{[^}]*display\s*:\s*flex[^}]*flex-wrap\s*:\s*wrap/i.test(htmlSurface);
  const mobileTabHorizontalScroll = /@media\s*\([^)]*max-width\s*:\s*640px[^)]*\)[\s\S]{0,1600}\.tab-bar\s*\{[^}]*overflow-x\s*:\s*auto[^}]*flex-wrap\s*:\s*nowrap/i.test(htmlSurface)
    || /@media\s*\([^)]*max-width\s*:\s*640px[^)]*\)[\s\S]{0,1600}\.tab-bar\s*\{[^}]*flex-wrap\s*:\s*nowrap[^}]*overflow-x\s*:\s*auto/i.test(htmlSurface);
  const codeTabsHorizontalScroll = /\.code-tabs\s*\{[^}]*overflow-x\s*:\s*auto/i.test(htmlSurface)
    || /\.code-tabs\s*\{[^}]*overflow\s*:\s*auto/i.test(htmlSurface)
    || /\.code-tab\s*\{[^}]*white-space\s*:\s*nowrap/i.test(htmlSurface);
  const codeSurfaceRadiusUncapped = /\.code-preview-block\s*\{[^}]*border-radius\s*:\s*var\(\s*--duvu-radius-sm/i.test(htmlSurface);
  const reasons = [];
  const warnings = [];
  const metrics = {
    bytes: size,
    h1: countMatches(htmlSurface, /<h1\b/gi),
    main: countMatches(htmlSurface, /<main\b/gi),
    primaryCta: countMatches(htmlSurface, /\b(data-primary|aria-label=["'][^"']*primary|class=["'][^"']*(?:primary|btn-primary|button-primary)[^"']*)/gi),
    hardcodedHex: countMatches(tokenAwareSurface, /#[0-9a-fA-F]{3,8}\b/g),
    rawPxSpacing: countMatches(tokenAwareSurface, /(?<!-)\b(?:margin|padding|gap|row-gap|column-gap|inset|top|right|bottom|left)\s*:\s*(?!\s*var\()[^;{}]*\d+(?:\.\d+)?px\b/gi),
    rawPxRadius: countMatches(tokenAwareSurface, /\bborder-radius\s*:\s*(?!\s*var\()[^;{}]*\d+(?:\.\d+)?px\b/gi),
    duvuTokenRefs: countMatches(tokenAwareSurface, /(?:var\(--duvu-|--duvu-)/g),
    viewportFontSizes: countMatches(tokenAwareSurface, /font-size\s*:\s*(?!\s*var\()[^;{}]*vw\b/gi),
    tinyFontDeclarations: [...tokenAwareSurface.matchAll(/font-size\s*:\s*(\d+(?:\.\d+)?)px\b/gi)].filter(match => Number(match[1]) < 16).length,
    fontTokenFloorViolations: fontTokenViolations.length,
    paletteLabelGap: paletteLabelGap ?? null,
    paletteMobileTwoColumn: paletteMobileTwoColumn ? 1 : 0,
    singletonPronePillWrap: singletonPronePillWrap ? 1 : 0,
    mobileTabHorizontalScroll: mobileTabHorizontalScroll ? 1 : 0,
    codeTabsHorizontalScroll: codeTabsHorizontalScroll ? 1 : 0,
    codeSurfaceRadiusUncapped: codeSurfaceRadiusUncapped ? 1 : 0,
    nestedCardHints: countMatches(htmlSurface, /class=["'][^"']*card[^"']*["'][\s\S]{0,800}class=["'][^"']*card[^"']*["']/gi),
  };

  if (/(lorem ipsum|placeholder|dummy text|sample image|your (?:title|subtitle|content) here)/i.test(htmlSurface)) {
    reasons.push('placeholder/lorem/dummy 텍스트가 포함되어 있습니다.');
  }
  if (!metrics.duvuTokenRefs) reasons.push('DUVU 토큰 참조가 없습니다. var(--duvu-*) 또는 --duvu-* 토큰을 사용해야 합니다.');
  if (metrics.hardcodedHex > 0) reasons.push(`raw hex ${metrics.hardcodedHex}개가 있습니다. 색상은 DUVU 토큰/alias로만 사용하세요.`);
  if (metrics.rawPxSpacing > 0) reasons.push(`raw px spacing ${metrics.rawPxSpacing}개가 있습니다. spacing은 DUVU 토큰으로만 사용하세요.`);
  if (metrics.rawPxRadius > 0) reasons.push(`raw px radius ${metrics.rawPxRadius}개가 있습니다. radius는 DUVU 토큰으로만 사용하세요.`);
  if (!/prefers-reduced-motion\s*:\s*reduce/i.test(tokenAwareSurface)) reasons.push('prefers-reduced-motion: reduce 처리가 없습니다.');
  if (metrics.primaryCta > 1) reasons.push(`Primary CTA 후보가 ${metrics.primaryCta}개입니다. 한 viewport에는 1개만 허용합니다.`);
  if (metrics.viewportFontSizes > 0) reasons.push('font-size에 vw 단위를 직접 사용했습니다. 토큰/clamp/rem 기반 스케일을 사용하세요.');
  if (metrics.tinyFontDeclarations > 0) reasons.push(`16px 미만 font-size 선언 ${metrics.tinyFontDeclarations}개가 있습니다. 보조 텍스트도 읽을 수 있는 크기로 유지하세요.`);
  if (fontTokenViolations.length) reasons.push(`타입 토큰 하한 위반: ${fontTokenViolations.join(', ')}`);
  if (hasPaletteCards && paletteLabelGap !== null && (paletteLabelGap < 6 || paletteLabelGap > 10)) {
    reasons.push(`팔레트 카드 이름/메타 간격 ${paletteLabelGap}px가 부적절합니다. 6~10px 범위를 사용하세요.`);
  }
  if (metrics.paletteMobileTwoColumn) reasons.push('모바일 팔레트가 2열입니다. 팔레트 탐색은 세로 과밀을 막기 위해 3열 이상을 사용하세요.');
  if (metrics.singletonPronePillWrap) reasons.push('프리셋 칩이 flex-wrap 기반입니다. singleton 마지막 줄을 막는 균형 그리드를 사용하세요.');
  if (metrics.mobileTabHorizontalScroll) reasons.push('모바일 탭이 가로 스크롤/nowrap 구조입니다. 좁은 화면에서 잘림 없이 3열 균형 그리드로 배치하세요.');
  if (metrics.codeTabsHorizontalScroll) reasons.push('코드 출력 탭이 가로 스크롤/nowrap 구조입니다. 좁은 화면에서도 모든 플랫폼 탭이 보이는 균형 래핑을 사용하세요.');
  if (metrics.codeSurfaceRadiusUncapped) reasons.push('코드/데이터 표면이 전역 radius-sm을 그대로 사용합니다. pill/soft 스타일에서도 형태가 망가지지 않도록 전용 반경 상한 토큰을 사용하세요.');
  if (/\b(gradient-orb|orb|blob|bokeh|glow)\b/i.test(htmlSurface)) reasons.push('orb/blob/bokeh/glow 계열 장식 흔적이 있습니다.');
  if (metrics.nestedCardHints > 0) reasons.push('중첩 카드로 보이는 구조가 있습니다.');
  if (/<button\b|role=["']button|class=["'][^"']*btn/i.test(htmlSurface)) {
    const minHeights = [...tokenAwareSurface.matchAll(/min-height\s*:\s*(\d+(?:\.\d+)?)px/gi)].map(match => Number(match[1]));
    if (!minHeights.some(value => value >= 44)) reasons.push('버튼/인터랙션 요소가 있지만 44px 이상 min-height 근거가 없습니다.');
  }
  if (metrics.h1 !== 1) warnings.push(`h1 개수가 ${metrics.h1}개입니다. 대부분의 페이지는 1개가 적절합니다.`);
  if (metrics.main < 1) warnings.push('main landmark가 없습니다.');

  const score = Math.max(0, Math.min(100, 100 - reasons.length * 12 - warnings.length * 3));
  const grade = score >= 97 && reasons.length === 0 ? 'A+' : score >= 93 && reasons.length === 0 ? 'A' : score >= 90 ? 'A-' : score >= 87 ? 'B+' : 'B';
  return {
    file: relative(process.cwd(), absolutePath),
    score,
    grade,
    pass: score >= 93 && reasons.length === 0,
    metrics,
    reasons,
    warnings,
  };
}

async function tokensCmd(subcmd) {
  const data = loadPresets();
  let preset;
  try { preset = tokenSourceFromArgs(data); }
  catch (e) {
    console.log(`${c.red}${e.message}${c.r}`);
    process.exit(1);
  }

  if (subcmd === 'export') {
    const formatIdx = args.indexOf('--format');
    const format = formatIdx >= 0 ? args[formatIdx + 1] : 'dtcg';
    const dtcg = buildDtcgTokens(data, preset);
    if (format === 'dtcg') {
      console.log(JSON.stringify(dtcg, null, 2));
    } else if (format === 'figma') {
      console.log(JSON.stringify(toFigmaVariableExport(dtcg), null, 2));
    } else if (format === 'figma-dtcg') {
      const mode = getArgValue('--mode');
      if (mode) {
        const figmaTokens = buildFigmaDtcgTokens(data, preset, mode);
        const audit = auditFigmaDtcgTokens(figmaTokens);
        if (audit.issues.length) {
          console.log(`${c.red}Figma DTCG export 실패:${c.r}`);
          audit.issues.forEach(issue => console.log(`  ${c.red}✗${c.r} ${issue}`));
          process.exit(1);
        }
        console.log(JSON.stringify(figmaTokens, null, 2));
      } else {
        const files = ['dark', 'light'].map(itemMode => {
          const tokens = buildFigmaDtcgTokens(data, preset, itemMode);
          const audit = auditFigmaDtcgTokens(tokens);
          return {
            filename: `duvu-${preset.id}-${itemMode}.tokens.json`,
            collection: `DUVU ${preset.id}`,
            mode: itemMode,
            importReady: audit.issues.length === 0,
            tokenCount: audit.flat.length,
            issues: audit.issues,
            audit,
            tokens,
          };
        });
        const bundleAudit = auditFigmaDtcgBundle(files);
        for (const file of files) {
          delete file.audit;
          file.importReady = file.importReady && bundleAudit.issues.length === 0;
        }
        console.log(JSON.stringify({
          format: 'figma-dtcg-import-bundle',
          note: 'Figma imports one DTCG JSON file per mode. Save each files[].tokens object as files[].filename and import it into the target Variables collection/mode.',
          importReady: bundleAudit.issues.length === 0 && files.every(file => file.importReady),
          parityIssues: bundleAudit.issues,
          files,
        }, null, 2));
      }
    } else if (format === 'figma-api') {
      const payload = buildFigmaApiPayload(data, preset);
      const audit = auditFigmaApiPayload(payload);
      if (audit.issues.length) {
        console.log(`${c.red}Figma API payload export 실패:${c.r}`);
        audit.issues.forEach(issue => console.log(`  ${c.red}✗${c.r} ${issue}`));
        process.exit(1);
      }
      console.log(JSON.stringify(payload, null, 2));
    } else {
      console.log(`${c.red}지원하지 않는 토큰 export format: ${format}${c.r}`);
      console.log('지원 format: dtcg, figma, figma-dtcg, figma-api');
      process.exit(1);
    }
    writeLog({ cmd: 'tokens export', args, presets: { color: preset.id } });
    return;
  }

  if (subcmd === 'sync-figma' || subcmd === 'push-figma') {
    const fileKey = getArgValue('--file-key') || getArgValue('--file');
    const token = getArgValue('--token') || process.env.FIGMA_TOKEN || process.env.DUVU_FIGMA_TOKEN;
    const dryRun = args.includes('--dry-run');
    const payload = buildFigmaApiPayload(data, preset);
    const audit = auditFigmaApiPayload(payload);
    if (audit.issues.length) {
      console.log(`${c.red}Figma API payload 검증 실패:${c.r}`);
      audit.issues.forEach(issue => console.log(`  ${c.red}✗${c.r} ${issue}`));
      process.exit(1);
    }
    if (!fileKey) {
      console.log(`${c.red}--file-key가 필요합니다.${c.r}`);
      console.log('사용법: duvu tokens sync-figma --file-key <figma_file_key> [--token <token>|FIGMA_TOKEN] [--dry-run]');
      process.exit(1);
    }
    if (dryRun) {
      console.log(JSON.stringify({
        ok: true,
        dryRun: true,
        endpoint: `POST /v1/files/${fileKey}/variables`,
        audit,
        payload,
      }, null, 2));
      writeLog({ cmd: 'tokens sync-figma', args, presets: { color: preset.id }, result: { dryRun: true, variables: audit.variables } });
      return;
    }
    if (!token) {
      console.log(`${c.red}Figma API 토큰이 필요합니다.${c.r}`);
      console.log('FIGMA_TOKEN 환경변수 또는 --token <token>을 사용하세요. 토큰은 출력/로그에 기록하지 않습니다.');
      process.exit(1);
    }
    const result = await postFigmaVariables({ fileKey, token, payload });
    if (!result.ok) {
      console.log(`${c.red}Figma Variables POST 실패:${c.r} HTTP ${result.status} ${result.statusText}`);
      if (result.body?.message) console.log(`  ${c.red}✗${c.r} ${result.body.message}`);
      else if (result.body?.err) console.log(`  ${c.red}✗${c.r} ${result.body.err}`);
      writeLog({ cmd: 'tokens sync-figma', args: args.filter(arg => arg !== token), presets: { color: preset.id }, error: `HTTP ${result.status}` });
      process.exit(1);
    }
    console.log(JSON.stringify({
      ok: true,
      status: result.status,
      audit,
      response: result.body,
    }, null, 2));
    writeLog({ cmd: 'tokens sync-figma', args: args.filter(arg => arg !== token), presets: { color: preset.id }, result: { status: result.status, variables: audit.variables } });
    return;
  }

  if (subcmd === 'contract' || subcmd === 'prompt') {
    let template;
    try { template = templateFromArgs(data); }
    catch (e) {
      console.log(`${c.red}${e.message}${c.r}`);
      process.exit(1);
    }
    const format = getArgValue('--format', subcmd === 'prompt' ? 'md' : 'json');
    try { preset = resolveContractPreset(data, template, preset); }
    catch (e) {
      console.log(`${c.red}${e.message}${c.r}`);
      process.exit(1);
    }
    const contract = buildGenerationContract(data, template, preset);
    if (!contract.quality.score.pass) {
      console.log(`${c.red}템플릿 품질 게이트 실패:${c.r} ${contract.quality.score.reasons.join(', ')}`);
      process.exit(1);
    }
    if (format === 'json') console.log(JSON.stringify(contract, null, 2));
    else if (format === 'md' || format === 'markdown') printContractMarkdown(contract);
    else {
      console.log(`${c.red}지원하지 않는 contract format: ${format}${c.r}`);
      console.log('지원 format: json, md');
      process.exit(1);
    }
    writeLog({ cmd: `tokens ${subcmd}`, args, presets: { color: preset.id }, result: { template: template.id, score: contract.quality.score.score } });
    return;
  }

  if (subcmd === 'score') {
    const templateId = getArgValue('--template');
    const templates = templateId ? [templateFromArgs(data)] : (data.templates || []);
    const result = templates.map(template => scoreTemplateQuality(template, data));
    console.log(JSON.stringify(templateId ? result[0] : result, null, 2));
    const failures = result.filter(item => !item.pass);
    writeLog({ cmd: 'tokens score', args, result: { checked: result.length, fail: failures.length } });
    if (failures.length) process.exit(1);
    return;
  }

  if (subcmd === 'lint') {
    const fileArg = args[1];
    const format = getArgValue('--format', 'text');
    let result;
    try { result = lintGeneratedHtml(fileArg); }
    catch (e) {
      console.log(`${c.red}${e.message}${c.r}`);
      process.exit(1);
    }
    if (format === 'json') {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`${c.b}${c.cyan}DUVU 생성 결과물 린트${c.r}`);
      console.log(`  파일: ${result.file}`);
      console.log(`  점수: ${result.score}/100 (${result.grade})`);
      console.log(`  결과: ${result.pass ? c.green + '통과' : c.red + '실패'}${c.r}\n`);
      for (const reason of result.reasons) console.log(`  ${c.red}✗${c.r} ${reason}`);
      for (const warning of result.warnings) console.log(`  ${c.yellow}!${c.r} ${warning}`);
      if (!result.reasons.length && !result.warnings.length) console.log(`  ${c.green}✓${c.r} AI 슬롭/토큰 하드 게이트 통과`);
    }
    writeLog({ cmd: 'tokens lint', args, result: { score: result.score, pass: result.pass, fail: result.reasons.length } });
    if (!result.pass) process.exit(1);
    return;
  }

  if (subcmd === 'audit' || subcmd === 'quality' || !subcmd) {
    const result = auditTokenEngine(data, preset);
    console.log(`${c.b}${c.cyan}DUVU 토큰 엔진 감사${c.r}`);
    console.log(`  기준 프리셋: ${c.yellow}${preset.id}${c.r}`);
    console.log(`  DTCG 토큰: ${result.flat.length}개`);
    console.log(`  품질 점수: ${result.score}/100 (${result.grade})\n`);

    console.log(`${c.cyan}── 품질 게이트 ──${c.r}`);
    for (const [label, ok, value] of result.qualityGates) {
      console.log(`  ${ok ? c.green + '✓' : c.red + '✗'}${c.r} ${label} ${c.d}(${value})${c.r}`);
    }

    if (result.warnings.length) {
      console.log(`\n${c.yellow}── 경고 ──${c.r}`);
      result.warnings.slice(0, 20).forEach(item => console.log(`  ${c.yellow}!${c.r} ${item}`));
      if (result.warnings.length > 20) console.log(`  ${c.d}...${result.warnings.length - 20}개 추가 경고${c.r}`);
    }

    if (result.issues.length) {
      console.log(`\n${c.red}── 실패 ──${c.r}`);
      result.issues.forEach(item => console.log(`  ${c.red}✗${c.r} ${item}`));
      writeLog({ cmd: 'tokens audit', result: { score: result.score, grade: result.grade, fail: result.issues.length } });
      process.exit(1);
    }

    console.log(`\n${c.green}✓ DTCG 구조, alias 그래프, 생성형 UI 품질 게이트 통과${c.r}`);
    writeLog({ cmd: 'tokens audit', result: { score: result.score, grade: result.grade, fail: 0 } });
    return;
  }

  console.log(`${c.red}사용법: duvu tokens export|contract|score|lint|audit|sync-figma [--format dtcg|figma|figma-dtcg|figma-api|json|md] [--preset <id>|--hex <#hex>] [--template <id>] [--file-key <key>] [html-file]${c.r}`);
}

function outputCode(preset, platform) {
  const d = preset.dark;
  const l = preset.light;
  const preferredBtnText = isHexColor(preset.btnText) ? preset.btnText : null;
  const darkAction = resolveActionSurface(d.accent, preferredBtnText || readableOnAccent(d.accent));
  const lightAction = resolveActionSurface(l.accent, preferredBtnText || readableOnAccent(l.accent));
  const darkBtnText = darkAction.text;
  const lightBtnText = lightAction.text;
  
  if (platform === 'css') {
    console.log(`\n${c.b}/* DUVU CSS Variables — ${preset.name || preset.id} */${c.r}\n`);
    console.log(`:root {
  /* Color — Dark */
  --duvu-bg: ${d.bg};
  --duvu-surface: ${d.surface};
  --duvu-surface2: ${d.surface2};
  --duvu-fg: ${d.fg};
  --duvu-fg2: ${d.fg2};
  --duvu-fg3: ${d.fg3};
  --duvu-accent: ${d.accent};
  --duvu-action: ${darkAction.bg};
  --duvu-accent-rgb: ${d['accent-rgb']};
  --duvu-btn-text: ${darkBtnText};

	  /* Spacing */
	  --duvu-space-xs: 4px; --duvu-space-sm: 8px; --duvu-space-md: 16px;
	  --duvu-space-lg: 24px; --duvu-space-xl: 32px; --duvu-space-2xl: 48px;

	  /* Typography */
	  --duvu-font-size-title: 56px; --duvu-font-size-subtitle: 20px;
	  --duvu-font-size-xs: 16px; --duvu-font-size-sm: 16px;
	  --duvu-font-size-base: 17px; --duvu-font-size-body: var(--duvu-font-size-base);
	  --duvu-font-size-label: var(--duvu-font-size-xs);

  /* Shape */
  --duvu-radius-sm: 10px; --duvu-radius-md: 10px;
  --duvu-radius-lg: ${preset.radius || 16}px; --duvu-radius-full: 9999px;
  --duvu-btn-radius: 10px; --duvu-card-radius: ${preset.radius || 16}px;

  /* Motion */
  --duvu-dur: 0.4s; --duvu-dur-fast: 0.2s;
  --duvu-ease: cubic-bezier(0.16, 1, 0.3, 1);

  /* Semantic */
  --duvu-success: #2A9D8F; --duvu-warning: #F4A261;
  --duvu-error: #E76F51; --duvu-info: var(--duvu-accent);

  /* Border — 선은 최후 수단. 여백→색차→그림자→선 순서. */
  --duvu-border-width: 1px;
  --duvu-border-color: rgba(255,255,255,0.08);
  --duvu-divider-color: rgba(255,255,255,0.06);
  --duvu-focus-ring: 0 0 0 2px var(--duvu-accent);
}

[data-theme="light"] {
  --duvu-bg: ${l.bg}; --duvu-surface: ${l.surface};
  --duvu-surface2: ${l.surface2}; --duvu-fg: ${l.fg};
  --duvu-fg2: ${l.fg2}; --duvu-fg3: ${l.fg3};
  --duvu-accent: ${l.accent}; --duvu-accent-rgb: ${l['accent-rgb']};
  --duvu-action: ${lightAction.bg};
  --duvu-btn-text: ${lightBtnText};
  --duvu-border-color: rgba(0,0,0,0.08);
  --duvu-divider-color: rgba(0,0,0,0.06);
}

/* Responsive Breakpoints */
:root {
  --duvu-bp-mobile: 640px;
  --duvu-bp-tablet: 768px;
  --duvu-bp-desktop: 1024px;
  --duvu-bp-wide: 1440px;
}

/* Fluid Typography */
	.duvu-title { font-size: var(--duvu-font-size-title); line-height: 1.1; font-weight: 700; letter-spacing: 0; }
	.duvu-subtitle { font-size: var(--duvu-font-size-subtitle); line-height: 1.5; }
	.duvu-body { font-size: var(--duvu-font-size-body); line-height: 1.55; max-width: var(--duvu-content-max-width, 680px); }

/* Responsive Container */
	.duvu-container { width: 100%; max-width: var(--duvu-bp-wide); margin: 0 auto; padding: 0 var(--duvu-space-lg); }
	@media (max-width: 640px) { .duvu-container { padding: 0 var(--duvu-space-md); } }

/* Responsive Grid */
.duvu-grid { display: grid; gap: var(--duvu-space-md); }
.duvu-grid-2 { grid-template-columns: repeat(2, 1fr); }
.duvu-grid-3 { grid-template-columns: repeat(3, 1fr); }
.duvu-grid-4 { grid-template-columns: repeat(4, 1fr); }
@media (max-width: 768px) {
  .duvu-grid-3, .duvu-grid-4 { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .duvu-grid-2, .duvu-grid-3, .duvu-grid-4 { grid-template-columns: 1fr; }
}

/* Touch Target (HIG 44px) */
.duvu-btn, .duvu-input { min-height: 44px; }
@media (max-width: 640px) { .duvu-btn, .duvu-input { min-height: 48px; font-size: 16px; } }

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}`);
  } else if (platform === 'tailwind') {
    console.log(`\n${c.b}/* DUVU Tailwind Config — ${preset.name || preset.id} */${c.r}\n`);
    console.log(`// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        duvu: {
          bg: '${d.bg}',
          surface: '${d.surface}',
          surface2: '${d.surface2}',
          fg: '${d.fg}',
          fg2: '${d.fg2}',
          fg3: '${d.fg3}',
          accent: '${d.accent}',
          action: '${darkAction.bg}',
          btnText: '${darkBtnText}',
          success: '#2A9D8F',
          warning: '#F4A261',
          error: '#E76F51',
        }
      },
      borderRadius: {
        'duvu': '${preset.radius || 16}px',
        'duvu-sm': '10px',
        'duvu-full': '9999px',
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'duvu-xs': '4px', 'duvu-sm': '8px', 'duvu-md': '16px',
        'duvu-lg': '24px', 'duvu-xl': '32px', 'duvu-2xl': '48px',
      },
      screens: {
        'mobile': '640px',
        'tablet': '768px',
        'desktop': '1024px',
        'wide': '1440px',
      },
      minHeight: {
        'touch': '44px',
        'touch-mobile': '48px',
      },
    }
  }
}`);
  } else if (platform === 'flutter') {
    const hex = (h) => h.slice(1).toUpperCase();
    console.log(`\n${c.b}// DUVU Flutter Theme — ${preset.name || preset.id}${c.r}\n`);
    console.log(`import 'package:flutter/material.dart';

final duvuTheme = ThemeData(
  brightness: Brightness.dark,
  scaffoldBackgroundColor: const Color(0xFF${hex(d.bg)}),
  colorScheme: const ColorScheme.dark(
    primary: Color(0xFF${hex(d.accent)}),
    onPrimary: Color(0xFF${hex(darkBtnText)}),
    surface: Color(0xFF${hex(d.surface)}),
    surfaceContainerHighest: Color(0xFF${hex(d.surface2)}),
    onSurface: Color(0xFF${hex(d.fg)}),
    onSurfaceVariant: Color(0xFF${hex(d.fg2)}),
    outline: Color(0xFF${hex(d.fg3)}),
    error: Color(0xFFE76F51),
  ),
  cardTheme: CardTheme(
    color: const Color(0xFF${hex(d.surface)}),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(${preset.radius || 16})),
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: const Color(0xFF${hex(darkAction.bg)}),
      foregroundColor: const Color(0xFF${hex(darkBtnText)}),
      minimumSize: const Size(44, 44),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ),
  ),
);`);
  } else if (platform === 'swiftui') {
    console.log(`\n${c.b}// DUVU SwiftUI Theme — ${preset.name || preset.id}${c.r}\n`);
    console.log(`import SwiftUI

struct DuvuTheme {
    static let bg = Color(hex: "${d.bg}")
    static let surface = Color(hex: "${d.surface}")
    static let surface2 = Color(hex: "${d.surface2}")
    static let fg = Color(hex: "${d.fg}")
    static let fg2 = Color(hex: "${d.fg2}")
    static let fg3 = Color(hex: "${d.fg3}")
    static let accent = Color(hex: "${d.accent}")
    static let action = Color(hex: "${darkAction.bg}")
    static let btnText = Color(hex: "${darkBtnText}")
    static let cornerRadius: CGFloat = ${preset.radius || 16}
    static let btnRadius: CGFloat = 10
    static let success = Color(hex: "#2A9D8F")
    static let warning = Color(hex: "#F4A261")
    static let error = Color(hex: "#E76F51")
}`);
  } else if (platform === 'compose') {
    const hex = (h) => h.slice(1).toUpperCase();
    console.log(`\n${c.b}// DUVU Compose Theme — ${preset.name || preset.id}${c.r}\n`);
    console.log(`import androidx.compose.ui.graphics.Color

object DuvuColors {
    val bg = Color(0xFF${hex(d.bg)})
    val surface = Color(0xFF${hex(d.surface)})
    val surface2 = Color(0xFF${hex(d.surface2)})
    val fg = Color(0xFF${hex(d.fg)})
    val fg2 = Color(0xFF${hex(d.fg2)})
    val fg3 = Color(0xFF${hex(d.fg3)})
    val accent = Color(0xFF${hex(d.accent)})
    val action = Color(0xFF${hex(darkAction.bg)})
    val btnText = Color(0xFF${hex(darkBtnText)})
    val success = Color(0xFF2A9D8F)
    val warning = Color(0xFFF4A261)
    val error = Color(0xFFE76F51)
}

val DuvuShapes = Shapes(
    small = RoundedCornerShape(10.dp),
    medium = RoundedCornerShape(${preset.radius || 16}.dp),
    large = RoundedCornerShape(${preset.radius || 16}.dp),
)`);
  } else if (platform === 'unity') {
    console.log(`\n${c.b}// DUVU Unity Theme — ${preset.name || preset.id}${c.r}\n`);
    console.log(`using UnityEngine;

[CreateAssetMenu(menuName = "DUVU/Theme")]
public class DuvuTheme : ScriptableObject
{
    public Color bg = ColorUtility.TryParseHtmlString("${d.bg}", out var _bg) ? _bg : Color.black;
    public Color surface = ColorUtility.TryParseHtmlString("${d.surface}", out var _s) ? _s : Color.black;
    public Color surface2 = ColorUtility.TryParseHtmlString("${d.surface2}", out var _s2) ? _s2 : Color.black;
    public Color fg = ColorUtility.TryParseHtmlString("${d.fg}", out var _fg) ? _fg : Color.white;
    public Color fg2 = ColorUtility.TryParseHtmlString("${d.fg2}", out var _fg2) ? _fg2 : Color.gray;
    public Color fg3 = ColorUtility.TryParseHtmlString("${d.fg3}", out var _fg3) ? _fg3 : Color.gray;
    public Color accent = ColorUtility.TryParseHtmlString("${d.accent}", out var _a) ? _a : Color.blue;
    public Color action = ColorUtility.TryParseHtmlString("${darkAction.bg}", out var _act) ? _act : Color.blue;
    public Color btnText = ColorUtility.TryParseHtmlString("${darkBtnText}", out var _bt) ? _bt : Color.white;
    public float cornerRadius = ${preset.radius || 16}f;
    public float btnRadius = 10f;
}`);
  } else if (platform === 'react-native') {
    console.log(`\n${c.b}// DUVU React Native Theme — ${preset.name || preset.id}${c.r}\n`);
    console.log(`const DuvuTheme = {
  colors: {
    bg: '${d.bg}',
    surface: '${d.surface}',
    surface2: '${d.surface2}',
    fg: '${d.fg}',
    fg2: '${d.fg2}',
    fg3: '${d.fg3}',
    accent: '${d.accent}',
    action: '${darkAction.bg}',
    btnText: '${darkBtnText}',
    success: '#2A9D8F',
    warning: '#F4A261',
    error: '#E76F51',
  },
  radius: { sm: 10, md: ${preset.radius || 16}, full: 9999 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
};

export default DuvuTheme;`);
  } else {
    console.log(`${c.red}지원하지 않는 플랫폼: ${platform}${c.r}`);
    console.log(`지원 플랫폼: css, tailwind, flutter, swiftui, compose, unity, react-native`);
  }
}

// ─── Add / Remove / Reset ───
function addPreset(type, jsonStr) {
  if (!type || !jsonStr) {
    console.log(`${c.red}사용법: duvu add <type> '<json>'${c.r}`);
    return;
  }
  ensureDefaults();
  const data = loadPresets();
  const key = TYPE_MAP[type];
  if (!key || !data[key]) {
    console.log(`${c.red}알 수 없는 타입: ${type}${c.r}`);
    return;
  }
  
  let newItem;
  try { newItem = JSON.parse(jsonStr); } catch(e) {
    console.log(`${c.red}JSON 파싱 실패: ${e.message}${c.r}`);
    writeLog({ cmd: 'add', args: [type], error: 'json parse: ' + e.message });
    return;
  }
  
  if (!newItem.id) {
    console.log(`${c.red}id 필드가 필요합니다.${c.r}`);
    return;
  }
  
  const existing = data[key].findIndex(i => i.id === newItem.id);
  if (existing >= 0) {
    data[key][existing] = newItem;
    console.log(`${c.yellow}${key}/${newItem.id} 업데이트됨${c.r}`);
  } else {
    data[key].push(newItem);
    console.log(`${c.green}${key}/${newItem.id} 추가됨${c.r}`);
  }
  savePresets(data);
  writeLog({ cmd: 'add', args: [type, newItem.id], result: existing >= 0 ? 'updated' : 'added' });
}

function removePreset(type, id) {
  if (!type || !id) {
    console.log(`${c.red}사용법: duvu remove <type> <id>${c.r}`);
    return;
  }
  ensureDefaults();
  const data = loadPresets();
  const defaults = JSON.parse(readFileSync(join(DEFAULTS_DIR, 'presets.json'), 'utf8'));
  const key = TYPE_MAP[type];
  if (!key) return console.log(`${c.red}알 수 없는 타입: ${type}${c.r}`);
  
  // Check if it's a default
  const isDefault = defaults[key]?.some(i => i.id === id);
  if (isDefault) {
    console.log(`${c.yellow}⚠ '${id}'는 기본 프리셋입니다. 삭제 후 'duvu reset ${type}'으로 복원 가능합니다.${c.r}`);
  }
  
  const idx = data[key].findIndex(i => i.id === id);
  if (idx < 0) return console.log(`${c.red}'${id}'을(를) 찾을 수 없습니다.${c.r}`);
  
  data[key].splice(idx, 1);
  savePresets(data);
  console.log(`${c.green}${key}/${id} 삭제됨${c.r}`);
  writeLog({ cmd: 'remove', args: [type, id] });
}

function reset(type) {
  if (!existsSync(join(DEFAULTS_DIR, 'presets.json'))) {
    console.log(`${c.red}기본값 백업이 없습니다.${c.r}`);
    return;
  }
  const defaults = JSON.parse(readFileSync(join(DEFAULTS_DIR, 'presets.json'), 'utf8'));
  
  if (!type) {
    copyFileSync(join(DEFAULTS_DIR, 'presets.json'), PRESETS_FILE);
    console.log(`${c.green}전체 프리셋이 기본값으로 복원되었습니다.${c.r}`);
    writeLog({ cmd: 'reset', args: ['all'] });
    return;
  }

  const data = loadPresets();
  const key = TYPE_MAP[type];
  if (!key) return console.log(`${c.red}알 수 없는 타입: ${type}${c.r}`);

  data[key] = defaults[key];
  savePresets(data);
  console.log(`${c.green}${key} 프리셋이 기본값으로 복원되었습니다.${c.r}`);
  writeLog({ cmd: 'reset', args: [type] });
}

// ─── Install Skills ───
function installSkill() {
  const installClaude = args.includes('--claude') || (!args.includes('--codex') && !args.includes('--gemini'));
  const installCodex = args.includes('--codex') || (!args.includes('--claude') && !args.includes('--gemini'));
  const installGemini = args.includes('--gemini') || (!args.includes('--claude') && !args.includes('--codex'));

  banner();
  console.log(`${c.b}스킬 설치 중...${c.r}\n`);

  // SKILL.md 원본 읽기
  const skillMd = readFileSync(join(SKILLS_DIR, 'SKILL.md'), 'utf8');

  function copyDir(src, dest) {
    mkdirSync(dest, { recursive: true });
    for (const entry of readdirSync(src, { withFileTypes: true })) {
      const from = join(src, entry.name);
      const to = join(dest, entry.name);
      if (entry.isDirectory()) copyDir(from, to);
      else if (entry.isFile()) copyFileSync(from, to);
    }
  }

  function installSkillBundle(targetDir) {
    mkdirSync(targetDir, { recursive: true });
    writeFileSync(join(targetDir, 'SKILL.md'), skillMd);
    copyFileSync(PRESETS_FILE, join(targetDir, 'presets.json'));
    copyDir(join(DATA_DIR, 'references'), join(targetDir, 'references'));
  }

  // ━━━ 1. Claude Code: ~/.claude/skills/duvu/ ━━━
  if (installClaude) {
    const claudeSkillDir = join(HOME, '.claude', 'skills', 'duvu');
    installSkillBundle(claudeSkillDir);
    console.log(`  ${c.green}✓${c.r} Claude Code`);
    console.log(`    ${c.d}${claudeSkillDir}${c.r}`);
  }

  // ━━━ 2. Codex CLI + Gemini CLI: ~/.agents/skills/duvu/ ━━━
  if (installCodex || installGemini) {
    const agentsSkillDir = join(HOME, '.agents', 'skills', 'duvu');
    installSkillBundle(agentsSkillDir);
    console.log(`  ${c.green}✓${c.r} Codex CLI + Gemini CLI`);
    console.log(`    ${c.d}${agentsSkillDir}${c.r}`);
  }

  console.log(`\n${c.b}${c.green}설치 완료!${c.r}`);
  console.log(`${c.d}SKILL.md, presets.json, references/가 함께 설치됩니다.${c.r}\n`);
}

// ─── Demo Server ───
function demo() {
  let portArg;
  let noOpen = false;
  let windowSize = '1440,1000';
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--no-open') {
      noOpen = true;
    } else if (arg === '--open') {
      noOpen = false;
    } else if (arg === '--window-size') {
      const value = args[++i];
      if (!/^\d{3,5}[x,]\d{3,5}$/.test(value || '')) {
        console.error(`${c.red}--window-size는 1440x1000 또는 1440,1000 형식이어야 합니다.${c.r}`);
        process.exit(1);
      }
      windowSize = value.replace('x', ',');
    } else if (!arg.startsWith('--') && portArg === undefined) {
      portArg = arg;
    } else {
      console.error(`${c.red}알 수 없는 demo 옵션: ${arg}${c.r}`);
      process.exit(1);
    }
  }
  const port = portArg === undefined ? 3333 : Number.parseInt(portArg, 10);
  if (!Number.isInteger(port) || String(port) !== String(portArg ?? port) || port < 1 || port > 65535) {
    console.error(`${c.red}demo 포트는 1~65535 사이의 정수여야 합니다.${c.r}`);
    process.exit(1);
  }
  const demoHtml = join(DEMO_DIR, 'index.html');
  const demoRoot = resolve(DEMO_DIR);
  
  if (!existsSync(demoHtml)) {
    console.log(`${c.red}데모 파일이 없습니다: ${demoHtml}${c.r}`);
    return;
  }
  
  const server = createServer((req, res) => {
    if (req.url === '/api/presets') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(readFileSync(PRESETS_FILE, 'utf8'));
      return;
    }

    // 데모 인터랙션 로그 수신
    if (req.url === '/api/log' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; if (body.length > 8192) { req.destroy(); return; } });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          writeLog({ cmd: 'demo-interaction', ...data });
        } catch {}
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end('{"ok":true}');
      });
      return;
    }
    
    let reqPath;
    try {
      reqPath = new URL(req.url || '/', `http://localhost:${port}`).pathname;
      reqPath = reqPath === '/' ? 'index.html' : decodeURIComponent(reqPath).replace(/^\/+/, '');
    } catch {
      res.writeHead(400); res.end('Bad Request'); return;
    }

    const filePath = resolve(demoRoot, reqPath);
    const relPath = relative(demoRoot, filePath);
    const isInsideDemo = relPath === '' || (!relPath.startsWith('..') && !isAbsolute(relPath));
    if (!isInsideDemo || !existsSync(filePath) || statSync(filePath).isDirectory()) {
      res.writeHead(404); res.end('Not Found'); return;
    }
    
    const ext = filePath.split('.').pop();
    const types = {
      html: 'text/html; charset=utf-8',
      css: 'text/css; charset=utf-8',
      js: 'application/javascript; charset=utf-8',
      json: 'application/json; charset=utf-8',
      svg: 'image/svg+xml',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      avif: 'image/avif',
      gif: 'image/gif',
      ico: 'image/x-icon',
      woff: 'font/woff',
      woff2: 'font/woff2',
      ttf: 'font/ttf',
      mp4: 'video/mp4',
    };
    res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain', 'Access-Control-Allow-Origin': '*' });
    res.end(readFileSync(filePath));
  });
  
  server.on('error', error => {
    if (error.code === 'EADDRINUSE') {
      console.error(`${c.red}demo 포트 ${port}는 이미 사용 중입니다. 다른 포트를 지정하세요: duvu demo ${port + 1}${c.r}`);
    } else {
      console.error(`${c.red}demo 서버 오류: ${error.message}${c.r}`);
    }
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`\n${c.cyan}${c.b}DUVU Demo${c.r} 실행 중: ${c.green}http://localhost:${port}${c.r}`);
    console.log(`${c.d}Ctrl+C로 종료${c.r}\n`);
    writeLog({ cmd: 'demo', args: [String(port)] });
    
    if (!noOpen) {
      const url = `http://localhost:${port}`;
      try {
        if (process.platform === 'darwin') {
          execSync(`open "${url}" 2>/dev/null || true`, { stdio: 'ignore' });
        } else if (process.platform === 'win32') {
          execSync(`start "" chrome --new-window --window-size=${windowSize} "${url}" 2>NUL`, { stdio: 'ignore' });
        } else if (existsSync('/mnt/c/Windows/System32/cmd.exe')) {
          execSync(`/mnt/c/Windows/System32/cmd.exe /c start "" chrome --new-window --window-size=${windowSize} "${url}" >/dev/null 2>&1`, { stdio: 'ignore' });
        } else {
          execSync(`xdg-open "${url}" 2>/dev/null || true`, { stdio: 'ignore' });
        }
      } catch(e) {}
    }
  });
}

// ─── Template command ───
function templateCmd(id) {
  if (!id) {
    console.log(`${c.red}사용법: duvu template <id>${c.r}`);
    return;
  }
  const data = loadPresets();
  const tmpl = data.templates.find(t => t.id === id);
  if (!tmpl) {
    console.log(`${c.red}'${id}' 템플릿을 찾을 수 없습니다.${c.r}`);
    writeLog({ cmd: 'template', args: [id], error: 'not found' });
    return;
  }
  
  const colorPreset = data.color.find(c2 => c2.id === tmpl.color);
  const typoPreset = data.typography.find(t => t.id === tmpl.typography);
  const layoutPreset = data.layout.find(l => l.id === tmpl.layout);
  const stylePreset = data.style.find(s => s.id === tmpl.style);
  const motionPreset = data.motion.find(m => m.id === tmpl.motion);
  
  console.log(`\n${c.b}${c.cyan}템플릿: ${tmpl.id}${c.r}`);
  console.log(`${c.d}${tmpl.description || ''}${c.r}\n`);
  console.log(`  컬러:     ${c.yellow}${tmpl.color}${c.r} (${colorPreset?.src || '?'})`);
  console.log(`  타이포:   ${typoPreset?.family || tmpl.typography}`);
  console.log(`  레이아웃: ${tmpl.layout} (×${layoutPreset?.multiplier || 1})`);
  console.log(`  스타일:   ${tmpl.style} (${stylePreset?.radius || '?'}px)`);
  console.log(`  모션:     ${tmpl.motion} (${motionPreset?.duration || '?'}s)\n`);
  
  if (colorPreset) outputCode(colorPreset, 'css');
  writeLog({ cmd: 'template', args: [id], presets: { color: tmpl.color, typo: tmpl.typography, layout: tmpl.layout, style: tmpl.style, motion: tmpl.motion } });
}

// ─── Domain Match ───
function matchDomain(domain) {
  if (!domain) {
    console.log(`${c.red}사용법: duvu match <domain> [--tone warm|cool|neutral]${c.r}`);
    console.log(`도메인: saas, fintech, ecommerce, portfolio, health, luxury, creative, dev, editorial, social, nature, education, gaming, enterprise, dashboard`);
    console.log(`톤:     warm (따뜻한), cool (차가운), neutral (중성적)`);
    return;
  }
  const data = loadPresets();
  const toneIdx = args.indexOf('--tone');
  const tone = toneIdx >= 0 ? args[toneIdx + 1] : null;

  const find = (arr, key = 'domains') => (arr || []).filter(p => {
    if (!p.domains?.includes(domain)) return false;
    if (tone && p.tone && p.tone !== tone) return false;
    return true;
  });
  const ids = (arr) => arr.map(p => p.id).join(', ') || '—';
  const withMood = (arr) => arr.map(p => `${p.id}${p.mood ? ` ${c.d}(${p.mood})${c.r}` : ''}`).join(', ') || '—';

  banner();
  const toneLabel = tone ? ` + 톤: ${tone}` : '';
  console.log(`${c.b}도메인: ${c.cyan}${domain}${c.r}${toneLabel}에 맞는 프리셋 조합\n`);

  const colors = find(data.color);
  const typos = find(data.typography);
  const layouts = find(data.layout);
  const styles = find(data.style);
  const motions = find(data.motion);

  console.log(`  ${c.cyan}컬러${c.r}      ${colors.map(p => `${p.id} ${c.d}(${p.tone})${c.r}`).join(', ') || '—'}`);
  console.log(`  ${c.cyan}타이포${c.r}    ${withMood(typos)}`);
  console.log(`  ${c.cyan}레이아웃${c.r}  ${withMood(layouts)}`);
  console.log(`  ${c.cyan}스타일${c.r}    ${withMood(styles)}`);
  console.log(`  ${c.cyan}모션${c.r}      ${withMood(motions)}`);

  // 매칭되는 인터랙션 패턴
  const interactions = (data.interaction_patterns || []).filter(p => p.domains?.includes(domain));
  if (interactions.length) {
    console.log(`  ${c.cyan}인터랙션${c.r}  ${interactions.map(p => p.id).join(', ')}`);
  }

  // 매칭되는 템플릿
  const tpls = data.templates.filter(t => {
    const colorP = data.color.find(cc => cc.id === t.color);
    if (!colorP?.domains?.includes(domain)) return false;
    if (tone && colorP.tone !== tone) return false;
    return true;
  });
  if (tpls.length) {
    console.log(`\n  ${c.cyan}추천 템플릿${c.r}  ${tpls.map(t => t.id).join(', ')}`);
  }
  console.log('');
  writeLog({ cmd: 'match', args: [domain, ...(tone ? ['--tone', tone] : [])], domain, result: { colors: colors.map(p => p.id), templates: tpls.map(t => t.id) } });
}

// ═══════════════════════════════════════════════
// COMPLIANCE AUDIT (HIG/MD3/WCAG)
// ═══════════════════════════════════════════════
function audit() {
  const data = loadPresets();
  banner();
  console.log(`${c.b}컴플라이언스 감사: WCAG AA + HIG + MD3${c.r}\n`);

  // WCAG contrast utility
  function hexToRgb(hex) {
    hex = hex.replace('#','');
    return [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
  }
  function luminance(r,g,b) {
    const s = [r,g,b].map(v => { v/=255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055, 2.4); });
    return 0.2126*s[0] + 0.7152*s[1] + 0.0722*s[2];
  }
  function contrast(a,b) {
    const [r1,g1,b1] = hexToRgb(a);
    const [r2,g2,b2] = hexToRgb(b);
    const l1 = luminance(r1,g1,b1), l2 = luminance(r2,g2,b2);
    return (Math.max(l1,l2)+0.05) / (Math.min(l1,l2)+0.05);
  }

  let pass = 0, fail = 0;

  // 1. WCAG: 컬러 프리셋 대비 검사
  console.log(`${c.cyan}── WCAG AA 대비 검사 (${data.color.length}개 컬러) ──${c.r}`);
  for (const color of data.color) {
    const modes = [
      { name: 'dark', theme: color.dark },
      { name: 'light', theme: color.light }
    ];
    for (const { name, theme } of modes) {
      if (!theme) continue;
      const issues = [];

      // fg vs bg (4.5:1)
      const fgBg = contrast(theme.fg, theme.bg);
      if (fgBg < 4.5) issues.push(`fg/bg ${fgBg.toFixed(2)} (<4.5)`);

      // accent vs bg (3:1)
      const accentBg = contrast(theme.accent, theme.bg);
      if (accentBg < 3) issues.push(`accent/bg ${accentBg.toFixed(2)} (<3)`);

      // btnText vs accent (3:1 large text)
      const actionSurface = resolveActionSurface(theme.accent, color.btnText || readableOnAccent(theme.accent));
      const btnAccent = contrast(actionSurface.bg, actionSurface.text);
      if (btnAccent < 3) issues.push(`btn/accent ${btnAccent.toFixed(2)} (<3)`);

      // fg2 vs bg (2.5:1 minimum for secondary)
      if (theme.fg2) {
        const fg2Bg = contrast(theme.fg2, theme.bg);
        if (fg2Bg < 2.5) issues.push(`fg2/bg ${fg2Bg.toFixed(2)} (<2.5)`);
      }

      if (issues.length > 0) {
        console.log(`  ${c.red}✗${c.r} ${color.id} (${name}): ${issues.join(', ')}`);
        fail++;
      } else {
        pass++;
      }
    }
  }

  // 2. HIG: 터치 타겟 44px 검사 (생성 CSS와 데모 CSS 모두 실제 소스 검사)
  console.log(`\n${c.cyan}── HIG 터치 타겟 검사 ──${c.r}`);
  const cliSource = readFileSync(__filename, 'utf8');
  const demoSource = existsSync(join(DEMO_DIR, 'index.html')) ? readFileSync(join(DEMO_DIR, 'index.html'), 'utf8') : '';
  const touchChecks = [
    ['duvu generate CSS: .duvu-btn/.duvu-input min-height 44px', cliSource.includes('.duvu-btn, .duvu-input { min-height: 44px; }')],
    ['duvu generate CSS 모바일: min-height 48px + font-size 16px', cliSource.includes('min-height: 48px; font-size: 16px;')],
    ['demo CSS: --duvu-touch-min 44px', demoSource.includes('--duvu-touch-min: 44px;')],
    ['demo CSS 모바일 버튼 min-height 48px', demoSource.includes('min-height: 48px;')],
  ];
  for (const [label, ok] of touchChecks) {
    if (ok) { console.log(`  ${c.green}✓${c.r} ${label}`); pass++; }
    else { console.log(`  ${c.red}✗${c.r} ${label}`); fail++; }
  }

  // 3. MD3: 타이포 스케일 존재 확인
  console.log(`\n${c.cyan}── MD3 타이포 스케일 검사 ──${c.r}`);
  const requiredTokens = ['hero-title-size', 'section-title-size', 'metric-val-size', 'stat-val-size', 'stat-label-size', 'body-size'];
  const tokens = data.layout_tokens || {};
  for (const t of requiredTokens) {
    if (tokens[t]) {
      console.log(`  ${c.green}✓${c.r} ${t}: ${tokens[t]}`);
      pass++;
    } else {
      console.log(`  ${c.red}✗${c.r} ${t}: 누락`);
      fail++;
    }
  }

  // 4. 접근성: reduced-motion, 색상만으로 정보 전달 금지
  console.log(`\n${c.cyan}── 접근성 검사 ──${c.r}`);
  const accessibilityChecks = [
    ['generate CSS: prefers-reduced-motion 포함', cliSource.includes('prefers-reduced-motion: reduce')],
    ['demo CSS: prefers-reduced-motion 포함', demoSource.includes('prefers-reduced-motion: reduce')],
    ['시맨틱 색상(success/warning/error): 토큰 정의됨', ['--duvu-success', '--duvu-warning', '--duvu-error'].every(t => cliSource.includes(t) && demoSource.includes(t))],
  ];
  for (const [label, ok] of accessibilityChecks) {
    if (ok) { console.log(`  ${c.green}✓${c.r} ${label}`); pass++; }
    else { console.log(`  ${c.red}✗${c.r} ${label}`); fail++; }
  }

  // 5. 도메인 커버리지
  console.log(`\n${c.cyan}── 도메인 완전성 검사 ──${c.r}`);
  const allDomains = new Set();
  const cats = { color: data.color, typography: data.typography, layout: data.layout, style: data.style, motion: data.motion };
  Object.values(cats).flat().forEach(x => (x.domains||[]).forEach(d => allDomains.add(d)));
  let domainPass = 0;
  for (const d of [...allDomains].sort()) {
    const coverage = Object.entries(cats).every(([,arr]) => arr.some(x => x.domains?.includes(d)));
    if (coverage) domainPass++;
    else { console.log(`  ${c.red}✗${c.r} ${d}: 일부 카테고리 누락`); fail++; }
  }
  console.log(`  ${c.green}✓${c.r} ${domainPass}/${allDomains.size} 도메인 완전 커버리지`);
  pass += domainPass;

  // 6. Singleton 마지막 줄 검사: 그리드 마지막 줄에 1개만 남는 경우
  console.log(`\n${c.cyan}── Singleton 마지막 줄 검사 (그리드 마지막 줄 고립 방지) ──${c.r}`);
  let singletonLastRowPass = 0, singletonLastRowFail = 0;
  const assertNoSingletonRows = (tplId, label, count, columns) => {
    if (count <= 1) return;
    for (const cols of columns) {
      if (cols <= 1 || count <= cols) continue;
      if (count % cols === 1) {
        console.log(`  ${c.red}✗${c.r} ${tplId}: ${label} items=${count}, ${cols}열 singleton 마지막 줄`);
        singletonLastRowFail++;
      }
    }
  };
  for (const tpl of (data.templates || [])) {
    const preview = tpl.preview;
    if (!preview || !preview.cards) continue;
    for (const card of preview.cards) {
      if (card.type === 'gallery') {
        const count = card.count || 6;
        assertNoSingletonRows(tpl.id, 'gallery', count, [3, 2]);
      }
      if (card.type === 'product') {
        const items = card.items || [];
        assertNoSingletonRows(tpl.id, 'product', items.length, [3, 2]);
      }
      if (card.type === 'stat-row') {
        const stats = card.stats || [];
        // stat-row는 flex row이므로 홀수면 불균형
        if (stats.length === 1) {
          console.log(`  ${c.red}✗${c.r} ${tpl.id}: stat-row 1개만 (의미 부족)`);
          singletonLastRowFail++;
        }
      }
    }
  }
  if (singletonLastRowFail === 0) {
    console.log(`  ${c.green}✓${c.r} 모든 템플릿 그리드에 singleton 마지막 줄 없음`);
    singletonLastRowPass++;
  }
  pass += singletonLastRowPass; fail += singletonLastRowFail;

  // 7. 반응형 줄바꿈 토큰 검사
  console.log(`\n${c.cyan}── 반응형 줄바꿈 시스템 검사 ──${c.r}`);
  const wrapTokens = ['hero-sub-max-width', 'content-max-width'];
  for (const t of wrapTokens) {
    if (tokens[t]) {
      console.log(`  ${c.green}✓${c.r} ${t}: ${tokens[t]}`);
      pass++;
    } else {
      console.log(`  ${c.red}✗${c.r} ${t}: 누락 — 줄바꿈 제어 불가`);
      fail++;
    }
  }

  // 8. 반응형 생략 규칙 검사
  console.log(`\n${c.cyan}── 반응형 콘텐츠 계층 검사 ──${c.r}`);
  const components = data.components || [];
  let hasLevelAll = true;
  for (const comp of components) {
    if (typeof comp.level !== 'number') {
      console.log(`  ${c.red}✗${c.r} ${comp.id}: level 누락 — 반응형 우선순위 판단 불가`);
      fail++;
      hasLevelAll = false;
    }
  }
  if (hasLevelAll && components.length > 0) {
    console.log(`  ${c.green}✓${c.r} 모든 컴포넌트(${components.length}개)에 level 정의됨 — 반응형 생략 우선순위 판단 가능`);
    pass++;
  }

  // Summary
  console.log(`\n${c.b}결과: ${c.green}${pass} 통과${c.r}, ${fail > 0 ? c.red : c.green}${fail} 실패${c.r}`);
  writeLog({ cmd: 'audit', result: { pass, fail } });
  if (fail === 0) {
    console.log(`${c.green}✓ HIG + MD3 + WCAG AA 모두 통과${c.r}\n`);
  } else {
    console.log(`${c.red}✗ ${fail}개 항목 수정 필요${c.r}\n`);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════
if (!existsSync(PRESETS_FILE)) {
  if (cmd && cmd !== 'help' && cmd !== '-h' && cmd !== '--help' && cmd !== 'version' && cmd !== '-v' && cmd !== '--version') {
    console.log(`${c.red}프리셋 데이터가 없습니다: ${PRESETS_FILE}${c.r}`);
    console.log(`패키지를 다시 설치하세요.`);
    process.exit(1);
  }
} else {
  ensureDefaults();
}

switch(cmd) {
  case 'help': case '-h': case '--help': case undefined: help(); break;
  case 'version': case '-v': case '--version': version(); break;
  case 'info': info(); break;
  case 'list': case 'ls': list(args[0]); break;
  case 'show': show(args[0], args[1]); break;
  case 'tokens': await tokensCmd(args[0]); break;
  case 'generate': case 'gen': generate(args[0]); break;
  case 'template': case 'tmpl': templateCmd(args[0]); break;
  case 'match': matchDomain(args[0]); break;
  case 'add': addPreset(args[0], args.slice(1).join(' ')); break;
  case 'remove': case 'rm': removePreset(args[0], args[1]); break;
  case 'reset': reset(args[0]); break;
  case 'install-skill': case 'install': installSkill(); break;
  case 'demo': demo(); break;
  case 'audit': audit(); break;
  case 'log': logCmd(); break;
  case 'logs': logsCmd(); break;
  case 'screenshot': case 'ss': {
    const ssPath = join(__dirname, 'screenshot.js');
    writeLog({ cmd: 'screenshot', args });
    import('child_process').then(cp => cp.execFileSync('node', [ssPath, ...args], { stdio: 'inherit' }));
    break;
  }
  default:
    console.log(`${c.red}알 수 없는 명령: ${cmd}${c.r}`);
    console.log(`'duvu help'로 사용법을 확인하세요.`);
    writeLog({ cmd: 'error', args: [cmd, ...args], error: 'unknown command' });
}
