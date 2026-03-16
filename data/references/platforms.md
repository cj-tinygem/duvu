# DUVU 멀티플랫폼 코드 생성

## CSS (기본)

```css
:root {
  /* Color */
  --duvu-bg: #08080b;
  --duvu-surface: #111115;
  --duvu-surface2: #1b1b20;
  --duvu-fg: #eaeaf0;
  --duvu-fg2: #848490;
  --duvu-fg3: #525258;
  --duvu-accent: #3182F6;
  --duvu-accent-rgb: 49, 130, 246;
  --duvu-btn-text: #ffffff;
  
  /* Typography */
  --duvu-font: 'Inter', 'Pretendard', sans-serif;
  --duvu-font-code: 'JetBrains Mono', monospace;
  
  /* Spacing */
  --duvu-space-xs: 4px;
  --duvu-space-sm: 8px;
  --duvu-space-md: 16px;
  --duvu-space-lg: 24px;
  --duvu-space-xl: 32px;
  --duvu-space-2xl: 48px;
  --duvu-space-3xl: 64px;
  
  /* Shape */
  --duvu-radius-xs: 6px;
  --duvu-radius-sm: 10px;
  --duvu-radius-md: 10px;
  --duvu-radius-lg: 16px;
  --duvu-radius-full: 9999px;
  --duvu-btn-radius: 10px;
  --duvu-card-radius: 16px;
  
  /* Elevation */
  --duvu-card-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
  
  /* Motion */
  --duvu-dur: 0.4s;
  --duvu-dur-fast: 0.2s;
  --duvu-dur-slow: 0.7s;
  --duvu-ease: cubic-bezier(0.16, 1, 0.3, 1);
  --duvu-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --duvu-ease-std: cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Emphasis */
  --duvu-emphasis-1-bg: var(--duvu-accent);
  --duvu-emphasis-1-text: var(--duvu-btn-text);
  --duvu-emphasis-2-bg: var(--duvu-surface2);
  --duvu-emphasis-2-text: var(--duvu-fg);
  --duvu-emphasis-3-bg: transparent;
  --duvu-emphasis-3-text: var(--duvu-fg2);
  
  /* Semantic */
  --duvu-success: #2A9D8F;
  --duvu-warning: #F4A261;
  --duvu-error: #E76F51;
  --duvu-info: var(--duvu-accent);
}

/* 다크/라이트 전환 */
[data-theme="light"] {
  --duvu-bg: #f2f1ee;
  --duvu-surface: #ffffff;
  --duvu-surface2: #e8e7e4;
  --duvu-fg: #0c0c11;
  --duvu-fg2: #52525c;
  --duvu-fg3: #9e9ea6;
}

/* 접근성: 모션 감소 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* 기본 리셋 */
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: var(--duvu-font);
  background: var(--duvu-bg);
  color: var(--duvu-fg);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
```

### CSS 카드 컴포넌트

```css
.duvu-card {
  background: var(--duvu-surface);
  border-radius: var(--duvu-card-radius);
  padding: var(--duvu-space-lg);
  box-shadow: var(--duvu-card-shadow);
  transition: transform var(--duvu-dur-fast) var(--duvu-ease),
              box-shadow var(--duvu-dur-fast) var(--duvu-ease);
}
.duvu-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}
```

### CSS 버튼 컴포넌트

```css
.duvu-btn {
  min-height: 44px; /* HIG touch target */
  padding: 10px 22px;
  border-radius: var(--duvu-btn-radius);
  font-size: 14px;
  font-weight: 600;
  font-family: var(--duvu-font);
  border: none;
  cursor: pointer;
  transition: background var(--duvu-dur-fast) var(--duvu-ease-spring),
              transform 0.15s var(--duvu-ease-spring);
}
.duvu-btn:active { transform: scale(0.97); }

.duvu-btn-primary {
  background: var(--duvu-emphasis-1-bg);
  color: var(--duvu-emphasis-1-text);
}
.duvu-btn-secondary {
  background: var(--duvu-emphasis-2-bg);
  color: var(--duvu-emphasis-2-text);
}
.duvu-btn-ghost {
  background: var(--duvu-emphasis-3-bg);
  color: var(--duvu-emphasis-3-text);
}
```

---

## Tailwind CSS

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        duvu: {
          bg: 'var(--duvu-bg)',
          surface: 'var(--duvu-surface)',
          surface2: 'var(--duvu-surface2)',
          fg: 'var(--duvu-fg)',
          fg2: 'var(--duvu-fg2)',
          fg3: 'var(--duvu-fg3)',
          accent: 'var(--duvu-accent)',
          success: 'var(--duvu-success)',
          warning: 'var(--duvu-warning)',
          error: 'var(--duvu-error)',
        }
      },
      fontFamily: {
        sans: ['var(--duvu-font)'],
        code: ['var(--duvu-font-code)'],
      },
      borderRadius: {
        'duvu-xs': 'var(--duvu-radius-xs)',
        'duvu-sm': 'var(--duvu-radius-sm)',
        'duvu-md': 'var(--duvu-radius-md)',
        'duvu-lg': 'var(--duvu-radius-lg)',
        'duvu-full': 'var(--duvu-radius-full)',
      },
      spacing: {
        'duvu-xs': 'var(--duvu-space-xs)',
        'duvu-sm': 'var(--duvu-space-sm)',
        'duvu-md': 'var(--duvu-space-md)',
        'duvu-lg': 'var(--duvu-space-lg)',
        'duvu-xl': 'var(--duvu-space-xl)',
      },
      transitionTimingFunction: {
        'duvu': 'var(--duvu-ease)',
        'duvu-spring': 'var(--duvu-ease-spring)',
      },
    }
  }
}
```

---

## Flutter

```dart
import 'package:flutter/material.dart';

