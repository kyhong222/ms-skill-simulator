# MS Skill Simulator

메이플랜드 스킬 트리 시뮬레이터 — 모험가 12개 4차 직업 + 시그너스 5개 + 배틀메이지의 스킬 포인트 배분을 계획하는 웹앱 (React 19 + TypeScript + Vite + Tailwind CSS)

## 참고 문서
- 프로젝트 구조와 아키텍처 상세: [architecture.md](./architecture.md)
- 기능 추가/수정 시 반드시 architecture.md를 함께 참고할 것

## 기능 추가 시 진행 순서

1. architecture.md를 참고하여 영향받는 파일/타입 파악
2. 구현 방법 2-3가지 제안 (장단점 포함)
3. 사용자 승인 후 구현 시작
4. 기존 코드 컨벤션 준수, 타입 먼저 정의
5. 한 파일씩 수정/생성하며 설명
6. 완료 후 architecture.md, CLAUDE.md에 변경사항 반영

## 빠른 시작

```bash
npm install          # 의존성 설치
npm run dev          # 개발 서버 (localhost:5173, base: /)
npm run build        # 프로덕션 빌드 (tsc -b && vite build → dist/)
npm run lint         # ESLint 검사
npm run preview      # 빌드 결과 미리보기
```

배포는 Vercel Git 연동으로 자동 진행 (main 푸시 → 빌드 → 배포). 수동 배포 스크립트 없음.

## 기술 스택

- **React 19** + **TypeScript 5.8** + **Vite 6.3**
- **Tailwind CSS 3.4** (다크모드 비활성화)
- **react-router-dom 7.13** (BrowserRouter, basename 없음 — 루트 배포)
- **html2canvas 1.4** (스킬 트리 캡처)
- **Vercel** (Git 연동 자동 배포, `vercel.json`에 SPA rewrite)
- 배포 URL: `https://skill.mapleland.st/` (구 주소 `mapleland.st/skill` → 308 리다이렉트)

## 프로젝트 구조

```
api/
└── feedback.ts                      # Vercel 서버리스 함수 (문의 → GitHub Issue 생성)
scripts/                             # 스킬북 JSON 생성 도구 (수동 실행, 빌드와 무관)
├── data/battlemage-mapleland.txt    # 배틀메이지 생성 입력 (메이플랜드 인게임 수치, SSOT)
├── data/battlemage-t12137.txt       # KMST 원문 보존본 (참고용, 생성에 미사용)
├── lib/gif2png.mjs                  # GIF→PNG 변환 (무의존)
├── gen-cygnus.mjs                   # 시그너스 생성 (maplestory.io GMS v72)
└── gen-battlemage.mjs               # 배틀메이지 생성 (원본 텍스트 + 인벤 아이콘)
src/
├── components/
│   ├── Feedback/FeedbackDialog.tsx  # 문의하기 모달 폼
│   ├── JobSelector/JobSelector.tsx  # 직업 선택 UI
│   └── SkillTree/
│       ├── SkillTree.tsx            # 핵심: 상태관리, 포인트 계산, 데이터 로딩
│       ├── SkillBranch.tsx          # 단일 차수 스킬 UI (렌더링 전용, 모바일 접기)
│       ├── SkillRow.tsx             # 스킬 1개 행 (반응형 레이아웃)
│       ├── useSkillBranch.ts        # 스킬 브랜치 비즈니스 로직 훅
│       ├── SkillToolTip.tsx         # 스킬 툴팁 (레벨별 속성 치환)
│       └── SkillToolTipPostfix.tsx  # 15개 특수 스킬 속성값 후처리
├── constants/
│   ├── feedback.ts                 # 문의 유형/길이 제한/쿨다운 (api/feedback.ts와 동기화)
│   └── skillPoints.ts              # 게임 상수 (전직 레벨, SP 계산 관련)
├── data/
│   ├── jobs.ts                     # 직업 목록/그룹/하위직업 매핑
│   └── skillbooks/*.json           # 60개 스킬북 데이터 (Base64 아이콘 내장)
├── pages/
│   ├── SkillSimulatorPage.tsx      # / 라우트: 직업 선택
│   └── SkillTreePage.tsx           # /:jobId 라우트: 스킬 트리 + 캡처
├── types/
│   ├── job.ts                      # IJob
│   ├── jobSkillBook.ts             # IJobSkillBook, IJobSkill, ILevelProperties
│   └── skillPoints.ts              # IBranchSkillPoints (차수별 SP 분리 직업용)
├── App.tsx                         # Routes 정의
├── App.css                         # fadeIn 애니메이션
├── index.css                       # Tailwind 지시자 + 기본 스타일
└── main.tsx                        # 엔트리 (BrowserRouter, basename 없음)
```

