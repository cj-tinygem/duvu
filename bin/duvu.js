#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join, resolve, relative, isAbsolute } from 'path';
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync, statSync, appendFileSync, renameSync, unlinkSync, readdirSync } from 'fs';
import { execSync } from 'child_process';
import { createServer } from 'http';
import { homedir } from 'os';

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
  ${c.green}demo${c.r}                   데모 웹페이지 실행 (브라우저)

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
                          ${c.d}기본: 5종 화면비 전부 / --quick: 데스크톱+모바일만${c.r}
                          ${c.d}--light: 라이트 모드 / --out <경로>: 저장 위치${c.r}
  ${c.green}audit${c.r}                 HIG + MD3 + WCAG AA 컴플라이언스 자동 감사
                          ${c.d}컬러 대비, 터치 타겟, 타이포 스케일, 도메인 커버리지, orphan, 줄바꿈${c.r}

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

function deriveFromHex(hex) {
  // Simple HSL derivation
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
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  
  function hslToHex(h2, s2, l2) {
    s2 /= 100; l2 /= 100;
    const a2 = s2 * Math.min(l2, 1-l2);
    const f = n => { const k = (n + h2/30) % 12; return l2 - a2 * Math.max(Math.min(k-3, 9-k, 1), -1); };
    return '#' + [f(0), f(8), f(4)].map(x => Math.round(x*255).toString(16).padStart(2,'0')).join('');
  }
  
  const bgSat = Math.min(s, 15);
  return {
    id: 'custom', name: 'Custom', cat: 'custom', src: hex, radius: 16, btnText: readableOnAccent(hex),
    dark: { bg: hslToHex(h, bgSat, 4.5), fg: hslToHex(h, 5, 92), fg2: hslToHex(h, 5, 54), fg3: hslToHex(h, 4, 33), surface: hslToHex(h, bgSat, 7.5), surface2: hslToHex(h, bgSat, 12), accent: hex, 'accent-rgb': `${parseInt(hex.slice(1,3),16)}, ${parseInt(hex.slice(3,5),16)}, ${parseInt(hex.slice(5,7),16)}` },
    light: { bg: hslToHex(h, Math.min(s, 10), 96), fg: hslToHex(h, 8, 6), fg2: hslToHex(h, 6, 40), fg3: hslToHex(h, 4, 62), surface: '#ffffff', surface2: hslToHex(h, Math.min(s, 12), 93), accent: hex, 'accent-rgb': `${parseInt(hex.slice(1,3),16)}, ${parseInt(hex.slice(3,5),16)}, ${parseInt(hex.slice(5,7),16)}` },
  };
}

function outputCode(preset, platform) {
  const d = preset.dark;
  const l = preset.light;
  
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
  --duvu-accent-rgb: ${d['accent-rgb']};
  --duvu-btn-text: ${preset.btnText};

  /* Spacing */
  --duvu-space-xs: 4px; --duvu-space-sm: 8px; --duvu-space-md: 16px;
  --duvu-space-lg: 24px; --duvu-space-xl: 32px; --duvu-space-2xl: 48px;

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
.duvu-title { font-size: clamp(28px, 5vw, 56px); line-height: 1.1; font-weight: 700; letter-spacing: -0.04em; }
.duvu-subtitle { font-size: clamp(16px, 2vw, 22px); line-height: 1.5; }
.duvu-body { font-size: clamp(14px, 1.2vw, 16px); line-height: 1.5; max-width: var(--duvu-content-max-width, 680px); }

/* Responsive Container */
.duvu-container { width: 100%; max-width: var(--duvu-bp-wide); margin: 0 auto; padding: 0 24px; }
@media (max-width: 640px) { .duvu-container { padding: 0 16px; } }

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
    onPrimary: Color(0xFF${hex(preset.btnText)}),
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
      backgroundColor: const Color(0xFF${hex(d.accent)}),
      foregroundColor: const Color(0xFF${hex(preset.btnText)}),
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
    static let btnText = Color(hex: "${preset.btnText}")
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
    val btnText = Color(0xFF${hex(preset.btnText)})
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
    public Color btnText = ColorUtility.TryParseHtmlString("${preset.btnText}", out var _bt) ? _bt : Color.white;
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
    btnText: '${preset.btnText}',
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
  const portArg = args[0];
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
  
  server.listen(port, () => {
    console.log(`\n${c.cyan}${c.b}DUVU Demo${c.r} 실행 중: ${c.green}http://localhost:${port}${c.r}`);
    console.log(`${c.d}Ctrl+C로 종료${c.r}\n`);
    writeLog({ cmd: 'demo', args: [String(port)] });
    
    // Try to open browser
    try {
      const openCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
      execSync(`${openCmd} http://localhost:${port} 2>/dev/null || true`, { stdio: 'ignore' });
    } catch(e) {}
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
      const btnText = color.btnText || '#ffffff';
      const btnAccent = contrast(theme.accent, btnText);
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

  // 6. Orphan 검사: 그리드 마지막 줄에 1개만 남는 경우
  console.log(`\n${c.cyan}── Orphan 검사 (그리드 마지막 줄 고립 방지) ──${c.r}`);
  let orphanPass = 0, orphanFail = 0;
  for (const tpl of (data.templates || [])) {
    const preview = tpl.preview;
    if (!preview || !preview.cards) continue;
    for (const card of preview.cards) {
      if (card.type === 'gallery') {
        const count = card.count || 6;
        const cols = 3; // gallery-grid 기본 3열
        const remainder = count % cols;
        if (remainder === 1) {
          console.log(`  ${c.red}✗${c.r} ${tpl.id}: gallery count=${count}, 3열 마지막 줄 1개 (orphan)`);
          orphanFail++;
        }
      }
      if (card.type === 'product') {
        const items = card.items || [];
        const cols = 3; // product-grid 기본 3열
        const remainder = items.length % cols;
        if (remainder === 1 && items.length > 1) {
          console.log(`  ${c.red}✗${c.r} ${tpl.id}: product items=${items.length}, 3열 마지막 줄 1개 (orphan)`);
          orphanFail++;
        }
      }
      if (card.type === 'stat-row') {
        const stats = card.stats || [];
        // stat-row는 flex row이므로 홀수면 불균형
        if (stats.length === 1) {
          console.log(`  ${c.red}✗${c.r} ${tpl.id}: stat-row 1개만 (의미 부족)`);
          orphanFail++;
        }
      }
    }
  }
  if (orphanFail === 0) {
    console.log(`  ${c.green}✓${c.r} 모든 템플릿 그리드에 orphan 없음`);
    orphanPass++;
  }
  pass += orphanPass; fail += orphanFail;

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
