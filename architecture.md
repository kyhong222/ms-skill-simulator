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
- 상단 고정 헤더, 다크 모드(시스템/라이트/다크)
- 디스코드 로그인 + 계정 동기화 (*.mapleland.st SSO, 첫 로그인 시 브라우저 데이터 이관)
- 문의하기 → Supabase 저장, 내 문의에서 답변 확인 (아이템 시뮬레이터와 공용)

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
| 인증/DB | Supabase (아이템 시뮬레이터와 공용 프로젝트) | supabase-js 2 |
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
├── scripts/                         # 스킬북 JSON 생성 도구 (빌드/런타임과 무관, 수동 실행)
│   ├── data/
│   │   ├── battlemage-mapleland.txt # 배틀메이지 생성 입력 (메이플랜드 인게임 수치, 미확보 스킬은 KMST 원문)
│   │   └── battlemage-t12137.txt    # KMST T1.2.137 원문 보존본 (출처 maplestory.pe.kr, 생성에 미사용)
│   ├── lib/
│   │   └── gif2png.mjs              # GIF→PNG 변환 (무의존, 인벤 아이콘용)
│   ├── gen-cygnus.mjs               # 시그너스 스킬북 생성 (maplestory.io GMS v72 API)
│   ├── gen-battlemage.mjs           # 배틀메이지 스킬북 생성 (원본 텍스트 + 인벤 아이콘)
│   └── prepare-deploy.js            # (사용 안 함) 구 GitHub Pages 서브패스 배포용 잔재
├── src/
│   ├── components/
│   │   ├── Cloud/
│   │   │   ├── CloudProvider.tsx    # 세션 구독 + 동기화 기동 (App에서 라우트를 감쌈)
│   │   │   ├── cloudContext.ts      # useCloud 훅
│   │   │   ├── CloudPromptDialog.tsx # 이관/충돌/불러오기 실패 확인창
│   │   │   ├── AuthButton.tsx       # 로그인 버튼 + 계정 메뉴 (아이템 시뮬과 같은 모양)
│   │   │   ├── FeedbackCard.tsx     # 문의 1건 + 답변 (내 문의·문의 관리 공용)
│   │   │   ├── MyFeedbackDialog.tsx # 내 문의 + 운영자 답변
│   │   │   └── AdminFeedbackDialog.tsx # 문의 관리 (운영자 전용)
│   │   ├── Feedback/
│   │   │   └── FeedbackDialog.tsx   # 문의하기 모달 (Supabase feedbacks 저장)
│   │   ├── Header/
│   │   │   ├── Header.tsx           # 상단 고정 헤더 (페이지가 actions 전달, xl 미만은 메뉴로 접힘)
│   │   │   ├── ColorModeButton.tsx  # 시스템/라이트/다크 전환
│   │   │   └── useDismiss.ts        # 드롭다운 바깥 클릭/ESC 닫기
│   │   ├── JobSelector/
│   │   │   └── JobSelector.tsx      # 직업 선택 화면 (5개 그룹 × 12개 직업 + 시그너스 5개 + 레지스탕스 1개, 패치 노트)
│   │   └── SkillTree/
│   │       ├── SkillTree.tsx        # 스킬 트리 본문 (렌더링 전용, tree prop 수신)
│   │       ├── useSkillTree.ts      # 스킬 트리 상태·포인트 계산·데이터 로딩 (SSOT, SkillTreePage에서 호출)
│   │       ├── SkillCodeDialog.tsx  # 스킬코드 입력 모달
│   │       ├── SkillBranch.tsx      # 단일 차수 스킬 브랜치 (UI 렌더링 전용, 모바일 접기 토글)
│   │       ├── SkillRow.tsx         # 스킬 1개 행 (반응형: 모바일 한 줄 / 데스크톱 2줄)
│   │       ├── useSkillBranch.ts    # 스킬 브랜치 비즈니스 로직 훅 (활성화 검증, 레벨 증감)
│   │       ├── SkillToolTip.tsx     # 스킬 툴팁 (레벨별 속성 치환 렌더링)
│   │       └── SkillToolTipPostfix.tsx  # 특정 스킬의 속성값 후처리 (15개 스킬)
│   ├── constants/
│   │   ├── colorMode.ts             # 화면 모드 저장 키/순환 순서
│   │   ├── feedback.ts              # 문의 유형(dbType 매핑)/길이/첨부 제한
│   │   └── skillPoints.ts           # 게임 상수 (전직 레벨, SP 배수, 최대 레벨 등)
│   ├── data/
│   │   ├── cloud/                   # Supabase 클라이언트, 쿠키 세션, 동기화 엔진, 문의 데이터 접근
│   │   ├── skillTreeStorage.ts      # 스킬 트리 localStorage 접근 (게스트/계정 분리)
│   │   ├── jobs.ts                  # 직업 목록, 선택 가능 직업, 그룹화, 하위 직업 매핑
│   │   └── skillbooks/             # 60개 JSON 파일 (직업별 스킬 데이터, Base64 아이콘 포함)
│   │       ├── 100.json ~ 132.json  # 전사 계열
│   │       ├── 200.json ~ 232.json  # 마법사 계열
│   │       ├── 300.json ~ 322.json  # 궁수 계열
│   │       ├── 400.json ~ 422.json  # 도적 계열
│   │       ├── 500.json ~ 522.json  # 해적 계열
│   │       ├── 1100.json ~ 1511.json # 시그너스 (1~3차)
│   │       └── 3200.json ~ 3212.json # 레지스탕스 배틀메이지 (1~4차)
│   ├── pages/
│   │   ├── SkillSimulatorPage.tsx   # 직업 선택 페이지 (라우트: /)
│   │   └── SkillTreePage.tsx        # 스킬 트리 페이지 (라우트: /:jobId)
│   ├── types/
│   │   ├── job.ts                   # IJob 인터페이스
│   │   ├── jobSkillBook.ts         # IJobSkillBook, IJobSkill, ILevelProperties 등
│   │   ├── skillPoints.ts          # IBranchSkillPoints (차수별 SP 분리 직업의 차수 총/잔여 포인트)
│   │   ├── skillTree.ts            # ISkillLevel, ISkillLogEntry
│   │   ├── header.ts               # IHeaderAction
│   │   └── cloud.ts                # 인증/동기화 타입, ICloudPayload
│   ├── utils/
│   │   └── captureElement.ts       # html2canvas 공통 호출 (항상 라이트로 캡처)
│   ├── App.tsx                      # 루트 컴포넌트 (Routes 정의)
│   ├── App.css                      # 앱 전역 CSS (fadeIn 애니메이션 등)
│   ├── index.css                    # Tailwind 지시자 + 기본 스타일 (Vite 기본 템플릿 기반)
│   ├── main.tsx                     # 엔트리포인트 (BrowserRouter, StrictMode)
│   └── vite-env.d.ts               # Vite 타입 선언
├── index.html                       # HTML 템플릿 (SEO 메타태그)
├── package.json
├── vercel.json                      # Vercel 설정 (SPA rewrite(/api 제외), /skill/* → /* 리다이렉트)
├── vite.config.ts                   # Vite 설정 (base: /)
├── tsconfig.json                    # TS 프로젝트 레퍼런스 + 경로 별칭 (@/*)
├── tsconfig.app.json                # 앱 TS 설정 (strict, ES2020)
├── tsconfig.node.json               # Node TS 설정 (vite.config 타입체크)
├── tailwind.config.js               # Tailwind 설정 (darkMode: class, 공용 색상)
├── postcss.config.js                # PostCSS 설정 (tailwindcss + autoprefixer)
└── eslint.config.js                 # ESLint flat config (react-hooks, react-refresh)
```

## 핵심 아키텍처 패턴

### 상태 관리
- **전역 상태 관리 도구 없음** — React `useState`만 사용
- 스킬 레벨 상태는 `useSkillTree` 훅이 중앙 관리. 헤더 버튼과 본문이 함께 쓰도록 `SkillTreePage`에서 호출하고 하위 컴포넌트로 props 전달
- 로그인 세션·동기화 상태만 Context(`CloudProvider`/`useCloud`) 사용
- `localStorage`를 통한 영속성: 직업 ID + 모드(일반/4차만)별 별도 키로 저장 (`data/skillTreeStorage.ts` 경유, 로그인 시 계정 키)

### 데이터 흐름
```
사용자 입력
    ↓
