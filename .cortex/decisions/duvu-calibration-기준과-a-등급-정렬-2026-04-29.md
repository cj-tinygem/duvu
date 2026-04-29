---
title: "DUVU CALIBRATION 기준과 A 등급 정렬 2026-04-29"
type: decision
sources:
  - "CALIBRATION.md"
  - "docs/PRD.md"
  - "docs/DESIGN-PHILOSOPHY.md"
  - "skills/SKILL.md"
  - "README.md"
  - "docs/README.md"
  - ".docsys/STATUS.md"
related:
  - path: "knowledge/architecture/duvu-전역-밸런스-시스템.md"
    rel: informed-by
  - path: "knowledge/architecture/duvu-그리드-singleton-마지막-줄-규칙.md"
    rel: informed-by
confidence: high
tags: ["calibration", "quality", "audit", "duvu", "vision"]
created: 2026-04-29
updated: 2026-04-29
---

# DUVU CALIBRATION 기준과 A 등급 정렬 2026-04-29

## 결정

루트 `CALIBRATION.md`는 `/calibrate` 전용 수용 기준으로 유지한다. 다만 기준의 중심은 특정 구현 파일, 스모크 명령, 현재 모듈 재고가 아니라 DUVU의 최상위 비전이어야 한다.

DUVU의 calibrate 기준은 "작동하는 디자인 토큰 CLI인가"가 아니라, **AI가 세계 최고 수준의 디자인과 프론트엔드/UI/UX/비주얼을 실제 코드와 화면으로 만들어내게 하는 도구인가**를 판정한다.

## 변경된 기준 구조

이전의 `기준 1~10 PASS + 기준 11 PARTIAL/DEFER` 형태는 너무 구현 체크리스트에 가까웠다. 현재 기준은 다음 구조로 재정렬되었다.

- 최상위 비전: 작동은 바닥이며, 테스트가 통과해도 세계 최고 수준의 디자인을 강제하지 못하면 `A`가 아니다.
- 판정 태도: PASS/PARTIAL/FAIL/DEFER는 철학, 제품 방향, 구현, 검증 증거를 함께 본다.
- 비타협 원칙: 아름다움, 의도와 의미, 비움과 과감함, AI 슬롭 차단, 철학의 시스템화, 접근성과 규격, 레퍼런스 학습, AI 도구성, 운영 가능한 품질 체계.
- 증거 수집 방식: README/PRD/철학/스킬 문서, 토큰/템플릿/컴포넌트/reference, 실제 데모/생성 산출물, 자동 검증, doc-sys/Cortex를 대조한다.

## 유지되는 경계

구체 명령과 파일명은 기준 자체가 아니라 현재 저장소에서 증거를 찾는 대표 경로다. 동등하거나 더 강한 검증이 있으면 대체할 수 있다. 따라서 구현이 더 나은 구조로 진화해도 CALIBRATION이 불필요하게 깨지지 않는다.

`A+`는 세계 최고 레퍼런스와의 반복 가능한 벤치마크와 실제 산출물 비교까지 통과할 때만 고려한다. 레퍼런스 원본, 저작권 리스크가 있는 클론, 수동 비전 비교는 별도 자산과 운영 루프가 필요하므로 저장소 자동 검증만으로 과장 판정하지 않는다.

## 근거

- `docs/PRD.md`: DUVU를 세계 최고 수준의 UI/프론트엔드를 자동 생산하는 범용 디자인 시스템 엔진으로 정의한다.
- `docs/DESIGN-PHILOSOPHY.md`: 아름다움 우선, 의도와 의미, 비움, 과감함, 절제, 레벨/레이어를 요구사항으로 둔다.
- `skills/SKILL.md`: AI가 요구사항만 받아도 DUVU 철학과 토큰 계약을 적용해야 한다고 규정한다.
- `CALIBRATION.md`: 위 철학을 `/calibrate` 판정 헌장으로 압축한다.
