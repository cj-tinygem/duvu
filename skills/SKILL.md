---
name: duvu
description: "DUVU 범용 디자인 시스템 엔진. UI/프론트엔드 코드 생성 시 자동 발동. 소스 색상 하나에서 WCAG AA/HIG/MD3를 동시 준수하는 완전한 디자인 토큰을 도출하고, 43개 컬러 프리셋 × 11개 타이포 × 4개 레이아웃 × 8개 스타일 × 6개 모션 × 9개 그라디언트 × 17개 컴포넌트 × 7개 인터랙션 패턴을 조합하여 CSS, Tailwind, Flutter, SwiftUI, Compose, Unity, React Native 코드를 즉시 출력한다. 22개 종합 템플릿과 15개 도메인 매칭으로 SaaS부터 럭셔리까지 모든 도메인을 커버한다. Use when: UI 디자인, 프론트엔드 코드 생성, 디자인 시스템 적용, 컬러/타이포/레이아웃 결정, 디자인 토큰 생성, 컴포넌트 코드 작성, 페이지 레이아웃 구성."
---

# DUVU — 범용 디자인 시스템 엔진

> 하나의 결정이 시스템을 만든다.

## 이 스킬의 역할

이 스킬이 발동되면, **모든 UI/프론트엔드 코드 생성**은 이 시스템을 따른다.
사용자는 요구사항만 말한다. 나머지는 이 스킬이 자동으로 처리한다.

**절대 규칙**: 이 스킬이 로드된 상태에서는 어떤 UI 코드도 DUVU 토큰 체계 밖의 값을 사용하지 않는다. 모든 색상, 간격, 반경, 모션, 타이포는 `--duvu-` 접두사 토큰에서 파생된다.

### DUVU 데이터의 3가지 성격

| 성격 | 예시 | AI의 역할 |
|------|------|---------|
| **강제** (바닥) | `duvu audit` (WCAG/HIG/MD3), 토큰 체계 | 반드시 따른다. 위반 불가. |
| **맥락** (판단 재료) | `intent`, `meaning`, `why`, `page_patterns` | 읽고 이해하되, 상황에 따라 다르게 적용할 수 있다. |
| **추천** (가이드) | `harmonizes_with`, `tone`, `mood`, `domains` | 참고하되, 의도적으로 다른 선택을 할 수 있다. 파격도 유효하다. |

AI가 발전할수록 **맥락과 추천을 더 잘 해석**하여 더 좋은 디자인을 만든다. DUVU는 바닥을 보장하되 천장을 열어둔 시스템이다.

---

## 디자인 철학 (6원칙)

1. **비움의 미학** — 디자인을 잘 한다는 것은 '채우는 것'이 아니라 '비우는 것'이다. "이게 없으면 안 되나?"를 모든 요소에 묻는다.
2. **의도 있는 결정** — 아주 사소한 단 하나의 값(padding 1px, opacity 0.01)에도 방어 가능한 근거가 있어야 한다. 의도 없는 편집은 금지다.
3. **과감한 3요소** — 과감한 배치(비대칭, 크기 대비), 과감한 강조(Primary CTA 단 1개), 과감한 생략(불필요한 것 제거).
4. **절제** — 테두리/아웃라인은 절대적으로 필요한 경우에만. 장식이 아닌 의미만. 그라디언트, 그림자도 마찬가지.
5. **조화** — 모든 요소의 상호작용을 고려한다. 통일, 균형, 조화. 색상 온도, 타이포 성격, 모션 강도가 하나의 톤을 이룬다.
6. **아름다움 우선** — 아름다움은 첫 번째 관문이다. 기능은 아름다움을 통과한 후에 평가된다.

---

## 컴플라이언스 (비타협 — 3중 준수)

모든 출력은 다음 세 가지를 **동시에** 만족해야 한다:

| 표준 | 핵심 요구 | DUVU 구현 |
|---|---|---|
| **WCAG 2.1 AA** | 본문 4.5:1, 대형 텍스트 3:1, 색상만으로 정보 전달 금지 | `ensureContrast()` 자동 보정, `readableOnAccent()` |
| **Apple HIG** | 터치 타겟 44×44pt, 시스템 색상 역할 매핑, Reduce Motion 존중 | min-height: 44px 강제, `--duvu-` 역할 토큰 |
| **Material Design 3** | 엘리베이션 계층, 15종 타이포 스케일, 동적 컬러, 상태 레이어 | shadow 토큰, MD3 텍스트 스케일, `deriveTheme()` |