SkillTreePage (Header actions, 캡처, 모드 토글, 다이얼로그 열림 상태)
    ↓ useSkillTree (스킬 레벨 상태, 포인트 계산, 데이터 로딩)
SkillTree (렌더링) ← tree prop
    ↓ props (skillLevels, onLevelChange, remainingSkillPoints ...)
SkillBranch (UI 렌더링) + useSkillBranch (활성화 검증, 레벨 증감 로직)
    ↓ props (skill, level, is*, on*)
SkillRow (스킬 1개 행 렌더링 — 반응형 레이아웃)
    ↓ 데스크톱 hover (포탈) / 모바일 터치 (인라인 펼침)
SkillToolTip (레벨별 속성 치환 → SkillToolTipPostfix로 후처리)
```

### 반응형 레이아웃 (Tailwind `md` = 768px 기준)
- **직업 선택**: 모바일은 그룹 블록 2열 그리드 (`grid grid-cols-2 md:flex`), 시그너스는
  `md:hidden` 제목을 붙인 별도 섹션. 데스크톱은 가로 스크롤 없이 화면 폭에 맞춘 5열 (`md:flex-1 md:max-w-[160px]`)
- **패치 노트**: 모바일 기본 접힘 (`isPatchOpen` + `hidden md:block`), 데스크톱은 항상 표시
- **브랜치 배치**: 모바일 세로 (`flex-col`) / `md` 2열 (`md:grid-cols-2`) / `xl` 가로 4열 — `SkillTree.tsx`
- **브랜치 접기**: `SkillBranch`의 `isCollapsed` state. 헤더 전체가 토글 버튼이며,
  데스크톱은 `md:pointer-events-none` + 목록 래퍼 `md:grid-rows-[1fr]`로 항상 펼쳐진 상태 유지
- **접기 애니메이션**: 높이를 모르는 콘텐츠라 `grid-template-rows: 0fr↔1fr` 트랜지션을 사용.
  브랜치 접기와 스킬 설명 펼침 모두 동일한 패턴이며, 내부 래퍼에 `min-h-0 overflow-hidden`이 필수
- **스킬 행**: 모바일은 `[아이콘][스킬명][레벨/마스터(M)][▲][▼][M 또는 0]` 한 줄,
  데스크톱은 기존과 동일한 2줄 구조 (`md:block`) — `SkillRow.tsx`
  - 모바일 세 번째 버튼은 `isMaxLevel`로 분기 (마스터면 `0`, 아니면 `M`). 데스크톱은 `md:flex`로 둘 다 노출.
    이 때문에 버튼의 display는 `BUTTON_BASE`에 넣지 않고 버튼마다 개별 지정함
- **스킬 설명**: 데스크톱은 hover 포탈 툴팁(모바일에서는 `hidden md:block`으로 차단),
  모바일은 아이콘/스킬명 터치로 행 아래에 인라인 펼침. 두 경로 모두 `SkillTooltip` 컴포넌트를 재사용하며,
  모바일은 `detailOnly` prop으로 `[현재 레벨] + 상세 수치` 블록만 렌더링(스킬명·아이콘·마스터레벨·설명·필요스킬 제외).
  펼침 상태(`expandedSkillId`)는 `SkillBranch`가 보유해 브랜치당 하나만 열림
- **헤더**: `fixed` 56px 고정 + 스페이서. 8개 버튼이 약 1230px이라 `xl`(1280px) 미만은 `메뉴` 드롭다운으로 접는다.
  md가 아닌 xl을 쓰는 유일한 곳. 버튼은 `IHeaderAction[]` 하나로 두 레이아웃을 렌더링한다
- **전역 폭**: 고정 최소 너비 없음. `#root` 최대 폭 1564px(콘텐츠 1500 + 패딩). 브랜치는 `md` 2열, `xl` 4열,
  `#root` 패딩은 모바일 `0.75rem` / 데스크톱 `2rem` (`App.css` 미디어쿼리)

