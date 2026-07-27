import React from "react";
import type { IJobSkill } from "../../types/jobSkillBook";

interface SkillRowProps {
  skill: IJobSkill;
  level: number;
  isActivated: boolean;
  isIncreasable: boolean;
  isDecreasable: boolean;
  isMaxLevel: boolean;
  isShiftPressed: boolean;
  onIncrease: (e: React.MouseEvent) => void;
  onDecrease: (e: React.MouseEvent) => void;
  onIncreaseMax: () => void;
  onDecreaseZero: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onMouseMove: (e: React.MouseEvent) => void;
  children?: React.ReactNode; // 툴팁 포탈
}

// 모바일: 28x24 실제 크기 / 데스크톱: 기존 px-2 py-0.5 + scale(0.75)
// display(flex/hidden)는 버튼마다 지정 — '0' 버튼은 모바일에서 숨김
const BUTTON_BASE =
  "exclude-from-capture h-7 w-6 p-0 text-xs text-white font-bold rounded items-center justify-center flex-shrink-0 " +
  "md:h-auto md:w-auto md:px-2 md:py-0.5 md:text-base md:scale-75";

const SkillRow: React.FC<SkillRowProps> = ({
  skill,
  level,
  isActivated,
  isIncreasable,
  isDecreasable,
  isMaxLevel,
  isShiftPressed,
  onIncrease,
  onDecrease,
  onIncreaseMax,
  onDecreaseZero,
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
  children,
}) => {
  // Shift 클릭을 지원하는 버튼(▲▼)은 Shift 눌림 상태를 노란색으로 표시
  const toggleButtonColor = (enabled: boolean) =>
    enabled
      ? isShiftPressed
        ? "bg-yellow-500 hover:bg-yellow-600 cursor-pointer"
        : "bg-orange-500 hover:bg-orange-600 cursor-pointer"
      : "bg-gray-400 cursor-not-allowed";

  const buttonColor = (enabled: boolean) =>
    enabled ? "bg-orange-500 hover:bg-orange-600 cursor-pointer" : "bg-gray-400 cursor-not-allowed";

  return (
    // 스킬이 필요 스킬을 만족하지 않으면 비활성화(툴팁은 표시)
    <div
      className={`relative flex items-center gap-2 p-2 border rounded-lg md:items-start md:gap-4 md:p-3
        ${isActivated ? "" : "grayscale cursor-not-allowed"}
        ${level === skill.masterLevel ? "bg-amber-300" : level >= 1 ? "bg-amber-100" : "bg-white"}
        `}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
    >
      {skill.icon && (
        <img
          src={`data:image/png;base64,${skill.icon}`}
          alt={skill.description?.name || "skill icon"}
          className="w-7 h-7 flex-shrink-0 md:w-16 md:h-16"
        />
      )}

      {/* 모바일: [스킬명][레벨][버튼] 한 줄 / 데스크톱: 스킬명 위 + 레벨·버튼 아래 */}
      <div className="flex flex-1 min-w-0 items-center gap-2 md:block md:gap-0">
        {/* 스킬명 */}
        <div className="flex-1 min-w-0 text-black text-left text-sm font-semibold leading-tight break-keep md:text-base md:leading-normal">
          {skill.description?.name || "알 수 없는 스킬"}
        </div>

        {/* 현재 레벨 및 버튼들 */}
        <div className="flex flex-shrink-0 items-center gap-1 md:min-w-[120px] md:justify-end">
          <span className="text-black text-left text-xs whitespace-nowrap md:text-base">
            {`${level}/${skill.masterLevel}${level === skill.masterLevel ? " (M)" : ""}`}
          </span>
          <div className="ml-auto flex items-center gap-0.5 md:gap-0">
            <button
              onClick={onIncrease}
              className={`${BUTTON_BASE} flex ${toggleButtonColor(isIncreasable)}`}
              aria-label="Increase level"
              disabled={isMaxLevel}
              title="클릭: +1, Shift+클릭: +5"
            >
              ▲
            </button>
            <button
              onClick={onDecrease}
              className={`${BUTTON_BASE} flex ${toggleButtonColor(isDecreasable)}`}
              aria-label="Decrease level"
              disabled={level === 0}
              title="클릭: -1, Shift+클릭: -5"
            >
              ▼
            </button>
            {/* '0' 버튼은 모바일에서 숨김 (공간 확보) */}
            <button
              onClick={onDecreaseZero}
              className={`${BUTTON_BASE} hidden md:flex ${buttonColor(isDecreasable)}`}
              aria-label="Decrease to zero"
              disabled={level === 0}
            >
              0
            </button>
            <button
              onClick={onIncreaseMax}
              className={`${BUTTON_BASE} flex ${buttonColor(isIncreasable)}`}
              aria-label="Master skill"
              disabled={isMaxLevel}
            >
              M
            </button>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
};

export default SkillRow;
