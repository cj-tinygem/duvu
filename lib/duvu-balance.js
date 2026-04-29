const VIEWPORT_SAMPLES = {
  mobile: { width: 390, height: 844 },
  short: { width: 844, height: 390 },
  base: { width: 1440, height: 900 },
  tall: { width: 1440, height: 1080 },
  wide: { width: 1920, height: 1080 },
};

const RESTRAINT_PROFILES = {
  minimal: {
    spacingScale: 0.8,
    groupGapScale: 0.84,
    labelGapScale: 0.88,
    readingScale: 0.96,
    gridScale: 0.9,
    densityMode: 'ultra-tight',
  },
  low: {
    spacingScale: 0.9,
    groupGapScale: 0.9,
    labelGapScale: 0.94,
    readingScale: 0.98,
    gridScale: 0.95,
    densityMode: 'compact',
  },
  medium: {
    spacingScale: 1,
    groupGapScale: 1,
    labelGapScale: 1,
    readingScale: 1,
    gridScale: 1,
    densityMode: 'balanced',
  },
  high: {
    spacingScale: 1.12,
    groupGapScale: 1.08,
    labelGapScale: 1.05,
    readingScale: 1.04,
    gridScale: 1.04,
    densityMode: 'airy',
  },
};

const VIEWPORT_PROFILES = {
  mobile: {
    spacingScale: 0.86,
    gapScale: 0.9,
    readingScale: 0.9,
    pillMinWidth: 90,
    pillMaxCols: 3,
    tabMinWidth: 96,
    tabMaxCols: 3,
    previewMinWidth: 240,
  },
  short: {
    spacingScale: 0.76,
    gapScale: 0.82,
    readingScale: 0.9,
    pillMinWidth: 112,
    pillMaxCols: 6,
    tabMinWidth: 98,
    tabMaxCols: 6,
    previewMinWidth: 240,
  },
  base: {
    spacingScale: 1,
    gapScale: 1,
    readingScale: 1,
    pillMinWidth: 132,
    pillMaxCols: 6,
    tabMinWidth: 104,
    tabMaxCols: 7,
    previewMinWidth: 260,
  },
  tall: {
    spacingScale: 1.08,
    gapScale: 1.04,
    readingScale: 1.04,
    pillMinWidth: 138,
    pillMaxCols: 6,
    tabMinWidth: 108,
    tabMaxCols: 7,
    previewMinWidth: 280,
  },
  wide: {
    spacingScale: 1.12,
    gapScale: 1.08,
    readingScale: 1.08,
    pillMinWidth: 144,
    pillMaxCols: 8,
    tabMinWidth: 112,
    tabMaxCols: 7,
    previewMinWidth: 300,
  },
};

const JOURNEY_PROFILES = {
  conversion: {
    sectionScale: 1,
    titleWidth: 820,
    heroSubWidth: 600,
    contentWidth: 680,
    previewGapScale: 0.96,
    alignmentMode: 'center',
  },
  operational: {
    sectionScale: 0.9,
    titleWidth: 860,
    heroSubWidth: 620,
    contentWidth: 700,
    previewGapScale: 0.9,
    alignmentMode: 'center',
  },
  reading: {
    sectionScale: 1.02,
    titleWidth: 760,
    heroSubWidth: 620,
    contentWidth: 680,
    previewGapScale: 1,
    alignmentMode: 'start',
  },
  immersive: {
    sectionScale: 1.12,
    titleWidth: 900,
    heroSubWidth: 640,
    contentWidth: 720,
    previewGapScale: 1.08,
    alignmentMode: 'center',
  },
};

function roundPx(value, floor = 0) {
  return Math.max(floor, Math.round(value));
}