### 데이터 로딩 전략
- 스킬북 JSON 파일은 `import()`를 통한 **동적 임포트** (코드 스플리팅)
- 직업 선택 시 해당 직업의 1~4차 스킬북 4개를 `Promise.all`로 병렬 로딩
- `subJobs` 매핑으로 4차 직업 ID → [1차, 2차, 3차, 4차] 직업 ID 배열 변환
  (시그너스는 3차까지 3개만 매핑)

### 스킬북 데이터 출처
스킬북 JSON은 직업군마다 출처가 다르다. 수치를 고칠 때 어느 파이프라인인지 먼저 확인할 것.

| 직업군 | 파일 | 출처 | 생성 |
|---|---|---|---|
| 모험가 | `1xx~5xx.json` | maplestory.io GMS API | 초기 수기 반영, 이후 패치는 직접 수정 |
| 시그너스 | `11xx~15xx.json` | maplestory.io GMS v72 API | `scripts/gen-cygnus.mjs` |
| 배틀메이지 | `32xx.json` | 메이플랜드 인게임 수치(미확보분은 KMST T1.2.137 원문) + 인벤 아이콘 | `scripts/gen-battlemage.mjs` |

**배틀메이지 스킬 포인트** — 레지스탕스는 10레벨 1차 전직 시 SP를 **5** 받는다(다른 직업군은 1).
`constants/skillPoints.ts`의 `getBranch1stBonusSp(jobId)`가 이 차이를 담당하고,
총 SP 계산(`SkillTree`)·차수 활성화 기준(`useSkillBranch`)·스킬 로그 차수 분류(`SkillLogDialog`)가 모두 이 값을 쓴다.

