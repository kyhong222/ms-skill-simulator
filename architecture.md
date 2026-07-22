# Architecture - MS Skill Simulator

## 프로젝트 개요

메이플랜드(메이플스토리 클래식 서버) 스킬 트리 시뮬레이터. 5개 직업군(전사, 마법사, 궁수, 도적, 해적)의 12개 4차 직업에 대해 1~4차 스킬 포인트 배분을 미리 계획하고 시뮬레이션할 수 있는 SPA 웹 애플리케이션.

### 핵심 기능
- 12개 4차 직업 선택 및 1~4차 스킬 트리 표시
- 캐릭터 레벨 기반 스킬 포인트 자동 계산
- 스킬 레벨 증감 (클릭: ±1, Shift+클릭: ±5, 마스터/초기화 버튼)
- 선행 스킬 및 차수별 포인트 요구사항 검증
- 스킬 배분 상태 localStorage 자동 저장/복원
- "4차 이후만" 모드로 4차 스킬만 별도 계획
- html2canvas를 이용한 스킬 트리 캡처(이미지 다운로드, 클립보드 복사)
- 스킬 호버 시 레벨별 상세 수치 툴팁 표시

## 기술 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | React | 19.1 |
| 언어 | TypeScript | 5.8 |
| 빌드 도구 | Vite | 6.3 |
| CSS | Tailwind CSS | 3.4 |
| 라우팅 | react-router-dom | 7.13 |
| 캡처 | html2canvas | 1.4 |
| 린팅 | ESLint (flat config) | 9.25 |
| 배포 | Vercel (Git 연동 자동 배포) | - |
| 커스텀 도메인 | skill.mapleland.st | - |

## 디렉토리 구조

```
ms-skill-simulator/
├── .github/
│   └── workflows/
│       └── trigger-deploy.yml       # main 푸시 시 루트 레포 배포 트리거
├── public/
│   ├── googlee63cd6836513ab92.html  # Google Search Console 소유권 인증
│   ├── robots.txt                   # 크롤러 허용 설정
│   ├── sitemap.xml                  # SEO 사이트맵
│   └── vite.svg                     # Vite 기본 아이콘 (미사용)
├── scripts/
│   └── prepare-deploy.js            # (사용 안 함) 구 GitHub Pages 서브패스 배포용 잔재
├── src/
│   ├── components/
│   │   ├── JobSelector/
│   │   │   └── JobSelector.tsx      # 직업 선택 화면 (5개 그룹 × 12개 직업)
│   │   └── SkillTree/
│   │       ├── SkillTree.tsx        # 스킬 트리 메인 (상태관리, 포인트 계산, 데이터 로딩)
│   │       ├── SkillBranch.tsx      # 단일 차수 스킬 브랜치 (UI 렌더링 전용)
│   │       ├── useSkillBranch.ts    # 스킬 브랜치 비즈니스 로직 훅 (활성화 검증, 레벨 증감)
│   │       ├── SkillToolTip.tsx     # 스킬 툴팁 (레벨별 속성 치환 렌더링)
│   │       └── SkillToolTipPostfix.tsx  # 특정 스킬의 속성값 후처리 (15개 스킬)
│   ├── constants/
│   │   └── skillPoints.ts           # 게임 상수 (전직 레벨, SP 배수, 최대 레벨 등)
│   ├── data/
│   │   ├── jobs.ts                  # 직업 목록, 선택 가능 직업, 그룹화, 하위 직업 매핑
│   │   └── skillbooks/             # 45개 JSON 파일 (직업별 스킬 데이터, Base64 아이콘 포함)
│   │       ├── 100.json ~ 132.json  # 전사 계열
│   │       ├── 200.json ~ 232.json  # 마법사 계열
│   │       ├── 300.json ~ 322.json  # 궁수 계열
│   │       ├── 400.json ~ 422.json  # 도적 계열
│   │       └── 500.json ~ 522.json  # 해적 계열
│   ├── pages/
│   │   ├── SkillSimulatorPage.tsx   # 직업 선택 페이지 (라우트: /)
│   │   └── SkillTreePage.tsx        # 스킬 트리 페이지 (라우트: /:jobId)
│   ├── types/
│   │   ├── job.ts                   # IJob 인터페이스
│   │   └── jobSkillBook.ts         # IJobSkillBook, IJobSkill, ILevelProperties 등
│   ├── App.tsx                      # 루트 컴포넌트 (Routes 정의)
│   ├── App.css                      # 앱 전역 CSS (fadeIn 애니메이션 등)
│   ├── index.css                    # Tailwind 지시자 + 기본 스타일 (Vite 기본 템플릿 기반)
│   ├── main.tsx                     # 엔트리포인트 (BrowserRouter, StrictMode)
│   └── vite-env.d.ts               # Vite 타입 선언
├── index.html                       # HTML 템플릿 (SEO 메타태그)
├── package.json
├── vercel.json                      # Vercel 설정 (SPA rewrite, /skill/* → /* 리다이렉트)
├── vite.config.ts                   # Vite 설정 (base: /)
├── tsconfig.json                    # TS 프로젝트 레퍼런스 + 경로 별칭 (@/*)
├── tsconfig.app.json                # 앱 TS 설정 (strict, ES2020)
├── tsconfig.node.json               # Node TS 설정 (vite.config용)
├── tailwind.config.js               # Tailwind 설정 (다크모드 비활성화)
├── postcss.config.js                # PostCSS 설정 (tailwindcss + autoprefixer)
└── eslint.config.js                 # ESLint flat config (react-hooks, react-refresh)
```

