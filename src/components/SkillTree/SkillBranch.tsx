import React, { useState } from "react";
import type { IJobSkillBook } from "../../types/jobSkillBook";
import SkillTooltip from "./SkillToolTip";

interface SkillBranchProps {
  jobId: number;
  skillbook: IJobSkillBook;
  skillLevels: { id: number; name: string; level: number }[];
  onLevelChange: (skillId: number, newLevel: number) => void;
}

const SkillBranch: React.FC<SkillBranchProps> = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  jobId,
  skillbook,
  skillLevels,
  onLevelChange,
}) => {
  const [hoveredSkillId, setHoveredSkillId] = useState<number | null>(null);

  const getLevel = (skillId: number) => {
    return skillLevels.find((s) => s.id === skillId)?.level || 0;
  };

  const totalInvestedPoints = skillbook.skills.reduce((sum, skill) => {
    return sum + getLevel(skill.id);
  }, 0);

  const increaseLevel = (skillId: number) => {
    const currentLevel = getLevel(skillId);
    const maxLevel = skillbook.skills.find((s) => s.id === skillId)?.masterLevel || 0;

    if (currentLevel >= maxLevel) return; // 이미 마스터

    // 해당 스킬 객체 찾기
    const skill = skillbook.skills.find((s) => s.id === skillId);
    if (!skill) return;

    // 필요 조건 검사
    if (skill.requiredSkillLevels) {
      const allRequirementsMet = Object.entries(skill.requiredSkillLevels).every(
        ([reqSkillIdStr, reqLevel]) => {
          const reqSkillId = Number(reqSkillIdStr);
          const reqSkillCurrentLevel = getLevel(reqSkillId);
          return reqSkillCurrentLevel >= reqLevel;
        }
      );
      if (!allRequirementsMet) {
        // 조건 안맞으면 함수 종료 (레벨업 안됨)
        return;
      }
    }

    // 조건 만족하면 레벨업
    onLevelChange(skillId, currentLevel + 1);
  };

  const maxLevel = (skillId: number) => {
    const max = skillbook.skills.find((s) => s.id === skillId)?.masterLevel || 0;
    onLevelChange(skillId, max);
  };

  return (
    <div className="p-4 border rounded-xl shadow bg-white relative">
      {/* 직업 아이콘 + 스킬북 이름 */}
      <div className="flex items-start gap-3 mb-4">
        {skillbook.icon && (
          <img
            src={`data:image/png;base64,${skillbook.icon}`}
            alt={`${skillbook.description.name} icon`}
            className="w-16 h-16"
          />
        )}

        <div className="flex flex-col text-left">
          <h2 className="text-2xl font-bold">{skillbook.description.bookName}</h2>
          <span className="text-sm text-gray-600">총 투자 포인트: {totalInvestedPoints}</span>
        </div>
      </div>

      {/* 스킬 목록 */}
      <div className="grid gap-2">
        {skillbook.skills.map((skill) => (
          <div
            key={skill.id}
            className="flex items-center gap-2 p-2 border rounded-md hover:bg-gray-50 relative cursor-pointer"
            onMouseEnter={() => setHoveredSkillId(skill.id)}
            onMouseLeave={() => setHoveredSkillId(null)}
          >
            {skill.icon && (
              <img
                src={`data:image/png;base64,${skill.icon}`}
                alt={skill.description?.name || "skill icon"}
                className="w-16 h-16 flex-shrink-0"
              />
            )}

            {/* 스킬명 */}
            <div>
              <div className="text-sm font-semibold">{skill.description?.name || "알 수 없는 스킬"}</div>

              {/* 현재 레벨 및 버튼들 */}
              <div className="flex items-center gap-2 mt-1">
                <span>레벨: {getLevel(skill.id)}</span>
                <button
                  onClick={() => increaseLevel(skill.id)}
                  className="px-2 py-0.5 bg-orange-500 text-white font-bold rounded hover:bg-orange-600 flex items-center justify-center"
                  aria-label="Increase level"
                >
                  ▲
                </button>
                <button
                  onClick={() => maxLevel(skill.id)}
                  className="px-2 py-0.5 bg-orange-500 text-white font-bold rounded hover:bg-orange-600 flex items-center justify-center"
                  aria-label="Master skill"
                >
                  M
                </button>
              </div>
            </div>

            {/* 툴팁 */}
            {hoveredSkillId === skill.id && (
              <div className="absolute top-full left-0 z-50 mt-1">
                <SkillTooltip skill={skill} allSkills={skillLevels} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillBranch;
