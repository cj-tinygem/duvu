---
title: "팔레트 singleton 마지막 줄 규칙 결정"
type: decision
sources:
  - "demo/index.html"
  - "bin/screenshot.js"
  - "data/references/rules.md"
  - "data/references/layouts.md"
  - "data/references/tokens.md"
  - "lib/duvu-balance.js"
related:
  - path: "decisions/architecture/전역-밸런스-시스템-소비-범위-결정.md"
    rel: informed-by
  - path: "knowledge/architecture/duvu-전역-밸런스-시스템.md"
    rel: related
confidence: medium
tags: ["duvu", "balance", "grid", "decision", "palette"]
created: 2026-04-24
updated: 2026-04-24
---

# 팔레트 singleton 마지막 줄 규칙 결정

DUVU의 팔레트/프리셋 그리드는 "마지막 줄이 덜 찬 것" 일반을 금지하지 않는다. 금지하는 것은 **마지막 줄에 1개만 남는 singleton row**다.

## 결정
- 컬럼 선택 규칙은 `count % cols !== 1`이라는 암묵식을 직접 쓰지 않고, `hasSingletonLastRow(count, cols)`라는 의미 있는 helper로 표현한다.
- `6열 마지막 줄 3개`와 `4열 마지막 줄 1개`는 같은 문제로 취급하지 않는다.
- 45개 팔레트 데이터셋에서는 다음 판단을 유지한다.
  - `6열`: 허용 (`6/6/6/6/6/6/6/3`)
  - `5열`: 허용 (`5/5/5/5/5/5/5/5/5`)
  - `4열`: 금지 (`4/4/4/4/4/4/4/4/4/4/4/1`)
  - `3열`: 허용 (`3/3/3/3/3/3/3/3/3/3/3/3/3/3/3`)
- 시각 감사도 같은 용어를 사용한다. 실패 메시지는 모호한 마지막 줄 표현 대신 `singleton 마지막 줄`로 기록한다.

## 이유
- 이전 설명은 마지막 줄 불균형을 너무 넓게 표현해서, "반쯤 찬 마지막 줄"과 "1개만 남는 마지막 줄"을 같은 문제처럼 보이게 만들었다.
- 실제로는 둘의 시각적 질이 다르다. 6열에서 3개 남는 줄은 여전히 하나의 줄로 읽히지만, 4열에서 1개 남는 줄은 카드 하나가 덩그러니 남아 스캔 리듬을 깨뜨린다.
- 따라서 이 규칙은 디자인 취향이 아니라, 현재 데이터셋과 감사 기준을 함께 봤을 때의 구조적 판단이다.

## 구현 반영
- `demo/index.html`에서 컬럼 결정 helper를 `hasSingletonLastRow()`로 명시했다.
- `bin/screenshot.js`는 singleton 마지막 줄 발생 시 실패하도록 문구를 정리했다.
- `rules.md`, `layouts.md`, `tokens.md`, `lib/duvu-balance.js`도 같은 용어를 사용하도록 맞췄다.

## 주의사항
- 이 규칙은 "모든 불완전한 마지막 줄 금지"가 아니다.
- 다른 데이터셋에서 항목 수가 바뀌면 결과가 달라질 수 있으므로, 앞으로는 컬럼 선택 로직을 설명할 때 항상 실제 분포(`6/6/.../3`)를 함께 제시한다.
- 필요 이상으로 4열을 강제해 singleton 마지막 줄 규칙을 깨면 compact/tablet 감사가 바로 실패한다.

## Cortex Backlinks
- [[knowledge/architecture/duvu-그리드-singleton-마지막-줄-규칙]]
