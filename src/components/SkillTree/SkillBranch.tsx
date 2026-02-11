import React, { useState } from "react";
import type { IJobSkillBook } from "../../types/jobSkillBook";
import SkillTooltip from "./SkillToolTip";
import ReactDOM from "react-dom";
import { useSkillBranch } from "./useSkillBranch";

interface SkillBranchProps {
  jobId: number;
  skillbook: IJobSkillBook;
  skillLevels: { id: number; name: string; level: number }[];
  onLevelChange: (skillId: number, newLevel: number) => void;
  branchIndex: number; // 1차, 2차, 3차, 4차
  jobLevel: number; // 전직 레벨 (1차: 10, 마법사: 8)
  usedSkillPoints: number; // 현재 사용한 총 스킬 포인트
  remainingSkillPoints: number; // 남은 스킬 포인트
  fourthOnly?: boolean; // 4차 이후만 모드
}

const SkillBranch: React.FC<SkillBranchProps> = (props: SkillBranchProps) => {
  const [hoveredSkillId, setHoveredSkillId] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number; isBottomHalf?: boolean }>({ x: 0, y: 0 });
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  const { skillbook, skillLevels, fourthOnly = false } = props;

  const {
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
  } = useSkillBranch({ ...props, fourthOnly });

  // Shift 키 이벤트 리스너
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

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

  return (
    // 4차 이후만 모드일 때는 비활성화 처리 안 함
    // 차수에 맞는 포인트를 사용하지 않았으면 branch 전체를 비활성화
    <div
      className={`p-2 border rounded-xl w-full shadow bg-white relative ${
        !fourthOnly && !isBranchActivated() ? "filter cursor-not-allowed grayscale" : ""
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
          {!fourthOnly && (
            <span className="exclude-from-capture text-sm text-gray-600">
              필요 투자 포인트: {remainingPointsForBranch}
            </span>
          )}
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
                      onClick={(e) => increaseLevel(skill.id, e)}
                      className={`exclude-from-capture px-2 py-0.5 text-white font-bold rounded flex items-center justify-center ${
                        isSkillIncreasable(skill.id)
                          ? isShiftPressed
                            ? "bg-yellow-500 hover:bg-yellow-600 cursor-pointer"
                            : "bg-orange-500 hover:bg-orange-600 cursor-pointer"
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
                      style={{ transform: "scale(0.75)" }}
                      aria-label="Increase level"
                      disabled={isMaxLevel(skill.id)}
                      title="클릭: +1, Shift+클릭: +5"
                    >
                      ▲
                    </button>
                    <button
                      onClick={(e) => decreaseLevel(skill.id, e)}
                      className={`exclude-from-capture px-2 py-0.5 text-white font-bold rounded flex items-center justify-center ${
                        isSkillDecreasable(skill.id)
                          ? isShiftPressed
                            ? "bg-yellow-500 hover:bg-yellow-600 cursor-pointer"
                            : "bg-orange-500 hover:bg-orange-600 cursor-pointer"
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
                      style={{ transform: "scale(0.75)" }}
                      aria-label="Decrease level"
                      disabled={getLevel(skill.id) === 0}
                      title="클릭: -1, Shift+클릭: -5"
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
                      : tooltipPosition.y + 10,  // 마우스 아래 10px
                    bottom: tooltipPosition.isBottomHalf
                      ? window.innerHeight - tooltipPosition.y + 10  // 마우스 위 10px
                      : "auto",
                    left: tooltipPosition.x + 10,  // 마우스 오른쪽 10px
                    pointerEvents: "none", // 마우스 이벤트 무시
                    backgroundColor: "white",
                    boxShadow: "0 0 8px rgba(0,0,0,0.15)",
                    borderRadius: "6px",
                    padding: "8px",
                    maxWidth: "300px",
                    zIndex: 9999,
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
