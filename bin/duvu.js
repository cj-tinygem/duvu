#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { createServer } from 'http';

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
  return JSON.parse(readFileSync(PRESETS_FILE, 'utf8'));
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

const PKG_VERSION = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;

const TYPE_MAP = {
  color: 'color', colors: 'color',
  typo: 'typography', typography: 'typography',
  layout: 'layout', style: 'style', motion: 'motion',
  gradient: 'gradient', gradients: 'gradient',
  template: 'templates', templates: 'templates',
  component: 'components', components: 'components',
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
  ${c.green}list${c.r} [colors|typo|layout|style|motion|gradient|component|templates]
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
  ${c.green}match${c.r} <domain>          도메인에 맞는 프리셋 자동 매칭
                          ${c.d}saas, fintech, ecommerce, luxury, dev, creative...${c.r}
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
                          ${c.d}--all: 5종 화면비 / --out <경로>: 저장 위치${c.r}

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
  ${c.cyan}템플릿${c.r}           ${data.templates?.length || 0}개
  ${c.cyan}레이아웃 토큰${c.r}   ${Object.keys(data.layout_tokens || {}).length}개

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
    return;
  }
  
  const key = TYPE_MAP[type];
  if (!key || !data[key]) {
    console.log(`${c.red}알 수 없는 타입: ${type}${c.r}`);
    console.log(`사용 가능: colors, typo, layout, style, motion, gradient, templates`);
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
    } else {
      const desc = item.description || item.name || '';
      console.log(`  ${c.green}${item.id.padEnd(22)}${c.r} ${c.d}${desc.substring(0, 50)}${c.r}`);
    }
  }
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
    return;
  }
  console.log(`\n${c.b}${c.cyan}${key}/${id}${c.r}\n`);
  console.log(JSON.stringify(item, null, 2));
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
      return;
    }
    console.log(`${c.cyan}커스텀 색상 ${presetOrHex}에서 테마 도출 중...${c.r}`);
    colorPreset = deriveFromHex(presetOrHex);
  } else {
    colorPreset = data.color.find(c => c.id === presetOrHex);
    if (!colorPreset) {
      console.log(`${c.red}'${presetOrHex}' 컬러 프리셋을 찾을 수 없습니다.${c.r}`);
      return;
    }
  }
  
  const platformArg = args.includes('--platform') ? args[args.indexOf('--platform') + 1] : platform;
  outputCode(colorPreset, platformArg);
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
}

[data-theme="light"] {
  --duvu-bg: ${l.bg}; --duvu-surface: ${l.surface};
  --duvu-surface2: ${l.surface2}; --duvu-fg: ${l.fg};
  --duvu-fg2: ${l.fg2}; --duvu-fg3: ${l.fg3};
  --duvu-accent: ${l.accent}; --duvu-accent-rgb: ${l['accent-rgb']};
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
    onSurface: Color(0xFF${hex(d.fg)}),
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
    public Color fg = ColorUtility.TryParseHtmlString("${d.fg}", out var _fg) ? _fg : Color.white;
    public Color accent = ColorUtility.TryParseHtmlString("${d.accent}", out var _a) ? _a : Color.blue;
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
    return;
  }
  
  const data = loadPresets();
  const key = TYPE_MAP[type];
  if (!key) return console.log(`${c.red}알 수 없는 타입: ${type}${c.r}`);
  
  data[key] = defaults[key];
  savePresets(data);
  console.log(`${c.green}${key} 프리셋이 기본값으로 복원되었습니다.${c.r}`);
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

  // ━━━ 1. Claude Code: ~/.claude/skills/duvu/SKILL.md ━━━
  if (installClaude) {
    const claudeSkillDir = join(HOME, '.claude', 'skills', 'duvu');
    mkdirSync(claudeSkillDir, { recursive: true });
    writeFileSync(join(claudeSkillDir, 'SKILL.md'), skillMd);
    console.log(`  ${c.green}✓${c.r} Claude Code`);
    console.log(`    ${c.d}${claudeSkillDir}/SKILL.md${c.r}`);
  }

  // ━━━ 2. Codex CLI + Gemini CLI: ~/.agents/skills/duvu/SKILL.md ━━━
  if (installCodex || installGemini) {
    const agentsSkillDir = join(HOME, '.agents', 'skills', 'duvu');
    mkdirSync(agentsSkillDir, { recursive: true });
    writeFileSync(join(agentsSkillDir, 'SKILL.md'), skillMd);
    console.log(`  ${c.green}✓${c.r} Codex CLI + Gemini CLI`);
    console.log(`    ${c.d}${agentsSkillDir}/SKILL.md${c.r}`);
  }

  console.log(`\n${c.b}${c.green}설치 완료!${c.r}`);
  console.log(`${c.d}스킬이 각 AI 에이전트의 컨텍스트에 자동 로드됩니다.${c.r}\n`);
}

