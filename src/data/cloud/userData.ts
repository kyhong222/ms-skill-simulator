import { supabase } from "./supabase";
import type { IStateRow, WriteResult } from "./sync";

// Postgres unique_violation — insert 하려는데 이미 행이 있다 (다른 기기가 먼저 만듦)
const UNIQUE_VIOLATION = "23505";

export async function fetchState(userId: string, appId: string): Promise<IStateRow | null> {
  const { data, error } = await supabase()
    .from("user_state")
    .select("schema_version, payload, rev")
    .eq("user_id", userId)
    .eq("app_id", appId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return { schemaVersion: data.schema_version, payload: data.payload, rev: data.rev };
}

// 쓰기는 rev 낙관적 잠금. knownRev가 null이면 서버에 행이 없다는 뜻이라 insert한다.
// rev 증가는 DB 트리거(bump_rev)가 하므로 돌아온 값을 다음 기준으로 쓴다
export async function pushState(
  userId: string,
  appId: string,
  payload: unknown,
  schemaVersion: number,
  knownRev: number | null,
): Promise<WriteResult> {
  if (knownRev === null) {
    const { data, error } = await supabase()
      .from("user_state")
      .insert({ user_id: userId, app_id: appId, schema_version: schemaVersion, payload })
      .select("rev")
      .maybeSingle();
    if (error) {
      return error.code === UNIQUE_VIOLATION
        ? { ok: false, reason: "conflict" }
        : { ok: false, reason: "error", message: error.message };
    }
    return { ok: true, rev: data?.rev ?? 1 };
  }

  const { data, error } = await supabase()
    .from("user_state")
    .update({ schema_version: schemaVersion, payload })
    .eq("user_id", userId)
    .eq("app_id", appId)
    .eq("rev", knownRev)
    .select("rev")
    .maybeSingle();
  if (error) return { ok: false, reason: "error", message: error.message };
  if (!data) return { ok: false, reason: "conflict" }; // 0행 = 다른 기기가 먼저 썼다
  return { ok: true, rev: data.rev };
}
