// 메이플 용사 master 20→30, 용사의 의지 master 1→5 패치 (모험가 4차 12파일)
// 변경 대상 스킬 객체만 잘라내 수정 후 동일 포맷으로 되끼움(나머지 바이트 보존)
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "../src/data/skillbooks");
const FILES = ["112","122","132","212","222","232","312","322","412","422","512","522"];
const DRY = !process.argv.includes("--write");

// 원본 포맷 직렬화기: 원시값 배열 인라인, 그 외 멀티라인
function fmt(v, ind) {
  const pad = "  ".repeat(ind), pad1 = "  ".repeat(ind + 1);
  if (Array.isArray(v)) {
    if (v.length === 0) return "[]";
    if (v.every((e) => e === null || typeof e !== "object"))
      return "[" + v.map((e) => JSON.stringify(e)).join(", ") + "]";
    return "[\n" + v.map((e) => pad1 + fmt(e, ind + 1)).join(",\n") + "\n" + pad + "]";
  }
  if (v && typeof v === "object") {
    const ks = Object.keys(v);
    if (ks.length === 0) return "{}";
    return "{\n" + ks.map((k) => pad1 + JSON.stringify(k) + ": " + fmt(v[k], ind + 1)).join(",\n") + "\n" + pad + "}";
  }
  return JSON.stringify(v);
}

// soundPath 앵커로 스킬 객체 [start,end) 찾기 (문자열 인지 brace 매칭)
function findSpan(raw, soundPath) {
  const anchor = raw.indexOf(`"soundPath": ${JSON.stringify(soundPath)}`);
  if (anchor < 0) throw new Error("anchor 없음: " + soundPath);
  let depth = 0, start = -1;
  for (let i = anchor; i >= 0; i--) {
    const c = raw[i];
    if (c === "}") depth++;
    else if (c === "{") { if (depth === 0) { start = i; break; } depth--; }
  }
  let d = 0, end = -1, inStr = false, esc = false;
  for (let i = start; i < raw.length; i++) {
    const c = raw[i];
    if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === "{") d++;
    else if (c === "}") { d--; if (d === 0) { end = i + 1; break; } }
  }
  return [start, end];
}

const mpcMW = (lv) => (lv <= 24 ? "50" : lv <= 29 ? "60" : "70");
const statMW = (lv) => String(10 + Math.ceil((lv - 20) / 2));

function patchFile(file) {
  const path = join(DIR, file + ".json");
  let raw = readFileSync(path, "utf8");
  const j = JSON.parse(raw);
  const mw = j.skills.find((s) => s.description.name === "메이플 용사");
  const will = j.skills.find((s) => /용사의 의지/.test(s.description.name));

  // 두 스킬을 raw에서 각각 잘라 수정 (end가 큰 것부터 처리해 인덱스 보존)
  const targets = [
    { obj: mw, sp: mw.soundPath, mod: (o) => {
        o.masterLevel = 30;
        const h20 = o.levelProperties.find((p) => p.hs === "h20");
        h20.mpCon = "50";
        for (let lv = 21; lv <= 30; lv++) {
          const e = { ...h20 };
          e.hs = "h" + lv; e.mpCon = mpcMW(lv); e.time = String(30 * lv); e.x = statMW(lv);
          o.levelProperties.push(e);
        }
      } },
    { obj: will, sp: will.soundPath, mod: (o) => {
        o.masterLevel = 5;
        const h1 = o.levelProperties.find((p) => p.hs === "h1");
        for (let lv = 2; lv <= 5; lv++) {
          const e = { ...h1 };
          e.hs = "h" + lv; e.cooltime = String(600 - (lv - 1) * 60);
          o.levelProperties.push(e);
        }
      } },
  ].map((t) => ({ ...t, span: findSpan(raw, t.sp) })).sort((a, b) => b.span[0] - a.span[0]);

  let changedLines = 0;
  for (const t of targets) {
    const [s, e] = t.span;
    const origSpan = raw.slice(s, e);
    t.mod(t.obj);
    const newSpan = fmt(t.obj, 2);
    // 변경 라인 수 카운트
    const ol = origSpan.split("\n"), nl = newSpan.split("\n");
    changedLines += Math.abs(nl.length - ol.length);
    raw = raw.slice(0, s) + newSpan + raw.slice(e);
  }
  // 검증: 다시 파싱되는지
  JSON.parse(raw);
  if (DRY) {
    console.log(`${file}: dry-run OK | 메용 lp=${mw.levelProperties.length} master=${mw.masterLevel} | 의지 lp=${will.levelProperties.length} master=${will.masterLevel}`);
  } else {
    writeFileSync(path, raw, "utf8");
    console.log(`${file}: written`);
  }
}
for (const f of FILES) patchFile(f);
console.log(DRY ? "\n[DRY-RUN] --write 로 실제 적용" : "\n적용 완료");
