# MS Skill Simulator

메이플랜드 스킬 트리 시뮬레이터 — 12개 4차 직업의 1~4차 스킬 포인트 배분을 계획하는 웹앱 (React 19 + TypeScript + Vite + Tailwind CSS)

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
src/
├── components/
│   ├── JobSelector/JobSelector.tsx  # 직업 선택 UI
│   └── SkillTree/
│       ├── SkillTree.tsx            # 핵심: 상태관리, 포인트 계산, 데이터 로딩
│       ├── SkillBranch.tsx          # 단일 차수 스킬 UI (렌더링 전용, 모바일 접기)
│       ├── SkillRow.tsx             # 스킬 1개 행 (반응형 레이아웃)
│       ├── useSkillBranch.ts        # 스킬 브랜치 비즈니스 로직 훅
│       ├── SkillToolTip.tsx         # 스킬 툴팁 (레벨별 속성 치환)
│       └── SkillToolTipPostfix.tsx  # 15개 특수 스킬 속성값 후처리
├── constants/
│   └── skillPoints.ts              # 게임 상수 (전직 레벨, SP 계산 관련)
├── data/
│   ├── jobs.ts                     # 직업 목록/그룹/하위직업 매핑
│   └── skillbooks/*.json           # 45개 스킬북 데이터 (Base64 아이콘 내장)
├── pages/
│   ├── SkillSimulatorPage.tsx      # / 라우트: 직업 선택
│   └── SkillTreePage.tsx           # /:jobId 라우트: 스킬 트리 + 캡처
├── types/
│   ├── job.ts                      # IJob
│   └── jobSkillBook.ts             # IJobSkillBook, IJobSkill, ILevelProperties
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
- 선택 가능한 직업: 4차 12개 (`selectableJobs`)
- `subJobs[4차ID]` → `[1차, 2차, 3차, 4차]` ID 배열

### 스킬 포인트 계산 (`SkillTree.tsx:calculateSkillPoints`)
- 게임 상수는 `constants/skillPoints.ts`에 정의
- 일반 모드: `(currentLevel - jobLevel) * SP_PER_LEVEL + 보너스SP`
  - jobLevel: 마법사 계열 `MAGE_JOB_LEVEL`(8), 나머지 `DEFAULT_JOB_LEVEL`(10)
  - 보너스: Lv≥jobLevel +1, Lv≥30 +1, Lv≥70 +1, Lv≥120 +3
- 4차만 모드: `(currentLevel - FOURTH_ONLY_BASE_LEVEL) * SP_PER_LEVEL`

### 차수별 활성화 조건 (`useSkillBranch.ts:calcPointsForBranch`)
- 공식: `(branchLevel - jobLevel) * SP_PER_LEVEL + (branchIndex - 1)`
- 1차: 0, 2차: `(30-jobLevel)*3+1`, 3차: `(70-jobLevel)*3+2`, 4차: `(120-jobLevel)*3+3`

### 스킬 툴팁 속성 치환 (`SkillToolTip.tsx:makeSkillDetail`)
- `description.detail`의 `#key` 플레이스홀더를 `levelProperties`의 값으로 치환
- `lt`/`rb`: Point 문자열에서 X 파싱, `mastery`: `value*5+10` (비홀더스 버프 제외)
- `SkillToolTipPostfix`에서 15개 특수 스킬 추가 후처리

### 모바일 UI (< 768px)
- **직업 선택** (`JobSelector.tsx`): 그룹 블록 2열 그리드 (`grid grid-cols-2 md:flex`),
  시그너스는 "시그너스 기사단" 제목(`md:hidden`) + 2열 그리드. 가로 스크롤은 `md:overflow-x-auto`로 데스크톱 전용
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

### 데이터 저장 (localStorage)
- 키: `skillTree_{jobId}` (일반) / `skillTree_{jobId}_4th` (4차만)
- 값: `{ currentLevel, skillLevels: [{ id, name, level }] }`

## 자주 수정하는 영역

- **스킬 데이터 JSON** (`src/data/skillbooks/*.json`): 패치 반영 시 수치 변경
- **SkillToolTipPostfix.tsx**: 새 특수 스킬 추가 또는 후처리 로직 수정
- **JobSelector.tsx**: 패치 노트/변경 이력 (파일 상단 `PATCH_NOTES` 배열에 문자열 추가)
- **useSkillBranch.ts**: 스킬 레벨 증감 로직, 활성화 검증
- **SkillBranch.tsx**: 브랜치 헤더/접기, 스킬 목록 렌더링
- **SkillRow.tsx**: 스킬 1행 UI, 버튼 동작
- **SkillTree.tsx**: 포인트 계산 공식 변경 시
- **constants/skillPoints.ts**: 게임 상수값 변경 시

## 주의사항 / 함정

- 스킬 아이콘은 **Base64로 JSON에 내장** — 파일 크기가 큼
- `ILevelProperties`는 `hs` 외 동적 키 — 인덱스 시그니처 `[key: string]: string`으로 정의
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
