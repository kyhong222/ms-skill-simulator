import { useEffect, useRef } from "react";
import type { CloudPrompt } from "../../types/cloud";

interface CloudPromptDialogProps {
  prompt: CloudPrompt | null;
  isBusy: boolean;
  onMigrate: (shouldMigrate: boolean) => void;
  onTakeRemote: () => void;
  onKeepLocal: () => void;
  onRetry: () => void;
  onSignOut: () => void;
}

const COPY: Record<CloudPrompt, { title: string; description: string }> = {
  migrate: {
    title: "브라우저에 저장된 스킬 세팅을 계정으로 이관할까요?",
    description:
      "처음 로그인할 때 한 번만 묻습니다. 이후에는 디스코드 계정의 데이터를 따릅니다. 브라우저의 기존 세팅은 로그아웃하면 그대로 다시 볼 수 있습니다.",
  },
  conflict: {
    title: "다른 기기에서 먼저 저장했습니다",
    description: "이 기기에 아직 계정으로 올리지 못한 변경이 있습니다. 어느 쪽을 남길까요?",
  },
  loadError: {
    title: "계정 데이터를 불러오지 못했습니다",
    description: "네트워크 상태를 확인한 뒤 다시 시도해 주세요. 앱을 새로 배포한 직후라면 새로고침이 필요할 수 있습니다.",
  },
};

const PRIMARY = "px-4 py-2 text-sm bg-primary text-white rounded hover:opacity-90 disabled:opacity-50 dark:bg-primary-dark dark:text-gray-900";
const SECONDARY =
  "px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600";

export default function CloudPromptDialog({
  prompt,
  isBusy,
  onMigrate,
  onTakeRemote,
  onKeepLocal,
  onRetry,
  onSignOut,
}: CloudPromptDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (prompt && !dialog.open) dialog.showModal();
    if (!prompt && dialog.open) dialog.close();
  }, [prompt]);

  const copy = prompt ? COPY[prompt] : null;

  return (
    // 고르기 전에는 스킬 트리를 어느 데이터로 열지 정할 수 없어 ESC로 닫지 못하게 한다
    <dialog
      ref={dialogRef}
      onCancel={(e) => e.preventDefault()}
      className="rounded-lg shadow-xl p-0 w-[92vw] max-w-[440px] bg-white dark:bg-dark-paper backdrop:bg-black/50"
    >
      {copy && (
        <div className="px-5 py-4 text-left">
          <h3 className="font-semibold text-lg text-gray-800 break-keep dark:text-gray-100">{copy.title}</h3>
          <p className="mt-2 text-sm text-gray-600 break-keep dark:text-gray-400">{copy.description}</p>

          <div className="flex justify-end gap-2 mt-4">
            {prompt === "migrate" && (
              <>
                <button type="button" disabled={isBusy} onClick={() => onMigrate(false)} className={SECONDARY}>
                  이관하지 않기
                </button>
                <button type="button" disabled={isBusy} onClick={() => onMigrate(true)} className={PRIMARY}>
                  이관하기
                </button>
              </>
            )}
            {prompt === "conflict" && (
              <>
                <button type="button" disabled={isBusy} onClick={onKeepLocal} className={SECONDARY}>
                  이 기기 것으로 덮기
                </button>
                <button type="button" disabled={isBusy} onClick={onTakeRemote} className={PRIMARY}>
                  계정 것 받기
                </button>
              </>
            )}
            {prompt === "loadError" && (
              <>
                <button type="button" disabled={isBusy} onClick={onSignOut} className={SECONDARY}>
                  로그아웃
                </button>
                <button type="button" disabled={isBusy} onClick={onRetry} className={PRIMARY}>
                  다시 시도
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
