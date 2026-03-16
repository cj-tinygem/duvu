---
name: duvu
description: "DUVU 범용 디자인 시스템 엔진. UI/프론트엔드 코드 생성 시 자동 발동. 소스 색상 하나에서 WCAG AA/HIG/MD3를 동시 준수하는 완전한 디자인 토큰을 도출하고, 41개 컬러 프리셋 × 10개 타이포 × 4개 레이아웃 × 8개 스타일 × 5개 모션 × 9개 그라디언트를 조합하여 CSS, Tailwind, Flutter, SwiftUI, Compose, Unity 코드를 즉시 출력한다. 22개 종합 템플릿으로 SaaS부터 럭셔리까지 모든 도메인을 커버한다. Use when: UI 디자인, 프론트엔드 코드 생성, 디자인 시스템 적용, 컬러/타이포/레이아웃 결정, 디자인 토큰 생성, 컴포넌트 코드 작성, 페이지 레이아웃 구성."
---

# DUVU — 범용 디자인 시스템 엔진

> 하나의 결정이 시스템을 만든다.

## 이 스킬의 역할

이 스킬이 발동되면, **모든 UI/프론트엔드 코드 생성**은 이 시스템을 따른다.
사용자는 요구사항만 말한다. 나머지는 이 스킬이 자동으로 처리한다.

**절대 규칙**: 이 스킬이 로드된 상태에서는 어떤 UI 코드도 DUVU 토큰 체계 밖의 값을 사용하지 않는다. 모든 색상, 간격, 반경, 모션, 타이포는 `--duvu-` 접두사 토큰에서 파생된다.

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
컬러 + 타이포 + 레이아웃 + 스타일 + 모션 조합 (references/presets.json)
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

### 2단계: 프리셋 선택

`references/presets.json`에서 자동 매칭한다. 매칭 우선순위:

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

### 2.5단계: 컴포넌트 선택

`presets.json`의 `components` 배열(14종)과 각 템플릿의 `preview` 필드를 참조하여, 도메인에 적합한 컴포넌트 조합을 결정한다.

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

CLI: `duvu list component`, `duvu show component <id>`

### 3단계: 토큰 생성

선택된 프리셋에서 디자인 토큰을 생성한다. **모든 토큰은 `--duvu-` 접두사를 사용.**

`references/presets.json`에서 프리셋의 사전 계산된 값을 직접 사용한다. 각 컬러 프리셋에는 dark/light 양쪽 모두 bg, fg, fg2, fg3, surface, surface2, accent, accent-rgb 값이 포함되어 있다.

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

### 4단계: 코드 출력

타겟 플랫폼에 맞는 코드를 생성한다. `references/platforms.md`에서 플랫폼별 전체 코드 템플릿을 참조한다.

**지원 플랫폼 6개:**
- CSS (기본) — `:root` 변수 + 컴포넌트 클래스
- Tailwind CSS — `tailwind.config.js` + CSS 변수 브리지
- Flutter — `DuvuTheme.generate()` + ThemeData
- SwiftUI — `DuvuTheme` struct + 컴포넌트 View
- Jetpack Compose — `DuvuTheme` object + Composable
- Unity C# — `DuvuTheme` ScriptableObject

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
- [ ] 불통일이 있다면 그것은 의도된 것인가?

**의도 2중 질문**: 모든 요소 배치 전 "이건 왜 좋은가?", "정말 좋은가?"를 자문한다.

하나라도 실패하면 수정 후 재출력.

---

## 레퍼런스 파일 (필독)

| 파일 | 용도 | 언제 읽나 |
|---|---|---|
| `presets.json` | 41 컬러 + 10 타이포 + 4 레이아웃 + 8 스타일 + 5 모션 + 9 그라디언트 + 14 컴포넌트 + 22 템플릿. 각 템플릿에 `preview` 필드(layout + cards)가 있어 도메인별 컴포넌트 조합을 알 수 있다. CLI: `duvu list`, `duvu show <type> <id>` | **항상** (프리셋 데이터 조회) |
| `references/tokens.md` | 10개 카테고리 디자인 토큰 정의 | **항상** (토큰 구조 참조) |
| `references/platforms.md` | 6개 플랫폼 코드 생성 템플릿 (CSS, Tailwind, Flutter, SwiftUI, Compose, Unity) | 코드 생성 시 |
| `references/templates.md` | 22개 종합 템플릿 정의 (도메인별 최적 조합) | 템플릿 매칭 시 |
| `references/rules.md` | 디자인 규칙, 금지사항, 품질 기준, 자가 평가 체크리스트 | **항상** (품질 검증) |
| `references/compliance.md` | WCAG/HIG/MD3 준수 가이드, 알고리즘 (ensureContrast, readableOnAccent, 상태 레이어) | 접근성 검증 시 |
| `references/color-system.md` | 색상 도출 알고리즘 (deriveTheme, ensureContrast, readableOnAccent, colorHarmonyAudit) | 커스텀 색상 도출 시 |
| `references/components.md` | 16개 핵심 컴포넌트 패턴 (Button, Card, Input, Nav 등) | 컴포넌트 코드 작성 시 |
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