class DuvuTheme {
  // Color preset을 받아 ThemeData 생성
  static ThemeData generate({
    required Color accent,
    required Color bg,
    required Color surface,
    required Color surface2,
    required Color fg,
    required Color fg2,
    required Color fg3,
    required String fontFamily,
    double borderRadius = 16,
    Brightness brightness = Brightness.dark,
  }) {
    return ThemeData(
      brightness: brightness,
      scaffoldBackgroundColor: bg,
      colorScheme: ColorScheme(
        brightness: brightness,
        primary: accent,
        onPrimary: _readableOnAccent(accent),
        secondary: surface2,
        onSecondary: fg,
        surface: surface,
        onSurface: fg,
        error: const Color(0xFFE76F51),
        onError: Colors.white,
      ),
      fontFamily: fontFamily,
      cardTheme: CardTheme(
        color: surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(borderRadius),
        ),
        elevation: 2,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: accent,
          foregroundColor: _readableOnAccent(accent),
          minimumSize: const Size(44, 44), // HIG
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(borderRadius * 0.625),
          ),
          textStyle: TextStyle(
            fontFamily: fontFamily,
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface2,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(borderRadius * 0.625),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),
      textTheme: TextTheme(
        displayLarge: TextStyle(fontSize: 57, fontWeight: FontWeight.w400, color: fg, height: 1.12),
        headlineLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.w400, color: fg, height: 1.25),
        headlineMedium: TextStyle(fontSize: 28, fontWeight: FontWeight.w400, color: fg, height: 1.29),
        titleLarge: TextStyle(fontSize: 22, fontWeight: FontWeight.w500, color: fg, height: 1.27),
        titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: fg, height: 1.5),
        bodyLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.w400, color: fg, height: 1.5),
        bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w400, color: fg2, height: 1.43),
        bodySmall: TextStyle(fontSize: 12, fontWeight: FontWeight.w400, color: fg3, height: 1.33),
        labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: fg, height: 1.43),
      ),
    );
  }

  static Color _readableOnAccent(Color accent) {
    return accent.computeLuminance() > 0.4 ? Colors.black : Colors.white;
  }
}

// 사용법: Toss 프리셋 다크 모드
// MaterialApp(theme: DuvuTheme.generate(
//   accent: Color(0xFF3182F6),
//   bg: Color(0xFF08080B), surface: Color(0xFF111115), surface2: Color(0xFF1B1B20),
//   fg: Color(0xFFEAEAF0), fg2: Color(0xFF848490), fg3: Color(0xFF525258),
//   fontFamily: 'Inter', borderRadius: 16,
// ))
```

---

## SwiftUI

```swift
import SwiftUI

struct DuvuTheme {
    let accent: Color
    let bg: Color
    let surface: Color
    let surface2: Color
    let fg: Color
    let fg2: Color
    let fg3: Color
    let cornerRadius: CGFloat
    
    // Toss Dark 프리셋
    static let tossDark = DuvuTheme(
        accent: Color(hex: "#3182F6"),
        bg: Color(hex: "#08080B"),
        surface: Color(hex: "#111115"),
        surface2: Color(hex: "#1B1B20"),
        fg: Color(hex: "#EAEAF0"),
        fg2: Color(hex: "#848490"),
        fg3: Color(hex: "#525258"),
        cornerRadius: 16
    )
}

struct DuvuCard<Content: View>: View {
    let content: Content
    @Environment(\.duvuTheme) var theme
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        content
            .padding(24)
            .background(theme.surface)
            .cornerRadius(theme.cornerRadius)
            .shadow(color: .black.opacity(0.08), radius: 8, y: 2)
    }
}

struct DuvuButton: View {
    let title: String
    let style: ButtonStyle
    let action: () -> Void
    @Environment(\.duvuTheme) var theme
    
    enum ButtonStyle { case primary, secondary, ghost }
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 14, weight: .semibold))
                .frame(minHeight: 44) // HIG
                .frame(maxWidth: .infinity)
                .background(bgColor)
                .foregroundColor(fgColor)
                .cornerRadius(theme.cornerRadius * 0.625)
        }
    }
    
    var bgColor: Color {
        switch style {
        case .primary: return theme.accent
        case .secondary: return theme.surface2
        case .ghost: return .clear
        }
    }
    
    var fgColor: Color {
        switch style {
        case .primary: return .white
        case .secondary: return theme.fg
        case .ghost: return theme.fg2
        }
    }
}
```

---

## Jetpack Compose

```kotlin
object DuvuTheme {
    data class Colors(
        val bg: Color, val surface: Color, val surface2: Color,
        val fg: Color, val fg2: Color, val fg3: Color,
        val accent: Color, val btnText: Color,
        val success: Color = Color(0xFF2A9D8F),
        val warning: Color = Color(0xFFF4A261),
        val error: Color = Color(0xFFE76F51),
    )
    
    val TossDark = Colors(
        bg = Color(0xFF08080B), surface = Color(0xFF111115), surface2 = Color(0xFF1B1B20),
        fg = Color(0xFFEAEAF0), fg2 = Color(0xFF848490), fg3 = Color(0xFF525258),
        accent = Color(0xFF3182F6), btnText = Color.White,
    )
    
    val TossLight = Colors(
        bg = Color(0xFFF2F1EE), surface = Color.White, surface2 = Color(0xFFE8E7E4),
        fg = Color(0xFF0C0C11), fg2 = Color(0xFF52525C), fg3 = Color(0xFF9E9EA6),
        accent = Color(0xFF3182F6), btnText = Color.White,
    )
    
    fun shapes(radiusDp: Int = 16) = Shapes(
        small = RoundedCornerShape(radiusDp / 2),
        medium = RoundedCornerShape(radiusDp),
        large = RoundedCornerShape(radiusDp),
    )
}

@Composable
fun DuvuCard(
    modifier: Modifier = Modifier,
    colors: DuvuTheme.Colors = DuvuTheme.TossDark,
    content: @Composable () -> Unit
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = colors.surface),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Box(Modifier.padding(24.dp)) { content() }
    }
}

@Composable
fun DuvuButton(
    text: String,
    onClick: () -> Unit,
    colors: DuvuTheme.Colors = DuvuTheme.TossDark,
    style: String = "primary", // primary, secondary, ghost
) {
    Button(
        onClick = onClick,
        modifier = Modifier.heightIn(min = 44.dp), // HIG
        colors = ButtonDefaults.buttonColors(
            containerColor = when (style) {
                "primary" -> colors.accent
                "secondary" -> colors.surface2
                else -> Color.Transparent
            },
            contentColor = when (style) {
                "primary" -> colors.btnText
                "secondary" -> colors.fg
                else -> colors.fg2
            },
        ),
        shape = RoundedCornerShape(10.dp),
    ) {
        Text(text, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
    }
}
```

---

## Unity (C#)

```csharp
using UnityEngine;

[CreateAssetMenu(fileName = "DuvuTheme", menuName = "DUVU/Theme")]
public class DuvuTheme : ScriptableObject
{
    [Header("Color")]
    public Color bg = HexToColor("#08080B");
    public Color surface = HexToColor("#111115");
    public Color surface2 = HexToColor("#1B1B20");
    public Color fg = HexToColor("#EAEAF0");
    public Color fg2 = HexToColor("#848490");
    public Color fg3 = HexToColor("#525258");
    public Color accent = HexToColor("#3182F6");
    
    [Header("Shape")]
    public float cornerRadius = 16f;
    public float buttonRadius = 10f;
    
    [Header("Spacing")]
    public float spaceXs = 4f;
    public float spaceSm = 8f;
    public float spaceMd = 16f;
    public float spaceLg = 24f;
    public float spaceXl = 32f;
    
    [Header("Motion")]
    public float duration = 0.4f;
    public float durationFast = 0.2f;
    
    public static Color HexToColor(string hex) {
        ColorUtility.TryParseHtmlString(hex, out Color color);
        return color;
    }
    
    // 프리셋 생성 팩토리
    public static DuvuTheme CreateFromPreset(string presetName, bool isDark = true) {
        var theme = CreateInstance<DuvuTheme>();
        // presets.json에서 해당 프리셋 로드하여 적용
        return theme;
    }
}
```

---

## React Native

```typescript
import { StyleSheet } from 'react-native';

const DuvuTheme = {
  // Color — Toss Dark 프리셋
  colors: {
    bg: '#08080B',
    surface: '#111115',
    surface2: '#1B1B20',
    fg: '#EAEAF0',
    fg2: '#848490',
    fg3: '#525258',
    accent: '#3182F6',
    btnText: '#FFFFFF',
    success: '#2A9D8F',
    warning: '#F4A261',
    error: '#E76F51',
  },

  // Shape
  radius: { xs: 6, sm: 10, md: 10, lg: 16, full: 9999 },
  btnRadius: 10,
  cardRadius: 16,

  // Spacing
  space: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },

  // Typography
  font: { regular: 'Pretendard-Regular', medium: 'Pretendard-Medium', bold: 'Pretendard-Bold' },
};

