// 전직 레벨 (Job advancement levels)
export const MAGE_JOB_LEVEL = 8;
export const DEFAULT_JOB_LEVEL = 10;

// 마법사 계열 직업 ID 목록
export const MAGE_JOB_IDS = [200, 210, 211, 212, 220, 221, 222, 230, 231, 232];

// 시그너스 직업 ID 판별 (4차 전직 없음 → 1~3차, 120 추가 보너스 SP 없음)
// 플레임위자드(1200대)도 마법사가 아닌 일반 취급이라 jobLevel은 10으로 적용됨(MAGE_JOB_IDS 미포함)
export const isCygnusJobId = (id: number): boolean => id >= 1100 && id <= 1599;

// 레지스탕스 직업 ID 판별 (배틀메이지 3200~3212) — 1차 전직 시 SP 5로 시작
export const isResistanceJobId = (id: number): boolean => id >= 3000 && id <= 3999;

// 차수별 전직 레벨 (Branch advancement levels)
export const BRANCH_2ND_LEVEL = 30;
export const BRANCH_3RD_LEVEL = 70;
export const BRANCH_4TH_LEVEL = 120;

// 4차 이후만 모드 기준 레벨 (4th job only base)
export const FOURTH_ONLY_BASE_LEVEL = 119;

// 레벨당 SP 배수
export const SP_PER_LEVEL = 3;

// 차수별 전직 보너스 SP
export const BRANCH_1ST_BONUS_SP = 1;
// 레지스탕스는 1차 전직 시 5포인트를 받음
export const RESISTANCE_BRANCH_1ST_BONUS_SP = 5;
export const BRANCH_2ND_BONUS_SP = 1;
export const BRANCH_3RD_BONUS_SP = 1;
export const BRANCH_4TH_BONUS_SP = 3;

// 캐릭터 최대 레벨
export const MAX_CHARACTER_LEVEL = 300;

// 직업군에 따른 1차 전직 보너스 SP (레지스탕스만 5, 나머지는 1)
export const getBranch1stBonusSp = (jobId: number): number =>
  isResistanceJobId(jobId) ? RESISTANCE_BRANCH_1ST_BONUS_SP : BRANCH_1ST_BONUS_SP;

// 레지스탕스는 차수별로 스킬 포인트가 분리됨
//   - 각 레벨 구간에서 얻은 SP는 그 차수에만 쓸 수 있음 (다른 차수로 못 넘김)
//   - 이전 차수에 필수 포인트를 다 쓰지 않아도 다음 차수 스킬을 찍을 수 있음
export const hasSeparateBranchSp = isResistanceJobId;

// 레지스탕스는 200레벨 이후로 SP를 얻지 않음
export const SEPARATE_BRANCH_SP_MAX_LEVEL = 200;

// 차수 분리형 직업의 차수별 총 SP (branchIndex: 1~4)
//   1차: 전직 보너스 + (jobLevel, 30] 구간 레벨업 SP
//   2차: Lv30 전직 보너스 + (30, 70] 구간,  3차: Lv70 보너스 + (70, 120] 구간
//   4차: Lv120 보너스 + (120, 200] 구간
export function getSeparateBranchSp(jobId: number, currentLevel: number, jobLevel: number, branchIndex: number): number {
  const level = Math.min(currentLevel, SEPARATE_BRANCH_SP_MAX_LEVEL);
  const ranges: Record<number, { from: number; to: number; bonus: number }> = {
    1: { from: jobLevel, to: BRANCH_2ND_LEVEL, bonus: getBranch1stBonusSp(jobId) },
    2: { from: BRANCH_2ND_LEVEL, to: BRANCH_3RD_LEVEL, bonus: BRANCH_2ND_BONUS_SP },
    3: { from: BRANCH_3RD_LEVEL, to: BRANCH_4TH_LEVEL, bonus: BRANCH_3RD_BONUS_SP },
    4: { from: BRANCH_4TH_LEVEL, to: SEPARATE_BRANCH_SP_MAX_LEVEL, bonus: BRANCH_4TH_BONUS_SP },
  };
  const range = ranges[branchIndex];
  if (!range || level < range.from) return 0;
  return range.bonus + (Math.min(level, range.to) - range.from) * SP_PER_LEVEL;
}
