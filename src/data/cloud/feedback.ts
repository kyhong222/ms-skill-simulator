// 문의/답변 데이터 접근. 권한은 전부 RLS가 건다.
// 테이블·버킷은 아이템 시뮬레이터와 공용 (mapleland-setting-v2 docs/feedback.md).
// 어드민 답변은 아이템 시뮬레이터의 '문의 관리'에서 하므로 여기에는 어드민 기능이 없다
import { APP_ID, supabase } from "./supabase";
import type { FeedbackDbType } from "../../constants/feedback";

export type FeedbackStatus = "open" | "answered" | "resolved" | "wontfix";

export interface IFeedback {
  id: string;
  appId: string;
  type: FeedbackDbType;
  title: string;
  body: string;
  status: FeedbackStatus;
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
  images: string[] | null;
  created_at: string;
}

const FEEDBACK_BUCKET = "feedback";
const SIGN_TTL_SECONDS = 3600;
const FEEDBACK_COLUMNS = "id, app_id, type, title, body, status, images, created_at";

const toFeedback = (row: IFeedbackRow): IFeedback => ({
  id: row.id,
  appId: row.app_id,
  type: row.type,
  title: row.title,
  body: row.body,
  status: row.status,
  images: row.images ?? [],
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
    .select("id, feedback_id, body, created_at")
    .in("feedback_id", feedbackIds)
    .order("created_at");
  if (error) throw new Error(error.message);
  for (const row of data ?? []) {
    const list = replies.get(row.feedback_id) ?? [];
    list.push({ id: row.id, feedbackId: row.feedback_id, body: row.body, createdAt: row.created_at });
    replies.set(row.feedback_id, list);
  }
  return replies;
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
