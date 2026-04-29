# DUVU 색상 시스템

## 아키텍처

```
소스 색상 (1개 hex 또는 프리셋 src)
    ↓ deriveTheme()
다크/라이트 풀 팔레트 (bg, surface, surface2, fg, fg2, fg3)
    ↓ ensureContrast()
접근성 보정된 accent
    ↓ readableOnAccent()
버튼 텍스트 색상 결정
```

## deriveTheme 알고리즘

소스 색상의 hue와 saturation을 기반으로 전체 테마를 도출한다.

```javascript
function deriveTheme(sourceHex) {
  const [h, s] = hexToHSL(sourceHex);
  const bgSat = Math.min(s, 15); // 배경 채도는 15% 이하로 제한
  
  return {
    dark: {
      bg:       hslToHex(h, bgSat, 4.5),    // 거의 검정, 약간의 색조
      fg:       hslToHex(h, 5, 92),          // 거의 흰색
      fg2:      hslToHex(h, 5, 54),          // 중간 회색
      fg3:      hslToHex(h, 4, 33),          // 어두운 회색
      surface:  hslToHex(h, bgSat, 7.5),     // bg보다 약간 밝음
      surface2: hslToHex(h, bgSat, 12),      // surface보다 약간 밝음
    },
    light: {
      bg:       hslToHex(h, Math.min(s, 10), 96), // 거의 흰색, 약간의 색조
      fg:       hslToHex(h, 8, 6),                  // 거의 검정
      fg2:      hslToHex(h, 6, 40),                 // 중간 어둡
      fg3:      hslToHex(h, 4, 62),                 // 중간 밝음
      surface:  '#ffffff',                           // 순수 흰색
      surface2: hslToHex(h, Math.min(s, 12), 93),  // 약간의 색조
    },
  };
}
```

### Override 시스템

일부 프리셋은 브랜드 정체성을 위해 자동 도출값을 덮어쓴다:

```javascript
// GitHub: 고유한 어두운 배경
{ id: 'github', src: '#238636',
  dark: { bg: '#0d1117', surface: '#161b22', surface2: '#21262d' },
  light: { bg: '#ffffff', surface: '#f6f8fa', surface2: '#eaeef2' } }

// Stripe: 고유한 보라 톤 + 완전 커스텀 fg
{ id: 'stripe', src: '#635BFF',
  dark: { bg: '#0a0a14', surface: '#13132a', surface2: '#1c1c38',
          fg: '#e8e6f0', fg2: '#9590b0', fg3: '#5a5578' } }
```

## ensureContrast 알고리즘

accent가 bg 대비 최소 비율(기본 3:1)을 충족하도록 밝기를 조정한다. 저장된 프리셋과 커스텀 `--hex` 입력 모두 이 계약을 따른다.

```javascript
function ensureContrast(accentHex, bgHex, minRatio = 3) {
  let ratio = contrastRatio(accentHex, bgHex);
  if (ratio >= minRatio) return accentHex; // 이미 충분
  
  const [h, s, l] = hexToHSL(accentHex);
  const bgLum = relativeLuminance(bgHex);
  
  if (bgLum < 0.5) { // 어두운 배경 → accent를 밝게
    for (let newL = l; newL <= 95; newL += 1.5) {
      const candidate = hslToHex(h, s, newL);
      if (contrastRatio(candidate, bgHex) >= minRatio) return candidate;
    }
  } else { // 밝은 배경 → accent를 어둡게
    for (let newL = l; newL >= 5; newL -= 1.5) {
      const candidate = hslToHex(h, s, newL);
      if (contrastRatio(candidate, bgHex) >= minRatio) return candidate;
    }
  }
  return accentHex; // fallback
}
```

### 커스텀 `--hex` 처리

`duvu generate "#3182F6"`와 `duvu tokens export --format dtcg --hex "#3182F6"`는 같은 색상 도출 계약을 사용한다.

