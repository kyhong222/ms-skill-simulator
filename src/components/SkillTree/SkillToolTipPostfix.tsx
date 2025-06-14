import type { IJobSkill } from "../../types/jobSkillBook";

export const SkillToolTipPostfix = (skill: IJobSkill, curLevel: number, key: string, value: string) => {
  switch (skill.description?.name) {
    case "돌진":
      return rushPostfix(key, value);
    case "어드밴스드 콤보":
      return advancedComboPostfix(key, value);
    case "아킬레스":
      return achillesPostfix(key, value);
    case "블로킹":
      return blockingPostfix(key, value);
    case "몬스터 마그넷":
      return monsterMagnetPostfix(key, value);
    case "버서크":
      return berserkPostfix(key, value);
    case "비홀더스 버프":
      return beholdersBuffPostfix(curLevel, key, value);
    case "비홀더":
      return beholderPostfix(key, value);
    case "홀리 심볼":
      return holySymbolPostfix(key, value);
    case "리저렉션":
      return resurrectionPostfix(key, value);
    case "샤프 아이즈":
      return sharpEyesPostfix(key, value);
    case "다크 사이트":
      return darkSightPostfix(curLevel, key, value);
    case "메소 익스플로전":
      return mesoExplosionPostfix(key, value);
    case "에너지 차지":
      return energyChargePostfix(curLevel, key, value);
    case "타임 리프":
      return timeLeapPostfix(key, value);
    default:
      return value;
  }
};

// 돌진 후처리
const rushPostfix = (key: string, value: string) => {
  if (key === "rb" || key === "lt") {
    // value /= 2
    value = String(Number(value) / 2);
  }

  return value;
};

// 어드밴스드 콤보 후처리
const advancedComboPostfix = (key: string, value: string) => {
  switch (key) {
    case "damage": // 데미지
      // damage -= 120
      value = String(Number(value) - 120);
      break;
    case "x": // 최대 콤보카운터
      // x -= 5
      value = String(Number(value) - 5);
      break;
    default:
      break;
  }

  return value;
};

// 아킬레스 후처리
const achillesPostfix = (key: string, value: string) => {
  if (key === "x") {
    // x는 적에게 입는 데미지 감소 비율
    // 995 -> 0.5로 변환
    value = String((1000 - Number(value)) / 10);
  }

  return value;
};

// 블로킹 후처리
const blockingPostfix = (key: string, value: string) => {
  if (key === "prop") {
    // prop은 블록 확률
    // 5 -> 0.5로 변환
    value = String(Number(value) / 10);
  }

  return value;
};

// 몬스터 마그넷 후처리
const monsterMagnetPostfix = (key: string, value: string) => {
  if (key === "range") {
    // range /= 2
    value = String(Number(value) / 2);
  }

  return value;
};

// 버서크 후처리
const berserkPostfix = (key: string, value: string) => {
  switch (key) {
    case "damage": // 데미지
      // damage += 100
      value = String(Number(value) + 100);
      break;
    case "x": // 체력 유지 조건
      // x += 5
      value = String(Number(value) + 5);
      break;
    default:
      break;
  }

  return value;
};

// 비홀더스 버프 후처리
const beholdersBuffPostfix = (curLevel: number, key: string, value: string) => {
  if (key === "pdd") {
    // level 1~5 = 물리 방어력
    // level 6~10 = 물리 방어력, 마법 방어력
    // level 11~15 = 물리 방어력, 마법 방어력, 명중률
    // level 16~20 = 물리 방어력, 마법 방어력, 명중률, 회피율
    // level 21~25 = 물리 방어력, 마법 방어력, 명중률, 회피율, 공격력

    if (curLevel >= 1 && curLevel <= 5) {
      value = "물리 방어력";
    } else if (curLevel >= 6 && curLevel <= 10) {
      value = "물리 방어력, 마법 방어력";
    } else if (curLevel >= 11 && curLevel <= 15) {
      value = "물리 방어력, 마법 방어력, 명중률";
    } else if (curLevel >= 16 && curLevel <= 20) {
      value = "물리 방어력, 마법 방어력, 명중률, 회피율";
    } else {
      value = "물리 방어력, 마법 방어력, 명중률, 회피율, 공격력";
    }
  }

  return value;
};

// 비홀더 후처리
const beholderPostfix = (key: string, value: string) => {
  switch (key) {
    case "mastery": // 무기 숙련도
      // mastery *= 5
      value = String(Number(value) * 5);
      break;
    case "time": // 지속 시간
      // time /= 60
      value = String(Number(value) / 60);
      break;
    default:
      break;
  }

  return value;
};

// 홀리 심볼 후처리
const holySymbolPostfix = (key: string, value: string) => {
  // x += 100
  if (key === "x") {
    value = String(Number(value) + 100);
  }

  return value;
};

// 리저렉션 후처리
const resurrectionPostfix = (key: string, value: string) => {
  // cooltime /= 60
  if (key === "cooltime") {
    value = String(Number(value) / 60);
  }

  return value;
};

// 샤프 아이즈 후처리
const sharpEyesPostfix = (key: string, value: string) => {
  // y -= 100
  if (key === "y") {
    value = String(Number(value) - 100);
  }

  return value;
};

// 다크 사이트 후처리
const darkSightPostfix = (curLevel: number, key: string, value: string) => {
  if (key === "speed") {
    // 스킬레벨이 1~19이면 - x로 표기
    if (curLevel < 20) {
      value = `-${value}`;
    } else {
      // 스킬레벨이 20 이상이면 정상으로 표기
      value = `정상`;
    }
  }

  return value;
};

// 메소 익스플로전 후처리
const mesoExplosionPostfix = (key: string, value: string) => {
  if (key === "x") {
    // damage /= 10
    value = String(Number(value) / 10);
  }

  return value;
};

// 에너지 차지 후처리
const energyChargePostfix = (curLevel: number, key: string, value: string) => {
  if (key === "pad") {
    if (curLevel >= 4) {
      // 4레벨 이상이면 '물리공격력 +value, '
      value = `물리공격력 +${value}, `;
    } else {
      // 4레벨 미만이면 빈 문자열
      value = "";
    }
  }

  return value;
};

// 타임 리프 후처리
const timeLeapPostfix = (key: string, value: string) => {
  if (key === "cooltime") {
    // time /= 60
    value = String(Number(value) / 60);
  }

  return value;
};
