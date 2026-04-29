---
title: "DUVU 전역 밸런스 시스템"
type: knowledge
sources:
  - "lib/duvu-balance.js"
  - "demo/index.html"
  - "bin/duvu.js"
  - "data/references/rules.md"
  - "data/references/tokens.md"
related:
  - path: "decisions/architecture/전역-밸런스-시스템-소비-범위-결정.md"
    rel: informed-by
confidence: medium
tags: ["duvu", "balance", "architecture", "ui-system"]
created: 2026-04-24
updated: 2026-04-24
---

# DUVU 전역 밸런스 시스템

DUVU의 전역 밸런스 시스템은 디자인 토큰을 대체하는 계층이 아니라, 기존 메타데이터를 실제 화면 기하로 번역하는 결정 계층이다.

## 입력
- layout preset의 `restraint`, `multiplier`
- template의 `tags`, `domainTags`, `heroAlign`, `preview.cards`
- component metadata의 `level`
- page pattern의 `intent`, `why`
- viewport width/height
- layout_tokens

## 출력
- spacing/rhythm 관련 CSS 변수
- content/title/max width
- preset/tab/code-tab 분산 규칙
- preview min width
- palette bias
- alignment mode
- density mode
- journey mode

## 계층 구조
1. 상위: DUVU 철학/intent/meaning/page pattern
2. 중간: 전역 밸런스 시스템 (`lib/duvu-balance.js`)
3. 하위: 팔레트 같은 특수 UI의 전용 기하 엔진

## 데모 소비 지점
- hero / section rhythm
- article / quote / preview single의 읽기 폭
- dense preview grid의 최소 카드 폭
- template grid와 hero stats의 density 반영
- code tab 배치 계산
- start alignment 계열의 hero/section/tab 정렬

## 경계
- 모든 UI를 dataset 분기 기반으로 재작성하지 않는다.
- 계산된 CSS 변수로 충분한 부분은 변수 소비로 끝낸다.
- 반복해서 문제가 재발한 축만 직접 소비 규칙을 추가한다.

## Cortex Backlinks
- [[decisions/architecture/팔레트-singleton-마지막-줄-규칙-결정]]
- [[knowledge/architecture/duvu-그리드-singleton-마지막-줄-규칙]]
- [[decisions/duvu-calibration-기준과-a-등급-정렬-2026-04-29]]
