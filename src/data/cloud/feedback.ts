// 문의/답변 데이터 접근. 권한은 전부 RLS가 건다.
// 테이블·버킷은 아이템 시뮬레이터와 공용 (mapleland-setting-v2 docs/feedback.md).
// 어드민 함수(checkIsAdmin 이하)의 검사는 화면을 감추기 위한 것일 뿐이고, 실제 차단은 RLS(is_admin())가 한다
import { APP_ID, supabase } from "./supabase";
import type { FeedbackDbType, FeedbackStatus } from "../../constants/feedback";

export type { FeedbackStatus };

export interface IFeedback {
  id: string;
  appId: string;
  type: FeedbackDbType;
  title: string;
  body: string;
  status: FeedbackStatus;
  isPublic: boolean; // 아이템 시뮬 대문 노출 여부. 어드민만 켤 수 있다
  authorName: string | null;
  images: string[]; // 스토리지 경로. 보여주려면 서명 URL로 바꿔야 한다
  createdAt: string;
}

export interface IFeedbackReply {
  id: string;
  feedbackId: string;
  body: string;
  createdAt: string;
}

export interface INewFeedback {
  id: string; // 이미지 경로에 들어가서 호출부가 먼저 만든다
  type: FeedbackDbType;
  title: string;
  body: string;
  authorName: string | null;
  authorAvatar: string | null;
  images: string[];
}

interface IFeedbackRow {
  id: string;
  app_id: string;
  type: FeedbackDbType;
  title: string;
  body: string;
  status: FeedbackStatus;
  is_public: boolean;
  author_name: string | null;
  images: string[] | null;
  created_at: string;
}

interface IReplyRow {
  id: string;
  feedback_id: string;
  body: string;
  created_at: string;
}

const FEEDBACK_BUCKET = "feedback";
const SIGN_TTL_SECONDS = 3600;
const FEEDBACK_COLUMNS = "id, app_id, type, title, body, status, is_public, author_name, images, created_at";
const REPLY_COLUMNS = "id, feedback_id, body, created_at";

const toFeedback = (row: IFeedbackRow): IFeedback => ({
  id: row.id,
  appId: row.app_id,
  type: row.type,
  title: row.title,
  body: row.body,
  status: row.status,
  isPublic: row.is_public,
  authorName: row.author_name,
  images: row.images ?? [],
  createdAt: row.created_at,
});

const toReply = (row: IReplyRow): IFeedbackReply => ({
  id: row.id,
  feedbackId: row.feedback_id,
  body: row.body,
  createdAt: row.created_at,
});

// 경로는 <user_id>/<feedback_id>/<uuid>.<ext> — 스토리지 정책이 폴더 이름으로 소유자를 판정한다
export async function uploadFeedbackImages(userId: string, feedbackId: string, files: File[]) {
  const storage = supabase().storage.from(FEEDBACK_BUCKET);
  const paths: string[] = [];
  for (const file of files) {
    const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${userId}/${feedbackId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await storage.upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error(`이미지 업로드 실패: ${error.message}`);
    paths.push(path);
  }
  return paths;
}

export async function signImages(paths: string[]) {
  const urls = new Map<string, string>();
  const unique = [...new Set(paths)];
  if (unique.length === 0) return urls;
  const { data, error } = await supabase().storage.from(FEEDBACK_BUCKET).createSignedUrls(unique, SIGN_TTL_SECONDS);
  if (error) return urls; // 이미지가 안 보일 뿐 목록은 그대로 보여준다
  for (const row of data ?? []) {
    if (row.signedUrl && row.path) urls.set(row.path, row.signedUrl);
  }
  return urls;
}

export async function createFeedback(userId: string, input: INewFeedback) {
  const { error } = await supabase().from("feedbacks").insert({
    id: input.id,
    user_id: userId,
    app_id: APP_ID,
    type: input.type,
    title: input.title,
    body: input.body,
    author_name: input.authorName,
    author_avatar: input.authorAvatar,
    images: input.images,
  });
  if (error) throw new Error(error.message);
}

// 서비스를 가리지 않는다 — 아이템 시뮬에서 남긴 문의도 함께 보인다
export async function listMyFeedbacks(userId: string) {
  const { data, error } = await supabase()
    .from("feedbacks")
    .select(FEEDBACK_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toFeedback(row as IFeedbackRow));
}

export async function listReplies(feedbackIds: string[]) {
  const replies = new Map<string, IFeedbackReply[]>();
  if (feedbackIds.length === 0) return replies;
  const { data, error } = await supabase()
    .from("feedback_replies")
    .select(REPLY_COLUMNS)
    .in("feedback_id", feedbackIds)
    .order("created_at");
  if (error) throw new Error(error.message);
  for (const row of (data ?? []) as IReplyRow[]) {
    const list = replies.get(row.feedback_id) ?? [];
    list.push(toReply(row));
    replies.set(row.feedback_id, list);
  }
  return replies;
}

// ── 어드민 ──────────────────────────────────────────────

// 어드민인지 — admins에서 자기 행을 읽을 수 있는지로 판단한다 (화면 표시용 힌트)
export async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase().from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (error) return false;
  return data !== null;
}

// 전 서비스 문의를 가져온다. 어드민이 아니면 RLS가 '공개된 것 + 본인 것'까지만 내준다
export async function listAllFeedbacks(status?: FeedbackStatus) {
  let query = supabase().from("feedbacks").select(FEEDBACK_COLUMNS).order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toFeedback(row as IFeedbackRow));
}

// 답변 작성. 트리거가 문의 상태를 answered로 올린다
export async function createReply(feedbackId: string, authorId: string, body: string) {
  const { data, error } = await supabase()
    .from("feedback_replies")
    .insert({ feedback_id: feedbackId, author_id: authorId, body })
    .select(REPLY_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return toReply(data as IReplyRow);
}

// 상태·대문 공개 여부 변경
export async function updateFeedback(id: string, patch: { status?: FeedbackStatus; isPublic?: boolean }) {
  const body: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.status !== undefined) body.status = patch.status;
  if (patch.isPublic !== undefined) body.is_public = patch.isPublic;
  const { error } = await supabase().from("feedbacks").update(body).eq("id", id);
  if (error) throw new Error(error.message);
}

// 내 문의에 달린 가장 최근 답변 시각 — 새 답변 점 판정용
export async function latestReplyAt(userId: string): Promise<string | null> {
  const { data, error } = await supabase()
    .from("feedback_replies")
    .select("created_at, feedbacks!inner(user_id)")
    .eq("feedbacks.user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) return null; // 점이 안 뜰 뿐이다
  return (data?.[0] as { created_at: string } | undefined)?.created_at ?? null;
}

// 마지막으로 확인한 답변 시각 (계정 단위, 전 서비스 공용)
export async function fetchFeedbackSeenAt(userId: string): Promise<string | null> {
  const { data, error } = await supabase()
    .from("profiles")
    .select("feedback_seen_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return null;
  return (data as { feedback_seen_at: string | null } | null)?.feedback_seen_at ?? null;
}

// 더 최근 값일 때만 덮는다 — 두 기기에서 열어도 시각이 뒤로 가지 않게
export async function saveFeedbackSeenAt(userId: string, at: string) {
  await supabase()
    .from("profiles")
    .update({ feedback_seen_at: at })
    .eq("user_id", userId)
    .or(`feedback_seen_at.is.null,feedback_seen_at.lt."${at}"`);
}