// ─── Demo Server ───
function demo() {
  const port = args[0] && !isNaN(args[0]) ? parseInt(args[0]) : 3333;
  const demoHtml = join(DEMO_DIR, 'index.html');
  
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
    
    const reqPath = req.url === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]);
    const filePath = resolve(DEMO_DIR, reqPath.replace(/^\/+/, ''));
    if (!filePath.startsWith(resolve(DEMO_DIR)) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
      res.writeHead(404); res.end('Not Found'); return;
    }
    
    const ext = filePath.split('.').pop();
    const types = { html: 'text/html', css: 'text/css', js: 'application/javascript', json: 'application/json', svg: 'image/svg+xml' };
    res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain', 'Access-Control-Allow-Origin': '*' });
    res.end(readFileSync(filePath));
  });
  
  server.listen(port, () => {
    console.log(`\n${c.cyan}${c.b}DUVU Demo${c.r} 실행 중: ${c.green}http://localhost:${port}${c.r}`);
    console.log(`${c.d}Ctrl+C로 종료${c.r}\n`);
    
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
}

// ─── Domain Match ───
function matchDomain(domain) {
  if (!domain) {
    console.log(`${c.red}사용법: duvu match <domain>${c.r}`);
    console.log(`도메인: saas, fintech, ecommerce, portfolio, health, luxury, creative, dev, editorial, social, nature, education, gaming, enterprise`);
    return;
  }
  const data = loadPresets();
  const find = (arr) => (arr || []).filter(p => p.domains?.includes(domain)).map(p => p.id);

  banner();
  console.log(`${c.b}도메인: ${c.cyan}${domain}${c.r}에 맞는 프리셋 조합\n`);
  console.log(`  ${c.cyan}컬러${c.r}      ${find(data.color).join(', ') || '—'}`);
  console.log(`  ${c.cyan}타이포${c.r}    ${find(data.typography).join(', ') || '—'}`);
  console.log(`  ${c.cyan}레이아웃${c.r}  ${find(data.layout).join(', ') || '—'}`);
  console.log(`  ${c.cyan}스타일${c.r}    ${find(data.style).join(', ') || '—'}`);
  console.log(`  ${c.cyan}모션${c.r}      ${find(data.motion).join(', ') || '—'}`);

  // 매칭되는 템플릿
  const tpls = data.templates.filter(t => {
    const colorP = data.color.find(cc => cc.id === t.color);
    return colorP?.domains?.includes(domain);
  });
  if (tpls.length) {
    console.log(`\n  ${c.cyan}추천 템플릿${c.r}  ${tpls.map(t => t.id).join(', ')}`);
  }
  console.log('');
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
  case 'screenshot': case 'ss': {
    const ssPath = join(__dirname, 'screenshot.js');
    const safeArgs = args.filter(a => /^[a-zA-Z0-9_.\/\-]+$/.test(a));
    import('child_process').then(cp => cp.execFileSync('node', [ssPath, ...safeArgs], { stdio: 'inherit' }));
    break;
  }
  default: 
    console.log(`${c.red}알 수 없는 명령: ${cmd}${c.r}`);
    console.log(`'duvu help'로 사용법을 확인하세요.`);
}
