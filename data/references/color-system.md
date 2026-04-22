# DUVU 색상 시스템

## 아키텍처

```
소스 색상 (1개 hex) 
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

accent가 bg 대비 최소 비율(기본 3:1)을 충족하도록 밝기를 조정한다.

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

## readableOnAccent 알고리즘

accent 배경 위에 올라갈 텍스트 색상을 결정한다.

```javascript
function readableOnAccent(hex) {
  const [h, s, l] = hexToHSL(hex);
  const lum = relativeLuminance(hex);
  
  // 밝은 accent → 검은 텍스트
  if (lum >= 0.4) return '#000000';
  
  // 채도 높고 어두운 accent → 흰 텍스트
  if (s >= 50 && lum < 0.4) return '#ffffff';
  
  // 보라색 계열 특별 처리 (눈이 보라를 어둡게 인지)
  const isPurplish = h >= 230 && h <= 320;
  if (isPurplish && l <= 60) return '#ffffff';
  
  // 일반적으로 어두운 accent → 흰 텍스트
  if (s >= 20 && l <= 52) return '#ffffff';
  if (l <= 45) return '#ffffff';
  
  // 최종: 대비가 더 높은 쪽 선택
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
5. **surface vs bg 구분**: 1.08:1 미만이면 warning (구분 부족)
6. **색온도 대비**: accent와 bg의 색온도(warm/cool)가 충돌하면 info

## 43개 프리셋 전수조사 결과 (v19.0)

- ✅ 다크 모드 43/43: 핵심 대비(fg/bg, fg/surface, accent/bg, btn/accent 3:1) 전체 통과
- ✅ 라이트 모드 43/43: 핵심 대비 전체 통과
- `duvu audit`와 별도 구조 검증 스크립트로 현재 `data/presets.json` 기준 확인.
