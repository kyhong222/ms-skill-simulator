// 스킬 트리 localStorage 접근을 한곳에 모은다.
// - 비로그인: skillTree_{트리키} (기존 키 그대로. 로그인해도 건드리지 않는다)
// - 로그인: skillTreeAccount_{userId}_{트리키} (계정 데이터의 캐시, 서버가 원본)
// 트리키는 "112"(일반) / "112_4th"(4차만)
import type { ICloudPayload } from "../types/cloud";
import type { ISkillLogEntry } from "../types/skillTree";

const GUEST_PREFIX = "skillTree_";
const ACCOUNT_PREFIX = "skillTreeAccount_";
const GUEST_KEY_PATTERN = /^skillTree_(\d+(?:_4th)?)$/;

let accountId: string | null = null;
const listeners = new Set<() => void>();

function treeKey(jobId: number, is4thOnly: boolean) {
  return is4thOnly ? `${jobId}_4th` : `${jobId}`;
}

function accountPrefix() {
  return `${ACCOUNT_PREFIX}${accountId}_`;
}

function storageKey(key: string) {
  return accountId ? `${accountPrefix()}${key}` : `${GUEST_PREFIX}${key}`;
}

function keysWithPrefix(prefix: string) {
  return Object.keys(localStorage).filter((key) => key.startsWith(prefix));
}

export function setStorageAccount(userId: string | null) {
  accountId = userId;
}

export function readSkillTree(jobId: number, is4thOnly: boolean) {
  return localStorage.getItem(storageKey(treeKey(jobId, is4thOnly)));
}

export function writeSkillTree(jobId: number, is4thOnly: boolean, data: unknown) {
  localStorage.setItem(storageKey(treeKey(jobId, is4thOnly)), JSON.stringify(data));
  listeners.forEach((listener) => listener());
}

// 저장이 일어날 때마다 호출된다 (계정 동기화 트리거)
export function subscribeSkillTreeChange(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// 이관을 물을 가치가 있는 데이터인지 — 스킬을 1포인트라도 찍은 트리가 있어야 한다
export function hasGuestSkillData() {
  return Object.keys(localStorage).some((key) => {
    if (!GUEST_KEY_PATTERN.test(key)) return false;
    try {
      const levels: { level: number }[] = JSON.parse(localStorage.getItem(key) ?? "{}").skillLevels ?? [];
      return levels.some((skill) => skill.level > 0);
    } catch {
      return false;
    }
  });
}

// 이관은 복사다. 게스트 원본은 로그아웃 후에도 그대로 남는다
export function copyGuestTreesToAccount() {
  Object.keys(localStorage).forEach((key) => {
    const match = key.match(GUEST_KEY_PATTERN);
    const value = localStorage.getItem(key);
    if (match && value !== null) localStorage.setItem(storageKey(match[1]), value);
  });
}

export function captureAccountTrees(): ICloudPayload {
  const trees: Record<string, unknown> = {};
  keysWithPrefix(accountPrefix()).forEach((key) => {
    try {
      const tree = JSON.parse(localStorage.getItem(key) ?? "{}");
      const skillLog: ISkillLogEntry[] = tree.skillLog ?? [];
      trees[key.slice(accountPrefix().length)] = {
        ...tree,
        skillLog: skillLog.map((entry) => ({ ...entry, icon: "" })),
      };
    } catch (error) {
      console.error("Failed to parse account skill tree", error);
    }
  });
  return { trees };
}

export function replaceAccountTrees(payload: unknown) {
  keysWithPrefix(accountPrefix()).forEach((key) => localStorage.removeItem(key));
  const trees = (payload as Partial<ICloudPayload> | null)?.trees;
  Object.entries(trees ?? {}).forEach(([key, tree]) => {
    localStorage.setItem(`${accountPrefix()}${key}`, JSON.stringify(tree));
  });
}

// 로그아웃 후 공용 PC에 계정 데이터가 남지 않도록 지운다
export function clearAccountCaches() {
  keysWithPrefix(ACCOUNT_PREFIX).forEach((key) => localStorage.removeItem(key));
}
