import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { sessionStorageAdapter } from "./cookieStorage";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

// *.mapleland.st 서비스가 Supabase 프로젝트 하나를 공유하므로 user_state·feedbacks 행을 이 값으로 가른다.
// 환경변수로 두지 않는다 — 아이템 시뮬 값(item-sim)이 잘못 들어가면 그쪽 계정 데이터를 덮어쓴다
export const APP_ID = "skill-sim";

// false면 로그인 UI를 숨기고 기존 localStorage 전용으로 동작한다 (키 없이도 빌드·실행 가능)
export const isCloudEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let client: SupabaseClient | null = null;

// isCloudEnabled가 false일 때 호출하면 던진다 — 호출부가 먼저 확인할 것
export function supabase(): SupabaseClient {
  if (!isCloudEnabled) {
    throw new Error("Supabase 키가 없습니다 (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)");
  }
  client ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      // storageKey는 기본값을 유지해야 아이템 시뮬레이터와 세션(SSO)을 공유한다
      storage: sessionStorageAdapter(),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });
  return client;
}
