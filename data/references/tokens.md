# DUVU 디자인 토큰

## 토큰 네이밍 규칙

모든 토큰은 `--duvu-` 접두사를 사용한다. 플랫폼별 변환은 `platforms.md` 참조.

## 표준 교환 형식

DUVU는 내부 프리셋을 DTCG 2025.10 호환 JSON으로 내보낼 수 있다.

```bash
duvu tokens export --format dtcg --preset toss
duvu tokens export --format figma --preset toss
duvu tokens export --format figma-dtcg --preset toss --mode dark
duvu tokens export --format dtcg --hex "#3182F6"
duvu tokens contract --template saas --format json
duvu tokens score
duvu tokens lint ./index.html --format json
duvu tokens audit --preset toss
```

내보내기 계약:

- 루트에는 `$schema`, `$description`, `$extensions.duvu`가 있어야 한다.
- 모든 토큰은 `$type`, `$value`, `$description`을 가진다.
- DUVU 고유 메타데이터는 `$extensions.duvu`에만 둔다.
- alias는 `{core.color.dark.bg}` 같은 중괄호 경로만 허용한다.
- alias 대상은 반드시 존재해야 하며 순환 참조는 실패한다.
- collection은 `core`, `semantic`, `component`, `quality`로 분리한다.
- mode는 최소 `dark`, `light`를 완전하게 포함한다.
- `--hex` 입력은 `custom` 소스 색상으로 취급하되 프리셋과 같은 대비·alias·Figma parity 감사 경로를 통과해야 한다.

이 계약은 Figma Variables의 collections/modes/variables 개념과 왕복 가능한 구조를 만들기 위한 기반이다. `--format figma`는 API/플러그인용 커스텀 매핑 JSON이고, Figma Design의 네이티브 import는 `--format figma-dtcg`를 사용한다. Figma API 동기화는 별도 계층에서 수행하되, CLI는 먼저 표준 JSON과 참조 무결성을 보장한다.

### Figma 포맷 경계

| 포맷 | 상태 | 용도 | Figma 직접 동기화 |
|---|---|---|---|
| `dtcg` | 지원 | DTCG 호환 범용 토큰 교환 | 아님 |
| `figma` | 지원 | Figma Variables 개념에 맞춘 커스텀 collection/mode/variable JSON | 아님 |
| `figma-dtcg` | 지원 | Figma native DTCG import-ready 파일 또는 dark/light 번들 | 아님 |
| `figma-api` | 구현 | Figma REST API bulk write용 payload 생성 | `sync-figma`가 호출 |

`figma-api`는 Figma REST API의 `POST /v1/files/:file_key/variables`가 요구하는 `variableCollections`, `variableModes`, `variables`, mode별 값 payload를 생성한다. `duvu tokens sync-figma --file-key <key>`는 같은 payload를 검증한 뒤 Figma Variables REST API로 전송한다. 실제 반영은 Figma 인증 토큰, 파일 edit 권한, Enterprise/Full seat, `file_variables:write` scope 제약을 그대로 따른다. 토큰 값은 출력과 사용 로그에 남기지 않는다.

### Figma native import 계약

`duvu tokens export --format figma-dtcg`는 Figma Variables의 native DTCG import 제약에 맞춘다.

- `--mode dark|light` 지정 시 Figma에 바로 import할 단일 mode JSON을 출력한다.
- mode 생략 시 `duvu-<preset>-dark.tokens.json`, `duvu-<preset>-light.tokens.json` 번들을 출력한다.
- 지원 타입은 Figma import 가능 타입으로 제한한다: `color`, `dimension`, `fontFamily`, `duration`, `number`, `string`.
- `dimension` unit은 `px`만 사용한다.
- `duration` unit은 `s`만 사용한다.
- Figma name normalization 충돌을 막기 위해 중복 normalized name을 실패로 처리한다.
- alias는 같은 파일 안에서 해석 가능한 `{path.to.token}`만 허용한다.
- dark/light bundle은 Figma 다중 파일 import에서 누락되지 않도록 normalized name, `$type`, value shape parity를 하드 게이트로 검증한다.

