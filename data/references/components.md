# DUVU 컴포넌트 패턴

모든 컴포넌트는 DUVU 토큰만 사용한다. 매직 넘버 금지.

---

## 1. Button (버튼)

```css
.duvu-btn {
  min-height: 44px;
  padding: var(--duvu-control-padding-y, var(--duvu-space-sm)) var(--duvu-control-padding-x, var(--duvu-space-lg));
  border-radius: var(--duvu-btn-radius);
  font-size: var(--duvu-font-size-xs);
  font-weight: 600;
  font-family: var(--duvu-font);
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--duvu-space-sm);
  transition: background var(--duvu-dur-fast) var(--duvu-ease),
              transform var(--duvu-dur-fast) var(--duvu-ease-spring);
}
.duvu-btn:active { transform: scale(var(--duvu-active-scale, 0.97)); }
.duvu-btn:focus-visible { box-shadow: var(--duvu-focus-ring); outline: none; }

/* 3단계 강조 계층 */
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

/* 아이콘 버튼 */
.duvu-icon-btn {
  min-width: 44px;
  min-height: 44px;
  padding: var(--duvu-space-sm);
  border-radius: var(--duvu-radius-md);
  border: none;
  background: transparent;
  color: var(--duvu-fg2);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

**규칙**: 화면에 Primary 버튼 1개만. 나머지는 Secondary/Ghost.

---

## 2. Card (카드)

```css
.duvu-card {
  background: var(--duvu-surface);
  border-radius: var(--duvu-card-radius);
  padding: var(--duvu-space-lg);
  /* 테두리 없음 — surface vs bg 색차로 구분 */
  transition: transform var(--duvu-dur-fast) var(--duvu-ease),
              box-shadow var(--duvu-dur-fast) var(--duvu-ease);
}
.duvu-card:hover {
  transform: translateY(var(--duvu-hover-lift, calc(-1 * var(--duvu-space-xs))));
}

/* 카드 내부 간격 */
.duvu-card > * + * {
  margin-top: var(--duvu-space-md);
}
```

**금지**: 카드에 border 금지. surface vs bg 색차(최소 1.08:1)로 구분.
**금지**: 카드 안에 카드 중첩 금지 — surface2로 영역 구분.

---

## 3. Input (입력 필드)

```css
.duvu-input {
  min-height: 44px;
  padding: var(--duvu-input-padding-y, var(--duvu-space-sm)) var(--duvu-space-md);
  background: var(--duvu-surface2);
  border: none;
  border-radius: var(--duvu-radius-sm);
  font-family: var(--duvu-font);
  font-size: var(--duvu-font-size-xs);
  color: var(--duvu-fg);
  width: 100%;
  transition: box-shadow var(--duvu-dur-fast) var(--duvu-ease);
}
.duvu-input::placeholder {
  color: var(--duvu-fg3);
}
.duvu-input:focus {
  outline: none;
  box-shadow: var(--duvu-focus-ring);
}

/* 라벨 */
.duvu-label {
  font-size: var(--duvu-font-size-xs);
  font-weight: 500;
  color: var(--duvu-fg2);
  margin-bottom: var(--duvu-label-gap, var(--duvu-space-xs));
  display: block;
}
```

---

## 4. Navigation (내비게이션)

```css
.duvu-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--duvu-space-md) var(--duvu-space-xl);
  background: var(--duvu-bg);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(var(--duvu-nav-blur, var(--duvu-space-md)));
  -webkit-backdrop-filter: blur(var(--duvu-nav-blur, var(--duvu-space-md)));
}

.duvu-nav-links {
  display: flex;
  gap: var(--duvu-space-lg);
  list-style: none;
}

.duvu-nav-link {
  font-size: var(--duvu-font-size-xs);
  font-weight: 500;
  color: var(--duvu-fg2);
  text-decoration: none;
  padding: var(--duvu-space-sm) 0;
  transition: color var(--duvu-dur-fast) var(--duvu-ease);
}
.duvu-nav-link:hover,
.duvu-nav-link[aria-current="page"] {
  color: var(--duvu-fg);
}
```

---

## 5. Badge / Tag (뱃지)

```css
.duvu-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--duvu-badge-padding-y, var(--duvu-space-xs)) var(--duvu-space-sm);
  border-radius: var(--duvu-radius-xs);
  font-size: var(--duvu-font-size-xs);
  font-weight: 500;
  line-height: 1.33;
  background: color-mix(in srgb, var(--duvu-accent) var(--duvu-state-alpha-subtle, 12%), transparent);
  color: var(--duvu-accent);
}