상세 알고리즘은 `references/compliance.md` 참조.

---

## 아키텍처

```
사용자 요구사항
    ↓ [1단계: 분석]
도메인/분위기/플랫폼 추출
    ↓ [2단계: 프리셋 선택]
컬러 + 타이포 + 레이아웃 + 스타일 + 모션 조합 (presets.json)
    ↓ [3단계: 토큰 생성]
--duvu-* CSS 변수 풀 세트 (references/tokens.md)
    ↓ [4단계: 코드 출력]
타겟 플랫폼 코드 (references/platforms.md)
    ↓ [5단계: 검증]
WCAG/HIG/MD3 자동 체크 (references/compliance.md)
```

---

## 실행 프로토콜

### 1단계: 요구사항 분석

사용자 요구사항에서 다음을 추출한다:

| 항목 | 설명 | 기본값 |
|---|---|---|
| 도메인 | SaaS, 금융, 헬스, 커머스, 포트폴리오, 소셜 등 | 범용 |
| 분위기 | 전문적, 따뜻한, 차가운, 활기찬, 고급스러운 등 | 전문적 |
| 플랫폼 | CSS, Tailwind, Flutter, SwiftUI, Compose, Unity | CSS |
| 테마 | 다크/라이트/둘 다 | 둘 다 |

**분위기가 명시되지 않으면 도메인에서 추론한다.**

**페이지 흐름**: `presets.json`의 `page_patterns`에 도메인별 페이지 구조가 정의되어 있다. 각 패턴에 `flow`(섹션 순서), `why`(이 순서인 이유), `intent`(전체 목적)가 있다. 페이지를 구성할 때 반드시 참조하라.

예: SaaS → hero → social-proof → features → pricing → cta (why: "스크롤할수록 확신이 쌓이는 구조")

**조합 근거**: layout 프리셋의 `harmonizes_with.why`에 "왜 이 style/motion과 어울리는가"의 근거가 있다. 조합을 결정할 때 근거를 읽고 맥락에 맞는지 판단하라.

### 2단계: 프리셋 선택

`presets.json`에서 자동 매칭한다. 매칭 우선순위:

1. 사용자가 특정 프리셋 이름을 지정하면 그것을 사용
2. 사용자가 색상 hex를 지정하면 `deriveTheme()`으로 커스텀 생성
3. 도메인/분위기에 따른 자동 매칭 테이블:

| 도메인 | 추천 컬러 | 추천 타이포 | 추천 스타일 |
|---|---|---|---|
| SaaS/B2B | toss, linear, vercel | inter, pretendard | rounded, sharp |
| 금융/핀테크 | stripe, navy-depth | sora, inter | rounded |
| 커머스 | airbnb, coral-red | plus-jakarta | rounded, pill |
| 포트폴리오 | vercel, midnight | space-grotesk, satoshi | sharp, flat |
| 헬스/웰니스 | ocean-pearl, sage-green | outfit, manrope | soft, rounded |
| 럭셔리 | black-gold, earth | general-sans | soft |
| 크리에이티브 | figma, deep-purple | satoshi | pill, neo |
| 개발자 도구 | github, linear | space-grotesk | sharp, flat |
| 에디토리얼 | sunset, warm-coral | dm-sans | soft |
| 소셜 | indigo-bloom, spotify | plus-jakarta | pill |

또는 22개 종합 템플릿(`references/templates.md`) 중 하나를 바로 적용할 수 있다.

**도메인 + 톤 매칭**: `duvu match <domain> [--tone warm|cool|neutral]`

지원 도메인 (15개): `saas`, `fintech`, `ecommerce`, `portfolio`, `health`, `luxury`, `creative`, `dev`, `editorial`, `social`, `nature`, `education`, `gaming`, `enterprise`, `dashboard`

톤 (3종): `warm`(따뜻한 — 빨강, 주황, 노랑 계열), `cool`(차가운 — 파랑, 보라, 청록 계열), `neutral`(중성적 — 회색, 녹색 계열)