## 핵심 아키텍처 패턴

### 상태 관리
- **전역 상태 관리 도구 없음** — React `useState`만 사용
- 스킬 레벨 상태는 `SkillTree` 컴포넌트에서 중앙 관리, 하위 컴포넌트로 props 전달
- `localStorage`를 통한 영속성: 직업 ID + 모드(일반/4차만)별 별도 키로 저장

### 데이터 흐름
```
사용자 입력
    ↓
SkillTreePage (캡처, 모드 토글, 네비게이션)
    ↓
SkillTree (스킬 레벨 상태, 포인트 계산, 데이터 로딩)
    ↓ props (skillLevels, onLevelChange, remainingSkillPoints ...)
SkillBranch (UI 렌더링) + useSkillBranch (활성화 검증, 레벨 증감 로직)
    ↓ hover
SkillToolTip (레벨별 속성 치환 → SkillToolTipPostfix로 후처리)
```

### 데이터 로딩 전략
- 스킬북 JSON 파일은 `import()`를 통한 **동적 임포트** (코드 스플리팅)
- 직업 선택 시 해당 직업의 1~4차 스킬북 4개를 `Promise.all`로 병렬 로딩
- `subJobs` 매핑으로 4차 직업 ID → [1차, 2차, 3차, 4차] 직업 ID 배열 변환

### 컴포넌트 구조
- **페이지 컴포넌트**: `SkillSimulatorPage`, `SkillTreePage` — 라우팅 진입점, 네비게이션 처리
- **기능 컴포넌트**: `JobSelector`, `SkillTree` — 상태관리 및 데이터 로딩
- **UI 컴포넌트**: `SkillBranch` — 렌더링 전용 (로직은 `useSkillBranch` 훅에 분리)
- **커스텀 훅**: `useSkillBranch` — 스킬 활성화 검증, 레벨 증감, 포인트 계산 로직
- **표시 컴포넌트**: `SkillToolTip`, `SkillToolTipPostfix` — 순수 렌더링/데이터 변환

## 데이터 모델

### IJob
```typescript
interface IJob {
  id: number;      // 직업 고유 ID (100~522)
  name: string;    // 영문명 (예: "Hero (4th)")
  koname?: string; // 한글명 (예: "히어로")
}
```

### IJobSkillBook
```typescript
interface IJobSkillBook {
  icon: string;                // Base64 직업 아이콘
  job: IJob;                   // 직업 정보
  id: number;                  // 직업 ID
  skills: IJobSkill[];         // 스킬 리스트
  description: IJobDescription; // 직업 설명 (bookName 포함)
}
```

### IJobSkill
```typescript
interface IJobSkill {
  id: number;                              // 스킬 고유 ID (7자리, 예: 1120003)
  masterLevel: number;                     // 최대 레벨
  icon: string;                            // Base64 아이콘
  iconDisabled?: string;                   // 비활성화 아이콘
  iconMouseover?: string;                  // 마우스오버 아이콘
  weapons: string[];                       // 사용 가능 무기
  description?: IJobSkillDescription;      // 스킬명, 설명, 상세(#key 치환 템플릿)
  levelProperties: ILevelProperties[];     // 레벨별 속성값 배열
  requiredSkillLevels?: Record<number, number>; // 선행 스킬 (스킬ID → 필요레벨)
}
```

### ILevelProperties
```typescript
interface ILevelProperties {
  hs: string;           // 레벨 식별자 (예: "h10" = 10레벨)
  [key: string]: string; // 동적 속성 (damage, prop, x, lt, rb, mastery 등)
}
```

