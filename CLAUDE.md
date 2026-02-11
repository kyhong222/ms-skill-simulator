# MS Skill Simulator

메이플랜드 스킬 트리 시뮬레이터 — 12개 4차 직업의 1~4차 스킬 포인트 배분을 계획하는 웹앱 (React 19 + TypeScript + Vite + Tailwind CSS)

## 참고 문서
- 프로젝트 구조와 아키텍처 상세: [architecture.md](./architecture.md)
- 기능 추가/수정 시 반드시 architecture.md를 함께 참고할 것

## 빠른 시작

```bash
npm install          # 의존성 설치
npm run dev          # 개발 서버 (localhost:5173, base: /skill/)
npm run build        # 프로덕션 빌드 (tsc -b && vite build → dist/)
npm run lint         # ESLint 검사
npm run preview      # 빌드 결과 미리보기
npm run deploy       # GitHub Pages 배포 (gh-pages -d dist)
```

## 기술 스택

- **React 19** + **TypeScript 5.8** + **Vite 6.3**
- **Tailwind CSS 3.4** (다크모드 비활성화)
- **react-router-dom 7.13** (BrowserRouter, basename: `/skill`)
- **html2canvas 1.4** (스킬 트리 캡처)
- **gh-pages** (GitHub Pages 배포)
- 배포 URL: `https://mapleland.st/skill/`

## 프로젝트 구조

```
src/
├── components/
│   ├── JobSelector/JobSelector.tsx  # 직업 선택 UI
│   └── SkillTree/
│       ├── SkillTree.tsx            # 핵심: 상태관리, 포인트 계산, 데이터 로딩
│       ├── SkillBranch.tsx          # 단일 차수 스킬 UI (렌더링 전용)
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
└── main.tsx                        # 엔트리 (BrowserRouter basename="/skill")
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
- 일부 `style` 속성으로 고정값 지정 (width, transform: scale)
- 캡처 제외 요소: `exclude-from-capture` 클래스

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

### 데이터 저장 (localStorage)
- 키: `skillTree_{jobId}` (일반) / `skillTree_{jobId}_4th` (4차만)
- 값: `{ currentLevel, skillLevels: [{ id, name, level }] }`

## 자주 수정하는 영역

- **스킬 데이터 JSON** (`src/data/skillbooks/*.json`): 패치 반영 시 수치 변경
- **SkillToolTipPostfix.tsx**: 새 특수 스킬 추가 또는 후처리 로직 수정
- **JobSelector.tsx**: 패치 노트/변경 이력 (하드코딩)
- **useSkillBranch.ts**: 스킬 레벨 증감 로직, 활성화 검증
- **SkillBranch.tsx**: 스킬 UI 렌더링, 버튼 동작
- **SkillTree.tsx**: 포인트 계산 공식 변경 시
- **constants/skillPoints.ts**: 게임 상수값 변경 시

## 주의사항 / 함정

- 스킬 아이콘은 **Base64로 JSON에 내장** — 파일 크기가 큼
- `ILevelProperties`는 `hs` 외 동적 키 — 인덱스 시그니처 `[key: string]: string`으로 정의
- Vite `base: '/skill/'` + BrowserRouter `basename="/skill"` — 로컬 개발 시에도 `/skill/` 경로
- `isShiftPressed` 상태와 `e.shiftKey` 두 가지 방식 혼재 (useState는 버튼 색상용, 이벤트는 실제 로직용)
- `isBranchActivated()`: `usedSkillPoints - totalInvestedPoints` 계산 — 현재 브랜치 투자분 제외
- 툴팁: `ReactDOM.createPortal`로 `document.body`에 렌더링 (fixed 포지셔닝)
- `prepare-deploy.js`와 `npm run deploy`는 별개 프로세스 — deploy 스크립트는 dist 직접 배포

## 남은 개선 가능 영역

### 정리 필요
1. `index.css`에 다크/라이트 테마 CSS가 있으나 Tailwind에서 다크모드 비활성화 — 불일치
2. `public/vite.svg` 미사용 에셋
3. `@/*` tsconfig 경로 별칭 미활용 (모든 import가 상대 경로)

### 구조 개선
4. **Prop drilling** (8개+ props): Context 또는 커스텀 훅으로 개선 가능
5. **패치 이력 하드코딩**: `JobSelector.tsx`에 날짜/내용 직접 입력

## 테스트

- 테스트 없음 (유닛, 통합, E2E 모두 미설정)
- 테스트 프레임워크 미설치
- `npm run lint`로 ESLint 정적 분석만 가능
