import React, { useEffect, useState, useCallback } from "react";
import { subJobs } from "../../data/jobs";
import type { IJobSkillBook, IJobSkill } from "../../types/jobSkillBook";
import SkillBranch from "./SkillBranch";

interface SkillLevel {
  id: number;
  name: string;
  level: number;
}

interface SkillTreeProps {
  selectedJobId: number;
  onResetRef?: (resetFn: () => void) => void;
  fourthOnly?: boolean; // 4차 이후만 모드
}

function calculateSkillPoints(
  currentLevel: number,
  jobLevel: number,
  fourthOnly: boolean,
): number {
  // 4차 이후만 모드일 때는 (현재레벨-119)*3
  if (fourthOnly) {
    return Math.max((currentLevel - 119) * 3, 0);
  }

  // 일반 모드
  let sp = (currentLevel - jobLevel) * 3;

  if (currentLevel >= jobLevel) sp += 1;
  if (currentLevel >= 30) sp += 1;
  if (currentLevel >= 70) sp += 1;
  if (currentLevel >= 120) sp += 3;

  return Math.max(sp, 0);
}

function calcJobLevel(jobId: number): number {
  const magicianJobIds = [200, 210, 211, 212, 220, 221, 222, 230, 231, 232];
  return magicianJobIds.includes(jobId) ? 8 : 10;
}

