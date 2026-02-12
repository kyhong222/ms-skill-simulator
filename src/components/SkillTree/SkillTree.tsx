import React, { useEffect, useState, useCallback } from "react";
import { subJobs } from "../../data/jobs";
import type { IJobSkillBook, IJobSkill } from "../../types/jobSkillBook";
import SkillBranch from "./SkillBranch";
import SkillLogDialog from "./SkillLogDialog";
import {
  MAGE_JOB_IDS,
  MAGE_JOB_LEVEL,
  DEFAULT_JOB_LEVEL,
  FOURTH_ONLY_BASE_LEVEL,
  SP_PER_LEVEL,
  BRANCH_2ND_LEVEL,
  BRANCH_3RD_LEVEL,
  BRANCH_4TH_LEVEL,
  BRANCH_1ST_BONUS_SP,
  BRANCH_2ND_BONUS_SP,
  BRANCH_3RD_BONUS_SP,
  BRANCH_4TH_BONUS_SP,
  MAX_CHARACTER_LEVEL,
} from "../../constants/skillPoints";

interface SkillLevel {
  id: number;
  name: string;
  level: number;
}

interface SkillLogEntry {
  skillId: number;
  skillName: string;
  icon: string;
  level: number;
  masterLevel: number;
}

interface SkillTreeProps {
  selectedJobId: number;
  jobName?: string;
  onResetRef?: (resetFn: () => void) => void;
  fourthOnly?: boolean; // 4차 이후만 모드
}

function calculateSkillPoints(currentLevel: number, jobLevel: number, fourthOnly: boolean): number {
  // 4차 이후만 모드일 때는 (현재레벨-119)*3
  if (fourthOnly) {
    return Math.max((currentLevel - FOURTH_ONLY_BASE_LEVEL) * SP_PER_LEVEL, 0);
  }

  // 일반 모드
  let sp = (currentLevel - jobLevel) * SP_PER_LEVEL;

  if (currentLevel >= jobLevel) sp += BRANCH_1ST_BONUS_SP;
  if (currentLevel >= BRANCH_2ND_LEVEL) sp += BRANCH_2ND_BONUS_SP;
  if (currentLevel >= BRANCH_3RD_LEVEL) sp += BRANCH_3RD_BONUS_SP;
  if (currentLevel >= BRANCH_4TH_LEVEL) sp += BRANCH_4TH_BONUS_SP;

  return Math.max(sp, 0);
}

function calcJobLevel(jobId: number): number {
  return MAGE_JOB_IDS.includes(jobId) ? MAGE_JOB_LEVEL : DEFAULT_JOB_LEVEL;
}

