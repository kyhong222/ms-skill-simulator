import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * 문의하기 폼 → GitHub Issue 생성 프록시.
 *
 * GitHub 토큰을 브라우저에 노출할 수 없어 서버리스 함수를 경유한다.
 * 필요한 환경변수 (Vercel 프로젝트 설정):
 *   - GITHUB_TOKEN  : fine-grained PAT, 대상 레포의 Issues = Read and write
 *   - FEEDBACK_REPO : (선택) "owner/repo", 미설정 시 아래 기본값
 */
const DEFAULT_REPO = "kyhong222/ms-skill-simulator";
const ISSUE_LABEL = "feedback";

// src/constants/feedback.ts의 FEEDBACK_TYPES와 동기화할 것
const TYPE_LABELS: Record<string, string> = {
  bug: "버그/오류",
  data: "스킬 수치 오류",
  feature: "기능 건의",
  etc: "기타",
};

const MAX_TITLE = 100;
const MAX_BODY = 2000;
const MAX_CONTACT = 100;

// IP 기준 간이 레이트 리밋. 서버리스 인스턴스 메모리라 완벽하진 않고, 폭주만 막는 용도
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 3;
const recentHits = new Map<string, number[]>();

function isRateLimited(ip: string, now: number): boolean {
  const hits = (recentHits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (hits.length >= RATE_LIMIT_MAX) {
    recentHits.set(ip, hits);
    return true;
  }
  hits.push(now);
  recentHits.set(ip, hits);
  return false;
}

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return raw?.split(",")[0].trim() || req.socket.remoteAddress || "unknown";
}

// 제로폭 공백(U+200B)을 @ 뒤에 끼워 GitHub 사용자 멘션(알림) 악용을 막는다. 화면상으로는 동일하게 보인다
const ZERO_WIDTH_SPACE = "\u200B";

function asText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .slice(0, maxLength)
    .replace(/@(?=[A-Za-z0-9-])/g, `@${ZERO_WIDTH_SPACE}`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "POST 요청만 지원합니다." });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("[feedback] GITHUB_TOKEN 환경변수가 설정되지 않았습니다.");
    return res.status(500).json({ error: "문의 접수가 아직 준비되지 않았습니다." });
  }

  const payload: Record<string, unknown> =
    typeof req.body === "string" ? safeParse(req.body) : (req.body ?? {});

  // 허니팟: 사람에게는 보이지 않는 필드라 값이 있으면 봇으로 간주하고 조용히 성공 처리
  if (asText(payload.website, 50)) {
    return res.status(200).json({ ok: true });
  }

  const type = typeof payload.type === "string" ? payload.type : "";
  const title = asText(payload.title, MAX_TITLE);
  const body = asText(payload.body, MAX_BODY);
  const contact = asText(payload.contact, MAX_CONTACT);

  if (!TYPE_LABELS[type]) return res.status(400).json({ error: "문의 유형을 선택해주세요." });
  if (!title) return res.status(400).json({ error: "제목을 입력해주세요." });
  if (!body) return res.status(400).json({ error: "내용을 입력해주세요." });

  if (isRateLimited(getClientIp(req), Date.now())) {
    return res.status(429).json({ error: "잠시 후 다시 시도해주세요." });
  }

  const repo = process.env.FEEDBACK_REPO || DEFAULT_REPO;
  const issueTitle = `[${TYPE_LABELS[type]}] ${title}`;
  const issueBody = [
    body,
    "",
    "---",
    `- 유형: ${TYPE_LABELS[type]}`,
    contact ? `- 연락처: ${contact}` : "- 연락처: (미기재)",
    "- 접수 경로: 사이트 내 문의하기 폼",
  ].join("\n");

  const createIssue = (labels?: string[]) =>
    fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "ms-skill-simulator-feedback",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: issueTitle, body: issueBody, ...(labels ? { labels } : {}) }),
    });

  try {
    let response = await createIssue([ISSUE_LABEL]);
    // 라벨 문제로 거부되면 라벨 없이 재시도 — 문의 자체를 잃지 않는 게 우선
    if (response.status === 422) {
      response = await createIssue();
    }

    if (!response.ok) {
      console.error("[feedback] GitHub API 실패", response.status, await response.text());
      return res.status(502).json({ error: "문의 등록에 실패했습니다. 잠시 후 다시 시도해주세요." });
    }

    const issue = (await response.json()) as { html_url?: string; number?: number };
    return res.status(200).json({ ok: true, url: issue.html_url, number: issue.number });
  } catch (err) {
    console.error("[feedback] 예외 발생", err);
    return res.status(502).json({ error: "문의 등록에 실패했습니다. 잠시 후 다시 시도해주세요." });
  }
}

function safeParse(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}