## 커스텀 `--hex` 대비 보정 계약

`duvu tokens export --format dtcg --hex "#3182F6"`는 저장된 프리셋을 쓰지 않고 입력 HEX에서 `custom` 토큰 소스를 만든다.

- `deriveFromHex`로 hue/saturation 기반 dark/light `bg`, `surface`, `surface2`, `fg`, `fg2`, `fg3`를 만든다.
- `accent`는 입력 HEX를 기준으로 하되, `accent/bg` 3:1 미만이면 보정 또는 감사 실패 대상이다.
- `fg/bg`, `fg/surface`는 4.5:1 이상이어야 한다.
- 저장된 프리셋의 버튼/강조 텍스트는 `btnText`가 authoritative source다. `readableOnAccent`는 `--hex` 커스텀 입력 또는 `btnText` 누락 시 fallback으로만 사용한다.
- 필요하면 `action fill`을 별도로 보정해 `action/actionText` 4.5:1을 맞춘다. 원본 `accent`와 브랜드 전경색은 보존하고, 작은 텍스트 CTA에는 보정된 `action` 토큰을 쓴다.
- 커스텀 토큰도 `dtcg`, `figma`, `figma-dtcg`, `contract`, `audit`의 동일한 품질 게이트를 사용한다.

따라서 `--hex`는 임의 색상을 그대로 뿌리는 옵션이 아니라, 브랜드 색상을 DUVU의 접근성·Figma 교환·AI 생성 품질 계약 안으로 편입하는 입력 경로다.

## 생성 계약과 품질 점수

`duvu tokens contract`는 AI 에이전트가 UI를 생성하기 전에 따라야 하는 디자인 계약을 출력한다.

- 선택된 컬러/타이포/레이아웃/스타일/모션 프리셋
- 템플릿 `preview.cards`와 도메인 태그
- 전역 밸런스 계약(`journey`, `restraint`, `density`, `alignment`, `wrapping`, `surface separation`)과 viewport별 프로필
- aesthetic profile, direction, signature move, anti-pattern
- Primary CTA, placeholder, 중첩 카드, 장식용 효과에 대한 하드 룰
- `hierarchy`, `spacing`, `color`, `typography`, `responsive`, `motion`, `fidelity`, `restraint`, `aestheticDirection`, `memorability` 하위 점수
- 실제 생성 프롬프트

`duvu tokens score`는 22개 템플릿 전체를 같은 스키마로 평가한다. 93점 미만이거나 하드 룰 실패 이유가 있으면 non-zero로 종료하여 AI 슬롭 템플릿이 시스템에 남지 않게 한다. 특히 미학 방향이 없거나 기억에 남는 signature move가 약하면 템플릿은 통과하지 못한다.

### Aesthetic direction 계약

DUVU는 미감 생성 엔진이다. 따라서 `tokens contract`는 각 템플릿에 대해 먼저 하나의 미학 방향을 고정한다.

- `profile.id`: refined-saas, cinematic-dark, east-minimal, osmo-toolkit 같은 미학 계열
- `direction`: 색, 타이포, 여백, 모션이 따라야 하는 한 문장짜리 시각 방향
- `signatureMove`: 첫 화면에서 기억에 남아야 하는 구조적 장면
- `antiPattern`: 같은 계열에서 흔히 나오는 가짜 고급감, generic card grid, 장식 남발

AI 에이전트는 이 계약을 토큰보다 위의 장식 지시로 해석하면 안 된다. aesthetic direction은 토큰 선택과 배치의 상위 의도이며, 모든 색/간격/반경/모션은 여전히 DUVU 토큰 또는 alias에서 파생되어야 한다.

`duvu tokens lint`는 생성된 HTML/CSS 산출물을 검사한다. 사전 계약을 지켰는지 사후에 확인하기 위한 게이트이며, 다음을 실패로 본다.

