// 문의하기 폼 공용 상수
// 주의: api/feedback.ts는 별도 번들(Vercel Function)이라 이 파일을 import하지 않는다.
//       유형 키(value)와 길이 제한을 바꿀 때는 api/feedback.ts도 함께 수정할 것.

export const FEEDBACK_TYPES = [
  { value: "bug", label: "버그/오류" },
  { value: "data", label: "스킬 수치 오류" },
  { value: "feature", label: "기능 건의" },
  { value: "etc", label: "기타" },
] as const;

export type FeedbackType = (typeof FEEDBACK_TYPES)[number]["value"];

export const FEEDBACK_MAX_TITLE = 100;
export const FEEDBACK_MAX_BODY = 2000;
export const FEEDBACK_MAX_CONTACT = 100;

// 연속 제출 방지용 클라이언트 쿨다운 (서버에도 IP 기준 제한이 있음)
export const FEEDBACK_COOLDOWN_MS = 60_000;
export const FEEDBACK_COOLDOWN_KEY = "feedback_lastSubmittedAt";
