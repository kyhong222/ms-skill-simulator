export interface ICloudUser {
  id: string;
  name: string; // 디스코드 표시 이름
  avatarUrl?: string;
}

export type AuthStatus =
  | "disabled" // Supabase 키 없음 — 클라우드 기능 전체가 꺼진 상태
  | "loading" // 세션 확인 중
  | "signedOut"
  | "signedIn";

export type SyncStatus = "idle" | "syncing" | "saved" | "offline" | "conflict" | "error";

// 로그인 흐름에서 사용자에게 물어야 하는 순간
export type CloudPrompt = "migrate" | "conflict" | "loadError";

// user_state.payload — 트리 키("112", "112_4th") → localStorage 값과 같은 구조.
// 스킬 로그의 아이콘은 스킬북에서 다시 채울 수 있어 올리지 않는다
export interface ICloudPayload {
  trees: Record<string, unknown>;
}
