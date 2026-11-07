// '문의 관리' — 운영자 전용. 아이템 시뮬레이터의 문의 관리와 같은 기능 (mapleland-setting-v2 docs/feedback.md §5)
// 메뉴를 운영자에게만 보여주는 건 화면을 감추는 것일 뿐이고, 실제 차단은 RLS가 한다 —
// 운영자가 아니면 목록에 공개 + 본인 문의만 나오고 답변·변경은 실패한다
import { useCallback, useEffect, useRef, useState } from "react";
import { useCloud } from "./cloudContext";
import FeedbackCard from "./FeedbackCard";
import { FEEDBACK_STATUSES, FEEDBACK_STATUS_LABEL } from "../../constants/feedback";
import {
  createReply,
  listAllFeedbacks,
  listReplies,
  signImages,
  updateFeedback,
  type FeedbackStatus,
  type IFeedback,
  type IFeedbackReply,
} from "../../data/cloud/feedback";

interface AdminFeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SELECT_CLASS =
  "px-2 py-1 text-sm border rounded bg-white text-gray-800 disabled:opacity-50 dark:bg-dark-raised dark:text-gray-100 dark:border-gray-600";

export default function AdminFeedbackDialog({ isOpen, onClose }: AdminFeedbackDialogProps) {
  const { user } = useCloud();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [filter, setFilter] = useState<FeedbackStatus | "all">("open");
  const [items, setItems] = useState<IFeedback[]>([]);
  const [replies, setReplies] = useState<Map<string, IFeedbackReply[]>>(new Map());
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const userId = user?.id;

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const list = await listAllFeedbacks(filter === "all" ? undefined : filter);
      setItems(list);
      setReplies(await listReplies(list.map((feedback) => feedback.id)));
      setImageUrls(await signImages(list.flatMap((feedback) => feedback.images)));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "문의를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
      void load();
    } else {
      dialog.close();
    }
  }, [isOpen, load]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  // 답변 등록·상태 변경 공통 — 끝나면 목록째 다시 읽는다 (답변 트리거가 상태를 answered로 올리므로)
  const run = async (feedbackId: string, action: () => Promise<void>, failMessage: string) => {
    setBusyId(feedbackId);
    setError("");
    try {
      await action();
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : failMessage);
    } finally {
      setBusyId(null);
    }
  };

  const submitReply = (feedback: IFeedback) => {
    const body = (drafts[feedback.id] ?? "").trim();
    if (!body || !userId) return;
    void run(
      feedback.id,
      async () => {
        await createReply(feedback.id, userId, body);
        setDrafts((prev) => ({ ...prev, [feedback.id]: "" }));
      },
      "답변 등록에 실패했습니다.",
    );
  };

  const patch = (feedback: IFeedback, body: { status?: FeedbackStatus; isPublic?: boolean }) =>
    void run(feedback.id, () => updateFeedback(feedback.id, body), "변경에 실패했습니다.");

  return (
    <dialog
      ref={dialogRef}
      className="rounded-lg shadow-xl p-0 w-[92vw] max-w-[760px] max-h-[85vh] bg-white dark:bg-dark-paper backdrop:bg-black/50"
    >
      <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50 rounded-t-lg dark:bg-dark-raised">
        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">문의 관리</h3>
        <button
          onClick={onClose}
          className="bg-transparent border-0 p-0 text-gray-500 hover:text-gray-800 text-xl leading-none px-1 dark:text-gray-400 dark:hover:text-gray-100"
          aria-label="닫기"
        >
          ✕
        </button>
      </div>

      <div className="flex items-center gap-2 px-5 pt-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as FeedbackStatus | "all")}
          className={SELECT_CLASS}
          aria-label="상태 필터"
        >
          <option value="all">전체</option>
          {FEEDBACK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {FEEDBACK_STATUS_LABEL[status]}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-500 dark:text-gray-400">{items.length}건</span>
        <button
          type="button"
          onClick={() => void load()}
          disabled={isLoading}
          className="ml-auto px-3 py-1 text-sm rounded bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
        >
          새로고침
        </button>
      </div>

      <div className="px-5 py-3 space-y-3 overflow-y-auto max-h-[65vh]">
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {isLoading ? (
          <p className="py-4 text-center text-gray-500 dark:text-gray-400">불러오는 중...</p>
        ) : items.length === 0 ? (
          <p className="py-4 text-center text-gray-500 dark:text-gray-400">해당하는 문의가 없습니다.</p>
        ) : (
          items.map((feedback) => {
            const isBusy = busyId === feedback.id;
            const draft = drafts[feedback.id] ?? "";
            return (
              <FeedbackCard
                key={feedback.id}
                feedback={feedback}
                replies={replies.get(feedback.id) ?? []}
                imageUrls={imageUrls}
                showAuthor
              >
                <div className="mt-2.5">
                  <textarea
                    rows={2}
                    placeholder="답변 작성"
                    value={draft}
                    disabled={isBusy}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [feedback.id]: e.target.value }))}
                    className="w-full px-2 py-1.5 text-sm border rounded resize-y bg-white text-gray-800 disabled:opacity-50 dark:bg-dark-raised dark:text-gray-100 dark:border-gray-600"
                  />
                  <div className="flex flex-col gap-2 mt-1.5 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      disabled={isBusy || !draft.trim()}
                      onClick={() => submitReply(feedback)}
                      className="px-3 py-1 text-sm rounded bg-primary text-white hover:opacity-90 disabled:opacity-50"
                    >
                      답변 등록
                    </button>
                    <select
                      value={feedback.status}
                      disabled={isBusy}
                      onChange={(e) => patch(feedback, { status: e.target.value as FeedbackStatus })}
                      className={SELECT_CLASS}
                      aria-label="상태 변경"
                    >
                      {FEEDBACK_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {FEEDBACK_STATUS_LABEL[status]}
                        </option>
                      ))}
                    </select>
                    {/* 켜면 아이템 시뮬 대문에 노출된다 — 작성자 닉네임도 함께 공개된다 */}
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={feedback.isPublic}
                        disabled={isBusy}
                        onChange={(e) => patch(feedback, { isPublic: e.target.checked })}
                      />
                      대문 공개
                    </label>
                  </div>
                </div>
              </FeedbackCard>
            );
          })
        )}
      </div>
    </dialog>
  );
}