```
→ duvu match fintech --tone cool
컬러: toss (cool), stripe (cool), royal (cool), navy-depth (cool)
타이포: inter (중성적, 범용), sora (기하학적 모던)
레이아웃: compact (밀도 높은, 효율적)
스타일: rounded (친근하고 안정적)
모션: subtle (은은, 전문적)
```

**조화 메타데이터**: 모든 프리셋에 AI가 조합을 판단할 수 있는 메타데이터가 있다:
- **컬러**: `domains`(용도) + `tone`(warm/cool/neutral) — 감성 방향
- **타이포**: `domains` + `mood`(감성 설명) — "기술적, 코드 친화", "둥글고 친근" 등
- **레이아웃**: `domains` + `mood` — "밀도 높은, 효율적", "여유로운, 호흡 넓은" 등
- **스타일**: `domains` + `mood` — "친근하고 안정적", "정밀하고 전문적" 등
- **모션**: `domains` + `mood` — "은은, 전문적", "활발하고 역동적" 등

**조화 원칙**: 같은 도메인 + 같은 톤에서 선택하면 자동으로 조화됨. 의도적 대비를 원하면 톤을 교차할 수 있음.

### 2.5단계: 컴포넌트 선택

`presets.json`의 `components` 배열(17종)과 각 템플릿의 `preview` 필드를 참조하여, 도메인에 적합한 컴포넌트 조합을 결정한다.

| 컴포넌트 | 용도 | 적합 도메인 |
|---|---|---|
| metric | KPI/통계 카드 | SaaS, 대시보드, 핀테크 |
| buttons | 버튼/폼 | 범용 |
| table | 데이터 테이블 | SaaS, 대시보드, 개발 |
| article | 아티클/블로그 | 에디토리얼, 블로그 |
| hero | 히어로 섹션 | 랜딩, 럭셔리, 커머스 |
| gallery | 이미지 그리드 | 포트폴리오, 크리에이티브 |
| code | 코드 블록 | 개발 도구 |
| chat | 채팅 UI | 소셜, 메신저 |
| wellness | 건강/활동 | 헬스, 웰니스 |
| product | 상품 카드 | 커머스 |
| stat-row | 통계 나열 | 범용 |
| quote | 인용구 | 에디토리얼, 럭셔리 |
| task-list | 체크리스트 | SaaS, 개발 |
| profile | 프로필 | 소셜 |
| marquee | 스크롤 텍스트 | 크리에이티브, 럭셔리 |
| nav-bar | 네비게이션 바 | 범용 |
| divider | 구분선 | 범용 |

CLI: `duvu list component`, `duvu show component <id>`, `duvu match <domain>`

### 2.7단계: 인터랙션 패턴 선택

동적 UI 패턴이 필요한 경우 `presets.json`의 `interaction_patterns`(7종)에서 선택한다.

| 패턴 | 용도 | 적합 도메인 |
|---|---|---|
| carousel | 수평 슬라이드 순차 표시 | 커머스, 랜딩, 포트폴리오 |
| masonry | 불균일 높이 다단 배치 | 포트폴리오, 크리에이티브, 소셜 |
| infinite-scroll | 스크롤 시 콘텐츠 추가 | 소셜, 에디토리얼, 피드 |
| sticky | 스크롤 시 요소 고정 | SaaS, 대시보드, 커머스 |
| lazy-load | 뷰포트 진입 시 로드 | 이미지 많은 모든 도메인 |
| tabs | 같은 영역 콘텐츠 전환 | SaaS, 대시보드, 개발 |
| modal | 오버레이 대화상자 | 범용 |

각 패턴에 `intent`(왜 이 패턴인가), `meaning`(사용자에게 무슨 뜻인가), `responsive`(반응형 전환), `accessibility`(접근성 요구) 정보가 있다. Intent Engine의 차원과 동일하게, "왜 carousel인가? masonry가 아니라?"를 판단하라.

CLI: `duvu list interaction`, `duvu show interaction <id>`

### 3단계: 토큰 생성

선택된 프리셋에서 디자인 토큰을 생성한다. **모든 토큰은 `--duvu-` 접두사를 사용.**