## 코드 컨벤션

### 네이밍
- 컴포넌트: PascalCase 함수형 컴포넌트 (`SkillTree`, `SkillBranch`)
- 인터페이스: `I` 접두사 (`IJob`, `IJobSkillBook`, `IJobSkill`)
- 파일명: 컴포넌트는 PascalCase (`SkillTree.tsx`), 데이터는 camelCase (`jobs.ts`)
- 한글 사용: UI 텍스트, 주석, 변수명 일부에 한글 사용

### 파일 구조
- 컴포넌트: `components/{기능명}/{컴포넌트명}.tsx` (기능별 폴더)
- 페이지: `pages/{페이지명}.tsx`
- 타입: `types/{도메인}.ts`
- 데이터: `data/{파일명}.ts` 또는 `data/{폴더명}/*.json`

### Import 패턴
- 타입 임포트: `import type { IJob } from "..."` (type-only import)
- 상대 경로 사용 (`../../data/jobs` 형태, `@/` 별칭은 tsconfig에 설정되어 있으나 미사용)
- 스킬북 데이터: `import()` 동적 임포트로 필요한 것만 로딩

### 상태 관리
- React `useState` + `localStorage` 영속화
- 전역 상태 관리 라이브러리 없음
- `SkillTree`가 스킬 레벨 상태의 단일 소스 (SSOT)
- 하위 컴포넌트로 props 전달 (prop drilling 패턴)

### 스타일링
- Tailwind CSS 유틸리티 클래스 직접 사용
- 캡처 제외 요소: `exclude-from-capture` 클래스
- **반응형은 Tailwind `md`(768px) 브레이크포인트 기준** — 모바일 우선(기본 클래스 = 모바일, `md:` = 데스크톱)
  - JS 브레이크포인트 감지 없음. 접기 상태만 React state이고 나머지는 전부 CSS로 분기

## 핵심 개념

### 직업 ID 체계
- 1차: 100, 200, 300, 400, 500
- 2차: 110/120/130, 210/220/230, 310/320, 410/420, 510/520
- 3차: 111/121/131, 211/221/231, 311/321, 411/421, 511/521
- 4차: 112/122/132, 212/222/232, 312/322, 412/422, 512/522
- 시그너스: 1100~1511 (4차 없음, 3차가 최종)
- 레지스탕스: 배틀메이지 3200/3210/3211/3212 (4차까지)
- 선택 가능한 직업: 18개 — 모험가 4차 12개 + 시그너스 3차 5개 + 배틀메이지 1개 (`selectableJobs`)
- `subJobs[최종ID]` → `[1차, 2차, 3차, 4차]` ID 배열 (시그너스는 3개)

### 스킬 포인트 계산 (`SkillTree.tsx:calculateSkillPoints`)
- 게임 상수는 `constants/skillPoints.ts`에 정의
- 일반 모드: `(currentLevel - jobLevel) * SP_PER_LEVEL + 보너스SP`
  - jobLevel: 마법사 계열 `MAGE_JOB_LEVEL`(8), 나머지 `DEFAULT_JOB_LEVEL`(10)
  - 보너스: Lv≥jobLevel +1(레지스탕스는 +5), Lv≥30 +1, Lv≥70 +1, Lv≥120 +3
  - 1차 전직 보너스는 `getBranch1stBonusSp(jobId)`가 결정 — 레지스탕스(32xx)만 `RESISTANCE_BRANCH_1ST_BONUS_SP`(5)
- 4차만 모드: `(currentLevel - FOURTH_ONLY_BASE_LEVEL) * SP_PER_LEVEL`

