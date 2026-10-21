import type { IJobSkillBook } from "../../types/jobSkillBook";
import type { IBranchSkillPoints } from "../../types/skillPoints";
import {
  BRANCH_2ND_LEVEL,
  BRANCH_3RD_LEVEL,
  BRANCH_4TH_LEVEL,
  SP_PER_LEVEL,
  BRANCH_2ND_BONUS_SP,
  BRANCH_3RD_BONUS_SP,
  getBranch1stBonusSp,
} from "../../constants/skillPoints";

interface UseSkillBranchParams {
  jobId: number;
  skillbook: IJobSkillBook;
  skillLevels: { id: number; name: string; level: number }[];
  onLevelChange: (skillId: number, newLevel: number) => void;
  branchIndex: number;
  jobLevel: number;
  usedSkillPoints: number;
  remainingSkillPoints: number;
  fourthOnly: boolean;
  branchSp?: IBranchSkillPoints; // 차수별 SP 분리 직업(레지스탕스)일 때만 전달
}

// 차수에 따른 포인트 계산
// branch1stBonusSp: 1차 전직 시 받는 SP (레지스탕스 5, 나머지 1)
function calcPointsForBranch(branchIndex: number, jobLevel: number, branch1stBonusSp: number): number {
  let branchLevel;
  if (branchIndex === 1) return 0;
  else if (branchIndex === 2) branchLevel = BRANCH_2ND_LEVEL;
  else if (branchIndex === 3) branchLevel = BRANCH_3RD_LEVEL;
  else if (branchIndex === 4) branchLevel = BRANCH_4TH_LEVEL;
  else return 0;

  // 이전 차수 전직 보너스 SP 누적
  const bonusSp =
    branch1stBonusSp +
    (branchIndex >= 3 ? BRANCH_2ND_BONUS_SP : 0) +
    (branchIndex >= 4 ? BRANCH_3RD_BONUS_SP : 0);

  return (branchLevel - jobLevel) * SP_PER_LEVEL + bonusSp;
}