`presets.json`에서 프리셋의 사전 계산된 값을 직접 사용한다. 각 컬러 프리셋에는 dark/light 양쪽 모두 bg, fg, fg2, fg3, surface, surface2, accent, accent-rgb 값이 포함되어 있다.

토큰 카테고리 (10개):
1. **색상** — bg, surface, surface2, fg, fg2, fg3, accent, accent-rgb, btn-text
2. **타이포** — font, font-code + MD3 15종 스케일
3. **간격** — space-xs(4) ~ space-3xl(64), 레이아웃 배율 적용
4. **모양** — radius-xs(6) ~ radius-full(9999), 스타일 프리셋 적용
5. **엘리베이션** — card-shadow (none/sm/md/lg)
6. **모션** — dur, dur-fast, dur-slow, ease, ease-spring, ease-std, motion-scale
7. **강조 계층** — emphasis-1(Primary), emphasis-2(Secondary), emphasis-3(Ghost)
8. **그라디언트** — gradient-bg, gradient-card
9. **시맨틱** — success, warning, error, info
10. **인터랙션** — hover-lift, active-scale, focus-ring

상세 정의는 `references/tokens.md` 참조.

### 3.5단계: 반응형 설계 (필수)

모든 UI 출력은 **모든 화면비에서 동작**해야 한다. DUVU가 생성하는 CSS에는 반응형 유틸리티가 포함된다:

**브레이크포인트 (layout_tokens)**:
- `--duvu-bp-mobile`: 640px
- `--duvu-bp-tablet`: 768px
- `--duvu-bp-desktop`: 1024px
- `--duvu-bp-wide`: 1440px

**반응형 원칙:**
- 타이포: `clamp(최소, 뷰포트비율, 최대)` 사용 — 모든 화면에서 자동 스케일
- 그리드: 4열(데스크톱) → 2열(태블릿) → 1열(모바일) 자동 전환
- 컨테이너: `max-width: 1440px` + `padding: clamp(16px, 3vw, 24px)`
- 터치 타겟: 데스크톱 44px → 모바일 48px (더 큰 손가락 대응)
- 이미지: `width: 100%; height: auto;` 기본
- 줄바꿈: `text_system` 참조 — `text-wrap: balance` + `max-width` 토큰으로 의도적 줄바꿈 제어
- 콘텐츠 생략: `responsive_system` 참조 — 컴포넌트 `level`에 따라 생략 가능 여부 결정. level 1-2만 모바일에서 생략 가능
- Orphan 방지: 그리드 열 변환 시 마지막 줄에 1개만 남지 않도록. `duvu audit`이 자동 검사

**CSS 출력에 포함되는 유틸리티:**
- `.duvu-container` — 반응형 컨테이너
- `.duvu-grid-2/3/4` — 자동 반응형 그리드
- `.duvu-title/subtitle/body` — 유동 타이포
- `.duvu-btn/input` — 터치 타겟 보장

### 4단계: 코드 출력

타겟 플랫폼에 맞는 코드를 생성한다. `references/platforms.md`에서 플랫폼별 전체 코드 템플릿을 참조한다.

**지원 플랫폼 7개:**
- CSS (기본) — `:root` 변수 + 컴포넌트 클래스
- Tailwind CSS — `tailwind.config.js` + CSS 변수 브리지
- Flutter — `DuvuTheme.generate()` + ThemeData
- SwiftUI — `DuvuTheme` struct + 컴포넌트 View
- Jetpack Compose — `DuvuTheme` object + Composable
- Unity C# — `DuvuTheme` ScriptableObject
- React Native — `StyleSheet` + DuvuTheme 객체

> **범용성**: 프리셋 데이터는 플랫폼 중립적(hex, px)으로 저장되므로, 위 7개 외의 플랫폼(React/Next.js는 CSS/Tailwind 사용, Android XML은 Compose 참조)으로도 변환 가능.

### 5단계: 자동 검증 (출력 전 필수)

코드 생성 후, 출력하기 전에 다음을 반드시 확인한다:

