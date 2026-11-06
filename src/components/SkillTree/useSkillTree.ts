import { useEffect, useState, useCallback } from "react";
import { subJobs } from "../../data/jobs";
import { readSkillTree, writeSkillTree } from "../../data/skillTreeStorage";
import { useCloud } from "../Cloud/cloudContext";
import type { IJobSkillBook, IJobSkill } from "../../types/jobSkillBook";
import type { IBranchSkillPoints } from "../../types/skillPoints";
import type { ISkillLevel, ISkillLogEntry } from "../../types/skillTree";
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
  getBranch1stBonusSp,
  BRANCH_2ND_BONUS_SP,
  BRANCH_3RD_BONUS_SP,
  BRANCH_4TH_BONUS_SP,
  isCygnusJobId,
  hasSeparateBranchSp,
  getSeparateBranchSp,
} from "../../constants/skillPoints";

// hasFourthJob=false(시그너스)면 120레벨 4차 보너스 SP를 제공하지 않음
// branch1stBonusSp: 1차 전직 시 받는 SP (레지스탕스 5, 나머지 1)
function calculateSkillPoints(currentLevel: number, jobLevel: number, fourthOnly: boolean, hasFourthJob: boolean = true, branch1stBonusSp: number = BRANCH_1ST_BONUS_SP): number {
  // 4차 이후만 모드일 때는 (현재레벨-119)*3
  if (fourthOnly) {
    return Math.max((currentLevel - FOURTH_ONLY_BASE_LEVEL) * SP_PER_LEVEL, 0);
  }

  // 일반 모드
  let sp = (currentLevel - jobLevel) * SP_PER_LEVEL;

  if (currentLevel >= jobLevel) sp += branch1stBonusSp;
  if (currentLevel >= BRANCH_2ND_LEVEL) sp += BRANCH_2ND_BONUS_SP;
  if (currentLevel >= BRANCH_3RD_LEVEL) sp += BRANCH_3RD_BONUS_SP;
  if (hasFourthJob && currentLevel >= BRANCH_4TH_LEVEL) sp += BRANCH_4TH_BONUS_SP;

  return Math.max(sp, 0);
}

function calcJobLevel(jobId: number): number {
  return MAGE_JOB_IDS.includes(jobId) ? MAGE_JOB_LEVEL : DEFAULT_JOB_LEVEL;
}