// 사용법
const styles = StyleSheet.create({
  card: {
    backgroundColor: DuvuTheme.colors.surface,
    borderRadius: DuvuTheme.cardRadius,
    padding: DuvuTheme.space.lg,
  },
  btnPrimary: {
    backgroundColor: DuvuTheme.colors.accent,
    borderRadius: DuvuTheme.btnRadius,
    minHeight: 44, // HIG
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  btnText: {
    color: DuvuTheme.colors.btnText,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: DuvuTheme.font.medium,
  },
  text: { color: DuvuTheme.colors.fg, fontSize: 16, lineHeight: 24 },
  textSecondary: { color: DuvuTheme.colors.fg2, fontSize: 14 },
});
```

---

## 플랫폼 범용성 가이드

DUVU의 디자인 토큰은 **플랫폼에 독립적**이다. 모든 토큰은 다음 형식으로 변환 가능:

| 플랫폼 | 색상 표현 | 간격 단위 | 모서리 | 모션 |
|---|---|---|---|---|
| CSS | `var(--duvu-*)` | px | border-radius | transition |
| Tailwind | theme config | rem 변환 가능 | rounded-* | duration-* |
| Flutter | `Color(0xFF...)` | dp | BorderRadius | Duration |
| SwiftUI | `Color(hex:)` | pt | cornerRadius | Animation |
| Compose | `Color(0xFF...)` | dp | RoundedCornerShape | animateAsState |
| Unity | `Color` | float | cornerRadius | DOTween |
| React Native | `'#hex'` | dp | borderRadius | Animated |

**핵심**: 프리셋 데이터(`presets.json`)는 플랫폼 중립적인 값(hex, px)으로 저장되므로, 어떤 플랫폼으로든 변환 가능하다. AI 스킬이 위 표를 참조하여 타겟 플랫폼에 맞는 코드를 생성한다.

---

## 컴포넌트별 멀티플랫폼 코드

핵심 UI 컴포넌트 6종의 멀티플랫폼 구현 코드. 모든 구현은 DUVU 디자인 토큰을 사용하며, HIG 44px 터치 타겟을 준수한다.

---

### Component: metric

**CSS:**
```css
.duvu-metric {
  display: flex;
  flex-direction: column;
  gap: var(--duvu-space-sm);
  background: var(--duvu-surface);
  border-radius: var(--duvu-card-radius);
  padding: var(--duvu-space-lg);
  box-shadow: var(--duvu-card-shadow);
}
.duvu-metric__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--duvu-fg2);
  letter-spacing: 0.02em;
}
.duvu-metric__value {
  font-size: 32px;
  font-weight: 700;
  color: var(--duvu-fg);
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.duvu-metric__badge {
  display: inline-flex;
  align-items: center;
  gap: var(--duvu-space-xs);
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--duvu-radius-full);
  width: fit-content;
}
.duvu-metric__badge--up {
  background: rgba(42, 157, 143, 0.15);
  color: var(--duvu-success);
}
.duvu-metric__badge--down {
  background: rgba(231, 111, 81, 0.15);
  color: var(--duvu-error);
}
```

**React Native:**
```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type BadgeDirection = 'up' | 'down';

interface DuvuMetricProps {
  label: string;
  value: string;
  badge?: { text: string; direction: BadgeDirection };
}

const DuvuMetric: React.FC<DuvuMetricProps> = ({ label, value, badge }) => (
  <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
    {badge && (
      <View style={[
        styles.badge,
        badge.direction === 'up' ? styles.badgeUp : styles.badgeDown,
      ]}>
        <Text style={[
          styles.badgeText,
          { color: badge.direction === 'up' ? '#2A9D8F' : '#E76F51' },
        ]}>
          {badge.direction === 'up' ? '▲' : '▼'} {badge.text}
        </Text>
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111115',
    borderRadius: 16,
    padding: 24,
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#848490',
    letterSpacing: 0.26,
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
    color: '#EAEAF0',
    lineHeight: 36,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    gap: 4,
  },
  badgeUp: { backgroundColor: 'rgba(42,157,143,0.15)' },
  badgeDown: { backgroundColor: 'rgba(231,111,81,0.15)' },
  badgeText: { fontSize: 12, fontWeight: '600' },
});

export default DuvuMetric;
```

**Flutter:**
```dart
import 'package:flutter/material.dart';

enum BadgeDirection { up, down }

class DuvuMetric extends StatelessWidget {
  final String label;
  final String value;
  final String? badgeText;
  final BadgeDirection? badgeDirection;

  const DuvuMetric({
    super.key,
    required this.label,
    required this.value,
    this.badgeText,
    this.badgeDirection,
  });

