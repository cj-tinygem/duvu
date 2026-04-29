# DUVU — 범용 디자인 시스템 엔진

> 소스 색상 하나에서 WCAG AA · Apple HIG · Material Design 3를 동시 준수하는 완전한 디자인 토큰을 도출한다.

```
45 컬러 × 11 타이포 × 4 레이아웃 × 8 스타일 × 6 모션 × 9 그라디언트 × 17 컴포넌트 × 7 인터랙션 × 22 템플릿
```

## 설치

```bash
# 글로벌 설치
npm install -g .

# 또는 npx로 실행
npx duvu
```

## 명령어

### 조회

```bash
duvu list                    # 전체 프리셋 목록
duvu list colors             # 컬러 프리셋만
duvu list typo               # 타이포 프리셋만
duvu show color toss         # 특정 프리셋 상세
duvu info                    # 시스템 통계
duvu tokens export           # DTCG 호환 토큰 JSON 출력
duvu tokens export --format figma --preset toss
duvu tokens export --format figma-dtcg --preset toss --mode dark
duvu tokens export --format dtcg --hex "#3182F6"
duvu tokens contract --template saas --format json
duvu tokens score            # 22개 템플릿 생성 품질 점수
duvu tokens lint ./index.html --format json
duvu tokens audit            # alias 그래프 + 생성형 UI 품질 게이트 검증
```

### 코드 생성

```bash
duvu generate toss                       # CSS 변수 출력
duvu generate "#3182F6"                  # 커스텀 HEX에서 테마 도출
duvu generate toss --platform tailwind   # 플랫폼별 기본 토큰 코드 출력
duvu template saas                       # 템플릿 기반 코드 생성
```

지원 플랫폼: `css` · `tailwind` · `flutter` · `swiftui` · `compose` · `unity` · `react-native`

### 토큰 교환 / 생성 품질 게이트

```bash
duvu tokens export --format dtcg --preset toss
duvu tokens export --format figma --preset toss
duvu tokens export --format figma-dtcg --preset toss
duvu tokens export --format figma-dtcg --preset toss --mode dark
duvu tokens export --format figma-api --preset toss
duvu tokens sync-figma --file-key <key> --dry-run
duvu tokens export --format dtcg --hex "#3182F6"
duvu tokens contract --template saas --format json
duvu tokens contract --template saas --format md
duvu tokens score
duvu tokens lint ./index.html --format json
duvu tokens audit --preset toss
```

`tokens export --format dtcg`는 DTCG 2025.10 형식의 `$schema`, `$type`, `$value`, `$description`, `$extensions.duvu`를 가진 범용 토큰 번들을 출력한다.

`--hex "#3182F6"`는 임의 브랜드 색상에서 dark/light 팔레트를 도출하고, 프리셋과 같은 DTCG·Figma DTCG·품질 감사 경로를 탄다. 커스텀 색상도 `accent/bg`, `fg/bg`, `fg/surface`, 버튼 텍스트 대비 기준을 통과해야 하며, 부족한 대비는 보정 또는 감사 실패 대상으로 본다.

`tokens export --format figma`는 Figma Variables API나 플러그인이 소비하기 쉬운 커스텀 collection/mode/variable JSON이다. Figma Design의 네이티브 import 파일은 아니다. 이름은 기존 호환을 위해 유지하며, Figma REST API bulk payload에 더 가까운 명시 포맷은 `figma-api`다.

`tokens export --format figma-dtcg`는 Figma Design의 native Variables import 제약에 맞춘 DTCG JSON이다. `--mode dark|light`를 주면 해당 모드에 바로 import할 수 있는 단일 DTCG 파일을 출력하고, 모드를 생략하면 dark/light 파일 번들을 출력한다. Figma import 제약에 맞춰 `color`, `dimension(px)`, `fontFamily`, `duration(s)`, `number`, `string`만 사용하며, bundle은 dark/light normalized name/type/value-shape parity를 검증한다.

Figma 지원 범위는 현재 **import-ready/export-ready JSON 생성**과 `tokens sync-figma`를 통한 Variables REST API 호출이다. `figma-api` 포맷은 Figma REST API의 `variableCollections`, `variableModes`, `variables`, `variableModeValues` payload를 생성하고 자체 검증한다. 실제 POST는 `FIGMA_TOKEN` 또는 `--token`과 `--file-key`가 필요하며, Figma Enterprise/Full seat/edit 권한/`file_variables:write` scope 제약을 그대로 따른다. 먼저 `--dry-run`으로 endpoint, 감사 결과, payload를 확인할 수 있다.

