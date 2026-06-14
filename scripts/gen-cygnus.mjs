// 시그너스 스킬북 생성 스크립트 (GMS v72 API → src/data/skillbooks/{id}.json)
// 사용법: node scripts/gen-cygnus.mjs 1100 1110 1111 ...  (인자 없으면 전체)
//  - API 원본에서 기존 JSON 스키마(IJobSkillBook)에 맞는 필드만 추출
//  - 영문 잔존 4개 스킬명은 NAME_OVERRIDES로 한글화
//  - description.detail: 모험가 동일 스킬명 detail 자동 재사용(placeholder 키가 모두 존재할 때만),
//    신규/키불일치 스킬은 AUTHORED[id]로 직접 작성. AUTHORED가 자동재사용보다 우선.
import { writeFileSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "src/data/skillbooks");
const API = (id) => `https://maplestory.io/api/gms/72/job/${id}/skillbook`;

const ALL_JOBS = [1100, 1110, 1111, 1200, 1210, 1211, 1300, 1310, 1311, 1400, 1410, 1411, 1500, 1510, 1511];
const CYGNUS_FILE = /^1[0-5]\d\d\.json$/;

// 영문으로 남은 스킬명 수동 번역
const NAME_OVERRIDES = {
  11001002: "파워 스트라이크",
  11001003: "슬래시 블러스트",
  11101003: "분노",
  13111001: "스트레이프",
};

// desc 본문이 영문으로 남은 스킬 → 한글 desc로 고정 (API가 호출마다 한/영을 비결정적으로 반환해 고정 필요)
const DESC_OVERRIDES = {
  11001002: "MP를 소비하여 장착한 무기로 적에게 일격을 가한다.",
  11001003: "HP, MP를 소비하여 장착한 무기로 주위의 적에게 전체 공격을 가한다.",
  11101003: "일정 시간동안 주위에 있는 파티 전원의 물리 공격력은 상승하나 물리 방어력은 낮아진다.",
  13111001: "한 명의 적에게 4발의 화살을 쏘아 공격한다.",
};

// 스킬ID → detail 직접 작성분 (신규 스킬 + 모험가와 키가 달라 재사용 불가한 스킬)
// 자동 재사용보다 우선 적용됨.
const AUTHORED = {
  // ── 소울마스터 ──
  11001002: "MP #mpCon 소비, 데미지 #damage%",
  11001003: "HP #hpCon, MP #mpCon 소비하여 데미지 #damage%",
  11001004: "MP #mpCon 소비하여 #time초간 물리 공격력 +#pad, 물리 방어력 +#pdd, 마법 방어력 +#mdd의 정령을 소환",
  11101002: "#prop% 확률로 검 데미지 #damage%의 파이널 어택 발동.",
  11101004: "MP #mpCon 소비하여 최대 #mobCount명에게 데미지 #damage%로 공격",
  11101005: "MP #mpCon 소비하여 소울의 힘으로 빠르게 이동",
  11111006: "MP #mpCon 소비하여 최대 #mobCount명에게 데미지 #damage%로 #attackCount번 공격",
  11111007: "MP #mpCon 소비하여 #time초간 검에 성속성 부여, 충전 공격 시 데미지 #damage%",
  // ── 플레임위자드 ──
  12001004: "MP #mpCon 소비하여 #time초간 마법 공격력 +#mad, 물리 방어력 +#pdd, 마법 방어력 +#mdd의 정령을 소환",
  12101005: "MP #mpCon 소비하여 #time초간 공격 속성을 무속성으로 변환",
  12101006: "MP #mpCon 소비, 기본 공격력 #mad, 최대 #mobCount마리 공격",
  12111005: "MP #mpCon 소비, 기본 공격력 #mad, #time초간 불 장벽 생성",
  12111006: "MP #mpCon 소비, 기본 공격력 #mad, 최대 #mobCount마리 공격",
  // ── 윈드브레이커 ──
  13001004: "MP #mpCon 소비하여 #time초간 물리 공격력 +#pad, 물리 방어력 +#pdd, 마법 방어력 +#mdd의 정령을 소환",
  13101002: "#prop% 확률로 활 데미지 #damage%의 파이널 어택 발동.",
  13101005: "MP #mpCon 소비, 데미지 #damage%, #prop% 확률로 넉백",
  13101006: "MP #mpCon 소비하여 #time초간 몸을 숨김, 공격 시 추가 데미지 #damage%",
  13111005: "MP #mpCon 소비하여 #time초간 알바트로스로 변신, 재사용 대기시간 #cooltime초",
  13111006: "MP #mpCon 소비하여 최대 #mobCount명에게 데미지 #damage%",
  13111007: "MP #mpCon 소비하여 데미지 #damage%로 #attackCount번 공격",
  // ── 나이트워커 ──
  // 다크 사이트: speed 키가 마스터(10레벨)에서 사라져 #speed 의존 제거
  14001003: "MP #mpCon 소비하여 #time초간 몸을 숨김",
  14001005: "MP #mpCon 소비하여 #time초간 물리 공격력 +#pad, 물리 방어력 +#pdd, 마법 방어력 +#mdd의 정령을 소환",
  14100005: "다크 사이트 상태에서 공격 시 추가 데미지 #damage%",
  14101006: "MP #mpCon 소비하여 최대 #mobCount명을 #attackCount번 공격, 데미지 #damage%, 데미지의 #x% 흡수",
  14110003: "회복량 #x% 상승, 상태변화 적용시간 #y% 증가",
  14111000: "MP #mpCon 소비하여 #time초간 분신 소환, 통상 공격 #x%, 스킬 공격 #y%",
  14111002: "MP #mpCon 소비하여 최대 #mobCount명에게 데미지 #damage%로 공격",
  14111006: "MP #mpCon 소비, 데미지 #damage%, #time초간 독 데미지",
  // ── 스트라이커 ──
  15001004: "MP #mpCon 소비하여 #time초간 물리 공격력 +#pad, 물리 방어력 +#pdd, 마법 방어력 +#mdd의 정령을 소환",
  15101005: "데미지 #damage%, 최대 #mobCount명을 공격",
  15110000: "#prop% 확률, 크리티컬 데미지 #damage%",
  15111006: "MP #mpCon 소비, 데미지 #damage%, 주변 #mobCount명에게 추가 공격",
  15111007: "MP #mpCon 소비하여 전방 최대 #mobCount명에게 데미지 #damage%",
};