### 차수별 활성화 조건 (`useSkillBranch.ts:calcPointsForBranch`)
- 공식: `(branchLevel - jobLevel) * SP_PER_LEVEL + 이전 차수 전직 보너스 SP 누적`
- 1차: 0, 2차: `(30-jobLevel)*3+1차보너스`, 3차: `(70-jobLevel)*3+1차보너스+1`, 4차: `(120-jobLevel)*3+1차보너스+2`
- 레지스탕스는 이 규칙을 쓰지 않음 (아래 차수별 SP 분리 참고)

### 차수별 SP 분리 — 레지스탕스(배틀메이지) 전용 (`hasSeparateBranchSp`)
- 레벨 구간마다 얻은 SP가 그 차수에만 귀속됨. 다른 차수로 넘겨 쓸 수 없고, 이전 차수를 다 찍지 않아도 다음 차수를 찍을 수 있음
- `constants/skillPoints.ts:getSeparateBranchSp(jobId, level, jobLevel, branchIndex)`
  - 1차: 5 + (Lv10~30 구간)×3 / 2차: 1 + (30~70)×3 / 3차: 1 + (70~120)×3 / 4차: 3 + (120~200)×3
  - 전직 보너스(+1/+1/+3)는 **새 차수**에 귀속. **Lv200 이후로는 SP를 얻지 않음** (`SEPARATE_BRANCH_SP_MAX_LEVEL`)
  - 4차만 모드는 4차 포인트만 존재 (나머지 차수 0)
- `SkillTree`가 차수별 `{ total, remaining }`(`IBranchSkillPoints`)을 계산해 `SkillBranch`에 `branchSp` prop으로 전달
  - `branchSp`가 있으면 `useSkillBranch`는 차수 잔여 포인트로 증가 상한을 정하고, 활성화는 `total > 0`(전직 레벨 도달)만 봄. 감소는 항상 허용
  - 브랜치 헤더는 `총 투자/필요 투자` 대신 `잔여 포인트/총 포인트` 표기 (잔여 음수면 빨간색)
- 상단 바(총/사용/남은)는 전 차수 합계 그대로
- 스킬코드 적용: 차수별 예산 안에서 적용, 한 차수가 부족해도 다른 차수 스킬은 계속 적용
- 스킬 로그: 누적 SP 추정 대신 스킬이 속한 차수로 분류 (`SkillLogDialog`의 `skillBranchIndex`)

### 스킬 툴팁 속성 치환 (`SkillToolTip.tsx:makeSkillDetail`)
- `description.detail`의 `#key` 플레이스홀더를 `levelProperties`의 값으로 치환
- `lt`/`rb`: Point 문자열에서 X 파싱, `mastery`: `value*5+10` (비홀더스 버프·비홀더 제외 — 비홀더는 추가숙련도라 `beholderPostfix`에서 `value*5`만 적용)
- `SkillToolTipPostfix`에서 15개 특수 스킬 추가 후처리

### 모바일 UI (< 768px)
- **직업 선택** (`JobSelector.tsx`): 그룹 블록 2열 그리드 (`grid grid-cols-2 md:flex`),
  시그너스·레지스탕스는 각각 `md:hidden` 제목이 붙은 별도 섹션 + 2열 그리드. 가로 스크롤은 `md:overflow-x-auto`로 데스크톱 전용
- **패치 노트**: 모바일 기본 접힘 (`isPatchOpen`, 목록에 `hidden md:block`). 내용은 `PATCH_NOTES` 상수 배열
- 스킬 브랜치를 세로로 스택 (`SkillTree.tsx`: `flex-col md:flex-row`)
- 브랜치 헤더 전체가 접기/펼치기 토글 (`SkillBranch.tsx`의 `isCollapsed`, 기본값 펼침)
  - 데스크톱은 헤더에 `md:pointer-events-none`, 목록 래퍼에 `md:grid-rows-[1fr]`로 항상 펼침 상태 유지
  - 접기 애니메이션은 스킬 설명 펼침과 동일한 `grid-rows-[0fr]`↔`grid-rows-[1fr]` 트랜지션
- 스킬 1행 = `[아이콘][스킬명][레벨/마스터(M)][▲][▼][M 또는 0]` (`SkillRow.tsx`)
  - 세 번째 버튼은 `isMaxLevel`에 따라 하나만 노출 (마스터면 `0`, 아니면 `M`)
  - 데스크톱은 `md:flex`로 `0`/`M` 4개 모두 유지
