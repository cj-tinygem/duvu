# 프로젝트 상태

## 지금 여기
DUVU는 CLI, 프리셋 DB, 데모, AI 스킬 설치, clone 조회, 패키지 스모크 테스트, 링크/보안 스모크 테스트, Puppeteer 기반 스크린샷 검증 기능을 갖춘 디자인 시스템 엔진이다. 최근 전수 감사 기준 완성도는 A이며, `npm test`, 패키지 추출본 `npm test`, `npm audit --omit=dev`, `npm run screenshot`이 통과했다.

## 다음 작업
1. `duvu screenshot` 결과 이미지를 실제 비전 검수로 확인하고 레퍼런스 비교 기록을 남긴다.
2. 10개 클론 템플릿의 fidelity를 별도 점수로 관리한다.
3. 의미 단위 줄바꿈과 DOM 기반 접근성 검사를 `duvu audit`에 확장한다.
4. 색상 프리셋별 출처/근거 메타데이터를 보강한다.
5. `/mnt/c`에서 발생하는 간헐 `EIO`를 WSL 네이티브 경로와 비교 검증한다.

## 최근 완료
- `duvu audit` 118/0, 로컬 `npm test`, 패키지 추출본 `npm test`, `npm audit --omit=dev`, `npm run screenshot` 검증 완료.
- npm 패키지에서 `demo/clones/`와 문서 원문을 제외하면서 필요한 스모크 테스트 스크립트는 포함되도록 패키징 경계를 보정했다.
- PRD, README, presets/defaults, templates reference의 클론 레퍼런스와 7개 플랫폼 설명을 일치시켰다.

## 주의사항
- `demo/clones/`는 로컬/학습용 제외 경로이므로 패키지 배포에는 포함되지 않는다.
- npm 패키지의 클론은 `metadata-only`로 표시된다. `demo/clones/<id>/index.html`이 로컬에 있을 때만 CLI가 `archive.demoPath`/`archive.localPath`를 동적으로 출력한다.
- `/mnt/c`에서 `npm install` 중 EIO가 발생할 수 있어 WSL 네이티브 경로 검증이 필요하다.
- `.duvu/usage.jsonl`은 실행 로그이며 git 추적 대상이 아니다.
- `IDEA.md`는 원문 보존 자료이고 현재 요구사항 정본은 `docs/PRD.md`다.

## 참고 경로
- `README.md` — 사용법과 검증 명령.
- `bin/duvu.js` — CLI, 데모 서버, 감사, 스킬 설치.
- `bin/screenshot.js` — Puppeteer 기반 시각 검증 캡처.
- `docs/GAPS.md` — 제품 요구사항 대비 남은 갭.
- `bin/link-smoke.js`, `bin/package-smoke.js`, `bin/security-smoke.js` — 회귀 검증 스크립트.