### 데이터 관계
```
직업 선택 (selectableJobs: 12개)
    ↓ subJobs[jobId]
4개의 스킬북 JSON 동적 로딩
    ↓
각 스킬북.skills[]
    ↓ requiredSkillLevels
스킬 간 선행 관계 (크로스 차수 가능)
    ↓ levelProperties[hs === "h{level}"]
레벨별 속성값 → description.detail 내 #key 플레이스홀더 치환
```

### localStorage 저장 구조
```
키: skillTree_{4차jobId}        (일반 모드)
키: skillTree_{4차jobId}_4th    (4차만 모드)
값: {
  currentLevel: number,
  skillLevels: { id: number, name: string, level: number }[]
}
```

## 주요 컴포넌트 의존성 그래프

```
main.tsx
  └── App.tsx
        ├── SkillSimulatorPage.tsx
        │     ├── JobSelector.tsx
        │     │     └── data/jobs.ts (groupedJobs)
        │     └── types/job.ts
        └── SkillTreePage.tsx
              ├── SkillTree.tsx
              │     ├── constants/skillPoints.ts
              │     ├── data/jobs.ts (subJobs)
              │     ├── data/skillbooks/*.json (동적 import)
              │     ├── types/jobSkillBook.ts
              │     └── SkillBranch.tsx
              │           ├── useSkillBranch.ts (비즈니스 로직 훅)
              │           │     └── constants/skillPoints.ts
              │           ├── SkillToolTip.tsx
              │           │     └── SkillToolTipPostfix.tsx
              │           └── react-dom (createPortal)
              ├── data/jobs.ts (selectableJobs)
              └── html2canvas
```

## 라우팅 구조

| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/` | `SkillSimulatorPage` | 직업 선택 화면 |
| `/:jobId` | `SkillTreePage` | 스킬 트리 화면 (예: `/112` = 히어로) |

- `BrowserRouter`는 `basename` 없이 루트(`/`)에서 서비스 (`skill.mapleland.st` 서브도메인)
- 존재하지 않는 `jobId`로 접근 시 `/`로 리다이렉트
- 딥링크(예: `/112` 직접 접근)는 `vercel.json`의 rewrite로 `index.html` 반환하여 처리

## 스타일링 전략

- **Tailwind CSS** 유틸리티 클래스 중심 (인라인 스타일)
- 일부 고정 너비/스케일은 `style` 속성으로 직접 지정 (예: 버튼 width, transform: scale)
- `App.css`: fadeIn 애니메이션 정의 (`.animate-fade-in`)
- `index.css`: Tailwind 지시자 + Vite 기본 템플릿 스타일 (다크/라이트 테마 지원)
- 다크모드: `tailwind.config.js`에서 `darkMode: false`로 비활성화, 하지만 `index.css`에 `prefers-color-scheme: light` 미디어 쿼리가 남아있음
- 스킬 트리 캡처 시 제외할 요소는 `.exclude-from-capture` 클래스로 마킹

## 빌드 & 배포

### 빌드 설정
- `vite.config.ts`: `base: '/'` (서브도메인 루트 배포)
- TypeScript: strict 모드, ES2020 타겟, bundler 모듈 해석

### 배포 파이프라인
1. main 브랜치 푸시 → Vercel이 자동으로 `npm run build` 실행 → `dist/` 배포
2. `vercel.json` 설정
   - `rewrites`: 정적 파일이 없는 모든 경로를 `/index.html`로 (SPA 딥링크 지원)
   - `redirects`: `/skill`, `/skill/*` → 루트로 308 (구 경로 유입 대비)
3. GitHub Actions (`trigger-deploy.yml`): main 푸시 시 루트 레포(`mapleland-st-root-page`)에 deploy 이벤트 전송

### 커스텀 도메인 구조
- `skill.mapleland.st` 서브도메인 루트로 서비스
- 구 주소 `mapleland.st/skill` → 루트 레포 쪽에서 308 리다이렉트 처리

## 외부 의존성

| 라이브러리 | 용도 |
|-----------|------|
| `react` / `react-dom` (19.1) | UI 프레임워크, Portal 렌더링 |
| `react-router-dom` (7.13) | SPA 라우팅 (BrowserRouter) |
| `html2canvas` (1.4) | DOM → Canvas 캡처 (이미지 다운로드, 클립보드 복사) |
| `tailwindcss` (3.4) | 유틸리티 CSS |
| `@vitejs/plugin-react` (4.4) | Vite React 플러그인 (Fast Refresh) |
| `typescript-eslint` (8.30) | TypeScript ESLint 지원 |

### 데이터 소스
- 모든 스킬 데이터는 `src/data/skillbooks/*.json`에 로컬 내장 (외부 API 미사용)