  @override
  Widget build(BuildContext context) {
    final isUp = badgeDirection == BadgeDirection.up;
    final badgeColor = isUp
        ? const Color(0xFF2A9D8F)
        : const Color(0xFFE76F51);

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF111115),
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(color: Color(0x14000000), blurRadius: 8, offset: Offset(0, 2)),
          BoxShadow(color: Color(0x0A000000), blurRadius: 2, offset: Offset(0, 1)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: Color(0xFF848490),
              letterSpacing: 0.26,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.w700,
              color: Color(0xFFEAEAF0),
              height: 1.1,
            ),
          ),
          if (badgeText != null) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: badgeColor.withOpacity(0.15),
                borderRadius: BorderRadius.circular(9999),
              ),
              child: Text(
                '${isUp ? '▲' : '▼'} $badgeText',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: badgeColor,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
```

**SwiftUI:**
```swift
import SwiftUI

struct DuvuMetric: View {
    let label: String
    let value: String
    var badgeText: String? = nil
    var badgeDirection: BadgeDirection? = nil

    enum BadgeDirection { case up, down }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(Color(hex: "#848490"))
                .tracking(0.26)

            Text(value)
                .font(.system(size: 32, weight: .bold).monospacedDigit())
                .foregroundColor(Color(hex: "#EAEAF0"))
                .lineSpacing(0)

            if let badgeText, let dir = badgeDirection {
                let isUp = dir == .up
                let color = isUp ? Color(hex: "#2A9D8F") : Color(hex: "#E76F51")
                Text("\(isUp ? "▲" : "▼") \(badgeText)")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(color)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(color.opacity(0.15))
                    .clipShape(Capsule())
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(24)
        .background(Color(hex: "#111115"))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.08), radius: 8, y: 2)
    }
}
```

---

### Component: buttons

**CSS:**
```css
.duvu-buttons {
  display: flex;
  gap: var(--duvu-space-sm);
  flex-wrap: wrap;
}
.duvu-buttons .duvu-btn {
  min-height: 44px;
  padding: 10px 22px;
  border-radius: var(--duvu-btn-radius);
  font-size: 14px;
  font-weight: 600;
  font-family: var(--duvu-font);
  border: none;
  cursor: pointer;
  transition: background var(--duvu-dur-fast) var(--duvu-ease-spring),
              transform 0.15s var(--duvu-ease-spring),
              opacity var(--duvu-dur-fast) var(--duvu-ease);
}
.duvu-buttons .duvu-btn:active { transform: scale(0.97); }
.duvu-buttons .duvu-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}
.duvu-buttons .duvu-btn--primary {
  background: var(--duvu-emphasis-1-bg);
  color: var(--duvu-emphasis-1-text);
}
.duvu-buttons .duvu-btn--primary:hover:not(:disabled) {
  filter: brightness(1.1);
}
.duvu-buttons .duvu-btn--secondary {
  background: var(--duvu-emphasis-2-bg);
  color: var(--duvu-emphasis-2-text);
}
.duvu-buttons .duvu-btn--secondary:hover:not(:disabled) {
  filter: brightness(1.15);
}
.duvu-buttons .duvu-btn--ghost {
  background: var(--duvu-emphasis-3-bg);
  color: var(--duvu-emphasis-3-text);
}
.duvu-buttons .duvu-btn--ghost:hover:not(:disabled) {
  background: var(--duvu-surface2);
}
```

**React Native:**
```typescript
import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle, TextStyle } from 'react-native';

type Emphasis = 'primary' | 'secondary' | 'ghost';

interface ButtonItem {
  label: string;
  emphasis: Emphasis;
  onPress: () => void;
  disabled?: boolean;
}

interface DuvuButtonsProps {
  buttons: ButtonItem[];
}

const emphasisStyles: Record<Emphasis, { bg: ViewStyle; text: TextStyle }> = {
  primary: {
    bg: { backgroundColor: '#3182F6' },
    text: { color: '#FFFFFF' },
  },
  secondary: {
    bg: { backgroundColor: '#1B1B20' },
    text: { color: '#EAEAF0' },
  },
  ghost: {
    bg: { backgroundColor: 'transparent' },
    text: { color: '#848490' },
  },
};

const DuvuButtons: React.FC<DuvuButtonsProps> = ({ buttons }) => (
  <View style={styles.row}>
    {buttons.map((btn, i) => (
      <Pressable
        key={i}
        onPress={btn.onPress}
        disabled={btn.disabled}
        style={({ pressed }) => [
          styles.btn,
          emphasisStyles[btn.emphasis].bg,
          pressed && { transform: [{ scale: 0.97 }] },
          btn.disabled && { opacity: 0.4 },
        ]}
      >
        <Text style={[styles.btnText, emphasisStyles[btn.emphasis].text]}>
          {btn.label}
        </Text>
      </Pressable>
    ))}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  btn: {
    minHeight: 44,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DuvuButtons;
```

**Flutter:**
```dart
import 'package:flutter/material.dart';

enum DuvuEmphasis { primary, secondary, ghost }

class DuvuButtons extends StatelessWidget {
  final List<DuvuButtonItem> buttons;

  const DuvuButtons({super.key, required this.buttons});

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: buttons.map((btn) => _buildButton(btn)).toList(),
    );
  }

  Widget _buildButton(DuvuButtonItem btn) {
    Color bg;
    Color fg;
    switch (btn.emphasis) {
      case DuvuEmphasis.primary:
        bg = const Color(0xFF3182F6);
        fg = const Color(0xFFFFFFFF);
        break;
      case DuvuEmphasis.secondary:
        bg = const Color(0xFF1B1B20);
        fg = const Color(0xFFEAEAF0);
        break;
      case DuvuEmphasis.ghost:
        bg = Colors.transparent;
        fg = const Color(0xFF848490);
        break;
    }

    return MaterialButton(
      onPressed: btn.disabled ? null : btn.onPressed,
      color: bg,
      disabledColor: bg.withOpacity(0.4),
      textColor: fg,
      disabledTextColor: fg.withOpacity(0.4),
      minWidth: 0,
      height: 44,
      padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      elevation: 0,
      child: Text(
        btn.label,
        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
      ),
    );
  }
}

class DuvuButtonItem {
  final String label;
  final DuvuEmphasis emphasis;
  final VoidCallback onPressed;
  final bool disabled;

  const DuvuButtonItem({
    required this.label,
    required this.emphasis,
    required this.onPressed,
    this.disabled = false,
  });
}
```

**SwiftUI:**
```swift
import SwiftUI

enum DuvuEmphasis { case primary, secondary, ghost }

struct DuvuButtonItem: Identifiable {
    let id = UUID()
    let label: String
    let emphasis: DuvuEmphasis
    let action: () -> Void
    var disabled: Bool = false
}

struct DuvuButtons: View {
    let buttons: [DuvuButtonItem]

    var body: some View {
        HStack(spacing: 8) {
            ForEach(buttons) { btn in
                Button(action: btn.action) {
                    Text(btn.label)
                        .font(.system(size: 14, weight: .semibold))
                        .padding(.horizontal, 22)
                        .padding(.vertical, 10)
                        .frame(minHeight: 44)
                        .background(bgColor(btn.emphasis))
                        .foregroundColor(fgColor(btn.emphasis))
                        .cornerRadius(10)
                }
                .disabled(btn.disabled)
                .opacity(btn.disabled ? 0.4 : 1.0)
                .buttonStyle(ScaleButtonStyle())
            }
        }
    }