const SkillTree: React.FC<SkillTreeProps> = ({
  selectedJobId,
  onResetRef,
  fourthOnly = false,
}) => {
  const [skillbooks, setSkillbooks] = useState<
    Record<number, IJobSkillBook | null>
  >({});
  const [loading, setLoading] = useState(true);
  const [skillLevels, setSkillLevels] = useState<SkillLevel[]>([]);
  const [, setAllSkills] = useState<{ id: number; name: string }[]>([]);
  const [currentLevel, setCurrentLevel] = useState(10); // 기본값 10
  const [activeTab, setActiveTab] = useState(1);

  // localStorage에서 데이터 불러오기
  const loadFromLocalStorage = (
    jobId: number,
    loadedSkills: { id: number; name: string }[],
    is4thOnly: boolean,
  ) => {
    const storageKey = is4thOnly
      ? `skillTree_${jobId}_4th`
      : `skillTree_${jobId}`;
    const savedData = localStorage.getItem(storageKey);

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setCurrentLevel(parsed.currentLevel || 10);

        // 저장된 스킬 레벨 복원
        const restoredSkills = loadedSkills.map((s) => {
          const savedSkill = parsed.skillLevels?.find(
            (skill: SkillLevel) => skill.id === s.id,
          );
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
    return loadedSkills.map((s) => ({ id: s.id, name: s.name, level: 0 }));
  };

  // localStorage에 데이터 저장하기
  const saveToLocalStorage = (
    jobId: number,
    levels: SkillLevel[],
    charLevel: number,
    is4thOnly: boolean,
  ) => {
    const storageKey = is4thOnly
      ? `skillTree_${jobId}_4th`
      : `skillTree_${jobId}`;
    const dataToSave = {
      currentLevel: charLevel,
      skillLevels: levels,
    };
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  };

  // 스킬 레벨 증가/감소 핸들러
  const onLevelChange = (skillId: number, newLevel: number) => {
    setSkillLevels((prev) => {
      const updated = prev.map((skill) =>
        skill.id === skillId ? { ...skill, level: newLevel } : skill,
      );
      // localStorage에 저장
      saveToLocalStorage(selectedJobId, updated, currentLevel, fourthOnly);
      return updated;
    });
  };

  // 스킬 초기화 핸들러
  const resetLevels = useCallback(() => {
    setSkillLevels((prev) => {
      const reset = prev.map((skill) => ({ ...skill, level: 0 }));
      // localStorage에 저장
      saveToLocalStorage(selectedJobId, reset, currentLevel, fourthOnly);
      return reset;
    });
  }, [selectedJobId, currentLevel, fourthOnly]);

  // 캐릭터 레벨 변경 시 localStorage에 저장
  const handleLevelChange = (newLevel: number) => {
    setCurrentLevel(newLevel);
    saveToLocalStorage(selectedJobId, skillLevels, newLevel, fourthOnly);
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
              loadedSkills.push({
                id: skill.id,
                name: skill.description?.name || "알 수 없는 스킬",
              });
            });
          } catch (error) {
            console.error(`Failed to load skillbook for job ${jobId}`, error);
            results[jobId] = null;
          }
        }),
      );

      setSkillbooks(results);
      setAllSkills(loadedSkills);

      // localStorage에서 데이터 불러오기
      const restoredSkills = loadFromLocalStorage(
        selectedJobId,
        loadedSkills,
        fourthOnly,
      );
      setSkillLevels(restoredSkills);

      setLoading(false);
    };

    loadSkills();
  }, [selectedJobId, fourthOnly]);

  const jobLevel = calcJobLevel(selectedJobId);
  const totalSkillPoints = calculateSkillPoints(
    currentLevel,
    jobLevel,
    fourthOnly,
  );
  const usedSkillPoints = skillLevels.reduce(
    (sum, skill) => sum + skill.level,
    0,
  );
  const remainingSkillPoints = totalSkillPoints - usedSkillPoints;

  if (loading) {
    return <div className="text-center py-10">스킬 정보를 불러오는 중...</div>;
  }

  if (Object.keys(skillbooks).length === 0) {
    return (
      <div className="text-red-500">
        선택한 직업의 스킬 정보를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 상단 바: 현재 레벨 + 스킬 포인트 정보 */}
      <div className="exclude-from-capture flex flex-col md:flex-row md:items-center mb-4 gap-4">
        <div className="flex flex-wrap items-center justify-start gap-x-4 gap-y-2">
          <label className="font-semibold text-black">
            현재 레벨:
            <input
              type="number"
              min={jobLevel}
              max={300}
              value={currentLevel}
              onChange={(e) => handleLevelChange(Number(e.target.value))}
              className="ml-2 px-2 py-1 border rounded w-20 text-grey-800 bg-white"
            />
          </label>
          <div className="text-black">
            총 스킬 포인트:{" "}
            <strong className="text-gray-800">{totalSkillPoints}</strong>
          </div>
          <div className="text-black">
            사용한 포인트:{" "}
            <strong className="text-gray-800">{usedSkillPoints}</strong>
          </div>
          <div className="text-black">
            {/* 남은 포인트가 음수면 빨간색으로 표기 */}
            남은 포인트:{" "}
            <strong
              className={
                remainingSkillPoints < 0 ? "text-red-500" : "text-grey-800"
              }
            >
              {remainingSkillPoints}
            </strong>
          </div>
          <div className="text-black">{/* 여백 */} </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto md:ml-auto">
          <button
            onClick={resetLevels}
            className="exclude-from-capture px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            style={{ width: "120px" }}
          >
            스킬 초기화
          </button>
        </div>
      </div>

      {/* Tabs for mobile view */}
      {!fourthOnly && (
        <div className="flex justify-around border-b mb-4 lg:hidden">
          {["I", "II", "III", "IV"].map((roman, index) => {
            const num = index + 1;
            return (
              <button
                key={num}
                onClick={() => setActiveTab(num)}
                className={`py-2 px-4 w-1/4 text-center ${
                  activeTab === num
                    ? "border-b-2 border-blue-500 text-blue-500 font-semibold"
                    : "text-gray-500"
                }`}
              >
                {roman}
              </button>
            );
          })}
        </div>
      )}

      <div
        className={`skill-branches-container flex flex-col lg:flex-row overflow-x-auto gap-6 pb-4 w-full ${
          fourthOnly ? "justify-center" : "lg:justify-between"
        }`}
      >
        {Object.entries(skillbooks).map(([jobId, skillbook], index) => {
          // 4차 모드일 때는 마지막 스킬북(index 3)만 표시
          if (fourthOnly && index !== 3) return null;

          const actualIndex = fourthOnly ? 4 : index + 1; // 4차 모드일 때는 branchIndex를 4로 고정
          return (
            <div
              key={jobId}
              className={`w-full lg:w-auto ${
                fourthOnly || activeTab === actualIndex ? "block" : "hidden"
              } lg:block`}
            >
              {skillbook ? (
                <SkillBranch
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
                <div className="text-red-500">
                  직업 {jobId}의 스킬 정보를 불러올 수 없습니다.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SkillTree;