- DUVU 토큰 참조가 없음
- placeholder/lorem/dummy 텍스트
- Primary CTA 후보 2개 이상
- `prefers-reduced-motion` 누락
- `font-size: vw` 직접 사용
- 16px 미만 텍스트 또는 타입 토큰 하한 위반
- 모바일 팔레트 2열
- 프리셋 칩 singleton 마지막 줄을 만드는 `flex-wrap`
- 모바일 탭 가로 스크롤/nowrap
- 코드 출력 탭 가로 스크롤/nowrap
- 코드/데이터 표면이 전역 `radius-sm`을 그대로 받아 pill 형태로 변형됨
- raw hex 색상 직접 사용
- raw px spacing/radius 직접 사용
- orb/blob/bokeh/glow 장식 흔적
- 중첩 카드 구조
- 버튼/인터랙션 요소가 있는데 44px 이상 `min-height` 근거가 없음

## A+ 토큰 엔진 포지셔닝

DUVU의 목표는 Figma 앱 자체를 대체하거나 자동 동기화를 과장하는 것이 아니다. 목표는 Figma native DTCG import, Figma REST API payload, AI 생성 계약, lint/audit를 하나의 토큰 엔진에서 연결해 디자인 토큰을 실제 산출물 품질 게이트로 쓰는 것이다.

현재 A+ 기준:

- DTCG 토큰 구조와 타입별 값 검증 통과
- alias 그래프 무결성 및 순환 참조 방지
- semantic dark/light parity 통과
- Figma DTCG dark/light import parity 통과
- 45개 컬러 프리셋 핵심 대비 감사 통과
- 22개 템플릿 생성 품질 A(93점) 이상
- 17개 컴포넌트, 7개 인터랙션 패턴, AI 슬롭 방지 규칙 포함

이 기준은 AI가 흔히 만드는 placeholder, raw hex/px, Primary CTA 과다, 장식용 glow/blob, 중첩 카드, 얕은 타이포 계층, 모바일 잘림, 프리셋 singleton 마지막 줄을 실패로 처리한다.

## 1. 색상 토큰 (Color)

| 토큰 | 역할 | 다크 모드 예시 | 라이트 모드 예시 |
|---|---|---|---|
| `--duvu-bg` | 최상위 배경 | `#08080b` | `#f2f1ee` |
| `--duvu-surface` | 카드/컨테이너 배경 | `#111115` | `#ffffff` |
| `--duvu-surface2` | 보조 표면 (입력 필드 등) | `#1b1b20` | `#e8e7e4` |
| `--duvu-fg` | 기본 텍스트 (WCAG 4.5:1 필수) | `#eaeaf0` | `#0c0c11` |
| `--duvu-fg2` | 보조 텍스트 | `#848490` | `#52525c` |
| `--duvu-fg3` | 비활성/플레이스홀더 | `#525258` | `#9e9ea6` |
| `--duvu-accent` | 주요 액센트 (CTA, 링크) | `#3182F6` | `#3182F6` |
| `--duvu-accent-rgb` | accent의 RGB 분해 | `49, 130, 246` | `49, 130, 246` |
| `--duvu-btn-text` | accent 위의 텍스트 | `#ffffff` | `#ffffff` |

### 색상 도출 알고리즘 (deriveTheme)

소스 색상 1개(accent)에서 전체 팔레트를 자동 도출:

```
입력: sourceHex (예: #3182F6)
→ [h, s] = hexToHSL(sourceHex)
→ bgSat = min(s, 15)

다크 모드:
  bg:       hsl(h, bgSat, 4.5%)
  fg:       hsl(h, 5%, 92%)
  fg2:      hsl(h, 5%, 54%)
  fg3:      hsl(h, 4%, 33%)
  surface:  hsl(h, bgSat, 7.5%)
  surface2: hsl(h, bgSat, 12%)

라이트 모드:
  bg:       hsl(h, min(s, 10), 96%)
  fg:       hsl(h, 8%, 6%)
  fg2:      hsl(h, 6%, 40%)
  fg3:      hsl(h, 4%, 62%)
  surface:  #ffffff
  surface2: hsl(h, min(s, 12), 93%)
```