    func bgColor(_ e: DuvuEmphasis) -> Color {
        switch e {
        case .primary: return Color(hex: "#3182F6")
        case .secondary: return Color(hex: "#1B1B20")
        case .ghost: return .clear
        }
    }

    func fgColor(_ e: DuvuEmphasis) -> Color {
        switch e {
        case .primary: return .white
        case .secondary: return Color(hex: "#EAEAF0")
        case .ghost: return Color(hex: "#848490")
        }
    }
}

struct ScaleButtonStyle: SwiftUI.ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .animation(.easeOut(duration: 0.15), value: configuration.isPressed)
    }
}
```

---

### Component: hero

**CSS:**
```css
.duvu-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--duvu-space-3xl) var(--duvu-space-lg);
  gap: var(--duvu-space-md);
  background: var(--duvu-bg);
}
.duvu-hero__eyebrow {
  font-size: 13px;
  font-weight: 600;
  color: var(--duvu-accent);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.duvu-hero__title {
  font-size: clamp(32px, 5vw, 56px);
  font-weight: 800;
  color: var(--duvu-fg);
  line-height: 1.1;
  max-width: 720px;
}
.duvu-hero__subtitle {
  font-size: 18px;
  font-weight: 400;
  color: var(--duvu-fg2);
  line-height: 1.6;
  max-width: 540px;
}
.duvu-hero__actions {
  display: flex;
  gap: var(--duvu-space-sm);
  margin-top: var(--duvu-space-md);
}
```

**React Native:**
```typescript
import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';

interface DuvuHeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

const DuvuHero: React.FC<DuvuHeroProps> = ({ eyebrow, title, subtitle, children }) => {
  const { width } = useWindowDimensions();
  const titleSize = Math.min(Math.max(width * 0.07, 32), 56);

  return (
    <View style={styles.container}>
      {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
      <Text style={[styles.title, { fontSize: titleSize }]}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {children && <View style={styles.actions}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
    gap: 16,
    backgroundColor: '#08080B',
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3182F6',
    textTransform: 'uppercase',
    letterSpacing: 1.04,
  },
  title: {
    fontWeight: '800',
    color: '#EAEAF0',
    textAlign: 'center',
    lineHeight: 62,
    maxWidth: 720,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '400',
    color: '#848490',
    textAlign: 'center',
    lineHeight: 29,
    maxWidth: 540,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
});

export default DuvuHero;
```

**Flutter:**
```dart
import 'package:flutter/material.dart';

class DuvuHero extends StatelessWidget {
  final String? eyebrow;
  final String title;
  final String? subtitle;
  final List<Widget>? actions;

  const DuvuHero({
    super.key,
    this.eyebrow,
    required this.title,
    this.subtitle,
    this.actions,
  });

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final titleSize = (screenWidth * 0.07).clamp(32.0, 56.0);

    return Container(
      color: const Color(0xFF08080B),
      padding: const EdgeInsets.symmetric(vertical: 64, horizontal: 24),
      width: double.infinity,
      child: Column(
        children: [
          if (eyebrow != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Text(
                eyebrow!.toUpperCase(),
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF3182F6),
                  letterSpacing: 1.04,
                ),
              ),
            ),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 720),
            child: Text(
              title,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: titleSize,
                fontWeight: FontWeight.w800,
                color: const Color(0xFFEAEAF0),
                height: 1.1,
              ),
            ),
          ),
          if (subtitle != null)
            Padding(
              padding: const EdgeInsets.only(top: 16),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 540),
                child: Text(
                  subtitle!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w400,
                    color: Color(0xFF848490),
                    height: 1.6,
                  ),
                ),
              ),
            ),
          if (actions != null && actions!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 32),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                alignment: WrapAlignment.center,
                children: actions!,
              ),
            ),
        ],
      ),
    );
  }
}
```

**SwiftUI:**
```swift
import SwiftUI

struct DuvuHero<Actions: View>: View {
    let eyebrow: String?
    let title: String
    let subtitle: String?
    let actions: () -> Actions

    init(
        eyebrow: String? = nil,
        title: String,
        subtitle: String? = nil,
        @ViewBuilder actions: @escaping () -> Actions = { EmptyView() }
    ) {
        self.eyebrow = eyebrow
        self.title = title
        self.subtitle = subtitle
        self.actions = actions
    }

    var body: some View {
        VStack(spacing: 16) {
            if let eyebrow {
                Text(eyebrow.uppercased())
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(Color(hex: "#3182F6"))
                    .tracking(1.04)
            }

            Text(title)
                .font(.system(size: dynamicTitleSize, weight: .heavy))
                .foregroundColor(Color(hex: "#EAEAF0"))
                .multilineTextAlignment(.center)
                .lineSpacing(0)
                .frame(maxWidth: 720)

            if let subtitle {
                Text(subtitle)
                    .font(.system(size: 18, weight: .regular))
                    .foregroundColor(Color(hex: "#848490"))
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
                    .frame(maxWidth: 540)
            }

            HStack(spacing: 8) { actions() }
                .padding(.top, 16)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 64)
        .padding(.horizontal, 24)
        .background(Color(hex: "#08080B"))
    }

