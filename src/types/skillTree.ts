// 스킬 1개의 현재 투자 레벨
export interface ISkillLevel {
  id: number;
  name: string;
  level: number;
}

// 스킬 로그 항목 (같은 스킬을 연속으로 찍으면 한 항목으로 합쳐짐)
export interface ISkillLogEntry {
  skillId: number;
  skillName: string;
  icon: string;
  level: number;
  masterLevel: number;
}
