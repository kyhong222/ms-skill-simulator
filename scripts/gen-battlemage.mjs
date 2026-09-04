// 배틀메이지(레지스탕스) 스킬북 생성 스크립트
//   scripts/data/battlemage-t12137.txt (KMST T1.2.137 원본 텍스트, 출처 maplestory.pe.kr/1873)
//   + 인벤 스킬 아이콘 (static.inven.co.kr)
//   → src/data/skillbooks/{3200,3210,3211,3212}.json
//
// 사용법: node scripts/gen-battlemage.mjs [--no-icons]
//
// 수치·스킬명·설명·마스터레벨·선행스킬은 전부 원본 텍스트가 단일 출처(SSOT)다.
// 스킬 ID와 아이콘만 인벤 DB에서 가져온다(원본 텍스트에 없는 정보).
//
// 생성 후 자체 검증: detail 템플릿 + levelProperties로 각 레벨 문장을 다시 만들어
// 원본 텍스트와 글자 단위로 대조한다. 하나라도 어긋나면 파일을 쓰지 않고 중단한다.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { gifToPngBase64 } from "./lib/gif2png.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC_TXT = join(ROOT, "scripts/data/battlemage-t12137.txt");
const OUT_DIR = join(ROOT, "src/data/skillbooks");
const ICON_CACHE = join(ROOT, "tmp/icons");
const ICON_URL = (id) => `https://static.inven.co.kr/image_2011/site_image/maple/dataninfo/skillicon/${id}.gif`;

const TIMEOUT = Number(process.env.MS_TIMEOUT || 30000);
const RETRIES = Number(process.env.MS_RETRIES || 5);

// 스킬북 이름 — 원본에 없어 모험가/시그너스 표기 관례에 맞춰 작명
const BOOKS = {
  3200: { name: "Battle Mage (1st)", bookName: "배틀메이지 입문서" },
  3210: { name: "Battle Mage (2nd)", bookName: "배틀메이지 가이드" },
  3211: { name: "Battle Mage (3rd)", bookName: "상급 배틀 마법" },
  3212: { name: "Battle Mage (4th)", bookName: "최상급 배틀 마법" },
};