- [ ] 모든 색상이 `--duvu-` 토큰에서 파생되었는가?
- [ ] 모든 spacing이 토큰에서 파생되었는가? (매직 넘버 금지)
- [ ] fg vs bg 대비 4.5:1 이상인가?
- [ ] accent vs bg 대비 3:1 이상인가?
- [ ] 모든 터치 타겟이 44px 이상인가?
- [ ] 불필요한 테두리/보더가 없는가? (ZERO borders)
- [ ] Primary CTA가 화면에 1개뿐인가?
- [ ] 다크/라이트 모드 둘 다 작동하는가?
- [ ] `prefers-reduced-motion` 지원하는가?
- [ ] 모든 결정에 방어 가능한 의도가 있는가?
- [ ] 같은 레벨의 요소는 같은 주목도를 가지는가?
- [ ] 레이아웃의 그리드에 orphan(빈 칸)이 없는가?
- [ ] 컴포넌트 간 통일성이 유지되는가? (같은 padding/radius/shadow)
- [ ] **5개 화면비에서 모두 정상인가?** (와이드 1920, 데스크톱 1440, 태블릿 가로 1024, 태블릿 세로 768, 모바일 390) — `duvu screenshot`이 기본으로 5개 전부 캡처
- [ ] 불통일이 있다면 그것은 의도된 것인가?
- [ ] 텍스트 줄바꿈이 의도적인가? (`text_system` 참조 — PC 1줄→모바일 2줄은 자연, 역전은 근거 필요)
- [ ] 모바일에서 숨겨진 요소가 있다면 의도적 생략인가? (level 낮은 보조 정보만 생략 가능)

검증 완료 후, 이번 설계 결정을 기록한다:
```bash
duvu log '{"type":"decision","domain":"<도메인>","presets":{"color":"<id>","typo":"<id>","layout":"<id>","style":"<id>","motion":"<id>"},"intent":"<선택 근거>"}'
```
결과물 평가도 기록한다 (`good`/`ok`/`poor`, issues 배열):
```bash
duvu log '{"type":"eval","quality":"good","issues":[]}'
```

### Intent Engine — 모든 디자인 결정의 "왜"

**의도(Intent)**: 설계자가 "왜 이렇게 만들었는가"
**의미(Meaning)**: 사용자가 "이것이 무엇을 뜻하는가"

모든 요소를 배치할 때, 아래 **18개 차원**에서 "왜 이 값인가?"를 판단하라. 해당 요소에 관련된 차원만 확인하면 된다.

| 차원 | 질문 | 판단 기준 |
|------|------|---------|
| **곡률** | 왜 이 radius인가? | restraint 수준. 프리미엄=크게, 데이터=작게. 주변과 일관. |
| **레벨** | 이 요소의 주목도 순위는? | 컴포넌트 `level` 1-5. 높을수록 크고 무겁게. |
| **계층** | 부모/형제 속에서 역할은? | 같은 level이면 같은 무게. 다르면 크기/색상으로 차이. |
| **레이어** | 시각적으로 어느 층인가? | bg < surface < surface2 < accent. 앞으로 올수록 강조. |
| **위치** | 왜 여기에 배치했는가? | `page_patterns`의 flow. 시선 흐름(좌→우, 상→하). |
| **관계** | 주변 요소와 어떤 관계인가? | 근접=같은 그룹, 떨어짐=다른 그룹. 간격이 관계를 정의. |
| **크기** | 왜 이 크기인가? | level에 비례. 가장 중요한 것이 가장 크다. |
| **주목도** | 사용자가 이것을 몇 번째로 볼까? | CTA=첫째, 보조텍스트=마지막. 색상/크기/위치로 조절. |
| **통일** | 같은 역할과 일관적인가? | 같은 level 카드는 같은 padding/radius/shadow. |
| **균형** | 화면 전체에서 무게가 치우치지 않나? | 좌우/상하 시각적 무게. 의도적 불균형은 유효. |
| **정렬** | 보이지 않는 기준선에 맞췄나? | CRAP Alignment. 그리드 정렬. |
| **대비** | 중요한 것이 충분히 다른가? | CRAP Contrast. 제목/본문 크기 비 1.5배+. |
| **색상** | 왜 이 색인가? | 역할(bg/fg/accent). tone(warm/cool/neutral). |
| **여백** | 왜 이 간격인가? | restraint 수준. 여백=호흡. 프리미엄=넓게. |
| **간격** | 요소 간 거리가 관계를 표현하는가? | 근접성 원칙. 같은 그룹 내 < 그룹 간. |
| **순서** | 왜 이 순서인가? | `page_patterns`. 중요도순 or 사용자 여정순. |
| **선/경계** | 이 선이 정말 필요한가? | `border_system` 참조. 여백→색차→그림자→선 순서. 선은 최후 수단. |
| **줄바꿈** | 이 텍스트의 줄바꿈이 의도적인가? | `text_system` 참조. PC 1줄→모바일 2줄은 자연. 역전은 근거 필요. text-wrap: balance + max-width 토큰으로 제어. |

