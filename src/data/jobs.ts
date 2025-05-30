import type { IJob } from "../types/job";

export const jobs: IJob[] = [
  { id: 100, name: "Swordsman (1st)", koname: "검사" },
  { id: 110, name: "Fighter (2nd)", koname: "파이터" },
  { id: 111, name: "Crusader (3rd)", koname: "크루세이더" },
  { id: 112, name: "Hero (4th)", koname: "히어로" },
  { id: 120, name: "Page (2nd)", koname: "페이지" },
  { id: 121, name: "Knight (3rd)", koname: "나이트" },
  { id: 122, name: "Paladin (4th)", koname: "팔라딘" },
  { id: 130, name: "Spearman (2nd)", koname: "스피어맨" },
  { id: 131, name: "Dragon Knight (3rd)", koname: "용기사" },
  { id: 132, name: "Dark Knight (4th)", koname: "다크나이트" },
  { id: 200, name: "Magician (1st)", koname: "매지션" },
  { id: 210, name: "Wizard - Fire/Poison (2nd)", koname: "위자드(불,독)" },
  { id: 211, name: "Mage - Fire/Poison (3rd)", koname: "메이지(불,독)" },
  { id: 212, name: "Arch Mage F/P (4th)", koname: "아크메이지(불,독)" },
  { id: 220, name: "Wizard - Ice/Lightning (2nd)", koname: "위자드(썬,콜)" },
  { id: 221, name: "Mage - Ice/Lightning (3rd)", koname: "메이지(썬,콜)" },
  { id: 222, name: "Arch Mage I/L (4th)", koname: "아크메이지(썬,콜)" },
  { id: 230, name: "Cleric (2nd)", koname: "클레릭" },
  { id: 231, name: "Priest (3rd)", koname: "프리스트" },
  { id: 232, name: "Bishop (4th)", koname: "비숍" },
  { id: 300, name: "Archer (1st)", koname: "아처" },
  { id: 310, name: "Hunter (2nd)", koname: "헌터" },
  { id: 311, name: "Ranger (3rd)", koname: "레인저" },
  { id: 312, name: "Bow Master (4th)", koname: "보우마스터" },
  { id: 320, name: "Crossbowman (2nd)", koname: "사수" },
  { id: 321, name: "Sniper (3rd)", koname: "저격수" },
  { id: 322, name: "Marksman (4th)", koname: "신궁" },
  { id: 400, name: "Rogue (1st)", koname: "로그" },
  { id: 410, name: "Assassin (1st)", koname: "어쌔신" },
  { id: 411, name: "Hermit (3rd)", koname: "허밋" },
  { id: 412, name: "Night Lord (4th)", koname: "나이트로드" },
  { id: 420, name: "Bandit (2nd)", koname: "시프" },
  { id: 421, name: "Chief Bandit  (3rd)", koname: "시프마스터" },
  { id: 422, name: "Shadower (4th)", koname: "섀도어" },
  { id: 500, name: "Pirate (1st)", koname: "해적" },
  { id: 510, name: "Brawler (2nd)", koname: "인파이터" },
  { id: 511, name: "Marauder (3rd)", koname: "버커니어" },
  { id: 512, name: "Buccaneer (4th)", koname: "바이퍼" },
  { id: 520, name: "Gunslinger (2nd)", koname: "건슬링거" },
  { id: 521, name: "Outlaw (3rd)", koname: "발키리" },
  { id: 522, name: "Corsair (4th)", koname: "캡틴" },
];

export const selectableJobs: IJob[] = [
  { id: 112, name: "Hero (4th)", koname: "히어로" },
  { id: 122, name: "Paladin (4th)", koname: "팔라딘" },
  { id: 132, name: "Dark Knight (4th)", koname: "다크나이트" },
  { id: 212, name: "Arch Mage F/P (4th)", koname: "아크메이지(불,독)" },
  { id: 222, name: "Arch Mage I/L (4th)", koname: "아크메이지(썬,콜)" },
  { id: 232, name: "Bishop (4th)", koname: "비숍" },
  { id: 312, name: "Bow Master (4th)", koname: "보우마스터" },
  { id: 322, name: "Marksman (4th)", koname: "신궁" },
  { id: 412, name: "Night Lord (4th)", koname: "나이트로드" },
  { id: 422, name: "Shadower (4th)", koname: "섀도어" },
  { id: 512, name: "Buccaneer (4th)", koname: "바이퍼" },
  { id: 522, name: "Corsair (4th)", koname: "캡틴" }, 
]

export const groupedJobs: Record<string, IJob[]> = {
  전사: [
    { id: 112, name: "Hero (4th)", koname: "히어로" },
    { id: 122, name: "Paladin (4th)", koname: "팔라딘" },
    { id: 132, name: "Dark Knight (4th)", koname: "다크나이트" },
  ],
  마법사: [
    { id: 212, name: "Arch Mage F/P (4th)", koname: "아크메이지(불,독)" },
    { id: 222, name: "Arch Mage I/L (4th)", koname: "아크메이지(썬,콜)" },
    { id: 232, name: "Bishop (4th)", koname: "비숍" },
  ],
  궁수: [
    { id: 312, name: "Bow Master (4th)", koname: "보우마스터" },
    { id: 322, name: "Marksman (4th)", koname: "신궁" },
  ],
  도적: [
    { id: 412, name: "Night Lord (4th)", koname: "나이트로드" },
    { id: 422, name: "Shadower (4th)", koname: "섀도어" },
  ],
  해적: [
    { id: 512, name: "Buccaneer (4th)", koname: "바이퍼" },
    { id: 522, name: "Corsair (4th)", koname: "캡틴" },
  ],
};

// 하위 직업 목록
export const subJobs: Record<number, number[]> = {
  // 히어로
  112: [
    // 검사, 파이터, 크루세이더, 히어로
    100, 110, 111, 112
  ],
  // 팔라딘
  122: [
    // 검사, 페이지, 나이트, 팔라딘
    100, 120, 121, 122
  ],
  // 다크나이트
  132: [
    // 검사, 스피어맨, 용기사, 다크나이트
    100, 130, 131, 132
  ],
  // 아크메이지(불,독)
  212: [
    // 매지션, 위자드(불,독), 메이지(불,독), 아크메이지(불,독)
    200, 210, 211, 212
  ],
  // 아크메이지(썬,콜)
  222: [
    // 매지션, 위자드(썬,콜), 메이지(썬,콜), 아크메이지(썬,콜)
    200, 220, 221, 222
  ],
  // 비숍
  232: [
    // 매지션, 클레릭, 프리스트, 비숍
    200, 230, 231, 232
  ],
  // 보우마스터
  312: [
    // 아처, 헌터, 레인저, 보우마스터
    300, 310, 311, 312
  ],
  // 신궁
  322: [
    // 아처, 사수, 저격수, 신궁
    300, 320, 321, 322
  ],
  // 나이트로드
  412: [
    // 로그, 어쌔신, 허밋, 나이트로드
    400, 410, 411, 412
  ],
  // 섀도어
  422: [
    // 로그, 시프, 시프마스터, 섀도어
    400, 420, 421, 422
  ],
  // 바이퍼
  512: [
    // 해적, 인파이터, 버커니어, 바이퍼
    500, 510, 511, 512
  ],
  // 캡틴
  522: [
    // 해적, 건슬링거, 발키리, 캡틴
    500, 520, 521, 522
  ]
}
