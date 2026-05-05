# Cortex Index

## Knowledge
- [DUVU 그리드 singleton 마지막 줄 규칙](knowledge/architecture/duvu-그리드-singleton-마지막-줄-규칙.md) — 반복 그리드의 핵심 실패 조건은 불완전한 마지막 줄 일반이 아니라 singleton 마지막 줄이다.
- [DUVU 전역 밸런스 시스템](knowledge/architecture/duvu-전역-밸런스-시스템.md) — 전역 밸런스 시스템의 입력, 출력, 계층, 데모 소비 지점을 정리했다.

## Failures

## Memory

## Decisions
- [DUVU CALIBRATION 기준과 A 등급 정렬 2026-04-29](decisions/duvu-calibration-기준과-a-등급-정렬-2026-04-29.md) — CALIBRATION.md를 구현 체크리스트가 아니라 세계 최고 수준 디자인을 만드는 AI 도구인지 판정하는 /calibrate 헌장으로 재정렬했다.
- [팔레트 singleton 마지막 줄 규칙 결정](decisions/architecture/팔레트-singleton-마지막-줄-규칙-결정.md) — 팔레트 그리드는 불완전한 마지막 줄 일반이 아니라 singleton 마지막 줄만 실패로 본다.
- [전역 밸런스 시스템 소비 범위 결정](decisions/architecture/전역-밸런스-시스템-소비-범위-결정.md) — 전역 밸런스 시스템의 직접 소비 범위와 과도한 엔지니어링 경계를 결정했다.

## Docs
- [DUVU 프로젝트 계약과 문서 스모크 검증 2026-05-05](docs/duvu-프로젝트-계약과-문서-스모크-검증-2026-05-05.md) — 2026-05-05 기준 DUVU project init/audit 계약 흐름과 docs smoke 회귀 검증을 반영하고 npm test 및 보안 감사를 통과한 상태.
- [DUVU 프로젝트 전체 상태 push 전 2026-04-29](docs/duvu-프로젝트-전체-상태-push-전-2026-04-29.md) — push 전 전체 프로젝트 상태: npm test, npm audit, ctx audit, JS/JSON 검증, dark/light visual audit 통과. 남은 리스크는 외부 레퍼런스 1:1 비전 벤치마크와 이전 감사 문서의 일부 stale 서술.
- [DUVU 프로젝트 전수 감사 2026-04-29](docs/duvu-프로젝트-전수-감사-2026-04-29.md) — 과거 감사 시점 기록. 현재는 CALIBRATION.md가 존재하며, 당시의 calibrate 보류와 일부 플랫폼 레퍼런스 지적은 후속 상태 문서와 현재 구현으로 supersede되었다.
- [DUVU 프로젝트 전수 감사 2026-04-24](docs/duvu-프로젝트-전수-감사-2026-04-24.md) — 전체 테스트와 Cortex 감사가 통과했고, 미참조 clone 폰트 정리까지 완료됨.
