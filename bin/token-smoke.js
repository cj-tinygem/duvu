#!/usr/bin/env node

import { execFileSync } from 'child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const root = new URL('..', import.meta.url).pathname;
const duvu = ['bin/duvu.js'];

function fail(message) {
  console.error(`token smoke failed: ${message}`);
  process.exit(1);
}

function run(args) {
  return execFileSync('node', [...duvu, ...args], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  });
}

function parseJson(output) {
  const start = output.indexOf('{');
  const end = output.lastIndexOf('}');
  if (start < 0 || end < start) fail('JSON 출력 블록을 찾을 수 없습니다.');
  return JSON.parse(output.slice(start, end + 1));
}

function parseJsonValue(output) {
  const objectStart = output.indexOf('{');
  const arrayStart = output.indexOf('[');
  const starts = [objectStart, arrayStart].filter(idx => idx >= 0);
  const start = Math.min(...starts);
  const end = Math.max(output.lastIndexOf('}'), output.lastIndexOf(']'));
  if (!Number.isFinite(start) || end < start) fail('JSON 출력 블록을 찾을 수 없습니다.');
  return JSON.parse(output.slice(start, end + 1));
}

function flatten(node, path = [], out = []) {
  if (!node || typeof node !== 'object') return out;
  if (Object.prototype.hasOwnProperty.call(node, '$value')) {
    out.push({ path: path.join('.'), token: node });
    return out;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith('$')) continue;
    flatten(value, [...path, key], out);
  }
  return out;
}

function resolveAlias(ref, map, seen = []) {
  const path = ref.slice(1, -1);
  if (seen.includes(path)) fail(`alias 순환 감지: ${[...seen, path].join(' -> ')}`);
  const token = map.get(path);
  if (!token) fail(`alias 대상 없음: ${path}`);
  if (typeof token.$value === 'string' && token.$value.startsWith('{')) {
    return resolveAlias(token.$value, map, [...seen, path]);
  }
  return token;
}

function colorHex(value) {
  if (typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)) return value.toUpperCase();
  if (value?.hex && /^#[0-9a-fA-F]{6}$/.test(value.hex)) return value.hex.toUpperCase();
  fail(`HEX 색상 값 형식 오류: ${JSON.stringify(value)}`);
}

