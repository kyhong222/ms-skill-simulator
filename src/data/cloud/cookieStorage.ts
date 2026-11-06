// Supabase 세션 저장소 — *.mapleland.st 서브도메인 간 SSO용.
// 아이템 시뮬레이터(mapleland-setting-v2)와 같은 쿠키를 읽어야 하므로 형식을 바꾸지 말 것.
// 세션 JSON은 쿠키 상한(4096B)을 넘길 수 있어 조각(<key>.0, <key>.1, ...)으로 나눠 담는다.
// mapleland.st가 아닌 호스트(로컬 개발·프리뷰)는 localStorage로 떨어진다 (SSO 없음).

const ROOT_DOMAIN = "mapleland.st";

// encodeURIComponent가 최악 3배로 부풀어도 쿠키 상한 안에 들도록 보수적으로 잡은 값
const CHUNK_SIZE = 1200;
const MAX_CHUNKS = 16;
const MAX_AGE = 400 * 24 * 60 * 60; // 브라우저가 허용하는 쿠키 수명 상한

export interface ISessionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function cookieDomain(): string | null {
  const host = window.location.hostname;
  if (host === ROOT_DOMAIN || host.endsWith(`.${ROOT_DOMAIN}`)) return `.${ROOT_DOMAIN}`;
  return null;
}

function readCookie(name: string): string | null {
  const prefix = `${encodeURIComponent(name)}=`;
  for (const part of document.cookie.split("; ")) {
    if (part.startsWith(prefix)) return decodeURIComponent(part.slice(prefix.length));
  }
  return null;
}

function writeCookie(name: string, value: string, domain: string) {
  document.cookie =
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}` +
    `; Domain=${domain}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax; Secure`;
}

function dropCookie(name: string, domain: string) {
  document.cookie = `${encodeURIComponent(name)}=; Domain=${domain}; Path=/; Max-Age=0; SameSite=Lax; Secure`;
}

function chunkedCookieStorage(domain: string): ISessionStorage {
  return {
    getItem(key) {
      const chunks: string[] = [];
      for (let i = 0; i < MAX_CHUNKS; i++) {
        const chunk = readCookie(`${key}.${i}`);
        if (chunk === null) break;
        chunks.push(chunk);
      }
      return chunks.length > 0 ? chunks.join("") : readCookie(key);
    },

    setItem(key, value) {
      dropCookie(key, domain);
      const count = Math.max(1, Math.ceil(value.length / CHUNK_SIZE));
      for (let i = 0; i < count; i++) {
        writeCookie(`${key}.${i}`, value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE), domain);
      }
      // 값이 짧아지면 뒤쪽 옛 조각이 남아 이어붙일 때 섞이므로 지운다
      for (let i = count; i < MAX_CHUNKS; i++) {
        if (readCookie(`${key}.${i}`) === null) break;
        dropCookie(`${key}.${i}`, domain);
      }
    },

    removeItem(key) {
      dropCookie(key, domain);
      for (let i = 0; i < MAX_CHUNKS; i++) dropCookie(`${key}.${i}`, domain);
    },
  };
}

function safeLocalStorage(): ISessionStorage {
  return {
    getItem: (key) => {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key, value) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // 저장 실패 시 세션은 탭 수명 동안만 유지된다
      }
    },
    removeItem: (key) => {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // 지울 수 없으면 그대로 둔다
      }
    },
  };
}

export function sessionStorageAdapter(): ISessionStorage {
  const domain = cookieDomain();
  return domain ? chunkedCookieStorage(domain) : safeLocalStorage();
}
