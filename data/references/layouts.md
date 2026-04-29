# DUVU 페이지 레이아웃 패턴

모든 레이아웃은 DUVU 토큰만 사용한다. 반응형 필수.

---

## 1. Dashboard (대시보드)

사이드바 + 콘텐츠 영역. 데이터 밀도 높음.

```css
.duvu-dashboard {
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 100vh;
  background: var(--duvu-bg);
}

/* 사이드바 */
.duvu-sidebar {
  background: var(--duvu-surface);
  padding: var(--duvu-space-lg) var(--duvu-space-md);
  display: flex;
  flex-direction: column;
  gap: var(--duvu-space-xs);
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.duvu-sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--duvu-space-sm);
  padding: var(--duvu-space-sm) var(--duvu-space-md);
  border-radius: var(--duvu-radius-sm);
  font-size: var(--duvu-font-size-xs);
  font-weight: 500;
  color: var(--duvu-fg2);
  text-decoration: none;
  min-height: 44px;
  transition: background var(--duvu-dur-fast) var(--duvu-ease),
              color var(--duvu-dur-fast) var(--duvu-ease);
}
.duvu-sidebar-item:hover { background: var(--duvu-surface2); }
.duvu-sidebar-item[aria-current="page"] {
  background: rgba(var(--duvu-accent-rgb), 0.1);
  color: var(--duvu-accent);
}

/* 메인 콘텐츠 */
.duvu-main {
  padding: var(--duvu-space-xl);
  overflow-y: auto;
}

/* KPI 그리드 */
.duvu-kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--duvu-space-md);
  margin-bottom: var(--duvu-space-xl);
}

.duvu-kpi-card {
  background: var(--duvu-surface);
  border-radius: var(--duvu-card-radius);
  padding: var(--duvu-space-lg);
}
.duvu-kpi-label {
  font-size: var(--duvu-font-size-xs);
  font-weight: 500;
  color: var(--duvu-fg3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.duvu-kpi-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--duvu-fg);
  margin-top: var(--duvu-space-xs);
  font-variant-numeric: tabular-nums;
}

/* 반응형: 모바일에서 사이드바 숨김 */
@media (max-width: 768px) {
  .duvu-dashboard {
    grid-template-columns: 1fr;
  }
  .duvu-sidebar {
    position: fixed;
    left: -280px;
    width: 260px;
    z-index: 200;
    transition: left var(--duvu-dur) var(--duvu-ease);
  }
  .duvu-sidebar.open { left: 0; }
}
```

---

## 2. Landing Page (랜딩 페이지)

히어로 → 특징 → CTA. 수직 흐름, 넓은 여백.

```css
/* 히어로 섹션 */
.duvu-hero {
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: var(--duvu-space-3xl) var(--duvu-space-xl);
}

.duvu-hero-title {
  font-size: clamp(36px, 6vw, 72px);
  font-weight: 700;
  color: var(--duvu-fg);
  line-height: 1.1;
  max-width: 800px;
  letter-spacing: 0;
}

.duvu-hero-subtitle {
  font-size: clamp(16px, 2vw, 20px);
  color: var(--duvu-fg2);
  max-width: 560px;
  margin-top: var(--duvu-space-lg);
  line-height: 1.6;
}

.duvu-hero-actions {
  display: flex;
  gap: var(--duvu-space-md);
  margin-top: var(--duvu-space-xl);
}

/* 특징 섹션 */
.duvu-features {
  padding: var(--duvu-space-3xl) var(--duvu-space-xl);
  max-width: 1200px;
  margin: 0 auto;
}

.duvu-features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--duvu-space-xl);
}

.duvu-feature-item {
  padding: var(--duvu-space-lg);
}
.duvu-feature-icon {
  width: 48px;
  height: 48px;
  color: var(--duvu-accent);
  margin-bottom: var(--duvu-space-md);
}
.duvu-feature-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--duvu-fg);
  margin-bottom: var(--duvu-space-sm);
}
.duvu-feature-desc {
  font-size: var(--duvu-font-size-xs);
  color: var(--duvu-fg2);
  line-height: 1.6;
}

/* CTA 섹션 */
.duvu-cta-section {
  padding: var(--duvu-space-3xl) var(--duvu-space-xl);
  text-align: center;
  background: var(--duvu-surface);
  border-radius: var(--duvu-card-radius);
  margin: var(--duvu-space-3xl) var(--duvu-space-xl);
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}
```

---

## 3. Form Page (폼 페이지)

좁은 너비, 수직 흐름. 로그인/회원가입/설정.

