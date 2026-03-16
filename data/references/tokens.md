# DUVU 디자인 토큰

## 토큰 네이밍 규칙

모든 토큰은 `--duvu-` 접두사를 사용한다. 플랫폼별 변환은 `platforms.md` 참조.

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
| Title Small | 14px | 1.43 | 500 |
| Body Large | 16px | 1.5 | 400 |
| Body Medium | 14px | 1.43 | 400 |
| Body Small | 12px | 1.33 | 400 |
| Label Large | 14px | 1.43 | 500 |
| Label Medium | 12px | 1.33 | 500 |
| Label Small | 11px | 1.45 | 500 |

**최소 글자 크기: 12px (WCAG). 본문 최소 16px.**

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
