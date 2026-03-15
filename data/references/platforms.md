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
