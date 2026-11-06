import React from "react";
import SkillBranch from "./SkillBranch";
import type { SkillTreeState } from "./useSkillTree";
import { MAX_CHARACTER_LEVEL } from "../../constants/skillPoints";

interface SkillTreeProps {
  tree: SkillTreeState; // 상태는 SkillTreePage의 useSkillTree가 소유
  fourthOnly?: boolean; // 4차 이후만 모드
}

const SkillTree: React.FC<SkillTreeProps> = ({ tree, fourthOnly = false }) => {
  const {
    skillbooks,
    loading,
    skillLevels,
    currentLevel,
    jobLevel,
    separateSp,
    totalSkillPoints,
    usedSkillPoints,
    remainingSkillPoints,
    getBranchSp,
    onLevelChange,
    onCharacterLevelChange,
  } = tree;

  if (loading) {
    return <div className="text-center py-10 dark:text-gray-100">스킬 정보를 불러오는 중...</div>;
  }

  if (Object.keys(skillbooks).length === 0) {
    return <div className="text-red-500">선택한 직업의 스킬 정보를 찾을 수 없습니다.</div>;
  }

  return (
    <div>
      {/* 상단 바: 현재 레벨 + 스킬 포인트 정보 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4 text-sm md:text-base">
        <label className="font-semibold text-black dark:text-gray-100">
          현재 레벨:
          <input
            type="number"
            min={jobLevel}
            max={MAX_CHARACTER_LEVEL}
            value={currentLevel}
            onChange={(e) => onCharacterLevelChange(Number(e.target.value))}
            className="ml-2 px-2 py-1 border rounded w-20 text-gray-800 bg-white dark:text-gray-100 dark:bg-dark-raised"
          />
        </label>
        <div className="text-black dark:text-gray-100">
          총 스킬 포인트: <strong className="text-gray-800 dark:text-gray-100">{totalSkillPoints}</strong>
        </div>
        <div className="text-black dark:text-gray-100">
          사용한 포인트: <strong className="text-gray-800 dark:text-gray-100">{usedSkillPoints}</strong>
        </div>
        <div className="text-black dark:text-gray-100">
          {/* 남은 포인트가 음수면 빨간색으로 표기 */}
          남은 포인트:{" "}
          <strong className={remainingSkillPoints < 0 ? "text-red-500" : "text-gray-800 dark:text-gray-100"}>{remainingSkillPoints}</strong>
        </div>
      </div>

      {/* 모바일: 세로 / md~: 2열 / xl~: 기존 가로 4열 (4열은 1280px 미만에서 좁아 2줄로 배치) */}
      <div className={`skill-branches-container overflow-x-visible gap-3 md:gap-6 pb-4 ${fourthOnly ? 'flex flex-col w-full md:w-1/2 xl:w-1/4 mx-auto' : 'flex flex-col md:grid md:grid-cols-2 md:items-start xl:flex xl:flex-row xl:items-stretch xl:justify-between w-full'}`}>
        {Object.entries(skillbooks).map(([jobId, skillbook], index) => {
          // 4차 모드일 때는 마지막 스킬북(index 3)만 표시
          if (fourthOnly && index !== 3) return null;

          const actualIndex = fourthOnly ? 4 : index + 1; // 4차 모드일 때는 branchIndex를 4로 고정
          return skillbook ? (
            <SkillBranch
              key={jobId}
              jobId={Number(jobId)}
              skillbook={skillbook}
              skillLevels={skillLevels}
              onLevelChange={onLevelChange}
              branchIndex={actualIndex}
              jobLevel={jobLevel}
              usedSkillPoints={usedSkillPoints}
              remainingSkillPoints={remainingSkillPoints}
              fourthOnly={fourthOnly}
              branchSp={separateSp ? getBranchSp(actualIndex) : undefined}
            />
          ) : (
            <div key={jobId} className="text-red-500">
              직업 {jobId}의 스킬 정보를 불러올 수 없습니다.
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SkillTree;