const SkillTree: React.FC<SkillTreeProps> = ({ selectedJobId, jobName = "", onResetRef, fourthOnly = false }) => {
  const [skillbooks, setSkillbooks] = useState<Record<number, IJobSkillBook | null>>({});
  const [loading, setLoading] = useState(true);
  const [skillLevels, setSkillLevels] = useState<SkillLevel[]>([]);
  const [currentLevel, setCurrentLevel] = useState(10); // 기본값 10
  const [skillLog, setSkillLog] = useState<SkillLogEntry[]>([]);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isCodeInputOpen, setIsCodeInputOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const codeDialogRef = React.useRef<HTMLDialogElement>(null);

  // localStorage에서 데이터 불러오기
  const loadFromLocalStorage = (jobId: number, loadedSkills: { id: number; name: string }[], is4thOnly: boolean) => {
    const storageKey = is4thOnly ? `skillTree_${jobId}_4th` : `skillTree_${jobId}`;
    const savedData = localStorage.getItem(storageKey);

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setCurrentLevel(parsed.currentLevel || 10);
        setSkillLog(parsed.skillLog || []);

        // 저장된 스킬 레벨 복원
        const restoredSkills = loadedSkills.map((s) => {
          const savedSkill = parsed.skillLevels?.find((skill: SkillLevel) => skill.id === s.id);
          return {
            id: s.id,
            name: s.name,
            level: savedSkill?.level || 0,
          };
        });
        return restoredSkills;
      } catch (error) {
        console.error("Failed to parse localStorage data", error);
      }
    }

    // 저장된 데이터가 없으면 초기값 반환
    setSkillLog([]);
    return loadedSkills.map((s) => ({ id: s.id, name: s.name, level: 0 }));
  };

  // localStorage에 데이터 저장하기
  const saveToLocalStorage = (jobId: number, levels: SkillLevel[], charLevel: number, is4thOnly: boolean, log?: SkillLogEntry[]) => {
    const storageKey = is4thOnly ? `skillTree_${jobId}_4th` : `skillTree_${jobId}`;
    const dataToSave = {
      currentLevel: charLevel,
      skillLevels: levels,
      skillLog: log ?? skillLog,
    };
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  };

  // 모든 skillbooks에서 스킬 정보 검색
  const findSkillInfo = (skillId: number) => {
    for (const book of Object.values(skillbooks)) {
      if (!book) continue;
      const skill = book.skills.find((s) => s.id === skillId);
      if (skill) return skill;
    }
    return null;
  };

  // 스킬 레벨 증가/감소 핸들러
  const onLevelChange = (skillId: number, newLevel: number) => {
    const currentSkillLevel = skillLevels.find((s) => s.id === skillId)?.level || 0;
    const isIncrease = newLevel > currentSkillLevel;

    setSkillLevels((prev) => {
      const updated = prev.map((skill) => (skill.id === skillId ? { ...skill, level: newLevel } : skill));

      if (isIncrease) {
        setSkillLog((prevLog) => {
          const lastEntry = prevLog[prevLog.length - 1];
          let newLog: SkillLogEntry[];

          if (lastEntry && lastEntry.skillId === skillId) {
            // 같은 스킬 연속 → 마지막 항목 레벨만 업데이트
            newLog = [...prevLog.slice(0, -1), { ...lastEntry, level: newLevel }];
          } else {
            // 다른 스킬 → 새 항목 추가
            const skillInfo = findSkillInfo(skillId);
            const skillName = skillInfo?.description?.name || prev.find((s) => s.id === skillId)?.name || "알 수 없는 스킬";
            newLog = [
              ...prevLog,
              {
                skillId,
                skillName,
                icon: skillInfo?.icon || "",
                level: newLevel,
                masterLevel: skillInfo?.masterLevel || 0,
              },
            ];
          }

          saveToLocalStorage(selectedJobId, updated, currentLevel, fourthOnly, newLog);
          return newLog;
        });
      } else {
        // 감소 시 마지막 로그 항목이 같은 스킬이면 레벨 업데이트
        setSkillLog((prevLog) => {
          const lastEntry = prevLog[prevLog.length - 1];
          if (lastEntry && lastEntry.skillId === skillId) {
            const newLog = newLevel > 0
              ? [...prevLog.slice(0, -1), { ...lastEntry, level: newLevel }]
              : prevLog.slice(0, -1); // 0이면 항목 제거
            saveToLocalStorage(selectedJobId, updated, currentLevel, fourthOnly, newLog);
            return newLog;
          }
          saveToLocalStorage(selectedJobId, updated, currentLevel, fourthOnly);
          return prevLog;
        });
      }

      return updated;
    });
  };

  // 스킬 초기화 핸들러
  const resetLevels = useCallback(() => {
    setSkillLevels((prev) => {
      const reset = prev.map((skill) => ({ ...skill, level: 0 }));
      const emptyLog: SkillLogEntry[] = [];
      setSkillLog(emptyLog);
      saveToLocalStorage(selectedJobId, reset, currentLevel, fourthOnly, emptyLog);
      return reset;
    });
  }, [selectedJobId, currentLevel, fourthOnly]);

  // 캐릭터 레벨 변경 시 localStorage에 저장
  const handleLevelChange = (newLevel: number) => {
    setCurrentLevel(newLevel);
    saveToLocalStorage(selectedJobId, skillLevels, newLevel, fourthOnly);
  };

  // 스킬코드 입력 다이얼로그 제어
  useEffect(() => {
    const dialog = codeDialogRef.current;
    if (!dialog) return;
    if (isCodeInputOpen) {
      setCodeInput("");
      setCodeError("");
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isCodeInputOpen]);

  useEffect(() => {
    const dialog = codeDialogRef.current;
    if (!dialog) return;
    const handleClose = () => setIsCodeInputOpen(false);
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, []);

  // 스킬코드 적용
  const applySkillCode = () => {
    try {
      const decoded = JSON.parse(atob(codeInput.trim()));
      if (decoded.j !== selectedJobId) {
        setCodeError("다른 직업의 스킬코드입니다");
        return;
      }
      const entries: [number, number][] = decoded.s;
      if (!Array.isArray(entries)) {
        setCodeError("올바르지 않은 스킬코드입니다");
        return;
      }

      // 스킬 레벨 초기화 후 적용
      const newLevels = skillLevels.map((s) => ({ ...s, level: 0 }));
      const newLog: SkillLogEntry[] = [];
      const totalSP = calculateSkillPoints(currentLevel, jobLevel, fourthOnly);
      let usedSP = 0;

      for (const [skillId, level] of entries) {
        const idx = newLevels.findIndex((s) => s.id === skillId);
        if (idx === -1) continue;

        const prevLevel = newLevels[idx].level;
        const delta = level - prevLevel;
        if (delta <= 0) continue;

        const remainingSP = totalSP - usedSP;
        const affordable = Math.min(delta, remainingSP);
        if (affordable <= 0) break;

        const appliedLevel = prevLevel + affordable;
        newLevels[idx].level = appliedLevel;
        usedSP += affordable;

        const skillInfo = findSkillInfo(skillId);
        newLog.push({
          skillId,
          skillName: skillInfo?.description?.name || newLevels[idx].name || "알 수 없는 스킬",
          icon: skillInfo?.icon || "",
          level: appliedLevel,
          masterLevel: skillInfo?.masterLevel || 0,
        });
      }

      setSkillLevels(newLevels);
      setSkillLog(newLog);
      saveToLocalStorage(selectedJobId, newLevels, currentLevel, fourthOnly, newLog);
      setIsCodeInputOpen(false);
    } catch {
      setCodeError("올바르지 않은 스킬코드입니다");
    }
  };

  // onResetRef 등록
  useEffect(() => {
    if (onResetRef) onResetRef(resetLevels);
  }, [onResetRef, resetLevels]);

  useEffect(() => {
    const loadSkills = async () => {
      setLoading(true);
      const jobIds = subJobs[selectedJobId];
      const results: Record<number, IJobSkillBook | null> = {};
      const loadedSkills: { id: number; name: string }[] = [];

      await Promise.all(
        jobIds.map(async (jobId) => {
          try {
            const data = await import(`../../data/skillbooks/${jobId}.json`);
            results[jobId] = data.default || data;

            (data.default || data).skills.forEach((skill: IJobSkill) => {
              loadedSkills.push({ id: skill.id, name: skill.description?.name || "알 수 없는 스킬" });
            });
          } catch (error) {
            console.error(`Failed to load skillbook for job ${jobId}`, error);
            results[jobId] = null;
          }
        })
      );

      setSkillbooks(results);

      // localStorage에서 데이터 불러오기
      const restoredSkills = loadFromLocalStorage(selectedJobId, loadedSkills, fourthOnly);
      setSkillLevels(restoredSkills);
      
      setLoading(false);
    };

    loadSkills();
  }, [selectedJobId, fourthOnly]);

  const jobLevel = calcJobLevel(selectedJobId);
  const totalSkillPoints = calculateSkillPoints(currentLevel, jobLevel, fourthOnly);
  const usedSkillPoints = skillLevels.reduce((sum, skill) => sum + skill.level, 0);
  const remainingSkillPoints = totalSkillPoints - usedSkillPoints;

  if (loading) {
    return <div className="text-center py-10">스킬 정보를 불러오는 중...</div>;
  }

  if (Object.keys(skillbooks).length === 0) {
    return <div className="text-red-500">선택한 직업의 스킬 정보를 찾을 수 없습니다.</div>;
  }

  return (
    <div>
      {/* 상단 바: 현재 레벨 + 스킬 포인트 정보 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center justify-between gap-4">
          <label className="font-semibold text-black">
            현재 레벨:
            <input
              type="number"
              min={jobLevel}
              max={MAX_CHARACTER_LEVEL}
              value={currentLevel}
              onChange={(e) => handleLevelChange(Number(e.target.value))}
              className="ml-2 px-2 py-1 border rounded w-20 text-grey-800 bg-white"
            />
          </label>
          <div className="text-black">
            총 스킬 포인트: <strong className="text-gray-800">{totalSkillPoints}</strong>
          </div>
          <div className="text-black">
            사용한 포인트: <strong className="text-gray-800">{usedSkillPoints}</strong>
          </div>
          <div className="text-black">
            {/* 남은 포인트가 음수면 빨간색으로 표기 */}
            남은 포인트:{" "}
            <strong className={remainingSkillPoints < 0 ? "text-red-500" : "text-grey-800"}>{remainingSkillPoints}</strong>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsLogOpen(true)}
            className="exclude-from-capture px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            style={{ width: "120px" }}
          >
            스킬 로그
          </button>
          <button
            onClick={() => setIsCodeInputOpen(true)}
            className="exclude-from-capture px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            style={{ width: "140px" }}
          >
            스킬코드 적용
          </button>
          <button
            onClick={resetLevels}
            className="exclude-from-capture px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            style={{ width: "120px" }}
          >
            스킬 초기화
          </button>
        </div>
      </div>

      <div className={`skill-branches-container flex overflow-x-visible gap-6 pb-4 ${fourthOnly ? 'w-1/4 mx-auto' : 'w-full justify-between'}`}>
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
            />
          ) : (
            <div key={jobId} className="text-red-500">
              직업 {jobId}의 스킬 정보를 불러올 수 없습니다.
            </div>
          );
        })}
      </div>

      <SkillLogDialog
        log={skillLog}
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        jobLevel={jobLevel}
        fourthOnly={fourthOnly}
        jobName={jobName}
        jobId={selectedJobId}
      />

      <dialog
        ref={codeDialogRef}
        className="rounded-lg shadow-xl p-0 w-[480px] backdrop:bg-black/50"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50 rounded-t-lg">
          <h3 className="font-semibold text-lg text-gray-800">스킬코드 적용</h3>
          <button
            onClick={() => setIsCodeInputOpen(false)}
            className="text-gray-500 hover:text-gray-800 text-xl leading-none px-1"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4">
          <textarea
            value={codeInput}
            onChange={(e) => { setCodeInput(e.target.value); setCodeError(""); }}
            placeholder="스킬코드를 붙여넣으세요"
            className="w-full h-24 px-3 py-2 border rounded text-sm text-gray-800 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          {codeError && (
            <p className="text-red-500 text-sm mt-2">{codeError}</p>
          )}
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => setIsCodeInputOpen(false)}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              취소
            </button>
            <button
              onClick={applySkillCode}
              className="px-4 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              적용
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default SkillTree;