    private var dynamicTitleSize: CGFloat {
        #if os(iOS)
        let width = UIScreen.main.bounds.width
        return min(max(width * 0.07, 32), 56)
        #else
        return 48
        #endif
    }
}
```

---

### Component: article

**CSS:**
```css
.duvu-article {
  max-width: 680px;
  margin: 0 auto;
  padding: var(--duvu-space-2xl) var(--duvu-space-lg);
}
.duvu-article__header {
  display: flex;
  flex-direction: column;
  gap: var(--duvu-space-sm);
  margin-bottom: var(--duvu-space-xl);
}
.duvu-article__category {
  font-size: 13px;
  font-weight: 600;
  color: var(--duvu-accent);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.duvu-article__title {
  font-size: 28px;
  font-weight: 700;
  color: var(--duvu-fg);
  line-height: 1.25;
}
.duvu-article__meta {
  display: flex;
  gap: var(--duvu-space-md);
  font-size: 13px;
  color: var(--duvu-fg3);
}
.duvu-article__cover {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: var(--duvu-radius-lg);
  margin-bottom: var(--duvu-space-xl);
}
.duvu-article__body {
  font-size: 16px;
  line-height: 1.75;
  color: var(--duvu-fg2);
}
.duvu-article__body p { margin-bottom: var(--duvu-space-md); }
.duvu-article__body h2 {
  font-size: 22px;
  font-weight: 700;
  color: var(--duvu-fg);
  margin-top: var(--duvu-space-xl);
  margin-bottom: var(--duvu-space-sm);
}
```

**React Native:**
```typescript
import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';

interface DuvuArticleProps {
  category?: string;
  title: string;
  author: string;
  date: string;
  coverUri?: string;
  children: React.ReactNode;
}

const DuvuArticle: React.FC<DuvuArticleProps> = ({
  category, title, author, date, coverUri, children,
}) => (
  <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <View style={styles.header}>
      {category && <Text style={styles.category}>{category.toUpperCase()}</Text>}
      <Text style={styles.title}>{title}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{author}</Text>
        <Text style={styles.meta}>{date}</Text>
      </View>
    </View>
    {coverUri && (
      <Image
        source={{ uri: coverUri }}
        style={styles.cover}
        resizeMode="cover"
      />
    )}
    <View style={styles.body}>{children}</View>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#08080B' },
  content: { maxWidth: 680, alignSelf: 'center', padding: 24, paddingVertical: 48 },
  header: { gap: 8, marginBottom: 32 },
  category: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3182F6',
    letterSpacing: 0.52,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#EAEAF0',
    lineHeight: 35,
  },
  metaRow: { flexDirection: 'row', gap: 16 },
  meta: { fontSize: 13, color: '#525258' },
  cover: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    marginBottom: 32,
  },
  body: {},
});

export default DuvuArticle;
```

**Flutter:**
```dart
import 'package:flutter/material.dart';

class DuvuArticle extends StatelessWidget {
  final String? category;
  final String title;
  final String author;
  final String date;
  final String? coverUrl;
  final Widget body;

  const DuvuArticle({
    super.key,
    this.category,
    required this.title,
    required this.author,
    required this.date,
    this.coverUrl,
    required this.body,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 680),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (category != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Text(
                      category!.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF3182F6),
                        letterSpacing: 0.52,
                      ),
                    ),
                  ),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFFEAEAF0),
                    height: 1.25,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Text(author,
                        style: const TextStyle(fontSize: 13, color: Color(0xFF525258))),
                    const SizedBox(width: 16),
                    Text(date,
                        style: const TextStyle(fontSize: 13, color: Color(0xFF525258))),
                  ],
                ),
                const SizedBox(height: 32),
                if (coverUrl != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 32),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: AspectRatio(
                        aspectRatio: 16 / 9,
                        child: Image.network(coverUrl!, fit: BoxFit.cover),
                      ),
                    ),
                  ),
                DefaultTextStyle(
                  style: const TextStyle(
                    fontSize: 16,
                    height: 1.75,
                    color: Color(0xFF848490),
                  ),
                  child: body,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
```

**SwiftUI:**
```swift
import SwiftUI

struct DuvuArticle<Body: View>: View {
    let category: String?
    let title: String
    let author: String
    let date: String
    let coverUrl: URL?
    let body: () -> Body

    init(
        category: String? = nil,
        title: String,
        author: String,
        date: String,
        coverUrl: URL? = nil,
        @ViewBuilder body: @escaping () -> Body
    ) {
        self.category = category
        self.title = title
        self.author = author
        self.date = date
        self.coverUrl = coverUrl
        self.body = body
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                // 헤더
                VStack(alignment: .leading, spacing: 8) {
                    if let category {
                        Text(category.uppercased())
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(Color(hex: "#3182F6"))
                            .tracking(0.52)
                    }
                    Text(title)
                        .font(.system(size: 28, weight: .bold))
                        .foregroundColor(Color(hex: "#EAEAF0"))
                        .lineSpacing(2)
                    HStack(spacing: 16) {
                        Text(author)
                        Text(date)
                    }
                    .font(.system(size: 13))
                    .foregroundColor(Color(hex: "#525258"))
                }
                .padding(.bottom, 32)

                // 커버 이미지
                if let coverUrl {
                    AsyncImage(url: coverUrl) { image in
                        image.resizable().aspectRatio(16/9, contentMode: .fill)
                    } placeholder: {
                        Rectangle()
                            .fill(Color(hex: "#1B1B20"))
                            .aspectRatio(16/9, contentMode: .fill)
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .padding(.bottom, 32)
                }

                // 본문
                self.body()
                    .font(.system(size: 16))
                    .foregroundColor(Color(hex: "#848490"))
                    .lineSpacing(6)
            }
            .frame(maxWidth: 680, alignment: .leading)
            .padding(.horizontal, 24)
            .padding(.vertical, 48)
        }
        .background(Color(hex: "#08080B"))
    }
}
```

---

### Component: gallery

**CSS:**
```css
.duvu-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--duvu-space-sm);
  padding: var(--duvu-space-lg);
}
.duvu-gallery__item {
  position: relative;
  overflow: hidden;
  border-radius: var(--duvu-radius-lg);
  aspect-ratio: 1;
  cursor: pointer;
}
.duvu-gallery__item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--duvu-dur) var(--duvu-ease);
}
.duvu-gallery__item:hover img {
  transform: scale(1.05);
}
.duvu-gallery__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(transparent 50%, rgba(0,0,0,0.6));
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: var(--duvu-space-md);
  opacity: 0;
  transition: opacity var(--duvu-dur-fast) var(--duvu-ease);
}
.duvu-gallery__item:hover .duvu-gallery__overlay {
  opacity: 1;
}
.duvu-gallery__caption {
  font-size: 14px;
  font-weight: 600;
  color: var(--duvu-fg);
}
.duvu-gallery__sub {
  font-size: 12px;
  color: var(--duvu-fg3);
}
```

**React Native:**
```typescript
import React from 'react';
import {
  View, Text, Image, Pressable, StyleSheet, FlatList,
  useWindowDimensions,
} from 'react-native';

interface GalleryItem {
  id: string;
  uri: string;
  caption?: string;
  sub?: string;
}

interface DuvuGalleryProps {
  items: GalleryItem[];
  columns?: number;
  onPress?: (item: GalleryItem) => void;
}

const DuvuGallery: React.FC<DuvuGalleryProps> = ({ items, columns = 2, onPress }) => {
  const { width } = useWindowDimensions();
  const gap = 8;
  const padding = 24;
  const itemSize = (width - padding * 2 - gap * (columns - 1)) / columns;

  return (
    <FlatList
      data={items}
      numColumns={columns}
      contentContainerStyle={styles.grid}
      columnWrapperStyle={{ gap }}
      ItemSeparatorComponent={() => <View style={{ height: gap }} />}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onPress?.(item)}
          style={[styles.item, { width: itemSize, height: itemSize }]}
        >
          <Image source={{ uri: item.uri }} style={styles.image} />
          {item.caption && (
            <View style={styles.overlay}>
              <Text style={styles.caption}>{item.caption}</Text>
              {item.sub && <Text style={styles.sub}>{item.sub}</Text>}
            </View>
          )}
        </Pressable>
      )}
    />
  );
};

