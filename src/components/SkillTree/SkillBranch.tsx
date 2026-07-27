import React, { useState } from "react";
import type { IJobSkillBook } from "../../types/jobSkillBook";
import SkillTooltip from "./SkillToolTip";
import SkillRow from "./SkillRow";
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
  // 모바일 전용 접기 상태 (데스크톱에서는 CSS로 항상 펼침)
  const [isCollapsed, setIsCollapsed] = useState(false);

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
      className={`p-2 border rounded-xl w-full min-w-0 shadow bg-white relative ${
        !fourthOnly && !isBranchActivated() ? "filter cursor-not-allowed grayscale" : ""
      }`}
    >
      {/* 직업 아이콘 + 스킬북 이름 (모바일에서는 접기 토글) */}
      <button
        type="button"
        onClick={() => setIsCollapsed((prev) => !prev)}
        aria-expanded={!isCollapsed}
        className="flex w-full items-center gap-3 mb-3 border-0 rounded-none bg-transparent p-0 text-left font-normal select-none focus:outline-none md:mb-4 md:items-start md:pointer-events-none"
      >
        {skillbook.icon && (
          <img
            src={`data:image/png;base64,${skillbook.icon}`}
            alt={`${skillbook.description.name} icon`}
            className="w-10 h-12 object-contain flex-shrink-0 md:w-[55px] md:h-16"
          />
        )}

        <div className="flex flex-col text-left min-w-0">
          <h2 className="text-black text-lg font-bold break-keep md:text-2xl">{skillbook.description.bookName}</h2>
          <span className="text-xs text-gray-600 md:text-sm">총 투자 포인트: {totalInvestedPoints}</span>
          {!fourthOnly && (
            <span className="exclude-from-capture text-xs text-gray-600 md:text-sm">
              필요 투자 포인트: {remainingPointsForBranch}
            </span>
          )}
        </div>

        {/* 접기/펼치기 표시 (모바일 전용) */}
        <span
          className="exclude-from-capture ml-auto flex-shrink-0 text-gray-500 text-base leading-none md:hidden"
          aria-hidden="true"
        >
          {isCollapsed ? "▼" : "▲"}
        </span>
      </button>

      {/* 스킬 목록 (모바일에서 접힘, 데스크톱은 항상 표시) */}
      <div className={`gap-2 w-full ${isCollapsed ? "hidden md:grid" : "grid"}`}>
        {skillbook.skills.map((skill) => (
          <SkillRow
            key={skill.id}
            skill={skill}
            level={getLevel(skill.id)}
            isActivated={isSkillActivated(skill.id)}
            isIncreasable={isSkillIncreasable(skill.id)}
            isDecreasable={isSkillDecreasable(skill.id)}
            isMaxLevel={isMaxLevel(skill.id)}
            isShiftPressed={isShiftPressed}
            onIncrease={(e) => increaseLevel(skill.id, e)}
            onDecrease={(e) => decreaseLevel(skill.id, e)}
            onIncreaseMax={() => increaseMaxLevel(skill.id)}
            onDecreaseZero={() => decreaseZeroLevel(skill.id)}
            onMouseEnter={() => setHoveredSkillId(skill.id)}
            onMouseLeave={() => setHoveredSkillId(null)}
            onMouseMove={handleMouseMove}
          >
            {/* Portal로 툴팁 렌더링 (모바일은 hover가 없어 숨김) */}
            {hoveredSkillId === skill.id &&
              ReactDOM.createPortal(
                <div
                  className="absolute z-50 hidden md:block"
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
          </SkillRow>
        ))}
      </div>
    </div>
  );
};

export default SkillBranch;
