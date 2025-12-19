import React, { useState } from "react";
import type { IJobSkillBook } from "../../types/jobSkillBook";
import SkillTooltip from "./SkillToolTip";
import ReactDOM from "react-dom";

interface SkillBranchProps {
  jobId: number;
  skillbook: IJobSkillBook;
  skillLevels: { id: number; name: string; level: number }[];
  onLevelChange: (skillId: number, newLevel: number) => void;
  branchIndex: number; // 1차, 2차, 3차, 4차
  jobLevel: number; // 전직 레벨 (1차: 10, 마법사: 8)
  usedSkillPoints: number; // 현재 사용한 총 스킬 포인트
  remainingSkillPoints: number; // 남은 스킬 포인트
}

const SkillBranch: React.FC<SkillBranchProps> = (props: SkillBranchProps) => {
  const [hoveredSkillId, setHoveredSkillId] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number; isBottomHalf?: boolean }>({ x: 0, y: 0 });

  const { skillbook, skillLevels, onLevelChange, branchIndex, jobLevel, usedSkillPoints, remainingSkillPoints } = props;

  // 마우스 이동 시 좌표 저장 (화면 절반 기준으로 위/아래 결정)
  const handleMouseMove = (e: React.MouseEvent) => {
    const screenHeight = window.innerHeight;
    const mouseY = e.clientY;
    const isBottomHalf = mouseY > screenHeight / 2;
    
    setTooltipPosition({ 
      x: e.clientX, 
      y: e.clientY,
      isBottomHalf 
    });
  };

  // 차수에 따른 포인트 계산
  const calcPointsForBranch = (branchIndex: number, jobLevel: number) => {
    let branchLevel;
    if (branchIndex === 1) return 0;
    else if (branchIndex === 2) branchLevel = 30;
    else if (branchIndex === 3) branchLevel = 70;
    else if (branchIndex === 4) branchLevel = 120;
    else return 0; // 잘못된 차수

    return (branchLevel - jobLevel) * 3 + (branchIndex - 1);
  };

  // 차수에 따른 남은 필요 포인트
  const remainingPointsForBranch = Math.max(calcPointsForBranch(branchIndex, jobLevel) - usedSkillPoints, 0);

  const isSkillActivated = (skillId: number) => {
    // 해당 스킬이 현재 활성화되어 있는지 확인

    // 이 스킬 브랜치가 활성화되어 있는지 확인
    if (!isBranchActivated()) return false;

    // 해당 스킬의 선행 스킬을 모두 만족하는지 확인
    if (!isSatisfiedRequiredSkills(skillId)) return false;

    return true;
  };

  // 해당 스킬이 레벨업 가능한지 확인
  const isSkillIncreasable = (skillId: number) => {
    // 스킬이 활성화되어 있는지 확인
    if (!isSkillActivated(skillId)) return false; // 스킬이 활성화되지 않았으면 false

    // 현재 레벨이 최대 레벨인지 확인
    if (isMaxLevel(skillId)) return false; // 이미 최대 레벨이면 false

    // 남은 포인트가 있는지 확인
    if (!hasRemainingPoints()) return false; // 남은 포인트가 없으면 false

    return true;
  };

  const isSkillDecreasable = (skillId: number) => {
    // 현재 레벨이 0인지 확인
    const currentLevel = getLevel(skillId);
    if (currentLevel <= 0) return false; // 이미 최소 레벨이면 false

    return true;
  };

  // 해당 차수에 필요한 포인트를 사용했는지 확인
  // 예: 1차는 0, 2차는 30, 3차는 70, 4차는 120
  const isBranchActivated = () => {
    const pointsRequiredForBranch = calcPointsForBranch(branchIndex, jobLevel);
    return usedSkillPoints - totalInvestedPoints >= pointsRequiredForBranch;
  };

  // 남은 포인트가 양수인지 확인
  const hasRemainingPoints = () => {
    if (remainingSkillPoints === undefined) return false; // 남은 포인트가 없으면 true로 간주
    return remainingSkillPoints > 0;
  };

  // 해당 스킬의 필요 스킬을 모두 만족하는지 확인
  const isSatisfiedRequiredSkills = (skillId: number) => {
    const skill = skillbook.skills.find((s) => s.id === skillId);
    if (!skill || !skill.requiredSkillLevels) return true; // 필요 스킬이 없으면 true
    return Object.entries(skill.requiredSkillLevels).every(([reqSkillIdStr, reqLevel]) => {
      const reqSkillId = Number(reqSkillIdStr);
      const reqSkillCurrentLevel = skillLevels.find((s) => s.id === reqSkillId)?.level || 0;
      return reqSkillCurrentLevel >= reqLevel;
    });
  };

  // 특정 스킬의 현재 레벨 가져오기
  const getLevel = (skillId: number) => {
    return skillLevels.find((s) => s.id === skillId)?.level || 0;
  };

  const isMaxLevel = (skillId: number) => {
    const skill = skillbook.skills.find((s) => s.id === skillId);
    if (!skill) return false; // 스킬이 없으면 false
    return getLevel(skillId) >= skill.masterLevel; // 현재 레벨이 마스터 레벨 이상이면 true
  };

  // 총 투자 포인트 계산
  const totalInvestedPoints = skillbook.skills.reduce((sum, skill) => {
    return sum + getLevel(skill.id);
  }, 0);

  // 스킬 레벨 증가 핸들러
  const increaseLevel = (skillId: number) => {
    const currentLevel = getLevel(skillId);

    // 스킬을 올릴 수 있는 조건인지 확인
    if (!isSkillIncreasable(skillId)) return;

    // 조건 만족하면 레벨업
    onLevelChange(skillId, currentLevel + 1);
  };

  // 스킬 레벨 감소 핸들러
  const decreaseLevel = (skillId: number) => {
    const currentLevel = getLevel(skillId);
    if (currentLevel <= 0) return; // 이미 최소 레벨
    // 해당 스킬 객체 찾기
    const skill = skillbook.skills.find((s) => s.id === skillId);
    if (!skill) return;
    // 필요 스킬 조건 확인
    if (!isSatisfiedRequiredSkills(skillId)) {
      return;
    }
    // 사용한 포인트가 차수에 맞는지 확인
    if (!isBranchActivated()) {
      return;
    }
    // 조건 만족하면 레벨 다운
    onLevelChange(skillId, currentLevel - 1);
  };

  const increaseMaxLevel = (skillId: number) => {
    const max = skillbook.skills.find((s) => s.id === skillId)?.masterLevel || 0;

    // 해당 스킬 객체 찾기
    const skill = skillbook.skills.find((s) => s.id === skillId);
    if (!skill) return;

    // 스킬을 올릴 수 있는 조건인지 확인
    if (!isSkillIncreasable(skillId)) return;

    // 남은 포인트만큼 레벨업
    const currentLevel = getLevel(skillId);
    const newLevel = Math.min(currentLevel + remainingSkillPoints, max);
    onLevelChange(skillId, newLevel);
  };

  const decreaseZeroLevel = (skillId: number) => {
    const currentLevel = getLevel(skillId);
    if (currentLevel <= 0) return; // 이미 최소 레벨
    // 해당 스킬 객체 찾기
    const skill = skillbook.skills.find((s) => s.id === skillId);
    if (!skill) return;
    // 필요 스킬 조건 확인
    if (!isSatisfiedRequiredSkills(skillId)) {
      return;
    }
    // 사용한 포인트가 차수에 맞는지 확인
    if (!isBranchActivated()) {
      return;
    }
    // 조건 만족하면 레벨 다운
    onLevelChange(skillId, 0);
  };

  return (
    // 차수에 맞는 포인트를 사용하지 않았으면 branch 전체를 비활성화
    <div
      className={`p-2 border rounded-xl w-full shadow bg-white relative ${
        !isBranchActivated() ? "filter cursor-not-allowed grayscale" : ""
      }`}
    >
      {/* 직업 아이콘 + 스킬북 이름 */}
      <div className="flex items-start gap-3 mb-4">
        {skillbook.icon && (
          <img
            src={`data:image/png;base64,${skillbook.icon}`}
            alt={`${skillbook.description.name} icon`}
            style={{ width: "55px", height: "64px", objectFit: "contain" }}
            className="w-16 h-16"
          />
        )}

        <div className="flex flex-col text-left">
          <h2 className="text-black text-2xl font-bold">{skillbook.description.bookName}</h2>
          <span className="text-sm text-gray-600">총 투자 포인트: {totalInvestedPoints}</span>
          <span className="exclude-from-capture text-sm text-gray-600">
            필요 투자 포인트: {remainingPointsForBranch}
          </span>
        </div>
      </div>

      {/* 스킬 목록 */}
      <div className="grid gap-2 w-full">
        {skillbook.skills.map((skill) => (
          // 스킬이 필요 스킬을 만족하지 않으면 비활성화(툴팁은 표시)
          <div
            key={skill.id}
            className={`flex items-start gap-4 p-3 border rounded-lg relative 
              ${isSkillActivated(skill.id) ? "" : "grayscale cursor-not-allowed"}
              ${getLevel(skill.id) === skill.masterLevel ? "bg-amber-300" : (getLevel(skill.id) >= 1 ? "bg-amber-100" :  "bg-white") }
              `}
            onMouseEnter={() => setHoveredSkillId(skill.id)}
            onMouseLeave={() => setHoveredSkillId(null)}
            onMouseMove={handleMouseMove}
          >
            {skill.icon && (
              <img
                src={`data:image/png;base64,${skill.icon}`}
                alt={skill.description?.name || "skill icon"}
                className="w-16 h-16 flex-shrink-0"
              />
            )}

            {/* 스킬명과 레벨/버튼을 감싸는 전체 flex 컨테이너 */}
            <div className="flex-1">
              {/* 스킬명 */}
              <div>
                <div className="text-black text-left font-semibold">{skill.description?.name || "알 수 없는 스킬"}</div>

                {/* 현재 레벨 및 버튼들 */}
                <div className="flex items-center gap-1 ml-0 min-w-[120px] justify-end">
                  <span className="text-black text-left">{`${getLevel(skill.id)}/${skill.masterLevel} ${
                    getLevel(skill.id) === skill.masterLevel ? "(M)" : ""
                  }`}</span>
                  <div className="ml-auto flex items-center gap-0">
                    <button
                      onClick={() => increaseLevel(skill.id)}
                      className={`exclude-from-capture px-2 py-0.5 text-white font-bold rounded flex items-center justify-center ${
                        isSkillIncreasable(skill.id)
                          ? "bg-orange-500 hover:bg-orange-600 cursor-pointer"
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
                      style={{ transform: "scale(0.75)" }}
                      aria-label="Increase level"
                      disabled={isMaxLevel(skill.id)}
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => decreaseLevel(skill.id)}
                      className={`exclude-from-capture px-2 py-0.5 text-white font-bold rounded flex items-center justify-center ${
                        isSkillDecreasable(skill.id)
                          ? "bg-orange-500 hover:bg-orange-600 cursor-pointer"
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
                      style={{ transform: "scale(0.75)" }}
                      aria-label="Decrease level"
                      disabled={getLevel(skill.id) === 0}
                    >
                      ▼
                    </button>
                    <button
                      onClick={() => decreaseZeroLevel(skill.id)}
                      className={`exclude-from-capture px-2 py-0.5 text-white font-bold rounded flex items-center justify-center ${
                        isSkillDecreasable(skill.id)
                          ? "bg-orange-500 hover:bg-orange-600 cursor-pointer"
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
                      style={{ transform: "scale(0.75)" }}
                      aria-label="Decrease to zero"
                      disabled={getLevel(skill.id) === 0}
                    >
                      0
                    </button>
                    <button
                      onClick={() => increaseMaxLevel(skill.id)}
                      className={`exclude-from-capture px-2 py-0.5 text-white font-bold rounded flex items-center justify-center ${
                        isSkillIncreasable(skill.id)
                          ? "bg-orange-500 hover:bg-orange-600 cursor-pointer"
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
                      style={{ transform: "scale(0.75)" }}
                      aria-label="Master skill"
                      disabled={isMaxLevel(skill.id)}
                    >
                      M
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Portal로 툴팁 렌더링 */}
            {hoveredSkillId === skill.id &&
              ReactDOM.createPortal(
                <div
                  className="absolute z-50"
                  style={{
                    position: "fixed",
                    top: tooltipPosition.isBottomHalf 
                      ? "auto"  // 하단에 있을 때는 bottom 기준으로 배치
                      : tooltipPosition.y,
                    bottom: tooltipPosition.isBottomHalf 
                      ? window.innerHeight - tooltipPosition.y  // 마우스 위에 표시
                      : "auto",
                    left: tooltipPosition.x,
                    pointerEvents: "none", // 마우스 이벤트 무시
                    backgroundColor: "white",
                    boxShadow: "0 0 8px rgba(0,0,0,0.15)",
                    borderRadius: "6px",
                    padding: "8px",
                    maxWidth: "300px",
                    zIndex: 9999,
                    transform: tooltipPosition.isBottomHalf ? "translateY(-100%)" : "none",  // 하단일 때 위로 이동
                  }}
                >
                  <SkillTooltip skill={skill} allSkills={skillLevels} curLevel={getLevel(skill.id)} />
                </div>,
                document.body
              )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillBranch;