const styles = StyleSheet.create({
  grid: { padding: 24 },
  item: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  caption: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EAEAF0',
  },
  sub: {
    fontSize: 12,
    color: '#525258',
    marginTop: 2,
  },
});

export default DuvuGallery;
```

**Flutter:**
```dart
import 'package:flutter/material.dart';

class GalleryItem {
  final String id;
  final String imageUrl;
  final String? caption;
  final String? sub;

  const GalleryItem({
    required this.id,
    required this.imageUrl,
    this.caption,
    this.sub,
  });
}

class DuvuGallery extends StatelessWidget {
  final List<GalleryItem> items;
  final int crossAxisCount;
  final void Function(GalleryItem)? onTap;

  const DuvuGallery({
    super.key,
    required this.items,
    this.crossAxisCount = 2,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: crossAxisCount,
          crossAxisSpacing: 8,
          mainAxisSpacing: 8,
          childAspectRatio: 1,
        ),
        itemCount: items.length,
        itemBuilder: (context, index) {
          final item = items[index];
          return GestureDetector(
            onTap: () => onTap?.call(item),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(item.imageUrl, fit: BoxFit.cover),
                  if (item.caption != null)
                    Positioned(
                      left: 0,
                      right: 0,
                      bottom: 0,
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Colors.transparent, Color(0x99000000)],
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              item.caption!,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFFEAEAF0),
                              ),
                            ),
                            if (item.sub != null)
                              Text(
                                item.sub!,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFF525258),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
```

**SwiftUI:**
```swift
import SwiftUI

struct GalleryItem: Identifiable {
    let id: String
    let imageUrl: URL
    var caption: String? = nil
    var sub: String? = nil
}

struct DuvuGallery: View {
    let items: [GalleryItem]
    let columns: Int
    var onTap: ((GalleryItem) -> Void)? = nil

    init(items: [GalleryItem], columns: Int = 2, onTap: ((GalleryItem) -> Void)? = nil) {
        self.items = items
        self.columns = columns
        self.onTap = onTap
    }

    private var gridColumns: [GridItem] {
        Array(repeating: GridItem(.flexible(), spacing: 8), count: columns)
    }