// 스킬 트리의 단일 상태 소스 (SSOT).
// 헤더 버튼(스킬 로그/스킬코드/초기화)과 본문이 함께 쓰도록 SkillTreePage에서 호출한다
export function useSkillTree(selectedJobId: number, fourthOnly: boolean) {
  const { isStorageReady, dataVersion } = useCloud();
  const [skillbooks, setSkillbooks] = useState<Record<number, IJobSkillBook | null>>({});
  const [loading, setLoading] = useState(true);
  const [skillLevels, setSkillLevels] = useState<ISkillLevel[]>([]);
  const [currentLevel, setCurrentLevel] = useState(10); // 기본값 10
  const [skillLog, setSkillLog] = useState<ISkillLogEntry[]>([]);

  // localStorage에서 데이터 불러오기
  const loadFromLocalStorage = (jobId: number, loadedSkills: { id: number; name: string; icon: string }[], is4thOnly: boolean) => {
    const savedData = readSkillTree(jobId, is4thOnly);

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setCurrentLevel(parsed.currentLevel || 10);
        // 계정 데이터에는 아이콘이 없어 스킬북에서 다시 채운다
        setSkillLog(
          (parsed.skillLog || []).map((entry: ISkillLogEntry) => ({
            ...entry,
            icon: entry.icon || loadedSkills.find((s) => s.id === entry.skillId)?.icon || "",
          }))
        );

        // 저장된 스킬 레벨 복원
        const restoredSkills = loadedSkills.map((s) => {
          const savedSkill = parsed.skillLevels?.find((skill: ISkillLevel) => skill.id === s.id);
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
  const saveToLocalStorage = (jobId: number, levels: ISkillLevel[], charLevel: number, is4thOnly: boolean, log?: ISkillLogEntry[]) => {
    writeSkillTree(jobId, is4thOnly, {
      currentLevel: charLevel,
      skillLevels: levels,
      skillLog: log ?? skillLog,
    });
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
          let newLog: ISkillLogEntry[];

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
      const emptyLog: ISkillLogEntry[] = [];
      setSkillLog(emptyLog);
      saveToLocalStorage(selectedJobId, reset, currentLevel, fourthOnly, emptyLog);
      return reset;
    });
  }, [selectedJobId, currentLevel, fourthOnly]);

  // 캐릭터 레벨 변경 시 localStorage에 저장
  const onCharacterLevelChange = (newLevel: number) => {
    setCurrentLevel(newLevel);
    saveToLocalStorage(selectedJobId, skillLevels, newLevel, fourthOnly);
  };

  useEffect(() => {
    // 로그인 확인 전에는 어느 저장소가 맞는지 모르므로 로딩 상태로 기다린다
    setLoading(true);
    if (!isStorageReady) return;

    let isCancelled = false;
    const loadSkills = async () => {
      const jobIds = subJobs[selectedJobId];
      const results: Record<number, IJobSkillBook | null> = {};
      const loadedSkills: { id: number; name: string; icon: string }[] = [];

      await Promise.all(
        jobIds.map(async (jobId) => {
          try {
            const data = await import(`../../data/skillbooks/${jobId}.json`);
            results[jobId] = data.default || data;

            (data.default || data).skills.forEach((skill: IJobSkill) => {
              loadedSkills.push({ id: skill.id, name: skill.description?.name || "알 수 없는 스킬", icon: skill.icon || "" });
            });
          } catch (error) {
            console.error(`Failed to load skillbook for job ${jobId}`, error);
            results[jobId] = null;
          }
        })
      );

      if (isCancelled) return;
      setSkillbooks(results);

      // localStorage에서 데이터 불러오기
      const restoredSkills = loadFromLocalStorage(selectedJobId, loadedSkills, fourthOnly);
      setSkillLevels(restoredSkills);

      setLoading(false);
    };

    loadSkills();
    return () => {
      isCancelled = true;
    };
  }, [selectedJobId, fourthOnly, isStorageReady, dataVersion]);

  const jobLevel = calcJobLevel(selectedJobId);
  const isCygnus = isCygnusJobId(selectedJobId);
  const branch1stBonusSp = getBranch1stBonusSp(selectedJobId);

  // 차수별 SP 분리 (레지스탕스)
  const separateSp = hasSeparateBranchSp(selectedJobId);
  const branchJobIds = subJobs[selectedJobId] || [];
  // 스킬 ID → 차수(1~4). 스킬 로그 분류·스킬코드 적용에서 사용
  const skillBranchIndex: Record<number, number> = {};
  branchJobIds.forEach((jobId, i) => {
    skillbooks[jobId]?.skills.forEach((s) => {
      skillBranchIndex[s.id] = i + 1;
    });
  });
  // 4차만 모드에서는 4차 포인트만 존재
  const getBranchTotalSp = (branchIndex: number) =>
    fourthOnly && branchIndex !== 4 ? 0 : getSeparateBranchSp(selectedJobId, currentLevel, jobLevel, branchIndex);
  const getBranchSp = (branchIndex: number): IBranchSkillPoints => {
    const total = getBranchTotalSp(branchIndex);
    const used = skillLevels.reduce((sum, s) => sum + (skillBranchIndex[s.id] === branchIndex ? s.level : 0), 0);
    return { total, remaining: total - used };
  };

  // 상단 바는 차수 분리형도 전 차수 합계로 표기
  const totalSkillPoints = separateSp
    ? branchJobIds.reduce((sum, _, i) => sum + getBranchTotalSp(i + 1), 0)
    : calculateSkillPoints(currentLevel, jobLevel, fourthOnly, !isCygnus, branch1stBonusSp);
  const usedSkillPoints = skillLevels.reduce((sum, skill) => sum + skill.level, 0);
  const remainingSkillPoints = totalSkillPoints - usedSkillPoints;

  // 스킬코드 적용. 실패하면 사용자에게 보여줄 메시지를, 성공하면 null을 반환
  const applySkillCode = (code: string): string | null => {
    try {
      const decoded = JSON.parse(atob(code.trim()));
      if (decoded.j !== selectedJobId) {
        return "다른 직업의 스킬코드입니다";
      }
      const entries: [number, number][] = decoded.s;
      if (!Array.isArray(entries)) {
        return "올바르지 않은 스킬코드입니다";
      }

      // 스킬 레벨 초기화 후 적용
      const newLevels = skillLevels.map((s) => ({ ...s, level: 0 }));
      const newLog: ISkillLogEntry[] = [];
      const totalSP = calculateSkillPoints(currentLevel, jobLevel, fourthOnly, !isCygnus, branch1stBonusSp);
      let usedSP = 0;
      // 차수 분리형: 차수별 예산 안에서만 적용 (branchIndex → 사용량)
      const usedByBranch: Record<number, number> = {};

      for (const [skillId, level] of entries) {
        const idx = newLevels.findIndex((s) => s.id === skillId);
        if (idx === -1) continue;

        const prevLevel = newLevels[idx].level;
        const delta = level - prevLevel;
        if (delta <= 0) continue;

        const branch = skillBranchIndex[skillId];
        const remainingSP = separateSp
          ? getBranchTotalSp(branch) - (usedByBranch[branch] || 0)
          : totalSP - usedSP;
        const affordable = Math.min(delta, remainingSP);
        if (affordable <= 0) {
          // 차수 분리형은 이 차수만 부족한 것이므로 다른 차수 스킬은 계속 적용
          if (separateSp) continue;
          break;
        }

        const appliedLevel = prevLevel + affordable;
        newLevels[idx].level = appliedLevel;
        usedSP += affordable;
        usedByBranch[branch] = (usedByBranch[branch] || 0) + affordable;

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
      return null;
    } catch {
      return "올바르지 않은 스킬코드입니다";
    }
  };

  return {
    skillbooks,
    loading,
    skillLevels,
    currentLevel,
    skillLog,
    jobLevel,
    isCygnus,
    separateSp,
    skillBranchIndex,
    totalSkillPoints,
    usedSkillPoints,
    remainingSkillPoints,
    getBranchSp,
    onLevelChange,
    onCharacterLevelChange,
    resetLevels,
    applySkillCode,
  };
}

export type SkillTreeState = ReturnType<typeof useSkillTree>;
