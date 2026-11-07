// 문의하기 폼 공용 상수

// feedbacks.type 컬럼이 허용하는 값 (아이템 시뮬레이터와 공용 테이블의 check 제약)
export type FeedbackDbType = "bug" | "idea" | "etc";

// 공용 테이블에 없는 유형은 dbType으로 저장하고 제목 말머리로 구분한다
export const FEEDBACK_TYPES = [
  { value: "bug", label: "버그/오류", dbType: "bug", titlePrefix: "" },
  { value: "data", label: "스킬 수치 오류", dbType: "bug", titlePrefix: "[스킬 수치] " },
  { value: "feature", label: "기능 건의", dbType: "idea", titlePrefix: "" },
  { value: "etc", label: "기타", dbType: "etc", titlePrefix: "" },
] as const;

export type FeedbackType = (typeof FEEDBACK_TYPES)[number]["value"];

export const FEEDBACK_TYPE_LABEL: Record<FeedbackDbType, string> = {
  bug: "버그 제보",
  idea: "기능 건의",
  etc: "기타",
};

// feedbacks.status 컬럼 값 (공용 테이블)
export type FeedbackStatus = "open" | "answered" | "resolved" | "wontfix";

export const FEEDBACK_STATUSES: FeedbackStatus[] = ["open", "answered", "resolved", "wontfix"];

export const FEEDBACK_STATUS_LABEL: Record<FeedbackStatus, string> = {
  open: "접수됨",
  answered: "답변 완료",
  resolved: "처리 완료",
  wontfix: "반영 안 함",
};

export const FEEDBACK_MAX_TITLE = 100;
export const FEEDBACK_MAX_BODY = 2000;

// 첨부 이미지 제한 (feedback 버킷 설정과 동일)
export const FEEDBACK_MAX_IMAGES = 3;
export const FEEDBACK_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const FEEDBACK_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