1. HEX 형식은 `#RRGGBB`만 허용한다.
2. `deriveFromHex`가 hue/saturation을 보존하면서 dark/light 배경과 표면, 텍스트 계층을 만든다.
3. accent는 입력 색상을 기준으로 하되, `accent/bg` 3:1 미만이면 보정 또는 감사 실패 대상이다.
4. 저장된 프리셋은 `btnText`를 브랜드 의도 기반의 accent 전경색 계약으로 사용한다. `readableOnAccent`는 커스텀 HEX 또는 `btnText` 누락 시의 fallback이다.
5. 필요하면 `action fill`을 따로 보정해 `action/actionText` 4.5:1을 맞춘다. 원본 `accent`와 브랜드 전경색은 보존하고, 작은 텍스트 CTA에는 보정된 `action` 토큰을 쓴다.
6. `tokens audit`는 커스텀 입력도 프리셋과 같은 DTCG, alias, Figma DTCG parity, 대비 게이트로 검증해야 한다.

이 경로의 목적은 브랜드 색상을 보존하면서도, AI가 접근성 낮은 CTA나 읽히지 않는 버튼을 생성하지 못하게 막는 것이다.

## accent 전경색 계약

accent 배경 위에 올라갈 텍스트 색상은 컴포넌트가 즉석 계산하지 않는다. 저장된 프리셋은 `btnText`를 authoritative token으로 갖고, 데모와 생성 토큰은 이 값을 먼저 사용한다. 이 규칙 때문에 Toss처럼 기계적 대비만 보면 검정이 더 높게 나오는 색도, 브랜드 컨셉이 요구하는 흰색 전경을 일관되게 유지한다.

`readableOnAccent`는 다음 경우에만 사용한다.

- 사용자가 `--hex`로 임의 색상을 입력해 저장된 브랜드 전경색이 없을 때
- 프리셋 데이터에 `btnText`가 없거나 HEX 형식이 아닐 때
- 내부 감사/보정 로직이 fallback 후보를 계산할 때

컴포넌트 구현에서는 `readableOnAccent(preset.src)` 같은 직접 호출을 금지하고, `btnText`, `semantic.color.*.actionText`, `--duvu-btn-text`, `--duvu-emphasis-1-text` 같은 역할 토큰을 사용해야 한다.

fallback 알고리즘은 흰색/검정 중 대비가 더 높은 쪽을 고른다.

```javascript
function readableOnAccent(hex) {
  const crWhite = contrastRatio('#ffffff', hex);
  const crBlack = contrastRatio('#000000', hex);
  return crWhite >= crBlack ? '#ffffff' : '#000000';
}
```

## colorHarmonyAudit

전체 팔레트의 조화를 검사한다:

1. **accent vs bg**: 3:1 미만이면 error
2. **fg vs bg**: 4.5:1 미만이면 error
3. **fg2 vs bg**: 2.5:1 미만이면 warning
4. **accent 눈 피로**: 채도 90%+ AND 밝기 60%+ 이면 warning
5. **surface vs bg 구분**: 1.05:1 미만이면 warning (구분 부족)
6. **색온도 대비**: accent와 bg의 색온도(warm/cool)가 충돌하면 info

## 45개 프리셋 전수조사 결과 (v19.0)

- ✅ 다크 모드 45/45: 핵심 대비(fg/bg, fg/surface, accent/bg, btn/action 4.5:1) 전체 통과
- ✅ 라이트 모드 45/45: 핵심 대비 전체 통과
- ✅ 출처/근거/참고처 메타데이터 45/45: 모든 컬러가 `metadata.presets.color.<id>.provenance`에 `type`, `source`, `rationale`, `references`를 가진다
- ✅ 토큰 엔진 감사 기준: 45개 컬러, 11개 타이포그래피, 4개 레이아웃, 8개 스타일, 6개 모션, 9개 그라디언트, 17개 컴포넌트, 7개 인터랙션, 22개 템플릿을 현재 `data/presets.json` 기준으로 검사
- `duvu audit`, `duvu tokens audit`, 토큰 스모크 테스트로 현재 preset 구조와 대비를 확인한다.