// 원본 텍스트의 스킬명 → 배치/ID/표시명/레벨 속성 키
//
// keys는 원본 레벨 문장에 숫자가 나오는 순서와 1:1로 대응한다.
// 주의 1) 툴팁의 #key 치환에 단어 경계가 없어 키가 서로의 접두사가 되면 안 됨
// 주의 2) mastery 키는 툴팁이 자동으로 (값*5+10)을 적용하므로 쓰지 않는다.
//         원본은 이미 최종 퍼센트를 주기 때문에 x/y로 둔다.
const SPECS = {
  // ── 1차 (3200) ──
  트리플블로우: { job: 3200, id: 32001000, name: "트리플 블로우", keys: ["mpCon", "mad"] },
  피니쉬어택: { job: 3200, id: 32001001, name: "피니쉬 어택", keys: ["mpCon", "mad"] },
  텔레포트: { job: 3200, id: 32001002, name: "텔레포트", keys: ["mpCon", "range"] },
  다크오라: { job: 3200, id: 32001003, name: "다크 오라", keys: ["mpCon", "x"] },

  // ── 2차 (3210) ──
  쿼드블로우: { job: 3210, id: 32101000, name: "쿼드 블로우", keys: ["mpCon", "mad"] },
  다크체인: { job: 3210, id: 32101001, name: "다크 체인", keys: ["mpCon", "mad", "time"] },
  // 개편 때 3차로 옮겨가 인벤에는 32111012로 있다. 아이콘만 그쪽에서 가져온다.
  블루오라: { job: 3210, id: 32101002, iconId: 32111012, name: "블루 오라", keys: ["mpCon", "x", "y"] },
  옐로우오라: { job: 3210, id: 32101003, name: "옐로우 오라", keys: ["mpCon", "x", "y"] },
  블러드드레인: { job: 3210, id: 32101004, name: "블러드 드레인", keys: ["mpCon", "x", "time"] },
  스태프부스터: { job: 3210, id: 32101005, name: "스태프 부스터", keys: ["mpCon", "x", "time"] },

  // ── 3차 (3211) ──
  어드밴스드블루오라: { job: 3211, id: 32110000, name: "어드밴스드 블루 오라", keys: ["mpCon", "x", "y"] },
  스태프마스터리: { job: 3211, id: 32110001, name: "스태프 마스터리", keys: ["x", "y"] },
  데스블로우: { job: 3211, id: 32111002, name: "데스 블로우", keys: ["mpCon", "damage"] },
  다크라이트닝: { job: 3211, id: 32111003, name: "다크 라이트닝", keys: ["mpCon", "mad"] },
  컨버전: { job: 3211, id: 32111004, name: "컨버전", keys: ["mpCon", "x", "time"] },
  슈퍼바디: {
    job: 3211,
    id: 32111005,
    name: "슈퍼바디",
    keys: ["mpCon", "blueTime", "darkTime", "darkX", "yellowTime", "speed", "attackSpeed", "avoid"],
  },
  리바이브: { job: 3211, id: 32111006, name: "리바이브", keys: ["mpCon", "prop", "time"] },

  // ── 4차 (3212) ──
  // 원본은 스탠스를 4차로 분류. ID 32111014는 원본의 ID 오름차순 나열 규칙과도 일치한다.
  스탠스: { job: 3212, id: 32111014, name: "스탠스", keys: ["mpCon", "prop", "time"] },
  어드밴스드다크오라: { job: 3212, id: 32120000, name: "어드밴스드 다크 오라", keys: ["mpCon", "x", "mad"] },
  어드밴스드옐로우오라: { job: 3212, id: 32120001, name: "어드밴스드 옐로우 오라", keys: ["mpCon", "x", "y", "z"] },
  피니쉬블로우: { job: 3212, id: 32121002, name: "피니쉬 블로우", keys: ["mpCon", "mad"] },
  싸이클론: { job: 3212, id: 32121003, name: "싸이클론", keys: ["mpCon", "mad"] },
  다크제네시스: { job: 3212, id: 32121004, name: "다크 제네시스", keys: ["mpCon", "mad"] },
  쉘터: { job: 3212, id: 32121006, name: "쉘터", keys: ["mpCon", "time"] },
};

// 원본이 "기존 내용과 같아 포함하지 않았다"고 밝힌 공용 스킬 — 기존 아크메이지 데이터에서 복사
const SHARED_FROM_212 = [
  { name: "메이플 용사", id: 32121007 },
  { name: "용사의 의지", id: 32121008 },
];

