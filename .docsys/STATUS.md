# 프로젝트 상태

## 지금 여기
DUVU는 CLI, 프리셋 DB, 데모, AI 스킬 설치, clone 조회, 패키지/링크/보안 스모크, Puppeteer 기반 시각 검증, `/calibrate`용 수용 기준을 갖춘 디자인 시스템 엔진이다. 이 파일을 프로젝트 전체 상태의 canonical 운영 상태로 본다.

## 다음 작업
1. 레퍼런스 사이트와의 1:1 비전 비교가 필요한 경우 별도 벤치마크 자산으로 관리한다.
2. 10개 클론 템플릿의 fidelity를 별도 점수로 관리한다.
3. 의미 단위 줄바꿈과 DOM 기반 접근성 검사를 `duvu audit`에 확장한다.
4. `/mnt/c`에서 발생하는 간헐 `EIO`를 WSL 네이티브 경로와 비교 검증한다.

## 최근 완료
- `/calibrate` 기준 파일 `CALIBRATION.md`를 추가하고, README/docs 포털에서 위치를 연결했다.
- 플랫폼 레퍼런스 예시의 생성 UI 16px 하한과 음수 letter-spacing 불일치를 정리했다.
- `duvu audit` 122/0, 로컬 `npm test`, dark/light 시각 감사, `npm audit --audit-level=moderate`, `ctx audit`, `duvu tokens audit --preset toss` 100/100 A+ 검증 완료.

## 주의사항
- `demo/clones/`는 로컬/학습용 제외 경로이므로 패키지 배포에는 포함되지 않는다.
- npm 패키지의 클론은 `metadata-only`로 표시된다. `demo/clones/<id>/index.html`이 로컬에 있을 때만 CLI가 `archive.demoPath`/`archive.localPath`를 동적으로 출력한다.
- `/mnt/c`에서 `npm install` 중 EIO가 발생할 수 있어 WSL 네이티브 경로 검증이 필요하다.
- `.duvu/usage.jsonl`은 실행 로그이며 git 추적 대상이 아니다.
- `IDEA.md`는 원문 보존 자료이고 현재 요구사항 정본은 `docs/PRD.md`다. `CALIBRATION.md`는 doc-sys 정본이 아니라 `/calibrate` 전용 기준이다.

## 참고 경로
- `README.md` — 사용법과 검증 명령.
- `CALIBRATION.md` — `/calibrate` 수용 기준.
- `bin/duvu.js` — CLI, 데모 서버, 감사, 스킬 설치.
- `bin/screenshot.js` — Puppeteer 기반 시각 검증 캡처.
- `docs/GAPS.md` — 제품 요구사항 대비 남은 갭.
- `bin/link-smoke.js`, `bin/package-smoke.js`, `bin/security-smoke.js` — 회귀 검증 스크립트.
