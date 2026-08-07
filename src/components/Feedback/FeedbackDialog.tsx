import { useRef, useEffect, useState } from "react";
import {
  FEEDBACK_TYPES,
  FEEDBACK_MAX_TITLE,
  FEEDBACK_MAX_BODY,
  FEEDBACK_MAX_CONTACT,
  FEEDBACK_COOLDOWN_MS,
  FEEDBACK_COOLDOWN_KEY,
  type FeedbackType,
} from "../../constants/feedback";

interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type SubmitStatus = "idle" | "sending" | "done";

const inputClass =
  "w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-400";

export default function FeedbackDialog({ isOpen, onClose }: FeedbackDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [type, setType] = useState<FeedbackType>("bug");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [contact, setContact] = useState("");
  const [website, setWebsite] = useState(""); // 허니팟 (사람은 볼 수 없는 필드)
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [issueUrl, setIssueUrl] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      // 열 때마다 초기화 — 이전 제출 결과가 남아있지 않도록
      setType("bug");
      setTitle("");
      setBody("");
      setContact("");
      setWebsite("");
      setStatus("idle");
      setErrorMessage("");
      setIssueUrl("");
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;

    if (!title.trim() || !body.trim()) {
      setErrorMessage("제목과 내용을 입력해주세요.");
      return;
    }

    const lastSubmittedAt = Number(localStorage.getItem(FEEDBACK_COOLDOWN_KEY) ?? 0);
    const remainMs = FEEDBACK_COOLDOWN_MS - (Date.now() - lastSubmittedAt);
    if (remainMs > 0) {
      setErrorMessage(`연속 제출은 어렵습니다. ${Math.ceil(remainMs / 1000)}초 후 다시 시도해주세요.`);
      return;
    }

    setStatus("sending");
    setErrorMessage("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title, body, contact, website }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus("idle");
        setErrorMessage(result.error ?? "문의 등록에 실패했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      localStorage.setItem(FEEDBACK_COOLDOWN_KEY, String(Date.now()));
      setIssueUrl(typeof result.url === "string" ? result.url : "");
      setStatus("done");
    } catch {
      setStatus("idle");
      setErrorMessage("네트워크 오류로 전송하지 못했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="rounded-lg shadow-xl p-0 w-[420px] max-w-[92vw] bg-white backdrop:bg-black/50"
    >
      <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50 rounded-t-lg">
        <h3 className="font-semibold text-lg text-gray-800">문의하기</h3>
        <button
          onClick={onClose}
          className="bg-transparent border-0 p-0 text-gray-500 hover:text-gray-800 text-xl leading-none px-1"
          aria-label="닫기"
        >
          ✕
        </button>
      </div>

      {status === "done" ? (
        <div className="px-5 py-6 text-center">
          <p className="text-gray-800 font-semibold mb-1">문의가 접수되었습니다</p>
          <p className="text-gray-500 text-sm mb-4">확인 후 반영하겠습니다. 감사합니다!</p>
          {issueUrl && (
            <a
              href={issueUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-blue-600 underline"
            >
              등록된 문의 확인하기
            </a>
          )}
          <div className="mt-5">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              닫기
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <p className="text-xs text-gray-500 break-keep">
            버그, 스킬 수치 오류, 기능 건의를 남겨주세요. 접수된 내용은 GitHub 저장소의 이슈로
            공개 등록됩니다.
          </p>

          <div>
            <label htmlFor="feedback-type" className="block text-sm text-gray-700 mb-1">
              유형
            </label>
            <select
              id="feedback-type"
              value={type}
              onChange={(e) => setType(e.target.value as FeedbackType)}
              className={inputClass}
            >
              {FEEDBACK_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="feedback-title" className="block text-sm text-gray-700 mb-1">
              제목
            </label>
            <input
              id="feedback-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={FEEDBACK_MAX_TITLE}
              placeholder="예: 히어로 브랜디쉬 30레벨 수치가 다릅니다"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="feedback-body" className="block text-sm text-gray-700 mb-1">
              내용
            </label>
            <textarea
              id="feedback-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={FEEDBACK_MAX_BODY}
              rows={6}
              placeholder="어떤 직업/스킬에서 어떤 문제가 있었는지 적어주시면 큰 도움이 됩니다."
              className={`${inputClass} resize-y`}
            />
            <p className="text-right text-xs text-gray-400 mt-0.5">
              {body.length} / {FEEDBACK_MAX_BODY}
            </p>
          </div>

          <div>
            <label htmlFor="feedback-contact" className="block text-sm text-gray-700 mb-1">
              연락처 <span className="text-gray-400">(선택)</span>
            </label>
            <input
              id="feedback-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              maxLength={FEEDBACK_MAX_CONTACT}
              placeholder="디스코드 ID 등 — 추가 확인이 필요할 때만 사용합니다"
              className={inputClass}
            />
          </div>

          {/* 허니팟: 자동 스팸만 채우는 필드 */}
          <input
            type="text"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />

          {errorMessage && <p className="text-sm text-red-600 break-keep">{errorMessage}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={status === "sending"}
              className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500"
            >
              {status === "sending" ? "전송 중..." : "보내기"}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