**차수별 SP 분리 (레지스탕스 전용)** — 배틀메이지는 다른 직업과 달리 SP를 전 차수가 공유하지 않는다.
레벨 구간에서 얻은 SP는 그 차수에만 쓸 수 있고(1차 Lv10~30, 2차 31~70, 3차 71~120, 4차 121~200),
이전 차수에 필수 포인트를 채우지 않아도 다음 차수 스킬을 찍을 수 있다.
- `hasSeparateBranchSp(jobId)`로 판별, `getSeparateBranchSp(jobId, level, jobLevel, branchIndex)`가 차수별 총 SP를 준다.
  전직 보너스(+5 / +1 / +1 / +3)는 새로 전직한 차수에 귀속되고, Lv200 이후로는 SP를 얻지 않는다
- `SkillTree`가 차수별 `IBranchSkillPoints { total, remaining }`를 계산해 `SkillBranch` → `useSkillBranch`로 `branchSp` prop을 내려준다.
  `branchSp`가 없으면(다른 모든 직업) 기존 공유형 로직이 그대로 돈다
  - `branchSp` 있음: 증가 상한 = 차수 잔여 포인트, 활성화 = `total > 0`, 감소 항상 허용, 헤더는 `잔여 포인트 / 총 포인트`
- 상단 바는 전 차수 합계. 스킬코드 적용은 차수별 예산으로 채우고(한 차수가 부족하면 그 스킬만 건너뜀),
  스킬 로그는 `skillBranchIndex`(스킬 ID → 차수)로 스킬이 속한 차수에 분류한다

**배틀메이지 파이프라인** — maplestory.io에 해당 버전이 없어 다른 경로를 쓴다.
- 수치·스킬명·설명·마스터레벨·선행스킬의 단일 출처는 `scripts/data/battlemage-mapleland.txt`
  (출처는 파일 상단·스킬별 `# 출처:` 주석에만 기록하고 UI에는 표기하지 않음)
- 이 파일은 KMST 원문(`battlemage-t12137.txt`, 블로그 원문 보존본)을 복사해 메이플랜드 인게임 데이터를
  확보한 스킬의 레벨 줄 숫자만 바꾼 것이다. 메이플랜드가 원작 스펙을 조정해 추가했기 때문에 둘이 다르다.
  인게임 데이터가 없는 스킬은 KMST 값을 유지하며 `# 출처: KMST T1.2.137 (…미확보)`로 표시한다