/* 시맨틱 변형 */
.duvu-badge-success { background: color-mix(in srgb, var(--duvu-success) var(--duvu-state-alpha-subtle, 12%), transparent); color: var(--duvu-success); }
.duvu-badge-warning { background: color-mix(in srgb, var(--duvu-warning) var(--duvu-state-alpha-subtle, 12%), transparent); color: var(--duvu-warning); }
.duvu-badge-error { background: color-mix(in srgb, var(--duvu-error) var(--duvu-state-alpha-subtle, 12%), transparent); color: var(--duvu-error); }
```

---

## 6. Modal / Dialog (모달)

```css
.duvu-overlay {
  position: fixed;
  inset: 0;
  background: var(--duvu-overlay-bg, color-mix(in srgb, var(--duvu-bg) 50%, transparent));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(var(--duvu-overlay-blur, var(--duvu-space-xs)));
}

.duvu-modal {
  background: var(--duvu-surface);
  border-radius: var(--duvu-card-radius);
  padding: var(--duvu-space-xl);
  max-width: var(--duvu-modal-max-width, calc(var(--duvu-space-3xl) * 7.5));
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
}

.duvu-modal-title {
  font-size: var(--duvu-font-size-lg);
  font-weight: 600;
  color: var(--duvu-fg);
  margin-bottom: var(--duvu-space-md);
}

.duvu-modal-actions {
  display: flex;
  gap: var(--duvu-space-sm);
  justify-content: flex-end;
  margin-top: var(--duvu-space-xl);
}
```

---

## 7. Table (테이블)

```css
.duvu-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--duvu-font-size-xs);
}