`tokens audit`는 다음을 하드 게이트로 검증한다.

- DTCG 토큰 구조와 alias `{path.to.token}` 참조 무결성
- DTCG 타입별 값 형식과 semantic dark/light mode parity
- Figma DTCG dark/light import parity
- WCAG 대비, HIG 터치 타겟, surface/bg 구분
- 컴포넌트 `intent`/`meaning`/`level` 메타데이터
- 템플릿 참조 무결성과 preview 다양성
- AI 슬롭 방지 규칙: Primary CTA 1개, accent 면적 제한, placeholder/장식/중첩 카드 금지
- 모든 템플릿의 `aesthetic direction`과 `memorability`: 강한 미학 방향과 기억에 남는 signature move 없이는 통과 불가

`tokens contract`는 AI 에이전트가 바로 소비할 수 있는 생성 계약을 출력한다. 선택된 컬러/타이포/레이아웃/스타일/모션, `preview.cards`, 도메인 태그, 미학 방향, signature move, 피해야 할 anti-pattern, 하드 룰, 품질 스코어, 생성 프롬프트를 한 번에 포함한다. `--preset`이나 `--hex`를 명시하지 않으면 템플릿 고유 컬러 프리셋을 사용하므로 `luxury`가 `toss`처럼 엉뚱한 기본 팔레트로 희석되지 않는다.

`tokens score`는 모든 템플릿의 `hierarchy`, `spacing`, `color`, `typography`, `responsive`, `motion`, `fidelity`, `restraint`, `aestheticDirection`, `memorability` 하위 점수와 실패 이유를 반환한다. 실패 템플릿이 있으면 non-zero로 종료한다.

`tokens lint`는 AI가 생성한 HTML/CSS 결과물을 검사한다. DUVU 토큰 미사용, placeholder/lorem, raw hex 색상, raw px spacing/radius, Primary CTA 과다, `prefers-reduced-motion` 누락, `font-size: vw`, 16px 미만 텍스트, 모바일 팔레트 2열, 프리셋 칩 singleton 마지막 줄을 만드는 `flex-wrap`, 모바일 탭 가로 스크롤, 코드 출력 탭 가로 스크롤/nowrap, 코드/데이터 표면의 과도한 pill 반경, orb/blob/glow 장식, 중첩 카드, 44px 미만 터치 타겟 근거 부족을 실패로 처리한다.

DUVU 토큰 엔진의 A+ 기준은 “예쁜 JSON 출력”이 아니라 구조, 대비, alias, Figma import parity, 템플릿 점수, 미학 방향, 생성 결과 린트가 함께 통과하는 상태다. 목표는 AI가 흔히 만드는 카드 나열·장식 과다·토큰 미사용·무성격 UI를 사전에 차단하고, 강한 미감 방향을 계약으로 고정해 최고 수준의 프론트엔드·디자인·UI/UX·비주얼 산출물을 만드는 것이다.

### 확장

```bash
duvu add color '{"id":"my-brand","name":"My Brand","src":"#FF6B35",...}'
duvu remove color my-brand
duvu reset color             # 특정 카테고리 기본값 복원
duvu reset                   # 전체 기본값 복원
```

기본 프리셋 삭제 시 경고를 표시하며, `duvu reset`으로 언제든 복원 가능.

### AI 에이전트 스킬 설치

```bash
duvu install-skill            # Claude Code + Codex CLI + Gemini CLI 전부
duvu install-skill --claude   # Claude Code만
duvu install-skill --codex    # Codex CLI만
duvu install-skill --gemini   # Gemini CLI만
```

설치 경로:

| 에이전트 | 경로 |
|---------|------|
| Claude Code | `~/.claude/skills/duvu/SKILL.md` |
| Codex CLI + Gemini CLI (공용) | `~/.agents/skills/duvu/SKILL.md` |

설치 후 각 에이전트가 UI/프론트엔드 코드를 작성할 때 DUVU 디자인 시스템이 자동으로 적용된다.

### 데모