- 스킬 설명: 데스크톱은 hover 툴팁(포탈에 `hidden md:block`), 모바일은 아이콘/스킬명 터치 시
  행 아래로 펼침 (`SkillRow`의 `detail` prop에 `SkillTooltip`을 `detailOnly`로 전달)
  - `detailOnly`: 스킬명/아이콘/마스터레벨/설명/필요스킬을 빼고 `[현재 레벨] + 상세 수치`만 렌더링
  - 펼침 상태는 `SkillBranch`의 `expandedSkillId` — 브랜치 내에서 한 번에 하나만 열림
  - 펼침 애니메이션은 `grid-rows-[0fr]`↔`grid-rows-[1fr]` 트랜지션 (높이를 모르는 콘텐츠용).
    내부 래퍼의 `min-h-0 overflow-hidden`이 없으면 0fr로 안 줄어듦. 닫힘 애니메이션 때문에 패널은 항상 마운트됨
  - 아이콘/스킬명에 `md:pointer-events-none`을 걸어 데스크톱은 hover 툴팁 동작을 그대로 유지
- 캡처는 보이는 그대로 — 접힌 브랜치는 이미지에 포함되지 않음 (모바일은 기기 캡처 사용 가정)

### 문의하기 → GitHub Issues
- 스킬 트리 화면 우측 상단 `문의하기` → `FeedbackDialog` 모달 → `POST /api/feedback`
- `api/feedback.ts`가 `GITHUB_TOKEN`(Vercel 환경변수)으로 GitHub REST API를 호출해 이슈 생성
  - 토큰은 서버 전용 — 브라우저에 절대 노출하지 말 것
  - `FEEDBACK_REPO` 미설정 시 `kyhong222/ms-skill-simulator`
- 방어: 허니팟(`website`) / 길이 제한 / IP 60초 3건 / 클라이언트 60초 쿨다운 / `@멘션` 무력화
- 유형 키·길이 제한을 바꿀 땐 `src/constants/feedback.ts`와 `api/feedback.ts`를 **둘 다** 수정
- `npm run dev`는 `/api/*`를 서빙하지 않음 → 함수 확인은 `vercel dev` 필요

### 데이터 저장 (localStorage)
- 키: `skillTree_{jobId}` (일반) / `skillTree_{jobId}_4th` (4차만)
- 값: `{ currentLevel, skillLevels: [{ id, name, level }] }`

## 자주 수정하는 영역

- **스킬 데이터 JSON** (`src/data/skillbooks/*.json`): 패치 반영 시 수치 변경
  (배틀메이지 32xx.json은 예외 — `scripts/data/battlemage-mapleland.txt`를 고치고 생성 스크립트를 다시 돌릴 것)
- **SkillToolTipPostfix.tsx**: 새 특수 스킬 추가 또는 후처리 로직 수정
- **JobSelector.tsx**: 패치 노트/변경 이력 (파일 상단 `PATCH_NOTES` 배열에 문자열 추가)
- **useSkillBranch.ts**: 스킬 레벨 증감 로직, 활성화 검증
- **SkillBranch.tsx**: 브랜치 헤더/접기, 스킬 목록 렌더링
- **SkillRow.tsx**: 스킬 1행 UI, 버튼 동작
- **SkillTree.tsx**: 포인트 계산 공식 변경 시
- **constants/skillPoints.ts**: 게임 상수값 변경 시

### 배틀메이지 데이터 (레지스탕스)
- maplestory.io에 해당 버전(빅뱅 이전, 마력 기반)이 없어 다른 경로로 만들었다
- 수치·스킬명·설명·마스터레벨·선행스킬의 **단일 출처는 `scripts/data/battlemage-mapleland.txt`**.
  수치를 고칠 일이 있으면 JSON이 아니라 이 텍스트를 고치고 스크립트를 다시 돌릴 것