.duvu-table th {
  text-align: left;
  padding: var(--duvu-space-sm) var(--duvu-space-md);
  font-weight: 500;
  font-size: var(--duvu-font-size-xs);
  color: var(--duvu-fg3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.duvu-table td {
  padding: var(--duvu-space-sm) var(--duvu-space-md);
  color: var(--duvu-fg);
}

/* 행 구분: 보더 아님, 배경색 교대 */
.duvu-table tr:nth-child(even) td {
  background: var(--duvu-surface);
}

.duvu-table tr:hover td {
  background: var(--duvu-surface2);
}
```

**규칙**: 테이블에 border 금지. 배경색 교대 또는 간격으로 행을 구분.

---

## 8. Toast / Notification (토스트)

```css
.duvu-toast {
  position: fixed;
  bottom: var(--duvu-space-xl);
  right: var(--duvu-space-xl);
  background: var(--duvu-surface);
  border-radius: var(--duvu-card-radius);
  padding: var(--duvu-space-md) var(--duvu-space-lg);
  box-shadow: var(--duvu-shadow-md);
  display: flex;
  align-items: center;
  gap: var(--duvu-space-sm);
  font-size: var(--duvu-font-size-xs);
  color: var(--duvu-fg);
  z-index: 2000;
  animation: duvu-slide-up var(--duvu-dur) var(--duvu-ease);
}

@keyframes duvu-slide-up {
  from { transform: translateY(var(--duvu-enter-offset, var(--duvu-space-lg))); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

---

## 9. Tabs (탭)

```css
.duvu-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--duvu-surface2);
}

.duvu-tab {
  padding: var(--duvu-space-sm) var(--duvu-space-md);
  min-height: 44px;
  font-size: var(--duvu-font-size-xs);
  font-weight: 500;
  color: var(--duvu-fg3);
  background: none;
  border: none;
  cursor: pointer;
  position: relative;
  transition: color var(--duvu-dur-fast) var(--duvu-ease);
}

.duvu-tab[aria-selected="true"] {
  color: var(--duvu-fg);
}
.duvu-tab[aria-selected="true"]::after {
  content: '';
  position: absolute;
  bottom: calc(-1 * var(--duvu-border-width));
  left: 0;
  right: 0;
  height: var(--duvu-active-indicator-height, calc(var(--duvu-border-width) * 2));
  background: var(--duvu-accent);
  border-radius: var(--duvu-border-width);
}
```

**참고**: 탭 하단 구분선(border-bottom)은 기능적으로 필요한 보더이므로 허용.

---

## 10. Chip / Pill (칩)

```css
.duvu-chip {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: var(--duvu-space-xs) var(--duvu-space-md);
  border-radius: var(--duvu-radius-full);
  font-size: var(--duvu-font-size-xs);
  font-weight: 500;
  color: var(--duvu-fg2);
  background: var(--duvu-surface2);
  cursor: pointer;
  transition: background var(--duvu-dur-fast) var(--duvu-ease),
              color var(--duvu-dur-fast) var(--duvu-ease);
}

.duvu-chip[aria-selected="true"] {
  background: var(--duvu-accent);
  color: var(--duvu-btn-text);
}
```

---

## 11. Avatar (아바타)

```css
.duvu-avatar {
  width: var(--duvu-avatar-size-md, var(--duvu-touch-min));
  height: var(--duvu-avatar-size-md, var(--duvu-touch-min));
  border-radius: 50%;
  background: var(--duvu-surface2);
  color: var(--duvu-fg2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--duvu-font-size-xs);
  font-weight: 600;
  overflow: hidden;
}
.duvu-avatar img { width: 100%; height: 100%; object-fit: cover; }
.duvu-avatar-sm { width: var(--duvu-avatar-size-sm, var(--duvu-space-xl)); height: var(--duvu-avatar-size-sm, var(--duvu-space-xl)); font-size: var(--duvu-font-size-xs); }
.duvu-avatar-lg { width: var(--duvu-avatar-size-lg, var(--duvu-space-3xl)); height: var(--duvu-avatar-size-lg, var(--duvu-space-3xl)); font-size: var(--duvu-font-size-xl); }
```

---

## 12. Dropdown / Select (드롭다운)

```css
.duvu-select {
  min-height: 44px;
  padding: var(--duvu-input-padding-y, var(--duvu-space-sm)) var(--duvu-space-md);
  background: var(--duvu-surface2);
  border: none;
  border-radius: var(--duvu-radius-sm);
  font-family: var(--duvu-font);
  font-size: var(--duvu-font-size-xs);
  color: var(--duvu-fg);
  appearance: none;
  cursor: pointer;
  background-image: var(--duvu-select-caret, none);
  background-repeat: no-repeat;
  background-position: right var(--duvu-space-md) center;
  padding-right: var(--duvu-select-caret-space, var(--duvu-space-2xl));
}
```

---

## 13. Toggle / Switch (토글)

```css
.duvu-toggle {
  width: var(--duvu-toggle-width, var(--duvu-space-2xl));
  height: var(--duvu-toggle-height, var(--duvu-space-xl));
  border-radius: var(--duvu-radius-full);
  background: var(--duvu-surface2);
  border: none;
  cursor: pointer;
  position: relative;
  transition: background var(--duvu-dur-fast) var(--duvu-ease);
}
.duvu-toggle::after {
  content: '';
  position: absolute;
  top: var(--duvu-toggle-inset, var(--duvu-space-xs));
  left: var(--duvu-toggle-inset, var(--duvu-space-xs));
  width: var(--duvu-toggle-thumb-size, var(--duvu-space-lg));
  height: var(--duvu-toggle-thumb-size, var(--duvu-space-lg));
  border-radius: 50%;
  background: var(--duvu-fg3);
  transition: transform var(--duvu-dur-fast) var(--duvu-ease-spring),
              background var(--duvu-dur-fast) var(--duvu-ease);
}
.duvu-toggle[aria-checked="true"] {
  background: var(--duvu-accent);
}
.duvu-toggle[aria-checked="true"]::after {
  transform: translateX(var(--duvu-toggle-translate, var(--duvu-space-lg)));
  background: var(--duvu-btn-text);
}
```

---

## 14. Skeleton Loader (스켈레톤)

```css
.duvu-skeleton {
  background: var(--duvu-surface2);
  border-radius: var(--duvu-radius-sm);
  animation: duvu-pulse var(--duvu-dur-slow) var(--duvu-ease) infinite;
}
.duvu-skeleton-text {
  height: var(--duvu-skeleton-line-height, var(--duvu-font-size-xs));
  margin-bottom: var(--duvu-space-sm);
}
.duvu-skeleton-heading {
  height: var(--duvu-skeleton-heading-height, var(--duvu-space-lg));
  width: 60%;
  margin-bottom: var(--duvu-space-md);
}

@keyframes duvu-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
```

---

## 15. Divider (구분선)

```css
.duvu-divider {
  height: var(--duvu-border-width);
  background: var(--duvu-surface2);
  margin: var(--duvu-space-lg) 0;
}
```

**참고**: 구분선은 허용되지만, 가능하면 간격(spacing)으로 구분하는 것이 우선.

---

## 16. MD3 상태 레이어 (공통)

모든 인터랙티브 요소에 적용하는 상태 오버레이:

```css
.duvu-interactive {
  position: relative;
  overflow: hidden;
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
  background: color-mix(in srgb, var(--duvu-accent) var(--duvu-level-1-alpha, 8%), transparent);
}
.duvu-interactive:focus-visible::after {
  background: color-mix(in srgb, var(--duvu-accent) var(--duvu-level-2-alpha, 12%), transparent);
}
.duvu-interactive:active::after {
  background: color-mix(in srgb, var(--duvu-accent) var(--duvu-level-3-alpha, 16%), transparent);
}
```

---

## 컴포넌트 조합 규칙

1. **간격**: 컴포넌트 간 최소 `--duvu-space-sm`(8px), 기본 `--duvu-space-md`(16px)
2. **계층**: 배경 bg → 카드 surface → 강조 영역 surface2 (최대 3단계)
3. **보더**: 기능적 보더만 허용 (탭 하단선, 입력 포커스 링)
4. **일관성**: 같은 역할의 요소는 같은 radius, padding, font-size
5. **접근성**: 모든 인터랙티브 요소에 focus-visible 스타일 필수
