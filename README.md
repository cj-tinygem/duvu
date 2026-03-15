# DUVU — 범용 디자인 시스템 엔진

> 소스 색상 하나에서 WCAG AA · Apple HIG · Material Design 3를 동시 준수하는 완전한 디자인 토큰을 도출한다.

```
41 컬러 × 10 타이포 × 4 레이아웃 × 8 스타일 × 5 모션 × 9 그라디언트 × 22 템플릿
```

## 설치

```bash
# 글로벌 설치
npm install -g .

# 또는 npx로 실행
npx duvu
```

## 명령어

### 조회

```bash
duvu list                    # 전체 프리셋 목록
duvu list colors             # 컬러 프리셋만
duvu list typo               # 타이포 프리셋만
duvu show color toss         # 특정 프리셋 상세
duvu info                    # 시스템 통계
```

### 코드 생성

```bash
duvu generate toss                       # CSS 변수 출력
duvu generate "#3182F6"                  # 커스텀 HEX에서 테마 도출
duvu generate toss --platform tailwind   # 플랫폼별 안내 (CSS만 직접 출력)
duvu template saas                       # 템플릿 기반 코드 생성
```

지원 플랫폼: `css` · `tailwind` · `flutter` · `swiftui` · `compose` · `unity`

### 확장

```bash
duvu add color '{"id":"my-brand","name":"My Brand","src":"#FF6B35",...}'
duvu remove color my-brand
duvu reset color             # 특정 카테고리 기본값 복원
duvu reset                   # 전체 기본값 복원
```

기본 프리셋 삭제 시 경고를 표시하며, `duvu reset`으로 언제든 복원 가능.

### AI 에이전트 스킬 설치

```bash
duvu install-skill            # Claude Code + Codex CLI + Gemini CLI 전부
duvu install-skill --claude   # Claude Code만
duvu install-skill --codex    # Codex CLI만
duvu install-skill --gemini   # Gemini CLI만
```

설치 경로:

| 에이전트 | 경로 |
|---------|------|
| Claude Code | `~/.claude/rules/duvu-design-system.md` |
| Codex CLI + Gemini CLI (공용) | `~/.agents/skills/duvu/SKILL.md` |
| Gemini CLI (추가) | `~/.gemini/skills/duvu/SKILL.md` |

설치 후 각 에이전트가 UI/프론트엔드 코드를 작성할 때 DUVU 디자인 시스템이 자동으로 적용된다.

### 데모

```bash
duvu demo                    # http://localhost:3333 에서 데모 실행
duvu demo 8080               # 포트 지정
```

인터랙티브 데모 웹페이지에서 모든 프리셋을 시각적으로 탐색하고, 라이브 프리뷰로 조합 결과를 확인할 수 있다.

## 디렉토리 구조

```
duvu-cli/
├── bin/duvu.js              # CLI 엔트리포인트
├── package.json
├── README.md
├── data/
│   ├── presets.json          # 라이브 프리셋 데이터 (편집 가능)
│   ├── defaults/
│   │   └── presets.json      # 불변 백업 (reset용)
│   └── references/           # 레퍼런스 마크다운
│       ├── tokens.md
│       ├── platforms.md
│       ├── rules.md
│       ├── compliance.md
│       ├── color-system.md
│       ├── templates.md
│       ├── components.md
│       └── layouts.md
├── skills/
│   └── SKILL.md              # AI 에이전트용 스킬 정의
└── demo/
    └── index.html            # 인터랙티브 데모 웹페이지
```

## 핵심 원칙

- **하나의 소스 색상** → 다크/라이트 모드 전체 팔레트 자동 도출
- **WCAG AA 4.5:1** 대비율 보장
- **Apple HIG + Material Design 3** 동시 준수
- **ZERO 아웃라인** — 테두리는 의미 있을 때만
- **의도 없는 요소는 없다** — 모든 요소에 명확한 목적

## 라이선스

MIT
