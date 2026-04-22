#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'path';

const root = new URL('..', import.meta.url).pathname;
const demoRoot = resolve(root, 'demo');
const htmlFiles = [join(demoRoot, 'index.html')];
const clonesRoot = join(demoRoot, 'clones');

if (existsSync(clonesRoot)) {
  for (const entry of readdirSync(clonesRoot, { withFileTypes: true })) {
    const candidate = join(clonesRoot, entry.name, 'index.html');
    if (entry.isDirectory() && existsSync(candidate)) htmlFiles.push(candidate);
  }
}

function fail(message) {
  console.error(`link smoke failed: ${message}`);
  process.exitCode = 1;
}

function collectRefs(html) {
  const refs = [];
  const tagRe = /<[^>]+\b(?:href|src)=(['"])(.*?)\1[^>]*>/g;
  const cssUrlRe = /url\((['"]?)(.*?)\1\)/g;

  for (const match of html.matchAll(tagRe)) {
    const tag = match[0];
    const isHidden = /\bhidden\b/i.test(tag)
      || /\baria-hidden=(['"])true\1/i.test(tag)
      || /\bstyle=(['"])[^'"]*display\s*:\s*none/i.test(tag);
    if (!isHidden) refs.push(match[2]);
  }
  for (const match of html.matchAll(cssUrlRe)) refs.push(match[2]);
  return refs;
}

function isExternal(ref) {
  return /^[a-z][a-z0-9+.-]*:/i.test(ref) || ref.startsWith('//') || ref.startsWith('mailto:') || ref.startsWith('tel:');
}

function isLocalFile(pathname) {
  return existsSync(pathname) && !statSync(pathname).isDirectory();
}

for (const htmlFile of htmlFiles) {
  const html = readFileSync(htmlFile, 'utf8');
  const refs = collectRefs(html);

  for (const rawRef of refs) {
    const ref = rawRef.trim();
    if (!ref || ref.startsWith('#') || isExternal(ref) || ref.startsWith('/api/')) continue;

    const pathOnly = ref.split(/[?#]/)[0];
    const target = pathOnly.startsWith('/')
      ? resolve(demoRoot, pathOnly === '/' ? 'index.html' : pathOnly.replace(/^\/+/, ''))
      : resolve(dirname(htmlFile), pathOnly);
    const scopeRoot = pathOnly.startsWith('/') ? demoRoot : dirname(htmlFile);
    const rel = relative(scopeRoot, target);

    if (rel.startsWith('..') || isAbsolute(rel)) {
      fail(`${relative(root, htmlFile)}: 데모 범위 밖 링크: ${ref}`);
      continue;
    }

    if (!isLocalFile(target)) {
      fail(`${relative(root, htmlFile)}: 누락된 로컬 링크: ${ref} -> ${relative(root, target)}`);
    }
  }
}

if (!process.exitCode) {
  console.log(`link smoke ok (${htmlFiles.map(file => basename(dirname(file))).join(', ')})`);
}