**사용법**: "이 버튼은 왜 이 크기인가?" → level 5이므로 가장 크게. "이 여백은 왜 넓은가?" → restraint: high. 매번 18개를 전부 묻는 것이 아니라, **해당 결정에 관련된 차원만** 확인.

**시스템 데이터 참조**: 컴포넌트 `intent`/`meaning`/`level`, layout `restraint`/`harmonizes_with.why`, `page_patterns.flow`/`why`, `text_system`(줄바꿈), `border_system`(선)

단순함은 출발점이 아니라 **도착점**이다. 모든 차원에서 의도를 부여한 결과로 불필요한 것이 제거된다. 아름다움 자체도, 의도적 불균형도 유효한 의도다.

하나라도 실패하면 수정 후 재출력.

---

## 레퍼런스 파일 (필독)

| 파일 | 용도 | 언제 읽나 |
|---|---|---|
| `presets.json` | 43 컬러 + 11 타이포 + 4 레이아웃 + 8 스타일 + 6 모션 + 9 그라디언트 + 17 컴포넌트 + 22 템플릿. 각 템플릿에 `preview` 필드(layout + cards)가 있어 도메인별 컴포넌트 조합을 알 수 있다. `layout_tokens`로 49개 레이아웃 토큰 정의. CLI: `duvu list`, `duvu show <type> <id>`, `duvu match <domain>` | **항상** (프리셋 데이터 조회) |
| `references/tokens.md` | 10개 카테고리 디자인 토큰 정의 | **항상** (토큰 구조 참조) |
| `references/platforms.md` | 7개 플랫폼 코드 생성 템플릿 (CSS, Tailwind, Flutter, SwiftUI, Compose, Unity, React Native) | 코드 생성 시 |
| `references/templates.md` | 22개 종합 템플릿 정의 (도메인별 최적 조합) | 템플릿 매칭 시 |
| `references/rules.md` | 디자인 규칙, 금지사항, 품질 기준, 자가 평가 체크리스트 | **항상** (품질 검증) |
| `references/compliance.md` | WCAG/HIG/MD3 준수 가이드, 알고리즘 (ensureContrast, readableOnAccent, 상태 레이어) | 접근성 검증 시 |
| `references/color-system.md` | 색상 도출 알고리즘 (deriveTheme, ensureContrast, readableOnAccent, colorHarmonyAudit) | 커스텀 색상 도출 시 |
| `references/components.md` | 17개 핵심 컴포넌트 패턴 (Button, Card, Input, Nav 등) | 컴포넌트 코드 작성 시 |
| `references/layouts.md` | 8개 페이지 레이아웃 패턴 (Dashboard, Landing, Form 등) | 페이지 구성 시 |

---

## 빠른 시작 예시

### 예시 1: "SaaS 대시보드 만들어줘. 다크 모드. 파란 계열."

```
→ 분석: 도메인=SaaS, 분위기=전문적, 테마=다크, 색감=파란
→ 프리셋: 컬러=toss(#3182F6), 타이포=inter, 레이아웃=compact, 스타일=rounded(16px), 모션=smooth
→ 토큰: --duvu-bg: #08080b, --duvu-accent: #3182f6, --duvu-font: 'Inter', 'Pretendard', sans-serif ...
→ 코드: CSS 변수 + .duvu-card, .duvu-btn, .duvu-input 컴포넌트 + 대시보드 레이아웃
→ 검증: WCAG ✓ (fg/bg 16.6:1), HIG ✓ (44px targets), MD3 ✓ (상태 레이어)
```