function contrastRatio(a, b) {
  const channel = hex => {
    const n = parseInt(hex, 16) / 255;
    return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  };
  const luminance = hex => {
    const clean = colorHex(hex).slice(1);
    return 0.2126 * channel(clean.slice(0, 2))
      + 0.7152 * channel(clean.slice(2, 4))
      + 0.0722 * channel(clean.slice(4, 6));
  };
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

function resolveTokenValue(ref, map) {
  return resolveAlias(ref, map).$value;
}

function variableValueKind(value) {
  if (typeof value === 'boolean') return 'BOOLEAN';
  if (typeof value === 'number') return 'FLOAT';
  if (typeof value === 'string' && value.startsWith('{')) return 'ALIAS';
  if (typeof value === 'string') return 'STRING';
  if (value?.type === 'VARIABLE_ALIAS' && value.id) return 'ALIAS';
  if (typeof value?.r === 'number' && typeof value?.g === 'number' && typeof value?.b === 'number') return 'COLOR';
  if (value?.colorSpace === 'srgb' || value?.hex || Array.isArray(value?.components)) return 'COLOR';
  if (typeof value?.value === 'number') return 'FLOAT';
  return 'UNKNOWN';
}

function variableValueShape(value) {
  const kind = variableValueKind(value);
  if (kind === 'ALIAS') return 'ALIAS';
  if (kind === 'BOOLEAN') return 'BOOLEAN';
  if (kind === 'FLOAT') return 'FLOAT';
  if (kind === 'STRING') return 'STRING';
  if (kind === 'COLOR') {
    if (typeof value?.r === 'number' && typeof value?.g === 'number' && typeof value?.b === 'number' && typeof value?.a === 'number') return 'COLOR_RGBA';
    if (value?.colorSpace === 'srgb' && Array.isArray(value?.components) && value.components.length === 3) return 'COLOR_SRGB_COMPONENTS';
    if (value?.hex && Array.isArray(value?.components)) return 'COLOR_HEX_COMPONENTS';
    return 'COLOR_INVALID_SHAPE';
  }
  return 'UNKNOWN';
}

function normalizeFigmaApiPayload(payload) {
  if (Array.isArray(payload.collections)) return payload;
  const restCollections = payload.variableCollections || [];
  const restModes = payload.variableModes || [];
  const restValues = payload.variableModeValues || [];
  return {
    collections: restCollections.map(collection => ({
      id: collection.id,
      name: collection.name,
      modes: [
        ...(collection.initialModeId ? [{ id: collection.initialModeId, name: 'dark' }] : []),
        ...restModes
          .filter(mode => mode.variableCollectionId === collection.id)
          .map(mode => ({ id: mode.id, name: mode.name })),
      ],
    })),
    variables: (payload.variables || []).map(variable => ({
      id: variable.id,
      name: variable.name,
      collectionId: variable.variableCollectionId,
      resolvedType: variable.resolvedType,
      modeValues: Object.fromEntries(restValues
        .filter(value => value.variableId === variable.id)
        .map(value => [value.modeId, value.value])),
    })),
  };
}

function assertFigmaApiPayload(payload, label) {
  payload = normalizeFigmaApiPayload(payload);
  if (!Array.isArray(payload.collections) || payload.collections.length < 1) fail(`${label}: collections 누락`);
  if (!Array.isArray(payload.variables) || payload.variables.length < 1) fail(`${label}: variables 누락`);

  const modeIds = new Set();
  for (const collection of payload.collections) {
    if (!collection.id || !collection.name) fail(`${label}: collection id/name 누락`);
    if (!Array.isArray(collection.modes) || collection.modes.length < 1) fail(`${label}: ${collection.name} modes 누락`);
    for (const mode of collection.modes) {
      if (!mode.id || !mode.name) fail(`${label}: ${collection.name} mode id/name 누락`);
      modeIds.add(mode.id);
    }
  }

  const variableMap = new Map(payload.variables.map(variable => [variable.id, variable]));
  const visitAlias = (id, seen = []) => {
    if (seen.includes(id)) fail(`${label}: alias 순환 감지: ${[...seen, id].join(' -> ')}`);
    const variable = variableMap.get(id);
    if (!variable) fail(`${label}: alias 대상 없음: ${id}`);
    for (const value of Object.values(variable.modeValues || {})) {
      if (variableValueKind(value) === 'ALIAS') visitAlias(value.id, [...seen, id]);
    }
  };

  let booleanCount = 0;
  let aliasCount = 0;
  for (const variable of payload.variables) {
    if (!variable.id || !variable.name || !variable.collectionId) fail(`${label}: variable id/name/collectionId 누락`);
    if (!variable.resolvedType) fail(`${label}: ${variable.name} resolvedType 누락`);
    if (!variable.modeValues || typeof variable.modeValues !== 'object') fail(`${label}: ${variable.name} modeValues 누락`);
    for (const [modeId, value] of Object.entries(variable.modeValues)) {
      if (!modeIds.has(modeId)) fail(`${label}: ${variable.name} 알 수 없는 modeValues mode: ${modeId}`);
      const kind = variableValueKind(value);
      if (kind === 'UNKNOWN') fail(`${label}: ${variable.name} modeValues 값 형식 오류`);
      if (kind !== 'ALIAS' && kind !== variable.resolvedType) {
        fail(`${label}: ${variable.name} resolvedType/value shape 불일치 (${variable.resolvedType} != ${kind})`);
      }
      if (variableValueShape(value).includes('INVALID')) fail(`${label}: ${variable.name} value shape 오류`);
      if (kind === 'ALIAS') {
        const target = variableMap.get(value.id);
        if (target && target.resolvedType !== variable.resolvedType) {
          fail(`${label}: ${variable.name} alias target type 불일치 (${variable.resolvedType} != ${target.resolvedType})`);
        }
      }
      if (kind === 'BOOLEAN') booleanCount += 1;
      if (kind === 'ALIAS') aliasCount += 1;
    }
  }
  for (const variable of payload.variables) visitAlias(variable.id);
  if (booleanCount < 1) fail(`${label}: boolean modeValues 누락`);
  if (aliasCount < 1) fail(`${label}: alias modeValues 누락`);
}

function expectFigmaApiPayloadFailure(payload, label, expected) {
  const originalExit = process.exit;
  const originalError = console.error;
  let message = '';
  try {
    process.exit = () => { throw new Error('expected failure'); };
    console.error = text => { message += text; };
    assertFigmaApiPayload(payload, label);
    fail(`${label}: 실패해야 하는 fixture가 통과함`);
  } catch (error) {
    if (error.message !== 'expected failure') throw error;
    if (!message.includes(expected)) fail(`${label}: 기대한 실패 메시지 누락`);
  } finally {
    process.exit = originalExit;
    console.error = originalError;
  }
}

const dtcg = parseJson(run(['tokens', 'export', '--format', 'dtcg', '--preset', 'toss']));
if (!dtcg.$schema) fail('$schema 누락');
if (!dtcg.$extensions?.duvu?.collections?.includes('quality')) fail('quality collection 누락');
if (!dtcg.$extensions?.duvu?.modes?.includes('dark') || !dtcg.$extensions?.duvu?.modes?.includes('light')) {
  fail('dark/light mode 누락');
}

const flat = flatten(dtcg);
if (flat.length < 70) fail(`DTCG token 수 부족: ${flat.length}`);
for (const { path, token } of flat) {
  for (const key of ['$type', '$value', '$description']) {
    if (!Object.prototype.hasOwnProperty.call(token, key)) fail(`${path}: ${key} 누락`);
  }
  if (typeof token.$value === 'string' && token.$value.startsWith('{')) continue;
  if (token.$type === 'dimension' && (typeof token.$value !== 'object' || typeof token.$value.value !== 'number' || !['px', 'rem'].includes(token.$value.unit))) {
    fail(`${path}: DTCG dimension 값 형식 오류`);
  }
  if (token.$type === 'duration' && (typeof token.$value !== 'object' || typeof token.$value.value !== 'number' || !['ms', 's'].includes(token.$value.unit))) {
    fail(`${path}: DTCG duration 값 형식 오류`);
  }
  if (token.$type === 'number' && typeof token.$value !== 'number') fail(`${path}: DTCG number 값 형식 오류`);
  if (token.$type === 'string' && typeof token.$value !== 'string') fail(`${path}: DTCG string 값 형식 오류`);
}
for (const mode of ['dark', 'light']) {
  for (const key of ['background', 'surface', 'text', 'textMuted', 'action', 'actionText']) {
    if (!flat.some(entry => entry.path === `semantic.color.${mode}.${key}`)) {
      fail(`semantic ${mode}.${key} 누락`);
    }
  }
}

const map = new Map(flat.map(entry => [entry.path, entry.token]));
const tossDarkActionText = colorHex(map.get('semantic.color.dark.actionText')?.$value);
const tossLightActionText = colorHex(map.get('semantic.color.light.actionText')?.$value);
if (tossDarkActionText !== '#FFFFFF' || tossLightActionText !== '#FFFFFF') {
  fail(`toss actionText 브랜드 전경색 불일치: dark=${tossDarkActionText}, light=${tossLightActionText}`);
}
const aliases = flat.filter(entry => typeof entry.token.$value === 'string' && entry.token.$value.startsWith('{'));
if (aliases.length < 5) fail(`alias 수 부족: ${aliases.length}`);
for (const entry of aliases) resolveAlias(entry.token.$value, map);

const demoHtml = readFileSync(join(root, 'demo/index.html'), 'utf8');
const buildColorCardsBody = demoHtml.match(/function buildColorCards\(\) \{[\s\S]*?\n\}/)?.[0] || '';
if (!buildColorCardsBody.includes('resolvePresetAccentText(preset, preset.src)')) {
  fail('demo color palette hover foreground가 preset 역할 토큰 경로를 사용하지 않음');
}
if (buildColorCardsBody.includes('readableOnAccent(preset.src)')) {
  fail('demo color palette hover foreground가 저수준 대비 함수를 직접 호출함');
}
const generatedTossReactNative = run(['generate', 'toss', '--platform', 'react-native']);
if (!generatedTossReactNative.includes("btnText: '#ffffff'") && !generatedTossReactNative.includes("btnText: '#FFFFFF'")) {
  fail('generate toss 출력이 preset btnText 계약을 유지하지 않음');
}
if (!/action:\s*'#[0-9a-fA-F]{6}'/.test(generatedTossReactNative)) {
  fail('generate toss 출력이 action surface HEX 토큰을 노출하지 않음');
}

const figma = parseJson(run(['tokens', 'export', '--format', 'figma', '--preset', 'toss']));
if (!Array.isArray(figma.collections) || figma.collections.length < 4) fail('Figma collection export 누락');
if (!Array.isArray(figma.variables) || figma.variables.length !== flat.length) fail('Figma variable 수 불일치');
const dtcgFigmaNames = new Set(flat.map(entry => entry.path.replace(/\./g, '/')));
const figmaVariableNames = new Set(figma.variables.map(variable => variable.name));
for (const name of dtcgFigmaNames) {
  if (!figmaVariableNames.has(name)) fail(`Figma variable parity 누락: ${name}`);
}
for (const name of figmaVariableNames) {
  if (!dtcgFigmaNames.has(name)) fail(`Figma variable parity 초과: ${name}`);
}
for (const collection of figma.collections) {
  if (!collection.name || !Array.isArray(collection.modes) || collection.modes.length < 1) fail('Figma collection modes 누락');
}
for (const variable of figma.variables) {
  if (!variable.name || !variable.resolvedType || !Object.prototype.hasOwnProperty.call(variable, 'value')) {
    fail('Figma variable 기본 구조 누락');
  }
  const kind = variableValueKind(variable.value);
  if (kind !== 'ALIAS' && kind !== variable.resolvedType) {
    fail(`Figma variable value shape 불일치: ${variable.name} ${variable.resolvedType} != ${kind}`);
  }
}

const figmaApiFixture = {
  collections: [
    { id: 'collection-core', name: 'core', modes: [{ id: 'mode-dark', name: 'dark' }, { id: 'mode-light', name: 'light' }] },
    { id: 'collection-quality', name: 'quality', modes: [{ id: 'mode-default', name: 'default' }] },
  ],
  variables: [
    {
      id: 'var-color-bg',
      name: 'semantic/color/background',
      collectionId: 'collection-core',
      resolvedType: 'COLOR',
      modeValues: {
        'mode-dark': { colorSpace: 'srgb', components: [0, 0, 0], hex: '#000000' },
        'mode-light': { colorSpace: 'srgb', components: [1, 1, 1], hex: '#FFFFFF' },
      },
    },
    {
      id: 'var-color-surface',
      name: 'semantic/color/surface',
      collectionId: 'collection-core',
      resolvedType: 'COLOR',
      modeValues: {
        'mode-dark': { type: 'VARIABLE_ALIAS', id: 'var-color-bg' },
        'mode-light': { type: 'VARIABLE_ALIAS', id: 'var-color-bg' },
      },
    },
    {
      id: 'var-quality-enabled',
      name: 'quality/enabled',
      collectionId: 'collection-quality',
      resolvedType: 'BOOLEAN',
      modeValues: { 'mode-default': true },
    },
  ],
};
assertFigmaApiPayload(figmaApiFixture, 'Figma API fixture');
const figmaApiCycleFixture = structuredClone(figmaApiFixture);
figmaApiCycleFixture.variables[0].modeValues['mode-dark'] = { type: 'VARIABLE_ALIAS', id: 'var-color-surface' };
expectFigmaApiPayloadFailure(figmaApiCycleFixture, 'Figma API cycle fixture', 'alias 순환 감지');
const figmaApiShapeFixture = structuredClone(figmaApiFixture);
figmaApiShapeFixture.variables[0].modeValues['mode-dark'] = '#000000';
expectFigmaApiPayloadFailure(figmaApiShapeFixture, 'Figma API shape fixture', 'resolvedType/value shape 불일치');
const figmaApiBooleanFixture = structuredClone(figmaApiFixture);
figmaApiBooleanFixture.variables[2].modeValues['mode-default'] = 'true';
expectFigmaApiPayloadFailure(figmaApiBooleanFixture, 'Figma API boolean fixture', 'resolvedType/value shape 불일치');
const figmaApiAliasTypeFixture = structuredClone(figmaApiFixture);
figmaApiAliasTypeFixture.variables[1].modeValues['mode-dark'] = { type: 'VARIABLE_ALIAS', id: 'var-quality-enabled' };
expectFigmaApiPayloadFailure(figmaApiAliasTypeFixture, 'Figma API alias type fixture', 'alias target type 불일치');
let figmaApiExport = null;
try {
  const figmaApi = parseJson(run(['tokens', 'export', '--format', 'figma-api', '--preset', 'toss']));
  figmaApiExport = figmaApi;
  assertFigmaApiPayload(figmaApi, 'Figma API export');
  for (const key of ['format', 'endpoint', 'note', 'importReady', 'audit']) {
    if (Object.prototype.hasOwnProperty.call(figmaApi, key)) fail(`Figma API export에 비-API 메타데이터가 포함됨: ${key}`);
  }
  const dryRun = parseJson(run(['tokens', 'sync-figma', '--preset', 'toss', '--file-key', 'dummy_file_key', '--dry-run']));
  if (!dryRun.ok || !dryRun.dryRun || dryRun.audit?.issues?.length) fail('Figma sync dry-run 결과 오류');
  assertFigmaApiPayload(dryRun.payload, 'Figma sync dry-run payload');
  if (!String(dryRun.endpoint || '').includes('/v1/files/dummy_file_key/variables')) fail('Figma sync dry-run endpoint 누락');
  let missingTokenFailed = false;
  try {
    run(['tokens', 'sync-figma', '--preset', 'toss', '--file-key', 'dummy_file_key']);
  } catch (error) {
    missingTokenFailed = true;
    if (!String(error.stdout || '').includes('Figma API 토큰이 필요합니다.')) fail('Figma sync missing token 메시지 오류');
  }
  if (!missingTokenFailed) fail('Figma sync가 토큰 없이 성공 처리됨');
} catch (error) {
  const unsupported = `${error.stdout || ''}${error.stderr || ''}${error.message || ''}`;
  if (!unsupported.includes('지원하지 않는 토큰 export format: figma-api')) throw error;
}

const figmaDtcgDark = parseJson(run(['tokens', 'export', '--format', 'figma-dtcg', '--preset', 'toss', '--mode', 'dark']));
if (!figmaDtcgDark.$schema) fail('Figma DTCG $schema 누락');
const figmaDtcgFlat = flatten(figmaDtcgDark);
const normalizedFigmaNames = figmaDtcgFlat.map(entry => entry.path.replace(/\./g, '/'));
if (figmaApiExport) {
  const apiNames = new Set(figmaApiExport.variables.map(variable => variable.name));
  for (const name of normalizedFigmaNames) {
    if (!apiNames.has(name)) fail(`Figma API/DTCG parity 누락: ${name}`);
  }
  for (const name of apiNames) {
    if (!normalizedFigmaNames.includes(name)) fail(`Figma API/DTCG parity 초과: ${name}`);
  }
}
const duplicateFigmaNames = normalizedFigmaNames.filter((name, index) => normalizedFigmaNames.indexOf(name) !== index);
if (duplicateFigmaNames.length) fail(`Figma normalized name 중복: ${duplicateFigmaNames.join(', ')}`);
const figmaSupportedTypes = new Set(['color', 'dimension', 'fontFamily', 'duration', 'number', 'string']);
for (const { path, token } of figmaDtcgFlat) {
  if (!figmaSupportedTypes.has(token.$type)) fail(`Figma DTCG 미지원 타입: ${path} ${token.$type}`);
  if (token.$type === 'dimension' && token.$value?.unit !== 'px') fail(`Figma DTCG dimension unit 오류: ${path}`);
  if (token.$type === 'duration' && token.$value?.unit !== 's') fail(`Figma DTCG duration unit 오류: ${path}`);
}
const figmaDtcgRefs = new Map(figmaDtcgFlat.map(entry => [entry.path, entry.token]));
for (const entry of figmaDtcgFlat.filter(item => typeof item.token.$value === 'string' && item.token.$value.startsWith('{'))) {
  resolveAlias(entry.token.$value, figmaDtcgRefs);
}
if (figmaDtcgFlat.length < 35) fail('Figma DTCG import-ready token 수 부족');

const figmaDtcgBundle = parseJson(run(['tokens', 'export', '--format', 'figma-dtcg', '--preset', 'toss']));
if (figmaDtcgBundle.format !== 'figma-dtcg-import-bundle') fail('Figma DTCG bundle format 불일치');
if (!Array.isArray(figmaDtcgBundle.files) || figmaDtcgBundle.files.length !== 2) fail('Figma DTCG dark/light bundle 누락');
if (!figmaDtcgBundle.importReady || figmaDtcgBundle.parityIssues?.length) fail('Figma DTCG bundle parity 실패');
if (!figmaDtcgBundle.files.every(file => file.importReady && file.tokenCount >= 35)) fail('Figma DTCG bundle importReady 실패');
const bundleMaps = figmaDtcgBundle.files.map(file => new Map(flatten(file.tokens).map(entry => [
  entry.path.replace(/\./g, '/'),
  { type: entry.token.$type, shape: variableValueShape(entry.token.$value), unit: entry.token.$value?.unit || null },
])));
for (const [name, meta] of bundleMaps[0]) {
  const other = bundleMaps[1].get(name);
  if (!other) fail(`Figma DTCG bundle token parity 누락: ${name}`);
  if (other.type !== meta.type || other.unit !== meta.unit || other.shape !== meta.shape) fail(`Figma DTCG bundle token parity 불일치: ${name}`);
}
for (const name of bundleMaps[1].keys()) {
  if (!bundleMaps[0].has(name)) fail(`Figma DTCG bundle token parity 초과: ${name}`);
}

const audit = run(['tokens', 'audit', '--preset', 'toss']);
if (!audit.includes('100/100 (A+)')) fail('tokens audit A+ 미달');
if (!audit.includes('DTCG 타입별 값 검증') || !audit.includes('Figma DTCG dark/light import parity')) fail('tokens audit 고급 품질 게이트 누락');
if (!audit.includes('DTCG 구조, alias 그래프, 생성형 UI 품질 게이트 통과')) fail('tokens audit 통과 문구 누락');

for (const hex of ['#000000', '#ffffff', '#ffff00']) {
  const hexAudit = run(['tokens', 'audit', '--hex', hex]);
  if (!hexAudit.includes('100/100 (A+)')) fail(`${hex}: tokens audit --hex A+ 미달`);
  if (!hexAudit.includes('DTCG 구조, alias 그래프, 생성형 UI 품질 게이트 통과')) fail(`${hex}: tokens audit --hex 통과 문구 누락`);
  const hexDtcg = parseJson(run(['tokens', 'export', '--format', 'dtcg', '--hex', hex]));
  const hexFlat = flatten(hexDtcg);
  const hexMap = new Map(hexFlat.map(entry => [entry.path, entry.token]));
  for (const mode of ['dark', 'light']) {
    const action = colorHex(resolveTokenValue(hexMap.get(`semantic.color.${mode}.action`).$value, hexMap));
    const actionText = colorHex(hexMap.get(`semantic.color.${mode}.actionText`).$value);
    const ratio = contrastRatio(action, actionText);
    if (ratio < 4.5) fail(`${hex}/${mode}: action/actionText 대비 부족 ${ratio.toFixed(2)} < 4.5`);
  }
}

const contract = parseJson(run(['tokens', 'contract', '--template', 'saas', '--format', 'json']));
if (contract.kind !== 'duvu-generation-contract') fail('contract kind 불일치');
if (contract.template?.id !== 'saas') fail('contract template id 불일치');
if (!contract.presets?.color?.id || !contract.presets?.typography?.id) fail('contract preset 조합 누락');
if (!Array.isArray(contract.composition?.previewCards) || contract.composition.previewCards.length < 2) fail('contract previewCards 누락');
if (!Array.isArray(contract.quality?.hardRules) || contract.quality.hardRules.length < 5) fail('contract hardRules 부족');
if (!contract.prompt || contract.prompt.length < 120) fail('contract prompt 부족');
if (!contract.quality?.score?.pass || contract.quality.score.score < 93) fail('contract 품질 점수 미달');

const score = parseJsonValue(run(['tokens', 'score']));
if (!Array.isArray(score) || score.length < 20) fail('tokens score 전체 템플릿 결과 부족');
const failedScores = score.filter(item => !item.pass);
if (failedScores.length) fail(`tokens score 실패 템플릿: ${failedScores.map(item => item.template).join(', ')}`);
const belowA = score.filter(item => item.score < 93 || !['A', 'A+'].includes(item.grade));
if (belowA.length) fail(`A 미만 템플릿 잔존: ${belowA.map(item => `${item.template}:${item.grade}`).join(', ')}`);
if (!score.every(item => item.subscores && Array.isArray(item.reasons))) fail('tokens score 스키마 불일치');

const markdown = run(['tokens', 'contract', '--template', 'saas', '--format', 'md']);
if (!markdown.includes('DUVU Generation Contract: saas') || !markdown.includes('## Hard Rules')) {
  fail('contract markdown 출력 불완전');
}

const tmp = mkdtempSync(join(tmpdir(), 'duvu-token-lint-'));
try {
	  const goodHtml = join(tmp, 'good.html');
	  const generatedCssHtml = join(tmp, 'generated-css.html');
	  const badHtml = join(tmp, 'bad.html');
  const mixedHtml = join(tmp, 'mixed.html');
  const tinyTypeHtml = join(tmp, 'tiny-type.html');
  const badPaletteHtml = join(tmp, 'bad-palette.html');
	  writeFileSync(goodHtml, `<!doctype html>
	<html><head><style>
	html { color-scheme: dark; }
	main { color: var(--duvu-fg); background: var(--duvu-bg); }
.button-primary { min-height: 44px; color: var(--duvu-bg); background: var(--duvu-accent); }
	@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; } }
	</style></head><body><main><h1>Revenue OS</h1><a class="button-primary">Start</a></main></body></html>`);
	  const generatedCss = run(['generate', 'toss', '--platform', 'css']);
	  writeFileSync(generatedCssHtml, `<!doctype html>
	<html><head><style>${generatedCss}</style></head><body><main><h1>Revenue OS</h1><a class="duvu-btn">Start</a><p class="duvu-body">Tokenized generated output.</p></main></body></html>`);
  writeFileSync(badHtml, `<!doctype html>
<html><head><style>
.orb { font-size: 8vw; color: #ff00ff; }
.btn-primary { min-height: 32px; }
</style></head><body><h1>Lorem ipsum</h1><a class="btn-primary">Buy</a><a class="button-primary">Join</a><div class="card"><div class="card">placeholder</div></div></body></html>`);
  writeFileSync(mixedHtml, `<!doctype html>
<html><head><style>
main { color: var(--duvu-fg); background: #123456; padding: 12px; border-radius: 8px; }
.button-primary { min-height: 44px; background: var(--duvu-accent); }
@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; } }
</style></head><body><main><h1>Revenue OS</h1><a class="button-primary">Start</a></main></body></html>`);
  writeFileSync(tinyTypeHtml, `<!doctype html>
<html><head><style>
:root { --duvu-font-size-xs: 10px; --duvu-font-size-sm: 12px; --duvu-font-size-base: 14px; }
main { color: var(--duvu-fg); background: var(--duvu-bg); }
.eyebrow { font-size: 10px; }
.button-primary { min-height: 44px; background: var(--duvu-accent); }
@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; } }
</style></head><body><main><h1>Revenue OS</h1><p class="eyebrow">Too small</p><a class="button-primary">Start</a></main></body></html>`);
  writeFileSync(badPaletteHtml, `<!doctype html>
<html><head><style>
:root { --duvu-font-size-xs: 13px; --duvu-font-size-sm: 15px; --duvu-font-size-base: 16px; --duvu-space-card-label-gap: 2px; }
main { color: var(--duvu-fg); background: var(--duvu-bg); }
.color-card { min-height: 44px; }
.color-grid { display: grid; }
.pill-grid { display: flex; flex-wrap: wrap; }
.code-tabs { overflow-x: auto; }
.code-tab { white-space: nowrap; }
@media (max-width: 640px) {
  .color-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .tab-bar { overflow-x: auto; flex-wrap: nowrap; }
}
.code-preview-block { border-radius: var(--duvu-radius-sm, 100px); }
.button-primary { min-height: 44px; background: var(--duvu-accent); }
@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; } }
</style></head><body><main><h1>Revenue OS</h1><div class="color-grid"><button class="color-card">Toss</button></div><div class="code-preview-block">const bad = true;</div><a class="button-primary">Start</a></main></body></html>`);

	  const goodLint = parseJson(run(['tokens', 'lint', goodHtml, '--format', 'json']));
	  if (!goodLint.pass || goodLint.score < 93) fail('good lint fixture가 A 기준을 통과하지 못함');
	  const generatedLint = parseJson(run(['tokens', 'lint', generatedCssHtml, '--format', 'json']));
	  if (!generatedLint.pass || generatedLint.score < 93) fail(`generate CSS 출력이 자체 lint를 통과하지 못함: ${generatedLint.reasons.join(', ')}`);

  let badFailed = false;
  try {
    run(['tokens', 'lint', badHtml, '--format', 'json']);
  } catch (error) {
    badFailed = true;
    const badLint = parseJson(error.stdout || '');
    if (badLint.pass || badLint.reasons.length < 4) fail('bad lint fixture 실패 이유 부족');
  }
  if (!badFailed) fail('bad lint fixture가 실패하지 않음');

  let mixedFailed = false;
  try {
    run(['tokens', 'lint', mixedHtml, '--format', 'json']);
  } catch (error) {
    mixedFailed = true;
    const mixedLint = parseJson(error.stdout || '');
    const reasonText = mixedLint.reasons.join(' ');
    if (!reasonText.includes('raw hex') || !reasonText.includes('raw px spacing') || !reasonText.includes('raw px radius')) {
      fail('mixed lint fixture가 raw hex/px/radius를 모두 잡지 못함');
    }
  }
  if (!mixedFailed) fail('mixed raw token fixture가 실패하지 않음');

  let tinyTypeFailed = false;
  try {
    run(['tokens', 'lint', tinyTypeHtml, '--format', 'json']);
  } catch (error) {
    tinyTypeFailed = true;
    const tinyLint = parseJson(error.stdout || '');
    const reasonText = tinyLint.reasons.join(' ');
    if (!reasonText.includes('font-size') || !reasonText.includes('타입 토큰 하한')) {
      fail('tiny type fixture가 작은 폰트/토큰 하한을 모두 잡지 못함');
    }
  }
  if (!tinyTypeFailed) fail('tiny type fixture가 실패하지 않음');

  let badPaletteFailed = false;
  try {
    run(['tokens', 'lint', badPaletteHtml, '--format', 'json']);
  } catch (error) {
    badPaletteFailed = true;
    const paletteLint = parseJson(error.stdout || '');
    const reasonText = paletteLint.reasons.join(' ');
    if (!reasonText.includes('팔레트 카드') || !reasonText.includes('모바일 팔레트') || !reasonText.includes('singleton 마지막 줄') || !reasonText.includes('모바일 탭') || !reasonText.includes('코드 출력 탭') || !reasonText.includes('코드/데이터 표면')) {
      fail('bad palette fixture가 팔레트 리듬/모바일 열 수/singleton 마지막 줄/탭 넘침/코드 탭/코드 반경을 모두 잡지 못함');
    }
  }
  if (!badPaletteFailed) fail('bad palette fixture가 실패하지 않음');

  console.log('token smoke ok');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
