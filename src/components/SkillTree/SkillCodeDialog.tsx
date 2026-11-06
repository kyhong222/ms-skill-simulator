import { useEffect, useRef, useState } from "react";

interface SkillCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (code: string) => string | null; // 실패 메시지 또는 성공 시 null
}

export default function SkillCodeDialog({ isOpen, onClose, onApply }: SkillCodeDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      setCode("");
      setError("");
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  // ESC로 닫혀도 부모의 열림 상태가 풀리도록 동기화
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  const handleApply = () => {
    const applyError = onApply(code);
    if (applyError) {
      setError(applyError);
    } else {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="rounded-lg shadow-xl p-0 w-[92vw] max-w-[480px] bg-white dark:bg-dark-paper backdrop:bg-black/50"
    >
      <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50 rounded-t-lg dark:bg-dark-raised">
        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">스킬코드 적용</h3>
        <button
          onClick={onClose}
          className="bg-transparent border-0 p-0 text-gray-500 hover:text-gray-800 text-xl leading-none px-1 dark:text-gray-400 dark:hover:text-gray-100"
          aria-label="닫기"
        >
          ✕
        </button>
      </div>
      <div className="px-5 py-4">
        <textarea
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(""); }}
          placeholder="스킬코드를 붙여넣으세요"
          className="w-full h-24 px-3 py-2 border rounded text-sm text-gray-800 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 dark:text-gray-100 dark:bg-dark-raised"
        />
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
          >
            취소
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          >
            적용
          </button>
        </div>
      </div>
    </dialog>
  );
}