```css
.duvu-form-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--duvu-space-xl);
  background: var(--duvu-bg);
}

.duvu-form-container {
  width: 100%;
  max-width: 420px;
}

.duvu-form-header {
  text-align: center;
  margin-bottom: var(--duvu-space-xl);
}
.duvu-form-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--duvu-fg);
}
.duvu-form-header p {
  font-size: var(--duvu-font-size-xs);
  color: var(--duvu-fg2);
  margin-top: var(--duvu-space-sm);
}

.duvu-form {
  background: var(--duvu-surface);
  border-radius: var(--duvu-card-radius);
  padding: var(--duvu-space-xl);
}

.duvu-form-group {
  margin-bottom: var(--duvu-space-md);
}
.duvu-form-group:last-of-type {
  margin-bottom: var(--duvu-space-xl);
}
```

---

## 4. List / Feed (리스트/피드)

좁은 콘텐츠 영역, 무한 스크롤 패턴.

```css
.duvu-feed {
  max-width: 680px;
  margin: 0 auto;
  padding: var(--duvu-space-xl) var(--duvu-space-md);
}

.duvu-feed-item {
  background: var(--duvu-surface);
  border-radius: var(--duvu-card-radius);
  padding: var(--duvu-space-lg);
  margin-bottom: var(--duvu-space-md);
}

.duvu-feed-item-header {
  display: flex;
  align-items: center;
  gap: var(--duvu-space-sm);
  margin-bottom: var(--duvu-space-md);
}

.duvu-feed-item-meta {
  font-size: var(--duvu-font-size-xs);
  color: var(--duvu-fg3);
}

.duvu-feed-item-body {
  font-size: var(--duvu-font-size-xs);
  color: var(--duvu-fg);
  line-height: 1.6;
}

.duvu-feed-item-actions {
  display: flex;
  gap: var(--duvu-space-md);
  margin-top: var(--duvu-space-md);
  padding-top: var(--duvu-space-md);
}
```

---

## 5. Settings (설정)

사이드 탭 + 콘텐츠 패널. 좁은 너비.

```css
.duvu-settings {
  display: grid;
  grid-template-columns: 220px 1fr;
  max-width: 960px;
  margin: 0 auto;
  padding: var(--duvu-space-xl);
  gap: var(--duvu-space-xl);
}

.duvu-settings-nav {
  display: flex;
  flex-direction: column;
  gap: var(--duvu-space-xs);
}

.duvu-settings-nav-item {
  padding: var(--duvu-space-sm) var(--duvu-space-md);
  border-radius: var(--duvu-radius-sm);
  font-size: var(--duvu-font-size-xs);
  font-weight: 500;
  color: var(--duvu-fg2);
  text-decoration: none;
  min-height: 44px;
  display: flex;
  align-items: center;
}
.duvu-settings-nav-item[aria-current="page"] {
  background: var(--duvu-surface);
  color: var(--duvu-fg);
}

.duvu-settings-panel {
  background: var(--duvu-surface);
  border-radius: var(--duvu-card-radius);
  padding: var(--duvu-space-xl);
}

.duvu-settings-section {
  margin-bottom: var(--duvu-space-xl);
}
.duvu-settings-section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--duvu-fg);
  margin-bottom: var(--duvu-space-md);
}

.duvu-settings-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--duvu-space-md) 0;
}
.duvu-settings-row + .duvu-settings-row {
  border-top: 1px solid var(--duvu-surface2);
}

@media (max-width: 768px) {
  .duvu-settings { grid-template-columns: 1fr; }
}
```

---

## 6. Grid Gallery (갤러리)

이미지/프로젝트 그리드. Masonry 또는 균일 그리드.

```css
.duvu-gallery {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--duvu-space-xl);
}

.duvu-gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--duvu-space-md);
}

.duvu-gallery-item {
  border-radius: var(--duvu-card-radius);
  overflow: hidden;
  background: var(--duvu-surface);
  cursor: pointer;
  transition: transform var(--duvu-dur-fast) var(--duvu-ease);
}
.duvu-gallery-item:hover {
  transform: translateY(var(--duvu-hover-lift, -2px));
}

.duvu-gallery-img {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
  display: block;
}

.duvu-gallery-info {
  padding: var(--duvu-space-md);
}
.duvu-gallery-title {
  font-size: var(--duvu-font-size-xs);
  font-weight: 600;
  color: var(--duvu-fg);
}
.duvu-gallery-subtitle {
  font-size: var(--duvu-font-size-xs);
  color: var(--duvu-fg3);
  margin-top: var(--duvu-space-xs);
}

/* 최대 4열, singleton 마지막 줄 방지 */
@media (min-width: 1200px) {
  .duvu-gallery-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
@media (max-width: 640px) {
  .duvu-gallery-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--duvu-space-sm);
  }
}
```

---

## 7. Article / Editorial (기사/에디토리얼)

최적 읽기 너비(65ch). 타이포그래피 중심.

