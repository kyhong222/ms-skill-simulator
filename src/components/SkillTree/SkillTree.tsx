import React, { useEffect, useState } from "react";
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
}

function calculateSkillPoints(currentLevel: number, jobLevel: number): number {
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

const SkillTree: React.FC<SkillTreeProps> = ({ selectedJobId, onResetRef }) => {
  const [skillbooks, setSkillbooks] = useState<Record<number, IJobSkillBook | null>>({});
  const [loading, setLoading] = useState(true);
  const [skillLevels, setSkillLevels] = useState<SkillLevel[]>([]);
  const [, setAllSkills] = useState<{ id: number; name: string }[]>([]);
  const [currentLevel, setCurrentLevel] = useState(10); // 기본값 10

  useEffect(() => {
    if (onResetRef) onResetRef(resetLevels);
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
      setAllSkills(loadedSkills);
      setSkillLevels(loadedSkills.map((s) => ({ id: s.id, name: s.name, level: 0 })));
      setLoading(false);
    };

    loadSkills();
  }, [selectedJobId, onResetRef]);

  const onLevelChange = (skillId: number, newLevel: number) => {
    setSkillLevels((prev) => prev.map((skill) => (skill.id === skillId ? { ...skill, level: newLevel } : skill)));
  };

  const resetLevels = () => {
    setSkillLevels((prev) => prev.map((skill) => ({ ...skill, level: 0 })));
  };

  const jobLevel = calcJobLevel(selectedJobId);
  const totalSkillPoints = calculateSkillPoints(currentLevel, jobLevel);
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
      <div className="flex items-center justify-between mb-4 min-w-[1500px]">
        <div className="flex items-center justify-between gap-4">
          <label className="font-semibold">
            현재 레벨:
            <input
              type="number"
              min={jobLevel}
              max={300}
              value={currentLevel}
              onChange={(e) => setCurrentLevel(Number(e.target.value))}
              className="ml-2 px-2 py-1 border rounded w-20"
            />
          </label>
          <div>
            총 스킬 포인트: <strong>{totalSkillPoints}</strong>
          </div>
          <div>
            사용한 포인트: <strong>{usedSkillPoints}</strong>
          </div>
          <div>
            {/* 남은 포인트가 음수면 빨간색으로 표기 */}
            남은 포인트:{" "}
            <strong className={remainingSkillPoints < 0 ? "text-red-500" : ""}>{remainingSkillPoints}</strong>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={resetLevels}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            style={{ width: "120px" }}
          >
            스킬 초기화
          </button>
        </div>
      </div>

      <div className="flex overflow-x-visible gap-6 pb-4 w-full justify-between">
        {Object.entries(skillbooks).map(([jobId, skillbook], index) =>
          skillbook ? (
            <SkillBranch
              key={jobId}
              jobId={Number(jobId)}
              skillbook={skillbook}
              skillLevels={skillLevels}
              onLevelChange={onLevelChange}
              branchIndex={index + 1}
              jobLevel={jobLevel}
              usedSkillPoints={usedSkillPoints}
              remainingSkillPoints={remainingSkillPoints}
            />
          ) : (
            <div key={jobId} className="text-red-500">
              직업 {jobId}의 스킬 정보를 불러올 수 없습니다.
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default SkillTree;
