import { useCallback, useEffect, useRef, useState } from "react";
import { useCloud } from "./cloudContext";
import FeedbackCard from "./FeedbackCard";
import {
  listMyFeedbacks,
  listReplies,
  saveFeedbackSeenAt,
  signImages,
  type IFeedback,
  type IFeedbackReply,
} from "../../data/cloud/feedback";

interface MyFeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSeen: (at: string) => void; // 화면에 보여준 가장 최근 답변 시각
}

export default function MyFeedbackDialog({ isOpen, onClose, onSeen }: MyFeedbackDialogProps) {
  const { user } = useCloud();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [items, setItems] = useState<IFeedback[]>([]);
  const [replies, setReplies] = useState<Map<string, IFeedbackReply[]>>(new Map());
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const userId = user?.id;

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError("");
    try {
      const list = await listMyFeedbacks(userId);
      const byFeedback = await listReplies(list.map((feedback) => feedback.id));
      setItems(list);
      setReplies(byFeedback);
      setImageUrls(await signImages(list.flatMap((feedback) => feedback.images)));

      // 클라이언트 시계 대신 실제로 보여준 답변의 서버 시각으로 확인 처리한다
      const replyTimes = [...byFeedback.values()].flat().map((reply) => reply.createdAt);
      const latest = replyTimes.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
      if (latest) {
        onSeen(latest);
        void saveFeedbackSeenAt(userId, latest);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "문의를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [userId, onSeen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
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

  return (
    <dialog
      ref={dialogRef}
      className="rounded-lg shadow-xl p-0 w-[92vw] max-w-[560px] max-h-[85vh] bg-white dark:bg-dark-paper backdrop:bg-black/50"
    >
      <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50 rounded-t-lg dark:bg-dark-raised">
        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">내 문의</h3>
        <button
          onClick={onClose}
          className="bg-transparent border-0 p-0 text-gray-500 hover:text-gray-800 text-xl leading-none px-1 dark:text-gray-400 dark:hover:text-gray-100"
          aria-label="닫기"
        >
          ✕
        </button>
      </div>

      <div className="px-5 py-4 space-y-3 overflow-y-auto max-h-[70vh]">
        {isLoading ? (
          <p className="py-4 text-center text-gray-500 dark:text-gray-400">불러오는 중...</p>
        ) : error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : items.length === 0 ? (
          <p className="py-4 text-center text-gray-500 dark:text-gray-400">아직 남긴 문의가 없습니다.</p>
        ) : (
          items.map((feedback) => (
            <FeedbackCard
              key={feedback.id}
              feedback={feedback}
              replies={replies.get(feedback.id) ?? []}
              imageUrls={imageUrls}
            />
          ))
        )}
      </div>
    </dialog>
  );
}
