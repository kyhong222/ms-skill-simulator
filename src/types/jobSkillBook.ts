import type { IJob } from "./job";

export interface IJobSkillBook {
  icon: string; // base64 인코딩된 직업 아이콘 이미지
  job: IJob;
  id: number; // 직업 고유 ID
  skills: IJobSkill[]; // 직업에 속한 스킬 리스트
  description: IJobDescription; // 직업 설명
}

interface IJobDescription {
  id: number; // 직업 고유 ID
  desc: string; // 직업 설명
  name: string; // 직업명
  shortDesc: string; // 직업 짧은 설명
  bookName: string; // 스킬북 이름
}

export interface IJobSkill {
  masterLevel: number; // 스킬의 최대 레벨
  icon: string; // base64 인코딩된 스킬 아이콘 이미지
  iconDisabled?: string; // 비활성화된 스킬 아이콘 (optional)
  iconMouseover?: string; // 마우스 오버 시 아이콘 (optional)
  weapons: string[]; // 스킬이 사용 가능한 무기 종류 (예: ["Sword", "Bow"])
  id: number; // 스킬 고유 ID
  soundPath?: string; // 스킬 사운드 경로 (optional)
  description?: IJobSkillDescription; // 스킬 설명 (optional)
  levelProperties: ILevelProperties[]; // 레벨별 속성 리스트
  requiredSkillLevels?: Record<number, number>; // 필요한 스킬 레벨 (optional)
}

interface IJobSkillDescription {
  id: number; // 스킬 고유 ID
  desc: string; // 스킬 설명
  name: string; // 스킬명
  bookName: string; // 스킬북 이름
  detail?: string; // 스킬 상세 설명 (optional)
}

// hs만 있고 나머지는 정해져 있지 않음
interface ILevelProperties {
  hs: string; // 레벨 속성 식별자 (예: "h10"은 10레벨)
  damage?: number; // 데미지 (optional)
  hpCon?: number; // HP 소모량 (optional)
  mpCon?: number; // MP 소모량 (optional)
  pdd?: number; // 물리 방어력 (optional)
}