function readLayoutToken(layoutTokens, key, fallback) {
  const raw = layoutTokens?.[key];
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const parsed = Number.parseFloat(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toText(value) {
  return String(value || '').toLowerCase();
}

function inferJourneyMode({ template = {}, pagePattern = null } = {}) {
  const bag = [
    pagePattern?.intent,
    pagePattern?.why,
    ...(template.tags || []),
    ...(template.domainTags || []),
    template.name,
    template.description,
  ].map(toText).join(' ');

  if (/(dashboard|admin|b2b|webapp|dev|data|의사결정|관리|기술적 확신)/.test(bag)) return 'operational';
  if (/(editorial|article|content|읽기|몰입|author)/.test(bag)) return 'reading';
  if (/(luxury|portfolio|gallery|creative|감성|경험|immersive)/.test(bag)) return 'immersive';
  return 'conversion';
}

function collectComponentProminence({ template = {}, components = [] } = {}) {
  const componentMap = new Map((components || []).map(component => [component.id, component]));
  const cards = template.preview?.cards || [];
  const levels = cards
    .map(card => componentMap.get(card.type)?.level)
    .filter(level => Number.isFinite(level));
  const maxLevel = levels.length ? Math.max(...levels) : 3;
  const averageLevel = levels.length ? levels.reduce((sum, level) => sum + level, 0) / levels.length : 3;
  return {
    maxLevel,
    averageLevel: Number(averageLevel.toFixed(2)),
    dominantAction: maxLevel >= 5,
    denseContent: cards.length >= 4 || averageLevel < 3.2,
  };
}

export function getBalanceViewportMode(width = 0, height = 0) {
  if (width <= 640) return 'mobile';
  if (height <= 420) return 'short';
  if (width >= 1680) return 'wide';
  if (height >= 980) return 'tall';
  return 'base';
}

export function buildBalanceProfile({
  layout = {},
  template = {},
  components = [],
  pagePattern = null,
  width = VIEWPORT_SAMPLES.base.width,
  height = VIEWPORT_SAMPLES.base.height,
  layoutTokens = {},
} = {}) {
  const viewportMode = getBalanceViewportMode(width, height);
  const restraint = layout.restraint || 'medium';
  const restraintProfile = RESTRAINT_PROFILES[restraint] || RESTRAINT_PROFILES.medium;
  const viewportProfile = VIEWPORT_PROFILES[viewportMode] || VIEWPORT_PROFILES.base;
  const journeyMode = inferJourneyMode({ template, pagePattern });
  const journeyProfile = JOURNEY_PROFILES[journeyMode] || JOURNEY_PROFILES.conversion;
  const prominence = collectComponentProminence({ template, components });
  const densityMultiplier = typeof layout.multiplier === 'number' && Number.isFinite(layout.multiplier)
    ? layout.multiplier
    : 1;

  const baseSectionGap = readLayoutToken(layoutTokens, 'space-section', 96);
  const baseHeroGap = readLayoutToken(layoutTokens, 'space-hero', 160);
  const baseTitleGap = readLayoutToken(layoutTokens, 'space-title-margin', 48);
  const baseSubtitleGap = readLayoutToken(layoutTokens, 'space-subtitle-margin', 40);
  const baseLabelGap = readLayoutToken(layoutTokens, 'section-label-gap', 20);
  const basePillGap = readLayoutToken(layoutTokens, 'pill-grid-gap', 8);
  const basePreviewGap = readLayoutToken(layoutTokens, 'preview-grid-gap', 16);
  const baseHeroSubMax = readLayoutToken(layoutTokens, 'hero-sub-max-width', 600);
  const baseContentMax = readLayoutToken(layoutTokens, 'content-max-width', 680);
  const baseCardPadding = readLayoutToken(layoutTokens, 'card-padding', 24);

  const spacingScale = restraintProfile.spacingScale * viewportProfile.spacingScale * journeyProfile.sectionScale * densityMultiplier;
  const groupGapScale = restraintProfile.groupGapScale * viewportProfile.gapScale;
  const prominenceBias = prominence.dominantAction ? 1.04 : 1;
  const denseBias = prominence.denseContent ? 0.94 : 1;

  const sectionGapPx = roundPx(baseSectionGap * spacingScale * denseBias, 56);
  const heroTopPx = roundPx(baseHeroGap * spacingScale * prominenceBias, 88);
  const titleMarginPx = roundPx(baseTitleGap * groupGapScale * prominenceBias, 24);
  const subtitleMarginPx = roundPx(baseSubtitleGap * groupGapScale, 20);
  const sectionLabelGapPx = roundPx(baseLabelGap * restraintProfile.labelGapScale * viewportProfile.gapScale, 18);
  const pillGapPx = roundPx(basePillGap * groupGapScale, 6);
  const previewGapPx = roundPx(basePreviewGap * groupGapScale * journeyProfile.previewGapScale, 10);
  const heroSubBaseWidth = Math.max(baseHeroSubMax, journeyProfile.heroSubWidth || baseHeroSubMax);
  const contentBaseWidth = Math.max(baseContentMax, journeyProfile.contentWidth || baseContentMax);
  const heroSubMaxWidthPx = roundPx(heroSubBaseWidth * restraintProfile.readingScale * viewportProfile.readingScale, 480);
  const contentMaxWidthPx = roundPx(contentBaseWidth * restraintProfile.readingScale * viewportProfile.readingScale, 600);
  const sectionTitleMaxWidthPx = roundPx(journeyProfile.titleWidth * viewportProfile.readingScale, 680);
  const pillMinWidthPx = roundPx(viewportProfile.pillMinWidth * restraintProfile.gridScale, 96);
  const tabMinWidthPx = roundPx(viewportProfile.tabMinWidth * restraintProfile.gridScale, 92);
  const previewMinWidthPx = roundPx(viewportProfile.previewMinWidth * restraintProfile.gridScale, 220);
  const cardPaddingPx = roundPx(baseCardPadding * groupGapScale * denseBias, 16);
  const pillMaxCols = viewportProfile.pillMaxCols;
  const tabMaxCols = viewportProfile.tabMaxCols;

  return {
    viewportMode,
    journeyMode,
    restraint,
    densityMode: restraintProfile.densityMode,
    alignmentMode: template.heroAlign === 'left' ? 'start' : journeyProfile.alignmentMode,
    wrapMode: 'balance',
    separationMode: 'spacing>color>shadow>border',
    prominence,
    sectionGapPx,
    heroTopPx,
    titleMarginPx,
    subtitleMarginPx,
    sectionLabelGapPx,
    pillGapPx,
    previewGapPx,
    heroSubMaxWidthPx,
    contentMaxWidthPx,
    sectionTitleMaxWidthPx,
    pillMinWidthPx,
    pillMaxCols,
    tabMinWidthPx,
    tabMaxCols,
    previewMinWidthPx,
    cardPaddingPx,
    paletteBias: viewportMode === 'short' ? 'text-first' : viewportMode === 'tall' || viewportMode === 'wide' ? 'swatch-first' : 'balanced',
  };
}

export function getBalanceCssVars(profile) {
  return {
    '--duvu-balanced-section-gap': `${profile.sectionGapPx}px`,
    '--duvu-balanced-hero-top': `${profile.heroTopPx}px`,
    '--duvu-balanced-title-margin': `${profile.titleMarginPx}px`,
    '--duvu-balanced-subtitle-margin': `${profile.subtitleMarginPx}px`,
    '--duvu-balanced-section-label-gap': `${profile.sectionLabelGapPx}px`,
    '--duvu-balanced-pill-gap': `${profile.pillGapPx}px`,
    '--duvu-balanced-tab-gap': `${profile.pillGapPx}px`,
    '--duvu-balanced-preview-gap': `${profile.previewGapPx}px`,
    '--duvu-balanced-hero-sub-max-width': `${profile.heroSubMaxWidthPx}px`,
    '--duvu-balanced-content-max-width': `${profile.contentMaxWidthPx}px`,
    '--duvu-balanced-section-title-max-width': `${profile.sectionTitleMaxWidthPx}px`,
    '--duvu-balanced-pill-min-width': `${profile.pillMinWidthPx}px`,
    '--duvu-balanced-pill-max-cols': String(profile.pillMaxCols),
    '--duvu-balanced-tab-min-width': `${profile.tabMinWidthPx}px`,
    '--duvu-balanced-tab-max-cols': String(profile.tabMaxCols),
    '--duvu-balanced-preview-min-width': `${profile.previewMinWidthPx}px`,
    '--duvu-balanced-card-padding': `${profile.cardPaddingPx}px`,
  };
}

export function buildBalanceContract({
  layout = {},
  template = {},
  components = [],
  pagePattern = null,
  layoutTokens = {},
} = {}) {
  const viewportProfiles = Object.fromEntries(
    Object.entries(VIEWPORT_SAMPLES).map(([mode, size]) => [
      mode,
      buildBalanceProfile({
        layout,
        template,
        components,
        pagePattern,
        width: size.width,
        height: size.height,
        layoutTokens,
      }),
    ]),
  );
  const base = viewportProfiles.base;
  return {
    journeyMode: base.journeyMode,
    restraint: base.restraint,
    densityMode: base.densityMode,
    alignmentMode: base.alignmentMode,
    wrapMode: base.wrapMode,
    separationMode: base.separationMode,
    paletteBias: base.paletteBias,
    componentProminence: base.prominence,
    rules: [
      '상위 intent/meaning/page pattern을 먼저 읽고, spacing과 정렬은 그 뒤에 결정한다.',
      '그룹 간 간격은 그룹 내 간격보다 더 커야 하며, 좁은 화면일수록 텍스트 블록을 먼저 압축한다.',
      '줄바꿈은 balance를 기본으로 하고, singleton 마지막 줄이 생기면 열 수와 폭을 다시 계산한다.',
      '경계는 spacing→색차→shadow→border 순서로 해결한다.',
      '팔레트 같은 특수 UI는 전역 밸런스 규칙 위에 전용 기하 엔진을 얹는다.',
    ],
    viewportProfiles,
  };
}