// ── 원본 텍스트 파싱 ──────────────────────────────────────────
const HEAD = /^배틀메이지\((\d)차\)>(.+)$/;
const META = /^(재사용대기시간|패시브 스킬)/;
const NOTE = /^[(（]?※/;

function parseSource() {
  const lines = readFileSync(SRC_TXT, "utf8").split("\n").map((l) => l.trim());
  const blocks = [];
  let cur = null;
  for (const l of lines) {
    if (l.startsWith("#")) continue;
    const m = HEAD.exec(l);
    if (m) {
      cur = { tier: Number(m[1]), name: m[2], desc: [], meta: [], req: null, raw: [], noteSeen: false };
      blocks.push(cur);
      continue;
    }
    if (!cur || l === "") continue;
    if (/^- - -/.test(l)) {
      cur = null;
      continue;
    }
    if (/^요구스킬/.test(l)) {
      cur.req = l;
      continue;
    }
    if (cur.req === null) {
      // 블로거 주석(※ …)부터는 게임 설명이 아니므로 desc에서 제외
      if (NOTE.test(l)) cur.noteSeen = true;
      if (!cur.noteSeen) cur.desc.push(l);
      continue;
    }
    if (META.test(l)) {
      cur.meta.push(l);
      continue;
    }
    cur.raw.push(l);
  }
  return blocks;
}

// 줄바꿈된 레벨 문장 병합 (쉼표로 끝나면 다음 줄과 이어진다)
function mergeWrapped(raw) {
  const out = [];
  let buf = "";
  for (const l of raw) {
    buf = buf ? `${buf} ${l}` : l;
    if (!buf.endsWith(",")) {
      out.push(buf);
      buf = "";
    }
  }
  if (buf) out.push(buf);
  return out;
}

const skeletonOf = (s) => s.replace(/\d+/g, "{}");
const numbersOf = (s) => s.match(/\d+/g) || [];

// "재사용대기시간 : 2분" / "… : 30초" → 초 단위 문자열
function parseCooltime(meta) {
  for (const m of meta) {
    const min = /(\d+)\s*분/.exec(m);
    if (min) return String(Number(min[1]) * 60);
    const sec = /(\d+)\s*초/.exec(m);
    if (sec) return sec[1];
  }
  return null;
}

// 원본 문구를 앱의 detail 표기 관례에 맞춘다 (검증에는 원본 스켈레톤을 그대로 쓴다)
const normalizeDetail = (s) => s.replace(/MP#/g, "MP #").replace(/기본공격력/g, "기본 공격력");

// ── 아이콘 ────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchIconGif(iconId) {
  if (!existsSync(ICON_CACHE)) mkdirSync(ICON_CACHE, { recursive: true });
  const cached = join(ICON_CACHE, `${iconId}.gif`);
  if (existsSync(cached)) return readFileSync(cached);

  let lastErr;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), TIMEOUT);
    try {
      const res = await fetch(ICON_URL(iconId), {
        signal: ac.signal,
        headers: { "user-agent": "Mozilla/5.0", accept: "image/gif,image/*" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 100) throw new Error(`응답이 너무 작음 (${buf.length}B)`);
      writeFileSync(cached, buf);
      return buf;
    } catch (e) {
      lastErr = e;
      if (attempt === RETRIES) break;
      await sleep(Math.min(1000 * 2 ** (attempt - 1), 8000));
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(`아이콘 ${iconId} 내려받기 실패: ${lastErr?.message}`);
}

// 직업 아이콘: 기존 결과물 → maplestory.io 원본 → 마법사 입문서 순으로 재사용
function jobIcon(jobId) {
  for (const p of [join(OUT_DIR, `${jobId}.json`), join(ROOT, `tmp/raw/${jobId}.json`)]) {
    if (!existsSync(p)) continue;
    const icon = JSON.parse(readFileSync(p, "utf8")).icon;
    if (icon) return icon;
  }
  return JSON.parse(readFileSync(join(OUT_DIR, "200.json"), "utf8")).icon;
}

// ── 빌드 ──────────────────────────────────────────────────────
function buildSkill(block, noIcons, iconCache) {
  const spec = SPECS[block.name];
  if (!spec) throw new Error(`SPECS에 없는 스킬: ${block.name}`);

  const levels = mergeWrapped(block.raw);
  const skels = [...new Set(levels.map(skeletonOf))];
  if (skels.length !== 1) throw new Error(`${block.name}: 레벨 문장 형식이 ${skels.length}종류 (1종류여야 함)`);
  const skeleton = skels[0];
  const slotCount = (skeleton.match(/\{\}/g) || []).length;
  if (slotCount !== spec.keys.length) {
    throw new Error(`${block.name}: 숫자 슬롯 ${slotCount}개인데 keys는 ${spec.keys.length}개 — ${skeleton}`);
  }

  // 스켈레톤의 {}를 순서대로 #key로 치환해 detail 템플릿을 만든다
  let i = 0;
  const rawTemplate = skeleton.replace(/\{\}/g, () => `#${spec.keys[i++]}`);
  const cooltime = parseCooltime(block.meta);

  const levelProperties = levels.map((line, idx) => {
    const nums = numbersOf(line);
    if (nums.length !== spec.keys.length) throw new Error(`${block.name} ${idx + 1}레벨: 숫자 개수 불일치`);
    const prop = { hs: `h${idx + 1}` };
    spec.keys.forEach((k, n) => {
      prop[k] = nums[n];
    });
    if (cooltime) prop.cooltime = cooltime;
    return prop;
  });

  let detail = normalizeDetail(rawTemplate);
  if (cooltime) detail += ", 재사용 대기시간 #cooltime초";

  const icon = noIcons ? "" : iconCache[spec.id];
  const skill = {
    masterLevel: levels.length,
    icon,
    iconDisabled: icon,
    iconMouseOver: icon,
    weapons: [],
    id: spec.id,
    soundPath: `Skill.img/${spec.id}`,
    description: {
      id: spec.id,
      desc: block.desc.join(" ").trim(),
      name: spec.name,
      bookName: "",
      detail,
    },
    levelProperties,
  };

  const reqMatch = /^요구스킬\s*:\s*(\S+)\s+(\d+)/.exec(block.req || "");
  if (reqMatch) {
    const reqSpec = SPECS[reqMatch[1]];
    if (!reqSpec) throw new Error(`${block.name}: 선행 스킬 "${reqMatch[1]}"을 찾을 수 없음`);
    skill.requiredSkillLevels = { [reqSpec.id]: Number(reqMatch[2]) };
  }

  return { skill, rawTemplate, levels };
}

// detail 템플릿 + levelProperties로 원본 문장을 재구성해 글자 단위로 대조
function verify(skill, rawTemplate, levels) {
  const fails = [];
  levels.forEach((original, idx) => {
    const prop = skill.levelProperties[idx];
    let rendered = rawTemplate;
    // 긴 키부터 치환해야 짧은 키가 긴 키를 갉아먹지 않는다
    const keys = Object.keys(prop)
      .filter((k) => k !== "hs" && k !== "cooltime")
      .sort((a, b) => b.length - a.length);
    for (const key of keys) rendered = rendered.split(`#${key}`).join(prop[key]);
    if (rendered !== original) fails.push({ level: idx + 1, original, rendered });
  });
  return fails;
}

// ── 실행 ──────────────────────────────────────────────────────
const noIcons = process.argv.includes("--no-icons");
const blocks = parseSource();
console.log(`원본 파싱: 배틀메이지 스킬 ${blocks.length}개`);

const iconCache = {};
if (!noIcons) {
  for (const [blogName, spec] of Object.entries(SPECS)) {
    const gif = await fetchIconGif(spec.iconId ?? spec.id);
    const { base64, width, height } = gifToPngBase64(gif);
    if (width !== 32 || height !== 32) console.warn(`   ⚠ ${blogName} 아이콘 크기 ${width}x${height}`);
    iconCache[spec.id] = base64;
  }
  console.log(`아이콘 ${Object.keys(iconCache).length}개 확보 (인벤 GIF → PNG 변환)`);
}

const byJob = {};
let totalFails = 0;
for (const block of blocks) {
  const { skill, rawTemplate, levels } = buildSkill(block, noIcons, iconCache);
  const fails = verify(skill, rawTemplate, levels);
  if (fails.length) {
    totalFails += fails.length;
    console.error(`✗ ${block.name} 검증 실패 ${fails.length}건`);
    for (const f of fails.slice(0, 2)) {
      console.error(`    ${f.level}레벨`);
      console.error(`      원본: ${f.original}`);
      console.error(`      복원: ${f.rendered}`);
    }
  }
  const jobId = SPECS[block.name].job;
  (byJob[jobId] ||= []).push(skill);
}

// 아크메이지에서 공용 스킬 복사 (ID만 배틀메이지 것으로 교체)
const mage = JSON.parse(readFileSync(join(OUT_DIR, "212.json"), "utf8"));
for (const shared of SHARED_FROM_212) {
  const src = mage.skills.find((s) => s.description?.name === shared.name);
  if (!src) throw new Error(`212.json에서 "${shared.name}"을 찾을 수 없음`);
  const copy = JSON.parse(JSON.stringify(src));
  copy.id = shared.id;
  copy.soundPath = `Skill.img/${shared.id}`;
  copy.description.id = shared.id;
  delete copy.requiredSkillLevels;
  byJob[3212].push(copy);
}

if (totalFails) {
  console.error(`\n검증 실패 ${totalFails}건 — 파일을 쓰지 않고 중단합니다.`);
  process.exit(1);
}

for (const [jobId, skills] of Object.entries(byJob)) {
  const meta = BOOKS[jobId];
  const out = {
    icon: jobIcon(jobId),
    job: { id: Number(jobId), name: meta.name },
    skills,
    id: Number(jobId),
    description: { id: Number(jobId), desc: "", name: "", shortDesc: "", bookName: meta.bookName },
  };
  writeFileSync(join(OUT_DIR, `${jobId}.json`), JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`✓ ${jobId}.json  스킬 ${skills.length}개`);
}
console.log("\n전 스킬 전 레벨 원문 대조 통과");
