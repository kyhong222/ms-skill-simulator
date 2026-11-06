import { useRef, useEffect, useState } from "react";
import { useCloud } from "../Cloud/cloudContext";
import {
  FEEDBACK_IMAGE_TYPES,
  FEEDBACK_MAX_BODY,
  FEEDBACK_MAX_IMAGES,
  FEEDBACK_MAX_IMAGE_BYTES,
  FEEDBACK_MAX_TITLE,
  FEEDBACK_TYPES,
  type FeedbackType,
} from "../../constants/feedback";
import { createFeedback, uploadFeedbackImages } from "../../data/cloud/feedback";

interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type SubmitStatus = "idle" | "sending" | "done";

const inputClass =
  "w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-400 dark:border-gray-600 dark:text-gray-100 dark:bg-dark-raised";
const secondaryButtonClass =
  "px-4 py-1.5 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600";
const primaryButtonClass =
  "px-4 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500";

export default function FeedbackDialog({ isOpen, onClose }: FeedbackDialogProps) {
  const { status: authStatus, user, signIn } = useCloud();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [type, setType] = useState<FeedbackType>("bug");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      // 열 때마다 초기화 — 이전 제출 결과가 남아있지 않도록
      setType("bug");
      setTitle("");
      setBody("");
      setFiles([]);
      setStatus("idle");
      setErrorMessage("");
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

  // 개수·크기·타입을 먼저 거른다 (버킷에도 같은 제한이 걸려 있다)
  const addFiles = (picked: FileList | null) => {
    if (!picked) return;
    const next = [...files];
    let message = "";
    for (const file of Array.from(picked)) {
      if (next.length >= FEEDBACK_MAX_IMAGES) {
        message = `이미지는 최대 ${FEEDBACK_MAX_IMAGES}장까지 첨부할 수 있습니다.`;
        break;
      }
      if (!FEEDBACK_IMAGE_TYPES.includes(file.type)) {
        message = "PNG·JPG·GIF·WEBP 이미지만 첨부할 수 있습니다.";
      } else if (file.size > FEEDBACK_MAX_IMAGE_BYTES) {
        message = `'${file.name}'이(가) 너무 큽니다 (장당 ${FEEDBACK_MAX_IMAGE_BYTES / 1024 / 1024}MB까지).`;
      } else {
        next.push(file);
      }
    }
    setFiles(next);
    setErrorMessage(message);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending" || !user) return;

    if (!title.trim() || !body.trim()) {
      setErrorMessage("제목과 내용을 입력해주세요.");
      return;
    }

    setStatus("sending");
    setErrorMessage("");

    try {
      const selected = FEEDBACK_TYPES.find((option) => option.value === type) ?? FEEDBACK_TYPES[0];
      // 이미지 경로에 문의 id가 들어가므로 id를 먼저 만든다
      const id = crypto.randomUUID();
      const images = files.length > 0 ? await uploadFeedbackImages(user.id, id, files) : [];
      await createFeedback(user.id, {
        id,
        type: selected.dbType,
        title: `${selected.titlePrefix}${title.trim()}`,
        body: body.trim(),
        authorName: user.name,
        authorAvatar: user.avatarUrl ?? null,
        images,
      });
      setStatus("done");
    } catch (error) {
      setStatus("idle");
      setErrorMessage(error instanceof Error ? error.message : "문의 등록에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  const renderContent = () => {
    if (authStatus === "disabled") {
      return (
        <div className="px-5 py-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">현재 문의 접수를 이용할 수 없습니다.</p>
        </div>
      );
    }

    if (!user) {
      return (
        <div className="px-5 py-6 text-center">
          <p className="text-gray-800 font-semibold mb-1 dark:text-gray-100">문의하려면 디스코드 로그인이 필요합니다</p>
          <p className="text-gray-500 text-sm mb-4 break-keep dark:text-gray-400">
            연락처를 따로 적지 않아도 되고, 남긴 문의와 답변을 계정에서 계속 확인할 수 있습니다.
          </p>
          <button type="button" onClick={() => void signIn()} disabled={authStatus === "loading"} className={primaryButtonClass}>
            디스코드 로그인
          </button>
        </div>
      );
    }

    if (status === "done") {
      return (
        <div className="px-5 py-6 text-center">
          <p className="text-gray-800 font-semibold mb-1 dark:text-gray-100">문의가 접수되었습니다</p>
          <p className="text-gray-500 text-sm mb-4 dark:text-gray-400">
            답변이 달리면 계정 메뉴의 내 문의에서 확인할 수 있습니다.
          </p>
          <button onClick={onClose} className={secondaryButtonClass}>
            닫기
          </button>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3 text-left">
        <p className="text-xs text-gray-500 break-keep dark:text-gray-400">
          버그, 스킬 수치 오류, 기능 건의를 남겨주세요. 도움이 될 문의는 공개 목록에 실릴 수 있으니 개인정보는 넣지 마세요.
        </p>

        <div>
          <label htmlFor="feedback-type" className="block text-sm text-gray-700 mb-1 dark:text-gray-300">
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
          <label htmlFor="feedback-title" className="block text-sm text-gray-700 mb-1 dark:text-gray-300">
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
          <label htmlFor="feedback-body" className="block text-sm text-gray-700 mb-1 dark:text-gray-300">
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
          <label htmlFor="feedback-images" className="block text-sm text-gray-700 mb-1 dark:text-gray-300">
            이미지 첨부 <span className="text-gray-400">({files.length}/{FEEDBACK_MAX_IMAGES}장)</span>
          </label>
          <input
            id="feedback-images"
            type="file"
            accept={FEEDBACK_IMAGE_TYPES.join(",")}
            multiple
            disabled={files.length >= FEEDBACK_MAX_IMAGES}
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = ""; // 같은 파일을 다시 고를 수 있게
            }}
            className="block w-full text-sm text-gray-700 dark:text-gray-300"
          />
          {files.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {files.map((file, index) => (
                <li key={`${file.name}-${index}`} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles(files.filter((_, i) => i !== index))}
                    aria-label={`${file.name} 첨부 취소`}
                    className="bg-transparent border-0 p-0 text-gray-500 dark:text-gray-400"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">디스코드 계정({user.name})이 기록되며 답변에 사용됩니다.</p>

        {errorMessage && <p className="text-sm text-red-600 break-keep dark:text-red-400">{errorMessage}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={secondaryButtonClass}>
            취소
          </button>
          <button type="submit" disabled={status === "sending"} className={primaryButtonClass}>
            {status === "sending" ? "전송 중..." : "보내기"}
          </button>
        </div>
      </form>
    );
  };

  return (
    <dialog
      ref={dialogRef}
      className="rounded-lg shadow-xl p-0 w-[420px] max-w-[92vw] bg-white dark:bg-dark-paper backdrop:bg-black/50"
    >
      <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50 rounded-t-lg dark:bg-dark-raised">
        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">문의하기</h3>
        <button
          onClick={onClose}
          className="bg-transparent border-0 p-0 text-gray-500 hover:text-gray-800 text-xl leading-none px-1 dark:text-gray-400 dark:hover:text-gray-100"
          aria-label="닫기"
        >
          ✕
        </button>
      </div>

      {renderContent()}
    </dialog>
  );
}