- 메이플랜드는 원작 KMST 스펙을 조정해 배틀메이지를 추가했다. `battlemage-mapleland.txt`는
  KMST 원문(`battlemage-t12137.txt`, 참고용 보존본)에 인게임 수치를 덮어쓴 것이고,
  스킬마다 `# 출처: 메이플랜드 인게임` / `# 출처: KMST T1.2.137 (…미확보)` 주석으로 어느 값인지 표시한다
  - 인게임 반영 스킬은 대부분 수치만 교체(설명·문구·선행스킬·재사용대기시간은 KMST 원문).
    블루 오라·슈퍼바디·컨버전은 설명·레벨 문구까지 인게임 문구로 교체
  - 인게임 미확보(KMST 값 유지): 스탠스·어드밴스드 다크/옐로우 오라·싸이클론·다크 제네시스·쉘터
- 레벨 줄이 `,`로 끝나면 공백으로, `\`로 끝나면 `\n`으로 다음 줄과 이어진다.
  툴팁 상세 수치 div는 `whitespace-pre-line`이라 `\n`이 실제 줄바꿈으로 보임 (현재 슈퍼바디만 사용)
- 스킬 ID·아이콘만 인벤에서 가져옴 → `node scripts/gen-battlemage.mjs` (아이콘은 `tmp/icons`에 캐시)
- 생성 시 detail 템플릿으로 원문 문장을 재조립해 글자 단위 대조. 어긋나면 파일을 쓰지 않고 종료
- 출처는 원본 텍스트 파일 상단 주석에만 기록. UI 표기는 넣지 않기로 함(게임 수치 데이터라 불필요하다는 판단)

## 주의사항 / 함정

- 스킬 아이콘은 **Base64로 JSON에 내장** — 파일 크기가 큼
- 레벨 속성 키 작명 제약 2가지: `SkillToolTip`의 `#key` 치환에 단어 경계가 없어 **키가 서로의 접두사면 안 됨**
  (`#dark`가 `#darkTime`을 갉아먹음). `mastery` 키는 툴팁이 자동으로 `값*5+10`을 적용함
- `ILevelProperties`는 `hs` 외 동적 키 — 인덱스 시그니처 `[key: string]: string`으로 정의
- `vercel.json`의 rewrite는 `/((?!api/).*)` — `/(.*)`로 되돌리면 `/api/*`까지 index.html로 삼켜 문의하기가 죽음
- Vite `base: '/'` + BrowserRouter basename 없음 — 도메인 변경(`skill.mapleland.st`) 시 둘 다 루트로 맞춰야 함 (불일치 시 자산 404 → 흰 화면)
- `isShiftPressed` 상태와 `e.shiftKey` 두 가지 방식 혼재 (useState는 버튼 색상용, 이벤트는 실제 로직용)
- `App.tsx`의 `md:min-w-[1500px]`에서 `md:`를 빼면 모바일에 1500px가 강제돼 가로 스크롤 발생
- `index.css`의 `button {}` 기본 스타일(배경/패딩/라운드)이 전역 적용됨 — 버튼 형태를 커스텀할 땐 `bg-transparent border-0 p-0 rounded-none` 등으로 명시적 초기화 필요 (`SkillBranch` 헤더 참고)
- `isBranchActivated()`: `usedSkillPoints - totalInvestedPoints` 계산 — 현재 브랜치 투자분 제외
- 툴팁: `ReactDOM.createPortal`로 `document.body`에 렌더링 (fixed 포지셔닝)
- `scripts/prepare-deploy.js`는 구 GitHub Pages 서브패스 배포용 잔재 — 현재 배포 경로에서 사용하지 않음

## 남은 개선 가능 영역

### 정리 필요
1. `index.css`에 다크/라이트 테마 CSS가 있으나 Tailwind에서 다크모드 비활성화 — 불일치
2. `public/vite.svg` 미사용 에셋
3. `@/*` tsconfig 경로 별칭 미활용 (모든 import가 상대 경로)

### 구조 개선
4. **Prop drilling** (8개+ props): Context 또는 커스텀 훅으로 개선 가능
5. **패치 이력 하드코딩**: `JobSelector.tsx`의 `PATCH_NOTES` 배열에 문자열 직접 입력 (별도 데이터 파일 분리 여지)

## 테스트

- 테스트 없음 (유닛, 통합, E2E 모두 미설정)
- 테스트 프레임워크 미설치
- `npm run lint`로 ESLint 정적 분석만 가능