### 예시 2: "Flutter 앱, 금융 서비스, 보라색 느낌으로"

```
→ 분석: 도메인=핀테크, 플랫폼=Flutter, 색감=보라
→ 프리셋: 컬러=stripe(#635BFF), 타이포=sora, 레이아웃=comfortable, 스타일=rounded(16px), 모션=smooth
→ 토큰: Flutter Color/TextStyle 객체로 변환
→ 코드: DuvuTheme.generate(accent: Color(0xFF635BFF), ...) + ThemeData
→ 검증: WCAG ✓, HIG ✓, MD3 ✓
```

### 예시 3: 커스텀 색상 "#FF6B35"로 랜딩 페이지

```
→ 분석: 커스텀 hex, 도메인=미지정
→ 색상 도출: deriveTheme('#FF6B35') → 전체 다크/라이트 팔레트 자동 생성
→ 대비 보정: ensureContrast() → 라이트 모드에서 accent 밝기 조정
→ 버튼 텍스트: readableOnAccent('#FF6B35') → #ffffff
→ 코드 출력 + 검증
```

---

## 금지사항 (NEVER)

- ❌ 의미 없는 테두리/아웃라인/보더 (ZERO borders unless absolutely necessary)
- ❌ `--duvu-` 접두사 없는 임의 CSS 변수
- ❌ 시스템 외부 매직 넘버 (spacing, radius, color 등)
- ❌ 하드코딩 색상값 (반드시 토큰 변수)
- ❌ placeholder 이미지, lorem ipsum (한국어 실제 콘텐츠)
- ❌ WCAG 대비 미달 색상 조합
- ❌ 44px 미만 터치 타겟
- ❌ 동시에 3개 이상 폰트, 4개 이상 웨이트
- ❌ 12px 미만 텍스트
- ❌ 의도 없는 편집 (모든 변경에 WHY 필수)
- ❌ 장식용 모션, 그라디언트, 그림자
- ❌ `prefers-reduced-motion` 미지원
- ❌ Primary CTA 복수 배치

---

## 한국어 규칙

- 기본 한글 폰트: **Pretendard** (안전하고 깔끔)
- 한국어 콘텐츠가 있으면 반드시 Pretendard를 fallback에 포함
- 예: `font-family: 'Inter', 'Pretendard', sans-serif`
- UI 텍스트는 한국어 사용 (placeholder, label 등)

---

## 품질 기준 (gold standard)

| 참조 사이트 | 배울 점 |
|---|---|
| osmo.supply | 모션, 레이아웃, 전체 완성도 (최고 기준) |
| godly.website | 비주얼 임팩트 |
| bestawards.co.nz | 종합 품질 |
| framer.com/gallery | 타이포그래피 |
| gdweb.co.kr | 한국 트렌드 |
| Awwwards, Dribbble, Behance | 글로벌 트렌드 |

**자기 평가 기준**: 위 사이트들과 나란히 놓았을 때 어색하지 않은 수준이 최소 기준.

---

## 클론 재창조 프로토콜

Picasso로 캡처한 클론의 스타일을 재현하여 새 UI를 만들 때:

1. **클론 확인**: `duvu show clone <id>` → 추상 토큰 (색상, 폰트, 모션, 레이아웃 프리셋)
2. **아카이브 참조**: `duvu show clone <id>`의 `archive` 필드 확인. `archive.available=true`일 때만 `archive.localPath`의 로컬 Picasso HTML/CSS를 직접 읽고, `archive.status="metadata-only"`이면 추출 토큰(`extractedTokens`)과 템플릿 메타데이터(`presetId`)만 사용
3. **인터랙션 패턴**: 아카이브에서 사용된 동적 패턴(carousel, masonry 등)을 식별하여 `interaction_patterns`에서 매칭
4. **조합**: DUVU 토큰(시스템) + 아카이브 참조(구체 수치) + 인터랙션 패턴(동적) → 새 콘텐츠로 재창조

**DUVU 토큰은 "무엇을, 왜"를 제공하고, Picasso 아카이브는 "구체적으로 어떻게"를 제공한다. 둘을 함께 사용하라.**
