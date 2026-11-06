// 계정 동기화 엔진. 서버(user_state 1행)가 원본이고 localStorage는 캐시다.
// 앱 도메인을 모른다 — 읽기/쓰기와 캡처/적용을 주입받고 payload는 unknown으로만 다룬다
import type { SyncStatus } from "../../types/cloud";

export interface IStateRow {
  schemaVersion: number;
  payload: unknown;
  rev: number;
}

export type WriteResult =
  | { ok: true; rev: number }
  | { ok: false; reason: "conflict" } // 다른 기기가 먼저 썼다
  | { ok: false; reason: "error"; message: string };

export interface ICloudSyncDeps {
  schemaVersion: number;
  fetchState: () => Promise<IStateRow | null>;
  pushState: (payload: unknown, schemaVersion: number, knownRev: number | null) => Promise<WriteResult>;
  captureState: () => unknown;
  applyState: (payload: unknown) => void;
  onStatus: (status: SyncStatus, message?: string) => void;
  onConflict: () => void;
}

export type StartResult =
  | "ready" // 계정 데이터를 받아 적용함
  | "firstLogin" // 서버에 행이 없음 — 이 서비스로 처음 로그인
  | "tooNew"; // 서버 스키마가 이 클라이언트보다 새로움

export interface ICloudSync {
  start: () => Promise<StartResult>;
  finishFirstLogin: () => Promise<void>;
  checkRemote: () => Promise<void>;
  takeRemote: () => Promise<void>;
  keepLocal: () => Promise<void>;
  schedulePush: () => void;
  flush: () => Promise<void>;
  dispose: () => void;
}

const DEBOUNCE_MS = 2000;
const MSG_TOO_NEW = "다른 기기에서 더 새 버전으로 저장했습니다. 페이지를 새로고침해 주세요.";

// jsonb는 키 순서를 보존하지 않아 서버 값과 비교하려면 정렬이 필요하다
function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) => {
    if (item === null || typeof item !== "object" || Array.isArray(item)) return item;
    const source = item as Record<string, unknown>;
    return Object.fromEntries(Object.keys(source).sort().map((key) => [key, source[key]]));
  });
}

export function createCloudSync(deps: ICloudSyncDeps): ICloudSync {
  const { schemaVersion } = deps;

  let knownRev: number | null = null; // null = 서버에 행이 없음
  let lastSynced: string | null = null; // 서버와 같다고 확인된 내용
  let started = false; // 서버 상태를 읽기 전에는 절대 올리지 않는다
  let paused = false; // 충돌 중에는 사용자가 고를 때까지 올리지 않는다
  let disposed = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running: Promise<void> = Promise.resolve(); // 네트워크 작업 직렬화 (겹치면 rev가 엇갈린다)

  const status = (next: SyncStatus, message?: string) => {
    if (!disposed) deps.onStatus(next, message);
  };

  const reportFailure = (error: unknown) => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      status("offline");
      return;
    }
    status("error", error instanceof Error ? error.message : String(error));
  };

  const serialize = (task: () => Promise<void>) => {
    running = running.then(task, task).catch(reportFailure);
    return running;
  };

  const enterConflict = () => {
    paused = true;
    status("conflict");
    deps.onConflict();
  };

  const markSynced = (rev: number | null) => {
    knownRev = rev;
    lastSynced = canonical(deps.captureState());
  };

  const applyRow = (row: IStateRow) => {
    deps.applyState(row.payload);
    markSynced(row.rev);
    paused = false;
    status("saved");
  };

  const push = async (force: boolean) => {
    if (paused || !started || disposed) return;
    const payload = deps.captureState();
    const json = canonical(payload);
    if (!force && json === lastSynced) return;

    status("syncing");
    const result = await deps.pushState(payload, schemaVersion, knownRev);
    if (result.ok) {
      knownRev = result.rev;
      lastSynced = json;
      status("saved");
    } else if (result.reason === "conflict") {
      enterConflict();
    } else {
      status("error", result.message);
    }
  };

  const flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    return serialize(() => push(false));
  };

  const handleOnline = () => void flush();
  if (typeof window !== "undefined") window.addEventListener("online", handleOnline);

  return {
    start: async () => {
      const row = await deps.fetchState();
      if (!row) {
        knownRev = null;
        started = true;
        return "firstLogin";
      }
      if (row.schemaVersion > schemaVersion) return "tooNew";
      applyRow(row);
      started = true;
      return "ready";
    },

    // 현재 캐시 내용으로 서버 행을 만든다. 빈 내용이어도 행이 생겨 다시 묻지 않게 된다.
    // 다른 탭·기기가 먼저 만들었으면 묻지 않고 그 계정 데이터를 따른다
    finishFirstLogin: () =>
      serialize(async () => {
        const payload = deps.captureState();
        const result = await deps.pushState(payload, schemaVersion, null);
        if (result.ok) {
          markSynced(result.rev);
          status("saved");
        } else if (result.reason === "error") {
          status("error", result.message);
        } else {
          const row = await deps.fetchState();
          if (row) applyRow(row);
        }
      }),

    // 탭 복귀 시 확인. 이 기기에 안 올린 변경이 없으면 조용히 계정 데이터를 따라간다
    checkRemote: () =>
      serialize(async () => {
        if (paused || !started) return;
        const row = await deps.fetchState();
        if (!row || row.rev === knownRev) return;
        if (row.schemaVersion > schemaVersion) {
          paused = true;
          status("error", MSG_TOO_NEW);
          return;
        }
        const local = canonical(deps.captureState());
        if (local === lastSynced || local === canonical(row.payload)) {
          applyRow(row);
        } else {
          enterConflict();
        }
      }),

    takeRemote: () =>
      serialize(async () => {
        const row = await deps.fetchState();
        if (row && row.schemaVersion > schemaVersion) {
          status("error", MSG_TOO_NEW);
          return;
        }
        paused = false;
        if (row) applyRow(row);
      }),

    keepLocal: () =>
      serialize(async () => {
        // 충돌 직후엔 아는 rev가 낡았으므로 서버의 현재 값을 다시 읽는다
        const row = await deps.fetchState();
        knownRev = row?.rev ?? null;
        paused = false;
        await push(true);
      }),

    schedulePush: () => {
      if (paused || disposed) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        void serialize(() => push(false));
      }, DEBOUNCE_MS);
    },

    flush,

    dispose: () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      timer = null;
      if (typeof window !== "undefined") window.removeEventListener("online", handleOnline);
    },
  };
}