```bash
duvu demo                    # http://localhost:3333 에서 데모 실행, 새 데스크톱 크기 창으로 열기
duvu demo 8080               # 포트 지정
duvu demo --no-open          # 서버만 실행
duvu demo --window-size 1440x1000
```

WSL에서는 일반 `xdg-open`이 기존의 좁은 Chrome 창을 재사용할 수 있으므로, `duvu demo`는 Windows Chrome을 새 창(`--new-window`)과 데스크톱 크기(`--window-size`)로 연다.

인터랙티브 데모 웹페이지에서 모든 프리셋을 시각적으로 탐색하고, 라이브 프리뷰로 조합 결과를 확인할 수 있다.

### 검증

```bash
npm test                     # 데이터/감사/기본 생성 스모크 테스트
duvu screenshot --quick      # 데모 스크린샷 캡처 (시스템 Chromium 필요)
npm run test:visual          # 6개 화면비 실제 브라우저 렌더 품질 감사
```

루트 [CALIBRATION.md](CALIBRATION.md)는 `/calibrate` 전용 수용 기준이다. `npm test`, `npm audit`, `ctx audit`, JS 문법 검사, 토큰/시각/패키지/보안 게이트를 프로젝트 방향과 대조하는 기준으로 사용한다.

`duvu screenshot`은 패키지 의존성 `puppeteer-core`로 설치된 API를 사용하고, 로컬 시스템의 Chromium/Chrome 실행 파일을 찾아 캡처한다. `--port`를 생략하면 빈 로컬 포트를 자동 선택하고, 명시한 포트가 사용 중이면 즉시 실패한다.
`--audit` 모드는 6개 화면비에서 모든 프리셋 탭과 22개 템플릿 상태를 순회하며 16px 미만 텍스트, 텍스트 클리핑, 화면 밖 오버플로, 코드 탭 행 분산, singleton 마지막 줄, 팔레트 라벨 리듬, 팔레트 swatch/info 비율, 코드 표면 반경을 렌더 결과에서 직접 실패시킨다. 빠른 수동 점검만 필요하면 `duvu screenshot --quick --audit`을 사용한다.

## 디렉토리 구조

```
duvu-cli/
├── bin/duvu.js              # CLI 엔트리포인트
├── package.json
├── README.md
├── data/
│   ├── presets.json          # 라이브 프리셋 데이터 (편집 가능)
│   ├── defaults/
│   │   └── presets.json      # 불변 백업 (reset용)
│   └── references/           # 레퍼런스 마크다운
│       ├── tokens.md
│       ├── platforms.md
│       ├── rules.md
│       ├── compliance.md
│       ├── color-system.md
│       ├── templates.md
│       ├── components.md
│       └── layouts.md
├── skills/
│   └── SKILL.md              # AI 에이전트용 스킬 정의
└── demo/
    └── index.html            # 인터랙티브 데모 웹페이지
```

## 핵심 원칙

- **하나의 소스 색상** → 다크/라이트 모드 전체 팔레트 자동 도출
- **WCAG AA 4.5:1** 대비율 보장
- **Apple HIG + Material Design 3** 동시 준수
- **ZERO 아웃라인** — 테두리는 의미 있을 때만
- **의도 없는 요소는 없다** — 모든 요소에 명확한 목적

## 클론 (로컬 전용)

`demo/clones/`에는 Picasso로 생성한 레퍼런스 사이트 클론이 저장된다. 이 클론들은 **로컬 개발/학습 전용**이며, 원본 사이트의 저작권이 있는 콘텐츠를 포함한다.

**배포 시 반드시 배제한다.** `.gitignore`와 `.npmignore` 모두에서 `demo/clones/`를 제외하고 있다. npm publish, Docker 빌드, CI/CD 파이프라인 등 어떤 배포 경로에서도 클론 디렉토리가 포함되어서는 안 된다.

단, `data/presets.json`의 클론 메타데이터는 패키지에 포함된다. npm 설치 환경에서는 `duvu show clone <id>`가 `archive.status: "metadata-only"`와 `archive.available: false`를 표시하며, 실제 로컬 경로는 출력하지 않는다. 로컬 개발 환경에서 `demo/clones/<id>/index.html`이 존재할 때만 CLI가 `archive.demoPath`, `archive.localPath`, `archive.absolutePath`를 동적으로 붙인다.

## 라이선스

MIT