    var body: some View {
        LazyVGrid(columns: gridColumns, spacing: 8) {
            ForEach(items) { item in
                Button { onTap?(item) } label: {
                    AsyncImage(url: item.imageUrl) { image in
                        image.resizable().aspectRatio(1, contentMode: .fill)
                    } placeholder: {
                        Rectangle().fill(Color(hex: "#1B1B20"))
                    }
                    .aspectRatio(1, contentMode: .fill)
                    .overlay(alignment: .bottom) {
                        if let caption = item.caption {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(caption)
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(Color(hex: "#EAEAF0"))
                                if let sub = item.sub {
                                    Text(sub)
                                        .font(.system(size: 12))
                                        .foregroundColor(Color(hex: "#525258"))
                                }
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(16)
                            .background(
                                LinearGradient(
                                    colors: [.clear, .black.opacity(0.6)],
                                    startPoint: .top, endPoint: .bottom
                                )
                            )
                        }
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(24)
    }
}
```

---

### Component: chat

**CSS:**
```css
.duvu-chat {
  display: flex;
  flex-direction: column;
  gap: var(--duvu-space-xs);
  padding: var(--duvu-space-md);
  max-width: 480px;
}
.duvu-chat__bubble {
  max-width: 75%;
  padding: 10px 14px;
  font-size: 15px;
  line-height: 1.45;
  word-break: break-word;
}
.duvu-chat__bubble--sent {
  align-self: flex-end;
  background: var(--duvu-accent);
  color: var(--duvu-btn-text);
  border-radius: var(--duvu-radius-lg) var(--duvu-radius-lg) var(--duvu-radius-xs) var(--duvu-radius-lg);
}
.duvu-chat__bubble--received {
  align-self: flex-start;
  background: var(--duvu-surface2);
  color: var(--duvu-fg);
  border-radius: var(--duvu-radius-lg) var(--duvu-radius-lg) var(--duvu-radius-lg) var(--duvu-radius-xs);
}
.duvu-chat__time {
  font-size: 11px;
  color: var(--duvu-fg3);
  padding: 0 4px;
}
.duvu-chat__time--sent { align-self: flex-end; }
.duvu-chat__time--received { align-self: flex-start; }
.duvu-chat__input-row {
  display: flex;
  gap: var(--duvu-space-sm);
  margin-top: var(--duvu-space-sm);
}
.duvu-chat__input {
  flex: 1;
  min-height: 44px;
  padding: 10px 16px;
  background: var(--duvu-surface2);
  color: var(--duvu-fg);
  border: none;
  border-radius: var(--duvu-radius-full);
  font-size: 15px;
  font-family: var(--duvu-font);
  outline: none;
}
.duvu-chat__send {
  width: 44px;
  height: 44px;
  border-radius: var(--duvu-radius-full);
  background: var(--duvu-accent);
  color: var(--duvu-btn-text);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  transition: transform 0.15s var(--duvu-ease-spring);
}
.duvu-chat__send:active { transform: scale(0.92); }
```

**React Native:**
```typescript
import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, FlatList, StyleSheet, KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface ChatMessage {
  id: string;
  text: string;
  sent: boolean;
  time: string;
}

interface DuvuChatProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
}

const DuvuChat: React.FC<DuvuChatProps> = ({ messages, onSend }) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.messageGroup}>
            <View style={[
              styles.bubble,
              item.sent ? styles.sent : styles.received,
            ]}>
              <Text style={[
                styles.bubbleText,
                { color: item.sent ? '#FFFFFF' : '#EAEAF0' },
              ]}>
                {item.text}
              </Text>
            </View>
            <Text style={[
              styles.time,
              { alignSelf: item.sent ? 'flex-end' : 'flex-start' },
            ]}>
              {item.time}
            </Text>
          </View>
        )}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="메시지 입력..."
          placeholderTextColor="#525258"
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <Pressable
          onPress={handleSend}
          style={({ pressed }) => [
            styles.sendBtn,
            pressed && { transform: [{ scale: 0.92 }] },
          ]}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#08080B', maxWidth: 480 },
  list: { padding: 16, gap: 4 },
  messageGroup: { gap: 2, marginBottom: 4 },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sent: {
    alignSelf: 'flex-end',
    backgroundColor: '#3182F6',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 6,
  },
  received: {
    alignSelf: 'flex-start',
    backgroundColor: '#1B1B20',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 16,
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  time: { fontSize: 11, color: '#525258', paddingHorizontal: 4 },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    paddingTop: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1B1B20',
    color: '#EAEAF0',
    borderRadius: 9999,
    fontSize: 15,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 9999,
    backgroundColor: '#3182F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});

export default DuvuChat;
```

**Flutter:**
```dart
import 'package:flutter/material.dart';

class ChatMessage {
  final String id;
  final String text;
  final bool sent;
  final String time;

  const ChatMessage({
    required this.id,
    required this.text,
    required this.sent,
    required this.time,
  });
}

class DuvuChat extends StatefulWidget {
  final List<ChatMessage> messages;
  final void Function(String text) onSend;

  const DuvuChat({super.key, required this.messages, required this.onSend});

  @override
  State<DuvuChat> createState() => _DuvuChatState();
}

class _DuvuChatState extends State<DuvuChat> {
  final _controller = TextEditingController();

  void _handleSend() {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    widget.onSend(text);
    _controller.clear();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(maxWidth: 480),
      color: const Color(0xFF08080B),
      child: Column(
        children: [
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: widget.messages.length,
              separatorBuilder: (_, __) => const SizedBox(height: 4),
              itemBuilder: (context, index) {
                final msg = widget.messages[index];
                return Column(
                  crossAxisAlignment:
                      msg.sent ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                  children: [
                    Container(
                      constraints: BoxConstraints(
                        maxWidth: MediaQuery.of(context).size.width * 0.75,
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: msg.sent
                            ? const Color(0xFF3182F6)
                            : const Color(0xFF1B1B20),
                        borderRadius: BorderRadius.only(
                          topLeft: const Radius.circular(16),
                          topRight: const Radius.circular(16),
                          bottomLeft: Radius.circular(msg.sent ? 16 : 6),
                          bottomRight: Radius.circular(msg.sent ? 6 : 16),
                        ),
                      ),
                      child: Text(
                        msg.text,
                        style: TextStyle(
                          fontSize: 15,
                          height: 1.45,
                          color: msg.sent
                              ? const Color(0xFFFFFFFF)
                              : const Color(0xFFEAEAF0),
                        ),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: Text(
                        msg.time,
                        style: const TextStyle(fontSize: 11, color: Color(0xFF525258)),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    onSubmitted: (_) => _handleSend(),
                    style: const TextStyle(fontSize: 15, color: Color(0xFFEAEAF0)),
                    decoration: InputDecoration(
                      hintText: '메시지 입력...',
                      hintStyle: const TextStyle(color: Color(0xFF525258)),
                      filled: true,
                      fillColor: const Color(0xFF1B1B20),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 10,
                      ),
                      constraints: const BoxConstraints(minHeight: 44),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(9999),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                SizedBox(
                  width: 44,
                  height: 44,
                  child: ElevatedButton(
                    onPressed: _handleSend,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF3182F6),
                      shape: const CircleBorder(),
                      padding: EdgeInsets.zero,
                      elevation: 0,
                    ),
                    child: const Icon(Icons.arrow_upward, color: Colors.white, size: 18),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}
```

**SwiftUI:**
```swift
import SwiftUI

struct ChatMessage: Identifiable {
    let id: String
    let text: String
    let sent: Bool
    let time: String
}

struct DuvuChat: View {
    let messages: [ChatMessage]
    let onSend: (String) -> Void
    @State private var input = ""

    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 4) {
                        ForEach(messages) { msg in
                            VStack(alignment: msg.sent ? .trailing : .leading, spacing: 2) {
                                Text(msg.text)
                                    .font(.system(size: 15))
                                    .foregroundColor(msg.sent ? .white : Color(hex: "#EAEAF0"))
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 10)
                                    .background(
                                        msg.sent
                                            ? Color(hex: "#3182F6")
                                            : Color(hex: "#1B1B20")
                                    )
                                    .clipShape(ChatBubbleShape(sent: msg.sent))

                                Text(msg.time)
                                    .font(.system(size: 11))
                                    .foregroundColor(Color(hex: "#525258"))
                                    .padding(.horizontal, 4)
                            }
                            .frame(maxWidth: .infinity, alignment: msg.sent ? .trailing : .leading)
                            .id(msg.id)
                        }
                    }
                    .padding(16)
                }
                .onChange(of: messages.count) { _ in
                    if let last = messages.last {
                        proxy.scrollTo(last.id, anchor: .bottom)
                    }
                }
            }

            HStack(spacing: 8) {
                TextField("메시지 입력...", text: $input)
                    .font(.system(size: 15))
                    .foregroundColor(Color(hex: "#EAEAF0"))
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .frame(minHeight: 44)
                    .background(Color(hex: "#1B1B20"))
                    .clipShape(Capsule())
                    .onSubmit(handleSend)

                Button(action: handleSend) {
                    Image(systemName: "arrow.up")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(.white)
                        .frame(width: 44, height: 44)
                        .background(Color(hex: "#3182F6"))
                        .clipShape(Circle())
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
            .padding(.bottom, 16)
        }
        .frame(maxWidth: 480)
        .background(Color(hex: "#08080B"))
    }

    private func handleSend() {
        let trimmed = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        onSend(trimmed)
        input = ""
    }
}

struct ChatBubbleShape: Shape {
    let sent: Bool

    func path(in rect: CGRect) -> Path {
        let tl: CGFloat = 16, tr: CGFloat = 16
        let bl: CGFloat = sent ? 16 : 6
        let br: CGFloat = sent ? 6 : 16
        var path = Path()
        path.move(to: CGPoint(x: rect.minX + tl, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX - tr, y: rect.minY))
        path.addArc(tangent1End: CGPoint(x: rect.maxX, y: rect.minY),
                     tangent2End: CGPoint(x: rect.maxX, y: rect.minY + tr), radius: tr)
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY - br))
        path.addArc(tangent1End: CGPoint(x: rect.maxX, y: rect.maxY),
                     tangent2End: CGPoint(x: rect.maxX - br, y: rect.maxY), radius: br)
        path.addLine(to: CGPoint(x: rect.minX + bl, y: rect.maxY))
        path.addArc(tangent1End: CGPoint(x: rect.minX, y: rect.maxY),
                     tangent2End: CGPoint(x: rect.minX, y: rect.maxY - bl), radius: bl)
        path.addLine(to: CGPoint(x: rect.minX, y: rect.minY + tl))
        path.addArc(tangent1End: CGPoint(x: rect.minX, y: rect.minY),
                     tangent2End: CGPoint(x: rect.minX + tl, y: rect.minY), radius: tl)
        return path
    }
}
