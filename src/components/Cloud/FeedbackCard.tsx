import type { ReactNode } from "react";
import { FEEDBACK_STATUS_LABEL, FEEDBACK_TYPE_LABEL } from "../../constants/feedback";
import type { IFeedback, IFeedbackReply } from "../../data/cloud/feedback";

interface FeedbackCardProps {
  feedback: IFeedback;
  replies: IFeedbackReply[];
  imageUrls: Map<string, string>; // 스토리지 경로 → 서명 URL (버킷이 비공개라 원본 경로로는 못 띄운다)
  showAuthor?: boolean; // 문의 관리에서만 작성자·서비스를 보여준다
  children?: ReactNode; // 어드민 조작(답변 작성·상태 변경·대문 공개)
}

const formatDate = (at: string) => new Date(at).toLocaleString("ko-KR");

// 문의 한 건 + 운영자 답변. '내 문의'와 '문의 관리'가 같은 생김새를 쓴다
export default function FeedbackCard({ feedback, replies, imageUrls, showAuthor, children }: FeedbackCardProps) {
  const shots = feedback.images.flatMap((path) => imageUrls.get(path) ?? []);

  return (
    <article className="p-3 border rounded-lg text-left text-gray-800 dark:text-gray-100">
      <div className="flex flex-wrap items-center gap-1.5 mb-1 text-xs">
        <span className="px-2 py-0.5 border rounded-full">{FEEDBACK_TYPE_LABEL[feedback.type]}</span>
        <span className="px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700">
          {FEEDBACK_STATUS_LABEL[feedback.status]}
        </span>
        {feedback.isPublic && (
          <span className="px-2 py-0.5 border rounded-full border-purple-400 text-purple-600 dark:text-purple-300">공개</span>
        )}
        <span className="ml-auto text-gray-500 dark:text-gray-400">{formatDate(feedback.createdAt)}</span>
      </div>
      <p className="font-bold break-keep">{feedback.title}</p>
      {showAuthor && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {feedback.authorName ?? "(이름 없음)"} · {feedback.appId}
        </p>
      )}
      <p className="mt-1 text-sm whitespace-pre-wrap break-words">{feedback.body}</p>

      {shots.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {shots.map((url) => (
            // 새 탭으로 원본 보기 — 서명 URL이라 1시간 뒤엔 만료된다
            <a key={url} href={url} target="_blank" rel="noreferrer">
              <img src={url} alt="첨부 이미지" loading="lazy" className="w-24 h-24 object-cover rounded border" />
            </a>
          ))}
        </div>
      )}

      {replies.map((reply) => (
        <div
          key={reply.id}
          className="mt-2 py-1.5 pl-3 pr-2 border-l-4 border-primary bg-gray-50 dark:border-primary-dark dark:bg-dark-raised"
        >
          <p className="text-xs font-bold text-primary dark:text-primary-dark">운영자 답변 · {formatDate(reply.createdAt)}</p>
          <p className="text-sm whitespace-pre-wrap break-words">{reply.body}</p>
        </div>
      ))}

      {children}
    </article>
  );
}
