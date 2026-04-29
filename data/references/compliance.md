# DUVU 컴플라이언스 가이드

## WCAG 2.1 AA

### 필수 준수 사항

| 기준 | 요구 | DUVU 구현 |
|---|---|---|
| 1.4.3 대비 (최소) | 본문 4.5:1, 대형텍스트 3:1 | `ensureContrast()` 자동 보정 |
| 1.4.11 비텍스트 대비 | UI 컴포넌트/그래픽 3:1 | accent vs bg 3:1 강제 |
| 1.4.1 색상 사용 | 색상만으로 정보 전달 금지 | 라벨/아이콘 병행 |
| 2.3.1 깜박임 | 3회/초 이상 깜박임 금지 | 모션 스케일로 제한 |
| 2.4.7 포커스 표시 | 키보드 포커스 시각적 표시 | focus-ring 토큰 |

### 대비 자동 보정 알고리즘

```
function ensureContrast(accentHex, bgHex, minRatio = 3):
  if contrastRatio(accent, bg) >= minRatio: return accent
  
  [h, s, l] = hexToHSL(accent)
  bgLum = relativeLuminance(bg)
  
  if bgLum < 0.5:  // 어두운 배경
    for newL = l to 95, step 1.5:
      if contrastRatio(hsl(h, s, newL), bg) >= minRatio: return result
  else:             // 밝은 배경
    for newL = l to 5, step -1.5:
      if contrastRatio(hsl(h, s, newL), bg) >= minRatio: return result
```

### 버튼 텍스트 가독성

DUVU는 `accent`와 `primary action fill`을 구분한다. 브랜드 색상 자체는 유지하되, 버튼처럼 작은 텍스트가 올라가는 면은 `action fill`로 약간 보정할 수 있다.

```
function resolveActionSurface(accentHex, preferredText):
  text = preferredText ?? readableOnAccent(accentHex)
  if contrastRatio(text, accentHex) >= 4.5: return { bg: accentHex, text }
  // preferred text를 유지한 채 action fill만 명도 보정
  return shiftLightnessUntilContrast(accentHex, text, 4.5)
```

**주의**: Toss(#3182F6), Apple(#007AFF), Spotify(#1DB954) 같은 브랜드 색상은 raw accent 위에 흰 텍스트를 올리면 4.5:1 미달일 수 있다. 이 경우 DUVU는 raw accent를 유지하고, primary action fill만 더 진하거나 옅게 보정한다.

---

## Apple HIG

### 필수 준수 사항

| 기준 | 요구 | DUVU 구현 |
|---|---|---|
| 터치 타겟 | 44×44pt 최소 | min-height: 44px 강제 |
| 시스템 색상 | 역할 기반 색상 매핑 | --duvu-accent/fg/bg 역할 구분 |
| 타이포그래피 | Dynamic Type 지원 | rem/em 기반 스케일 |
| 세이프 영역 | 노치/인디케이터 회피 | safe-area-inset 변수 |
| 모션 | Reduce Motion 존중 | prefers-reduced-motion 미디어쿼리 |

### 터치 타겟 규칙
```css
/* 모든 인터랙티브 요소 */
.duvu-btn, 
.duvu-input, 
.duvu-tab, 
.duvu-chip,
.duvu-icon-btn {
  min-height: 44px;
  min-width: 44px; /* 아이콘 버튼의 경우 */
}
```

---

## Material Design 3

### 필수 준수 사항

| 기준 | 요구 | DUVU 구현 |
|---|---|---|
| 엘리베이션 | 5단계 계층 | none/sm/md/lg 그림자 토큰 |
| 타이포 스케일 | 15종 스타일 | tokens.md 참조 |
| 동적 컬러 | 소스 색상에서 파생 | deriveTheme() 알고리즘 |
| 모양 | 4단계 라운딩 | radius-xs/sm/md/lg |
| 상태 레이어 | 호버/포커스/프레스/드래그 | opacity overlay |

### 상태 레이어 구현

```css
/* MD3 상태 레이어 */
.duvu-interactive {
  position: relative;
}
.duvu-interactive::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  transition: background var(--duvu-dur-fast);
}
.duvu-interactive:hover::after {
  background: rgba(var(--duvu-accent-rgb), 0.08);
}
.duvu-interactive:focus-visible::after {
  background: rgba(var(--duvu-accent-rgb), 0.12);
}
.duvu-interactive:active::after {
  background: rgba(var(--duvu-accent-rgb), 0.16);
}
```

---

## 자동 검증 체크리스트

코드 생성 후 다음을 자동으로 확인:

1. **색상 대비**: 모든 fg↔bg 조합이 WCAG AA 통과
2. **터치 타겟**: 모든 버튼/입력/링크가 44px 이상
3. **토큰 사용**: 하드코딩 색상/spacing 없음
4. **다크/라이트**: 두 모드 모두 렌더링 가능
5. **모션 감소**: prefers-reduced-motion 미디어쿼리 존재
6. **포커스 표시**: focus-visible 스타일 존재
7. **시맨틱 HTML**: 적절한 heading 계층, landmark 사용