- 한 레벨 문장이 여러 줄이면: `,`로 끝나는 줄은 공백으로, `\`로 끝나는 줄은 `\n`으로 이어 붙인다.
  `\n`이 들어간 detail은 재사용 대기시간도 새 줄에 붙고, `SkillToolTip`의 상세 수치 div가
  `whitespace-pre-line`이라 툴팁에서 실제 줄바꿈으로 보인다 (현재 슈퍼바디만 사용)
- 스킬 ID·아이콘만 인벤 DB에서 가져온다 (원본 텍스트에 없는 정보). 아이콘은 GIF라
  `scripts/lib/gif2png.mjs`로 PNG 변환 후 Base64 인라인 (앱이 `data:image/png`로 렌더링하기 때문)
- 생성 시 **자체 검증**: `description.detail` 템플릿과 `levelProperties`로 각 레벨 문장을
  다시 조립해 원문과 글자 단위로 대조하고, 하나라도 어긋나면 파일을 쓰지 않고 종료한다
- 레벨 속성 키를 정할 때 두 가지 제약이 있다.
  `SkillToolTip`의 `#key` 치환에 단어 경계가 없어 **키가 서로의 접두사가 되면 안 되고**,
  `mastery` 키는 툴팁이 자동으로 `값*5+10`을 적용하므로 최종 퍼센트를 그대로 넣으면 안 된다

