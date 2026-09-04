// GIF(첫 프레임) → PNG 변환. 외부 의존성 없이 node 내장 zlib만 사용한다.
// 인벤 스킬 아이콘이 GIF인데 앱은 data:image/png 로 렌더링하기 때문에 필요.
import { deflateSync } from "node:zlib";

// ── GIF 디코딩 ────────────────────────────────────────────────
function readColorTable(buf, offset, count) {
  const table = new Array(count);
  for (let i = 0; i < count; i++) {
    table[i] = [buf[offset + i * 3], buf[offset + i * 3 + 1], buf[offset + i * 3 + 2]];
  }
  return table;
}

// 서브블록 체인을 하나의 버퍼로 합침 (길이 바이트 0이 종료)
function readSubBlocks(buf, offset) {
  const parts = [];
  let p = offset;
  while (buf[p] !== 0) {
    const len = buf[p];
    parts.push(buf.subarray(p + 1, p + 1 + len));
    p += 1 + len;
  }
  return { data: Buffer.concat(parts), end: p + 1 };
}

// GIF의 가변 비트폭 LZW 디코더
function lzwDecode(minCodeSize, data, pixelCount) {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let dict = [];
  const resetDict = () => {
    dict = [];
    for (let i = 0; i < clearCode; i++) dict.push([i]);
    dict.push([]); // clear
    dict.push([]); // eoi
    codeSize = minCodeSize + 1;
  };
  resetDict();

  const out = new Uint8Array(pixelCount);
  let outPos = 0;
  let bitPos = 0;
  let prev = null;

  const readCode = () => {
    let code = 0;
    for (let i = 0; i < codeSize; i++) {
      const byte = data[bitPos >> 3];
      if (byte === undefined) return eoiCode;
      code |= ((byte >> (bitPos & 7)) & 1) << i;
      bitPos++;
    }
    return code;
  };

  for (;;) {
    const code = readCode();
    if (code === eoiCode) break;
    if (code === clearCode) {
      resetDict();
      prev = null;
      continue;
    }
    let entry;
    if (code < dict.length) {
      entry = dict[code];
      if (prev) dict.push(prev.concat(entry[0]));
    } else {
      if (!prev) break; // 손상된 스트림
      entry = prev.concat(prev[0]);
      dict.push(entry);
    }
    for (const px of entry) {
      if (outPos >= pixelCount) break;
      out[outPos++] = px;
    }
    prev = entry;
    // 사전이 가득 차면 코드 폭 확장 (12비트가 상한)
    if (dict.length === 1 << codeSize && codeSize < 12) codeSize++;
    if (outPos >= pixelCount) break;
  }
  return out;
}

// 인터레이스된 GIF의 행 순서 → 실제 행 번호
function deinterlaceRows(height) {
  const rows = [];
  for (let y = 0; y < height; y += 8) rows.push(y);
  for (let y = 4; y < height; y += 8) rows.push(y);
  for (let y = 2; y < height; y += 4) rows.push(y);
  for (let y = 1; y < height; y += 2) rows.push(y);
  return rows;
}

// GIF 버퍼 → { width, height, rgba }
export function decodeGif(buf) {
  const sig = buf.toString("ascii", 0, 6);
  if (sig !== "GIF87a" && sig !== "GIF89a") throw new Error(`GIF 시그니처 아님: ${sig}`);
  const width = buf.readUInt16LE(6);
  const height = buf.readUInt16LE(8);
  const packed = buf[10];
  let p = 13;
  let globalTable = null;
  if (packed & 0x80) {
    const size = 1 << ((packed & 0x07) + 1);
    globalTable = readColorTable(buf, p, size);
    p += size * 3;
  }

  let transparentIndex = -1;
  for (;;) {
    const marker = buf[p];
    if (marker === 0x3b || marker === undefined) throw new Error("이미지 블록 없이 GIF가 끝남");
    if (marker === 0x21) {
      // 확장 블록: 그래픽 제어 확장에서 투명 색인만 취한다
      const label = buf[p + 1];
      const sub = readSubBlocks(buf, p + 2);
      if (label === 0xf9 && sub.data.length >= 4 && sub.data[0] & 0x01) transparentIndex = sub.data[3];
      p = sub.end;
      continue;
    }
    if (marker === 0x2c) break;
    throw new Error(`알 수 없는 GIF 블록: 0x${marker.toString(16)}`);
  }

  // 이미지 디스크립터
  const left = buf.readUInt16LE(p + 1);
  const top = buf.readUInt16LE(p + 3);
  const frameW = buf.readUInt16LE(p + 5);
  const frameH = buf.readUInt16LE(p + 7);
  const imgPacked = buf[p + 9];
  p += 10;
  let table = globalTable;
  if (imgPacked & 0x80) {
    const size = 1 << ((imgPacked & 0x07) + 1);
    table = readColorTable(buf, p, size);
    p += size * 3;
  }
  if (!table) throw new Error("색상 테이블이 없음");
  const interlaced = Boolean(imgPacked & 0x40);

  const minCodeSize = buf[p];
  const sub = readSubBlocks(buf, p + 1);
  const indices = lzwDecode(minCodeSize, sub.data, frameW * frameH);

  const rgba = Buffer.alloc(width * height * 4); // 기본값 투명
  const rowOrder = interlaced ? deinterlaceRows(frameH) : null;
  for (let row = 0; row < frameH; row++) {
    const y = (rowOrder ? rowOrder[row] : row) + top;
    if (y >= height) continue;
    for (let x = 0; x < frameW; x++) {
      const px = left + x;
      if (px >= width) continue;
      const idx = indices[row * frameW + x];
      if (idx === transparentIndex) continue;
      const color = table[idx];
      if (!color) continue;
      const o = (y * width + px) * 4;
      rgba[o] = color[0];
      rgba[o + 1] = color[1];
      rgba[o + 2] = color[2];
      rgba[o + 3] = 255;
    }
  }
  return { width, height, rgba };
}

// ── PNG 인코딩 ────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

export function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  // 10~12: compression / filter / interlace 전부 0

  // 각 스캔라인 앞에 필터 타입 0(None)을 붙인다
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const src = y * width * 4;
    const dst = y * (width * 4 + 1);
    raw[dst] = 0;
    rgba.copy(raw, dst + 1, src, src + width * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

export function gifToPngBase64(gifBuffer) {
  const { width, height, rgba } = decodeGif(gifBuffer);
  return { base64: encodePng(width, height, rgba).toString("base64"), width, height };
}