```css
.duvu-article {
  max-width: 65ch;
  margin: 0 auto;
  padding: var(--duvu-space-3xl) var(--duvu-space-xl);
}

.duvu-article-title {
  font-size: clamp(28px, 4vw, 48px);
  font-weight: 700;
  color: var(--duvu-fg);
  line-height: 1.15;
  letter-spacing: 0;
}

.duvu-article-meta {
  font-size: var(--duvu-font-size-xs);
  color: var(--duvu-fg3);
  margin-top: var(--duvu-space-md);
  display: flex;
  gap: var(--duvu-space-md);
}

.duvu-article-body {
  margin-top: var(--duvu-space-xl);
  font-size: 16px;
  line-height: 1.7;
  color: var(--duvu-fg);
}
.duvu-article-body h2 {
  font-size: 24px;
  font-weight: 600;
  margin-top: var(--duvu-space-2xl);
  margin-bottom: var(--duvu-space-md);
}
.duvu-article-body h3 {
  font-size: 18px;
  font-weight: 600;
  margin-top: var(--duvu-space-xl);
  margin-bottom: var(--duvu-space-sm);
}
.duvu-article-body p + p {
  margin-top: var(--duvu-space-md);
}
.duvu-article-body blockquote {
  padding-left: var(--duvu-space-lg);
  border-left: 3px solid var(--duvu-accent);
  color: var(--duvu-fg2);
  font-style: italic;
  margin: var(--duvu-space-lg) 0;
}
.duvu-article-body code {
  font-family: var(--duvu-font-code);
  font-size: 0.875em;
  background: var(--duvu-surface2);
  padding: 2px 6px;
  border-radius: var(--duvu-radius-xs);
}
```

---

## 8. Pricing (가격)

3열 비교 카드. 추천 플랜 강조.

```css
.duvu-pricing {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--duvu-space-3xl) var(--duvu-space-xl);
  text-align: center;
}

.duvu-pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--duvu-space-lg);
  margin-top: var(--duvu-space-xl);
}

.duvu-pricing-card {
  background: var(--duvu-surface);
  border-radius: var(--duvu-card-radius);
  padding: var(--duvu-space-xl);
  text-align: left;
  display: flex;
  flex-direction: column;
}

/* 추천 플랜 강조 — 보더가 아닌 배경색으로 */
.duvu-pricing-card.featured {
  background: var(--duvu-accent);
  color: var(--duvu-btn-text);
}
.duvu-pricing-card.featured .duvu-pricing-price,
.duvu-pricing-card.featured .duvu-pricing-name {
  color: var(--duvu-btn-text);
}
.duvu-pricing-card.featured .duvu-pricing-desc {
  color: rgba(255,255,255,0.8);
}

.duvu-pricing-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--duvu-fg);
}
.duvu-pricing-price {
  font-size: 36px;
  font-weight: 700;
  color: var(--duvu-fg);
  margin-top: var(--duvu-space-md);
  font-variant-numeric: tabular-nums;
}
.duvu-pricing-price span {
  font-size: var(--duvu-font-size-xs);
  font-weight: 400;
  color: var(--duvu-fg2);
}
.duvu-pricing-desc {
  font-size: var(--duvu-font-size-xs);
  color: var(--duvu-fg2);
  margin-top: var(--duvu-space-sm);
}

.duvu-pricing-features {
  margin-top: var(--duvu-space-xl);
  flex: 1;
  list-style: none;
}
.duvu-pricing-features li {
  padding: var(--duvu-space-sm) 0;
  font-size: var(--duvu-font-size-xs);
  display: flex;
  align-items: center;
  gap: var(--duvu-space-sm);
}

.duvu-pricing-cta {
  margin-top: var(--duvu-space-xl);
}
```

---

## 공통 반응형 규칙

```css
/* 컨테이너 */
.duvu-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--duvu-space-xl);
}

/* 모바일 오버라이드 */
@media (max-width: 768px) {
  .duvu-container {
    padding: 0 var(--duvu-space-md);
  }
}

/* 반응형 텍스트 */
.duvu-text-hero {
  font-size: clamp(32px, 6vw, 72px);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: 0;
}
.duvu-text-title {
  font-size: clamp(24px, 4vw, 36px);
  font-weight: 600;
  line-height: 1.2;
}
```

---

## 레이아웃 조합 규칙

1. **최대 너비**: 콘텐츠 1200px, 텍스트 65ch, 폼 420px
2. **간격**: 섹션 간 `--duvu-space-3xl`(64px), 섹션 내 `--duvu-space-xl`(32px)
3. **그리드**: 최대 4열, 모바일 1~2열, singleton 마지막 줄 방지
4. **중첩**: 최대 3단계 (bg → surface → surface2)
5. **반응형**: 768px 브레이크포인트 필수, `clamp()` 활용