### 컴포넌트 구조
- **페이지 컴포넌트**: `SkillSimulatorPage`, `SkillTreePage` — 라우팅 진입점, 네비게이션 처리
- **기능 컴포넌트**: `JobSelector`, `SkillTree` — 상태관리 및 데이터 로딩
- **UI 컴포넌트**: `SkillBranch`, `SkillRow` — 렌더링 전용 (로직은 `useSkillBranch` 훅에 분리)
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
직업 선택 (selectableJobs: 18개 — 모험가 12 + 시그너스 5 + 배틀메이지 1)
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
키: skillTreeAccount_{userId}_{4차jobId}[_4th]  (로그인 시 계정 캐시)
값: {
  currentLevel: number,
  skillLevels: { id: number, name: string, level: number }[],
  skillLog: ISkillLogEntry[]
}
```

## 주요 컴포넌트 의존성 그래프

```
main.tsx
  └── App.tsx
        ├── CloudProvider.tsx (라우트 전체를 감쌈)
        ├── SkillSimulatorPage.tsx
        │     ├── Header.tsx
        │     ├── JobSelector.tsx
        │     │     └── data/jobs.ts (groupedJobs)
        │     └── types/job.ts
        └── SkillTreePage.tsx
              ├── Header.tsx (ColorModeButton, AuthButton, FeedbackDialog)
              ├── useSkillTree.ts
              │     ├── constants/skillPoints.ts
              │     ├── data/jobs.ts (subJobs)
              │     ├── data/skillTreeStorage.ts
              │     └── data/skillbooks/*.json (동적 import)
              ├── SkillLogDialog.tsx / SkillCodeDialog.tsx
              ├── SkillTree.tsx
              │     └── SkillBranch.tsx
              │           ├── useSkillBranch.ts (비즈니스 로직 훅)
              │           │     └── constants/skillPoints.ts
              │           ├── SkillRow.tsx (스킬 1개 행, 반응형)
              │           ├── SkillToolTip.tsx
              │           │     └── SkillToolTipPostfix.tsx
              │           └── react-dom (createPortal)
              ├── data/jobs.ts (selectableJobs)
              └── utils/captureElement.ts (html2canvas)
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
- 다크모드: `darkMode: "class"` + `dark:` 유틸리티 (아래 '다크 모드' 절 참고)
- 스킬 트리 캡처 시 제외할 요소는 `.exclude-from-capture` 클래스로 마킹

## 빌드 & 배포

### 빌드 설정
- `vite.config.ts`: `base: '/'` (서브도메인 루트 배포)
- TypeScript: strict 모드, ES2020 타겟, bundler 모듈 해석

### 배포 파이프라인
1. main 브랜치 푸시 → Vercel이 자동으로 `npm run build` 실행 → `dist/` 배포
2. `vercel.json` 설정
   - `rewrites`: `/api/` 로 시작하지 않는 모든 경로를 `/index.html`로 (SPA 딥링크 지원)
   - `redirects`: `/skill`, `/skill/*` → 루트로 308 (구 경로 유입 대비)
3. GitHub Actions (`trigger-deploy.yml`): main 푸시 시 루트 레포(`mapleland-st-root-page`)에 deploy 이벤트 전송

### 커스텀 도메인 구조
- `skill.mapleland.st` 서브도메인 루트로 서비스
- 구 주소 `mapleland.st/skill` → 루트 레포 쪽에서 308 리다이렉트 처리

## 디스코드 로그인 · 계정 동기화

아이템 시뮬레이터(`mapleland-setting-v2`, `docs/cloud-sync.md`)와 **같은 Supabase 프로젝트**를 쓴다.
테이블·RLS·디스코드 앱은 이미 그쪽에서 세팅되어 있어 이 레포에 DDL이 없다. 행은 `app_id = "skill-sim"`으로 구분한다.

### 구성
```
CloudProvider (App에서 라우트를 감쌈 — 세션 구독, 동기화 기동, CloudPromptDialog)
  ├── cloudContext.useCloud()      → status, user, isStorageReady, dataVersion, signIn/signOut
  ├── data/cloud/sync.ts           → 동기화 엔진 (앱 도메인 비의존, 읽기/쓰기·캡처/적용 주입)
  ├── data/cloud/userData.ts       → user_state fetch/push (rev 낙관적 잠금)
  ├── data/cloud/supabase.ts       → 클라이언트 싱글턴, APP_ID, isCloudEnabled
  ├── data/cloud/cookieStorage.ts  → 세션 쿠키(.mapleland.st) — 아이템 시뮬과 SSO
  └── data/skillTreeStorage.ts     → 스킬 트리 localStorage 접근 (게스트/계정 분리)
```

### 저장소 분리
- 비로그인: `skillTree_{트리키}` — 기존 키 그대로. **로그인해도 건드리지 않는다**
- 로그인: `skillTreeAccount_{userId}_{트리키}` — 계정 데이터 캐시. 로그아웃하면 지운다 (로그아웃 시 게스트 데이터가 그대로 돌아옴)
- 스킬 트리 읽기/쓰기는 전부 `skillTreeStorage`를 거친다. `localStorage`를 직접 쓰면 계정 분리가 깨진다
- `user_state.payload`는 `{ trees: { "112": {...}, "112_4th": {...} } }` 한 행. 로그 아이콘(Base64)은 올리지 않고 로드 시 스킬북에서 채운다

### 첫 로그인 판정
`user_state` 행이 없으면 첫 로그인이다.
- 찍은 포인트가 있는 게스트 트리가 있으면 "브라우저에 저장된 스킬 세팅을 계정으로 이관할까요?"를 묻는다
- 이관하지 않거나 게스트 데이터가 없어도 **빈 행을 만든다** — 행이 있으면 다시 묻지 않기 때문
- 이후로는 서버가 원본이다. 게스트 데이터가 있어도 묻지 않고 계정 데이터로 연다

### 동기화 정책
- push: 저장 → 2초 디바운스 → 내용이 바뀌었을 때만 전체 payload update. 탭 숨김·`pagehide`·`online`에서 flush. 로그아웃 전에도 flush
- pull: 로그인 직후 + 탭 포커스 복귀 시 `rev` 비교
- 충돌: 안 올린 변경이 없으면 조용히 서버를 따른다. 있으면 `계정 것 받기` / `이 기기 것으로 덮기`를 묻는다
- `isStorageReady`가 false인 동안 `useSkillTree`는 로딩 상태로 대기한다. 로딩 중에는 저장을 유발하는 헤더 버튼을 비활성화한다 (빈 목록을 저장하면 데이터가 지워짐)
- 서버 값이 적용되면 `dataVersion`이 올라가 `useSkillTree`가 다시 읽는다
- 서버 스키마가 `SCHEMA_VERSION`보다 새로우면 적용·전송하지 않는다

## 다크 모드

- `tailwind.config.js`의 `darkMode: "class"` — `<html class="dark">`로 전환, 색은 `dark:` 유틸리티 + 커스텀 색 `dark-page/paper/raised`, `primary`
- 시스템 → 라이트 → 다크 순환 (`ColorModeButton`), 저장 키 `skillSimulator_colorMode`
- 깜빡임 방지 스크립트가 `index.html`에 있다. 저장 키는 `constants/colorMode.ts`와 같아야 한다
- `index.css`의 다크 전역 규칙은 `:where()`로 명시도를 0으로 유지해야 Tailwind 유틸리티를 덮지 않는다
- 캡처는 `utils/captureElement.ts`가 복제 문서에서 `dark`를 제거해 **항상 라이트**로 나온다

## 문의하기 (Supabase)

헤더 `문의하기` → `FeedbackDialog` → Supabase `feedbacks`에 브라우저에서 직접 insert (서버 코드 없음).

- **로그인 필수.** 디스코드 계정이 연락처를 대신한다. 첨부 이미지는 3장·장당 5MB (`feedback` 비공개 버킷)
- `내 문의`(계정 메뉴): 전 서비스 문의와 운영자 답변 열람. 새 답변이면 빨간 점 (`profiles.feedback_seen_at` 기준)
- `문의 관리`(계정 메뉴, **운영자 전용**): 아이템 시뮬레이터의 문의 관리와 같은 기능. 전 서비스 문의를 상태별로 보고 답변 작성·상태 변경·대문 공개(아이템 시뮬 대문 노출)를 한다
  - 운영자 판별은 `admins` 테이블에서 내 행을 읽을 수 있는지(`checkIsAdmin`) → `useCloud().isAdmin`. **메뉴를 감추는 힌트일 뿐이고 실제 권한은 RLS(`is_admin()`)가 건다**
  - 운영자 추가는 Supabase에서 `admins`에 행을 넣는다 (mapleland-setting-v2 `docs/feedback.md`)
  - 문의 카드 생김새는 `FeedbackCard`로 `내 문의`와 공유. 상태 라벨은 `constants/feedback.ts`의 `FEEDBACK_STATUS_LABEL`
- `feedbacks.type`은 공용 check 제약으로 `bug/idea/etc`만 허용. `constants/feedback.ts`의 `dbType`으로 변환하고, 스킬 수치 오류는 `bug` + 제목 말머리 `[스킬 수치]`로 저장한다

### 환경변수 (Vercel + 로컬 `.env.local`)
| 변수 | 설명 |
|------|------|
| `VITE_SUPABASE_URL` | 아이템 시뮬레이터와 같은 값 |
| `VITE_SUPABASE_ANON_KEY` | 아이템 시뮬레이터와 같은 값 (공개값, 격리는 RLS) |

둘 다 없으면 로그인 UI가 숨겨지고 localStorage 전용으로 동작하며 문의하기는 이용할 수 없다.
`APP_ID`는 환경변수가 아니라 코드 상수다 — `item-sim`이 잘못 들어가면 그쪽 계정 데이터를 덮어쓴다.

## 외부 의존성

| 라이브러리 | 용도 |
|-----------|------|
| `react` / `react-dom` (19.1) | UI 프레임워크, Portal 렌더링 |
| `react-router-dom` (7.13) | SPA 라우팅 (BrowserRouter) |
| `html2canvas` (1.4) | DOM → Canvas 캡처 (이미지 다운로드, 클립보드 복사) |
| `tailwindcss` (3.4) | 유틸리티 CSS |
| `@vitejs/plugin-react` (4.4) | Vite React 플러그인 (Fast Refresh) |
| `typescript-eslint` (8.30) | TypeScript ESLint 지원 |
| `@supabase/supabase-js` | 디스코드 로그인, 계정 동기화, 문의 저장 |

### 데이터 소스
- 모든 스킬 데이터는 `src/data/skillbooks/*.json`에 로컬 내장
- 계정 데이터·문의는 Supabase (로그인 사용자만)