export function useSkillBranch(params: UseSkillBranchParams) {
  const { jobId, skillbook, skillLevels, onLevelChange, branchIndex, jobLevel, usedSkillPoints, fourthOnly, branchSp } = params;
  const branch1stBonusSp = getBranch1stBonusSp(jobId);
  // 차수 분리형이면 이 차수의 잔여 포인트, 아니면 전체 공유 잔여 포인트
  const remainingSkillPoints = branchSp ? branchSp.remaining : params.remainingSkillPoints;

  // 특정 스킬의 현재 레벨 가져오기
  const getLevel = (skillId: number) => {
    return skillLevels.find((s) => s.id === skillId)?.level || 0;
  };

  // 총 투자 포인트 계산
  const totalInvestedPoints = skillbook.skills.reduce((sum, skill) => {
    return sum + getLevel(skill.id);
  }, 0);

  // 차수에 따른 남은 필요 포인트
  const remainingPointsForBranch = Math.max(calcPointsForBranch(branchIndex, jobLevel, branch1stBonusSp) - usedSkillPoints, 0);

  // 해당 차수에 필요한 포인트를 사용했는지 확인
  // 차수 분리형은 이전 차수 투자와 무관 — 이 차수에 귀속된 포인트가 생겼으면(전직 레벨 도달) 활성화
  const isBranchActivated = () => {
    if (branchSp) return branchSp.total > 0;
    const pointsRequiredForBranch = calcPointsForBranch(branchIndex, jobLevel, branch1stBonusSp);
    return usedSkillPoints - totalInvestedPoints >= pointsRequiredForBranch;
  };

  // 남은 포인트가 양수인지 확인
  const hasRemainingPoints = () => {
    if (remainingSkillPoints === undefined) return false;
    return remainingSkillPoints > 0;
  };

  // 감소를 막을지 여부 — 공유형은 비활성 차수 감소 불가(기존 동작), 차수 분리형은 레벨을 낮춰도 언제든 회수 가능
  const isDecreaseLocked = () => !fourthOnly && !branchSp && !isBranchActivated();

  // 해당 스킬의 필요 스킬을 모두 만족하는지 확인
  const isSatisfiedRequiredSkills = (skillId: number) => {
    const skill = skillbook.skills.find((s) => s.id === skillId);
    if (!skill || !skill.requiredSkillLevels) return true;
    return Object.entries(skill.requiredSkillLevels).every(([reqSkillIdStr, reqLevel]) => {
      const reqSkillId = Number(reqSkillIdStr);

      // 4차 모드일 때: 선행 스킬이 현재 스킬북에 없으면 (다른 차수 스킬이면) 조건 무시
      if (fourthOnly) {
        const isInCurrentSkillbook = skillbook.skills.some((s) => s.id === reqSkillId);
        if (!isInCurrentSkillbook) return true;
      }

      const reqSkillCurrentLevel = skillLevels.find((s) => s.id === reqSkillId)?.level || 0;
      return reqSkillCurrentLevel >= reqLevel;
    });
  };

  const isMaxLevel = (skillId: number) => {
    const skill = skillbook.skills.find((s) => s.id === skillId);
    if (!skill) return false;
    return getLevel(skillId) >= skill.masterLevel;
  };

  const isSkillActivated = (skillId: number) => {
    if (fourthOnly) return true;
    if (!isBranchActivated()) return false;
    if (!isSatisfiedRequiredSkills(skillId)) return false;
    return true;
  };

  const isSkillIncreasable = (skillId: number) => {
    if (!isSkillActivated(skillId)) return false;
    if (isMaxLevel(skillId)) return false;
    if (!hasRemainingPoints()) return false;
    return true;
  };

  const isSkillDecreasable = (skillId: number) => {
    return getLevel(skillId) > 0;
  };

  // 스킬 레벨 증가 핸들러
  const increaseLevel = (skillId: number, e?: React.MouseEvent) => {
    const currentLevel = getLevel(skillId);
    const skill = skillbook.skills.find((s) => s.id === skillId);
    if (!skill) return;

    const isShift = e?.shiftKey || false;
    const increment = isShift ? 5 : 1;

    if (!isSkillIncreasable(skillId)) return;

    if (isShift) {
      const maxPossibleLevel = Math.min(
        currentLevel + Math.min(remainingSkillPoints, increment),
        skill.masterLevel
      );
      onLevelChange(skillId, maxPossibleLevel);
    } else {
      onLevelChange(skillId, currentLevel + 1);
    }
  };

  // 스킬 레벨 감소 핸들러
  const decreaseLevel = (skillId: number, e?: React.MouseEvent) => {
    const currentLevel = getLevel(skillId);
    if (currentLevel <= 0) return;
    const skill = skillbook.skills.find((s) => s.id === skillId);
    if (!skill) return;
    if (!isSatisfiedRequiredSkills(skillId)) return;
    if (isDecreaseLocked()) return;

    const isShift = e?.shiftKey || false;
    const decrement = isShift ? 5 : 1;

    const newLevel = Math.max(currentLevel - decrement, 0);
    onLevelChange(skillId, newLevel);
  };

  const increaseMaxLevel = (skillId: number) => {
    const skill = skillbook.skills.find((s) => s.id === skillId);
    if (!skill) return;
    if (!isSkillIncreasable(skillId)) return;

    const currentLevel = getLevel(skillId);
    const newLevel = Math.min(currentLevel + remainingSkillPoints, skill.masterLevel);
    onLevelChange(skillId, newLevel);
  };

  const decreaseZeroLevel = (skillId: number) => {
    const currentLevel = getLevel(skillId);
    if (currentLevel <= 0) return;
    const skill = skillbook.skills.find((s) => s.id === skillId);
    if (!skill) return;
    if (!isSatisfiedRequiredSkills(skillId)) return;
    if (isDecreaseLocked()) return;
    onLevelChange(skillId, 0);
  };

  return {
    getLevel,
    totalInvestedPoints,
    remainingPointsForBranch,
    isBranchActivated,
    isSkillActivated,
    isSkillIncreasable,
    isSkillDecreasable,
    isMaxLevel,
    increaseLevel,
    decreaseLevel,
    increaseMaxLevel,
    decreaseZeroLevel,
  };
}
