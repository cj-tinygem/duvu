# 프로젝트 상태

## 지금 여기
이 파일은 Cortex 지식/결정 작업 상태만 다룬다. 프로젝트 전체 운영 상태의 정본은 `.docsys/STATUS.md`다. 2026-04-29 push 전 전체 상태는 `docs/duvu-프로젝트-전체-상태-push-전-2026-04-29.md`에 컴파일했다. `npm test`, `npm audit --omit=dev`, `ctx audit --fix`, JS/JSON 검증, dark/light visual audit, `tokens audit`가 통과한 상태다.

## 다음 작업
1. 외부 레퍼런스 사이트와의 1:1 비전 비교가 필요하면 별도 벤치마크 자산과 반복 가능한 판정 루프로 관리한다.
2. `.cortex/docs/duvu-프로젝트-전수-감사-2026-04-29.md`의 이전 감사 시점 stale 서술은 후속 Cortex 문서에서 supersede하거나 갱신한다.
3. 전역 밸런스 시스템 확장은 실제 재발 문제 기준으로만 판단한다.
4. 컬럼/래핑 판단을 설명할 때는 실제 분포(`6/6/.../3`)를 함께 제시하도록 유지한다.

## 최근 완료
- push 전 전체 프로젝트 상태를 Cortex doc으로 컴파일
- `npm test` 통과: `duvu audit` 122/0, token smoke, dark/light visual audit 각 174 상태 이슈 0, link/package/security smoke 통과
- `ctx audit --fix` 이슈 0, 경고 0, 자동 수정 0

## 주의사항
- 전역 밸런스 시스템은 상위 intent/meaning/page pattern을 덮어쓰지 않는다.
- 반복해서 재발한 문제에만 직접 소비 규칙을 추가한다.
- palette는 전역 밸런스 위의 하위 전용 엔진으로 유지한다.
- 마지막 줄이 덜 찬 것 자체를 실패로 보지 않는다. 1개만 남는 singleton row가 핵심 실패 조건이다.
- `CALIBRATION.md`는 현재 존재한다. 이전 Cortex 감사 문서에 남은 "CALIBRATION.md 부재" 서술은 과거 시점 기록이다.

## 참고 경로
- .cortex/docs/duvu-프로젝트-전체-상태-push-전-2026-04-29.md
- .cortex/knowledge/architecture/duvu-전역-밸런스-시스템.md
- .cortex/knowledge/architecture/duvu-그리드-singleton-마지막-줄-규칙.md
- .cortex/decisions/architecture/전역-밸런스-시스템-소비-범위-결정.md
- .cortex/decisions/architecture/팔레트-singleton-마지막-줄-규칙-결정.md
