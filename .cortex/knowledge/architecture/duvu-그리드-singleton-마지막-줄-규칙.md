---
title: "DUVU 그리드 singleton 마지막 줄 규칙"
type: knowledge
sources:
  - "demo/index.html"
  - "bin/screenshot.js"
  - "data/references/rules.md"
  - "data/references/layouts.md"
  - "data/references/tokens.md"
  - "lib/duvu-balance.js"
related:
  - path: "knowledge/architecture/duvu-전역-밸런스-시스템.md"
    rel: depends-on
  - path: "decisions/architecture/팔레트-singleton-마지막-줄-규칙-결정.md"
    rel: informed-by
confidence: medium
tags: ["duvu", "balance", "grid", "knowledge", "palette"]
created: 2026-04-24
updated: 2026-04-24
---

# DUVU 그리드 singleton 마지막 줄 규칙

DUVU의 반복 그리드에서 핵심 문제는 "마지막 줄이 꽉 차지 않았는가"가 아니라, **마지막 줄에 항목이 1개만 남는가**다.

## 핵심 개념
- `singleton 마지막 줄`: 마지막 행에 카드/칩/탭이 1개만 남는 상태
- `partial 마지막 줄`: 마지막 행이 덜 찼지만 2개 이상 남는 상태

DUVU는 기본적으로 singleton 마지막 줄만 실패로 본다. partial 마지막 줄은 데이터 개수, 카드 폭, 읽기성에 따라 허용될 수 있다.

## 팔레트에서의 적용
45개 컬러 팔레트 기준:
- 6열 → `6/6/6/6/6/6/6/3` : 허용
- 5열 → `5/5/5/5/5/5/5/5/5` : 허용
- 4열 → `4/4/4/4/4/4/4/4/4/4/4/1` : 실패
- 3열 → `3/3/3/3/3/3/3/3/3/3/3/3/3/3/3` : 허용

즉, 4열이 없는 이유는 시스템이 4열을 못 만들기 때문이 아니라, 현재 항목 수에서는 4열이 singleton 마지막 줄을 만들어 더 나쁘기 때문이다.

## 구현 위치
- `demo/index.html`
  - `hasSingletonLastRow(count, cols)`
  - `chooseBalancedColumns()`
  - `chooseBalancedColumnsWithProfile()`
  - `chooseColorColumns()`
- `bin/screenshot.js`
  - row profile 측정 후 마지막 줄이 1개이고 충분히 좁으면 실패
- `data/references/*`
  - 규칙 문구를 모호한 마지막 줄 표현에서 `singleton 마지막 줄`로 명확화

## 전역 밸런스와의 관계
이 규칙은 팔레트 전용 미감이 아니라, 전역 밸런스 시스템의 wrapping/row distribution 원칙의 한 사례다. 다만 팔레트는 카드 개수와 읽기 폭 제약이 강해서, 일반 카드 그리드보다 이 규칙의 영향이 더 두드러진다.

## 실무 해석
- "마지막 줄이 비었다"만으로 실패 판정하지 않는다.
- "왜 4열이 없지?"라는 질문에는 실제 분포를 보여줘야 한다.
- 항목 수가 바뀌면 정답도 바뀔 수 있으므로, 컬럼 규칙은 항상 데이터 개수와 함께 판단한다.

## Cortex Backlinks
- [[docs/duvu-프로젝트-전수-감사-2026-04-29]]
- [[decisions/duvu-calibration-기준과-a-등급-정렬-2026-04-29]]
- [[docs/duvu-프로젝트-전체-상태-push-전-2026-04-29]]