// 기존 모험가 JSON에서 name → detail 맵 구축 (무기 접미사 " : 검/도끼" 베이스도 등록)
function buildAdvMap() {
  const map = {};
  for (const f of readdirSync(OUT_DIR)) {
    if (!/^\d+\.json$/.test(f) || CYGNUS_FILE.test(f)) continue;
    const j = JSON.parse(readFileSync(join(OUT_DIR, f), "utf8"));
    for (const s of j.skills) {
      const nm = s.description?.name;
      const detail = s.description?.detail || "";
      if (!nm || !detail) continue;
      if (!map[nm]) map[nm] = detail;
      const base = nm.replace(/ : .*$/, "");
      if (base !== nm && !map[base]) map[base] = detail;
    }
  }
  return map;
}

const placeholders = (s) => [...s.matchAll(/#(\w+)/g)].map((m) => m[1]);

function resolveDetail(skill, name, advMap, warn) {
  const keys = new Set(Object.keys(skill.levelProperties[0]).filter((k) => k !== "hs"));
  if (AUTHORED[skill.id] != null) {
    const bad = placeholders(AUTHORED[skill.id]).filter((k) => !keys.has(k));
    if (bad.length) warn.push(`${skill.id}(${name}) AUTHORED 미해결키: ${bad.join(",")}`);
    return AUTHORED[skill.id];
  }
  const reuse = advMap[name];
  if (reuse && placeholders(reuse).every((k) => keys.has(k))) return reuse;
  warn.push(`${skill.id}(${name}) detail 없음 [keys=${[...keys].join(",")}]`);
  return "";
}

// desc 정리: 툴팁이 별도 표시하는 중복 요소 제거 (모험가 desc 컨벤션과 일치)
//  1) 앞의 "[마스터 레벨 : N]\n"(영문 [Master Level : N]) 접두사
//  2) 뒤의 "\n필요 스킬 : #c...#" 줄 (requiredSkillLevels로 따로 표시됨)
//  3) "#c...#" 색상 마크업 기호 (텍스트는 유지, 기호만 제거)
const cleanDesc = (desc) =>
  (desc || "")
    .replace(/^\[[^\]]*\]\\n/, "")
    .replace(/\s*\\n\s*(?:필요\s?스킬|Required Skill)\s*:.*$/, "")
    .replace(/#c/g, "")
    .replace(/#/g, "")
    .trim();

function pickSkill(s, advMap, warn) {
  const name = NAME_OVERRIDES[s.id] ?? s.description.name;
  const desc = {
    id: s.description.id,
    desc: DESC_OVERRIDES[s.id] ?? cleanDesc(s.description.desc),
    name,
    bookName: s.description.bookName ?? "",
    detail: resolveDetail(s, name, advMap, warn),
  };
  // 영문 desc 감지(한글 없음 + 라틴문자 있음) → DESC_OVERRIDES에 한글 추가 필요
  if (desc.desc && !/[가-힣]/.test(desc.desc) && /[A-Za-z]/.test(desc.desc)) {
    warn.push(`${s.id}(${name}) desc 영문 잔존 → DESC_OVERRIDES 필요: ${JSON.stringify(desc.desc)}`);
  }
  const out = {};
  if (s.invisible) out.invisible = true;
  out.masterLevel = s.masterLevel;
  out.icon = s.icon;
  out.iconDisabled = s.iconDisabled;
  out.iconMouseOver = s.iconMouseOver;
  out.weapons = s.weapons ?? [];
  out.id = s.id;
  out.soundPath = s.soundPath;
  out.description = desc;
  if (s.requiredSkillLevels && Object.keys(s.requiredSkillLevels).length > 0) {
    out.requiredSkillLevels = s.requiredSkillLevels;
  }
  out.levelProperties = s.levelProperties;
  return out;
}

async function genJob(id, advMap) {
  const res = await fetch(API(id));
  if (!res.ok) throw new Error(`fetch ${id} failed: ${res.status}`);
  const sb = await res.json();
  const warn = [];
  const out = {
    icon: sb.icon,
    job: { id: sb.job.id, name: sb.job.name },
    skills: sb.skills.map((s) => pickSkill(s, advMap, warn)),
    id: sb.id,
    description: {
      id: sb.description.id,
      desc: sb.description.desc ?? "",
      name: sb.description.name ?? "",
      shortDesc: sb.description.shortDesc ?? "",
      bookName: sb.description.bookName ?? "",
    },
  };
  writeFileSync(join(OUT_DIR, `${id}.json`), JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`✓ ${id}.json skills=${out.skills.length}` + (warn.length ? `\n   ⚠ ${warn.join("\n   ⚠ ")}` : ""));
}

const ids = process.argv.slice(2).map(Number);
const jobs = ids.length ? ids : ALL_JOBS;
const advMap = buildAdvMap();
for (const id of jobs) await genJob(id, advMap);
