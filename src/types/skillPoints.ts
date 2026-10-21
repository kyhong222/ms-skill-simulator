// 차수별로 스킬 포인트가 분리된 직업(레지스탕스)의 한 차수 포인트 현황
export interface IBranchSkillPoints {
  total: number; // 해당 차수에 귀속된 총 포인트
  remaining: number; // 해당 차수에서 아직 쓰지 않은 포인트 (음수면 초과 투자)
}