일부 프리셋은 이 자동 도출값을 override하여 브랜드 정체성을 유지한다 (예: GitHub dark bg = #0d1117).

### 대비 자동 보정 (ensureContrast)

accent가 bg 대비 3:1 미만이면 자동으로 밝기를 조정한다:
- 어두운 bg → accent 밝기를 올림 (1.5% 단위)
- 밝은 bg → accent 밝기를 내림 (1.5% 단위)

## 2. 타이포그래피 토큰

| 토큰 | 역할 | 기본값 |
|---|---|---|
| `--duvu-font` | 기본 폰트 패밀리 | `'Inter', sans-serif` |
| `--duvu-font-code` | 코드 폰트 | `'JetBrains Mono', monospace` |

### 타이포 스케일 (MD3 기반)

| 용도 | CSS 크기 | 줄높이 | 두께 |
|---|---|---|---|
| Display Large | 57px | 1.12 | 400 |
| Display Medium | 45px | 1.16 | 400 |
| Display Small | 36px | 1.22 | 400 |
| Headline Large | 32px | 1.25 | 400 |
| Headline Medium | 28px | 1.29 | 400 |
| Headline Small | 24px | 1.33 | 400 |
| Title Large | 22px | 1.27 | 500 |
| Title Medium | 16px | 1.5 | 500 |
| Title Small | 15px | 1.43 | 500 |
| Body Large | 16px | 1.5 | 400 |
| Body Medium | 16px | 1.43 | 400 |
| Body Small | 15px | 1.4 | 400 |
| Label Large | 16px | 1.43 | 500 |
| Label Medium | 15px | 1.4 | 500 |
| Label Small | 15px | 1.4 | 500 |

**DUVU 생성 UI 운영 하한: 16px. 본문 최소 17px.** MD3 원본 스케일의 11~14px 레이블은 Figma/플랫폼 참조값으로만 취급하고, 실제 생성 산출물에서는 `--duvu-font-size-xs` 16px, `--duvu-font-size-sm` 16px, `--duvu-font-size-base` 17px 하한으로 정규화한다.

### 한국어 폰트 규칙

- 기본: Pretendard (안전하고 깔끔)
- 한국어 콘텐츠가 있으면 반드시 Pretendard를 fallback에 포함
- `font-family: 'Inter', 'Pretendard', sans-serif`

## 3. 간격 토큰 (Spacing)

| 토큰 | 값 | 용도 |
|---|---|---|
| `--duvu-space-xs` | 4px | 인라인 요소 간격 |
| `--duvu-space-sm` | 8px | 밀접한 요소 간격 |
| `--duvu-space-md` | 16px | 기본 간격 |
| `--duvu-space-lg` | 24px | 섹션 내 간격 |
| `--duvu-space-xl` | 32px | 섹션 간 간격 |
| `--duvu-space-2xl` | 48px | 대형 섹션 간격 |
| `--duvu-space-3xl` | 64px | 페이지 레벨 간격 |

### 레이아웃 레벨 토큰 (presets.json layout_tokens)

| 토큰 | 기본값 | 역할 |
|---|---|---|
| `--duvu-space-hero` | 160px | 히어로 섹션 상단 여백 |
| `--duvu-space-section` | 96px | 섹션 간 여백 |
| `--duvu-space-title-margin` | 48px | 제목 하단 여백 |
| `--duvu-space-subtitle-margin` | 40px | 부제목 하단 여백 |
| `--duvu-space-stats-gap` | 64px | 통계 그룹 간 간격 |
| `--duvu-space-stat-label-gap` | 4px | 통계 숫자-라벨 간격 |

이 토큰들은 `presets.json`의 `layout_tokens` 객체에 정의되며, 데모가 JS로 읽어서 CSS 변수로 적용한다.

**레이아웃 프리셋에 따른 배율:**
- Compact: ×0.75
- Comfortable: ×1 (기본)
- Spacious: ×1.25
- Dense: ×0.6

## 4. 모양 토큰 (Shape/Radius)

| 토큰 | 역할 | 기본값 |
|---|---|---|
| `--duvu-radius-xs` | 작은 요소 (뱃지, 태그) | 6px |
| `--duvu-radius-sm` | 입력 필드, 작은 버튼 | 10px |
| `--duvu-radius-md` | 버튼, 드롭다운 | 10px |
| `--duvu-radius-lg` | 카드, 모달 | 16px |
| `--duvu-radius-full` | 완전 라운드 (pill) | 9999px |
| `--duvu-btn-radius` | 버튼 전용 | 10px |
| `--duvu-card-radius` | 카드 전용 | 16px |

**스타일 프리셋에 따른 변동:**
- Rounded: 16px / Soft: 24px / Sharp: 4px / Pill: 100px / Flat: 8px / Brutalist: 0px

## 5. 엘리베이션 토큰 (Shadow)

| 토큰 | 값 |
|---|---|
| `--duvu-card-shadow` (none) | `none` |
| `--duvu-card-shadow` (sm) | `0 1px 2px rgba(0,0,0,0.06)` |
| `--duvu-card-shadow` (md) | `0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)` |
| `--duvu-card-shadow` (lg) | `0 4px 16px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.06)` |

## 6. 모션 토큰

| 토큰 | 역할 | 기본값 |
|---|---|---|
| `--duvu-dur` | 기본 지속시간 | 0.4s |
| `--duvu-dur-fast` | 빠른 전환 | 0.2s |
| `--duvu-dur-slow` | 느린 전환 | 0.7s |
| `--duvu-ease` | 기본 이징 | cubic-bezier(0.16, 1, 0.3, 1) |
| `--duvu-ease-spring` | 스프링 이징 | cubic-bezier(0.34, 1.56, 0.64, 1) |
| `--duvu-ease-std` | 표준 이징 | cubic-bezier(0.4, 0, 0.2, 1) |
| `--duvu-motion-scale` | 모션 스케일 (0~2) | 1 |

**`prefers-reduced-motion: reduce` 시 모든 모션을 0으로.**

## 7. 강조 계층 토큰 (Emphasis Hierarchy)

| 토큰 | 역할 |
|---|---|
| `--duvu-emphasis-1-bg` | 최고 강조 (Primary CTA) — accent 색상 |
| `--duvu-emphasis-1-text` | Primary CTA 텍스트 |
| `--duvu-emphasis-2-bg` | 중간 강조 (Secondary) — surface2 |
| `--duvu-emphasis-2-text` | Secondary 텍스트 |
| `--duvu-emphasis-3-bg` | 최저 강조 (Ghost) — transparent |
| `--duvu-emphasis-3-text` | Ghost 텍스트 |

**규칙: 화면에 Primary CTA는 1개만. 나머지는 Secondary/Ghost.**

## 8. 그라디언트 토큰

| 토큰 | 역할 |
|---|---|
| `--duvu-gradient-bg` | 배경 그라디언트 (radial-gradient) |
| `--duvu-gradient-card` | 카드 배경 그라디언트 |

9개 그라디언트 프리셋 중 선택. 기본값은 `none`.

## 9. 시맨틱 토큰

| 토큰 | 역할 |
|---|---|
| `--duvu-success` | 성공 상태 (#2A9D8F 계열) |
| `--duvu-warning` | 경고 상태 (#F4A261 계열) |
| `--duvu-error` | 오류 상태 (#E76F51 계열) |
| `--duvu-info` | 정보 상태 (accent와 동일) |

## 10. 인터랙션 토큰

| 토큰 | 역할 |
|---|---|
| `--duvu-hover-lift` | 호버 시 Y 이동 | -2px |
| `--duvu-active-scale` | 클릭 시 스케일 | 0.97 |
| `--duvu-focus-ring` | 포커스 링 스타일 | 0 0 0 2px accent |
