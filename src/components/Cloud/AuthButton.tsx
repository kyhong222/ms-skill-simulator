import { useCallback, useEffect, useRef, useState } from "react";
import { useCloud } from "./cloudContext";
import MyFeedbackDialog from "./MyFeedbackDialog";
import AdminFeedbackDialog from "./AdminFeedbackDialog";
import { useDismiss } from "../Header/useDismiss";
import { fetchFeedbackSeenAt, latestReplyAt } from "../../data/cloud/feedback";
import type { SyncStatus } from "../../types/cloud";

const SYNC_LABEL: Partial<Record<SyncStatus, string>> = {
  syncing: "계정에 저장 중…",
  saved: "계정에 저장됨",
  offline: "오프라인 — 연결되면 자동 저장",
  conflict: "다른 기기와 충돌 — 선택이 필요합니다",
  error: "동기화 오류",
};

const MENU_ITEM =
  "flex items-center gap-2 w-full px-3 py-2 text-sm text-left bg-transparent rounded text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700";

function isAfter(a: string, b: string | null) {
  return b === null || new Date(a).getTime() > new Date(b).getTime();
}

export default function AuthButton() {
  const { status, user, syncStatus, isAdmin, signIn, signOut } = useCloud();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMyFeedbackOpen, setIsMyFeedbackOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const closeAdmin = useCallback(() => setIsAdminOpen(false), []);
  const [lastReplyAt, setLastReplyAt] = useState<string | null>(null);
  const [seenAt, setSeenAt] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const userId = user?.id;

  useDismiss(menuRef, isMenuOpen, useCallback(() => setIsMenuOpen(false), []));

  // 로그인했을 때와 탭으로 돌아왔을 때 새 답변을 확인한다 (실시간 구독은 두지 않음)
  useEffect(() => {
    if (!userId) return;
    let isAlive = true;
    const check = () => {
      void Promise.all([latestReplyAt(userId), fetchFeedbackSeenAt(userId)]).then(([latest, seen]) => {
        if (!isAlive) return;
        setLastReplyAt(latest);
        setSeenAt(seen);
      });
    };
    check();
    window.addEventListener("focus", check);
    return () => {
      isAlive = false;
      window.removeEventListener("focus", check);
    };
  }, [userId]);

  if (status === "disabled") return null;

  if (status !== "signedIn" || !user) {
    return (
      // 아이템 시뮬레이터의 MUI outlined small 버튼과 같은 모양 (primary 50% 테두리, 13px, 라운드 10px)
      <button
        type="button"
        disabled={status === "loading"}
        onClick={() => void signIn()}
        className="flex-shrink-0 whitespace-nowrap px-[9px] py-[3px] text-[13px] leading-[1.75] font-medium rounded-[10px] border border-primary/50 bg-transparent text-primary hover:border-primary hover:bg-primary/5 disabled:opacity-40 dark:border-primary-dark/50 dark:bg-transparent dark:text-primary-dark dark:hover:border-primary-dark dark:hover:bg-primary-dark/10"
      >
        {status === "loading" ? "확인 중…" : "디스코드 로그인"}
      </button>
    );
  }

  const hasNewReply = lastReplyAt !== null && isAfter(lastReplyAt, seenAt);
  const syncLabel = SYNC_LABEL[syncStatus];

  return (
    <>
      <div ref={menuRef} className="relative flex-shrink-0">
        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-expanded={isMenuOpen}
          aria-haspopup="true"
          aria-label="계정 메뉴"
          className="relative flex items-center gap-1.5 px-2 py-1 text-[13px] font-medium rounded-[10px] border-0 bg-transparent text-primary hover:bg-primary/5 dark:bg-transparent dark:text-primary-dark dark:hover:bg-primary-dark/10"
        >
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
          ) : (
            <span className="flex items-center justify-center w-6 h-6 text-xs rounded-full bg-gray-300 dark:bg-gray-600">
              {user.name.slice(0, 1)}
            </span>
          )}
          <span className="hidden max-w-[120px] truncate sm:inline">{user.name}</span>
          {hasNewReply && <span className="absolute top-0.5 left-7 w-2 h-2 rounded-full bg-red-500" aria-label="새 답변" />}
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 p-1 text-left rounded-lg border border-gray-200 bg-white shadow-lg dark:bg-dark-raised">
            <div className="px-3 py-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">디스코드로 로그인됨</p>
              <p className="text-sm font-bold truncate text-gray-800 dark:text-gray-100">{user.name}</p>
              {syncLabel && (
                <p
                  className={`mt-1 text-xs ${
                    syncStatus === "error" || syncStatus === "conflict" ? "text-red-500" : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {syncLabel}
                </p>
              )}
            </div>
            <hr className="my-1" />
            <button
              type="button"
              className={MENU_ITEM}
              onClick={() => {
                setIsMenuOpen(false);
                setIsMyFeedbackOpen(true);
              }}
            >
              내 문의
              {hasNewReply && <span className="w-2 h-2 rounded-full bg-red-500" />}
            </button>
            {/* 운영자에게만 보인다. 감추는 것일 뿐이고 실제 권한은 RLS가 건다 */}
            {isAdmin && (
              <button
                type="button"
                className={MENU_ITEM}
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsAdminOpen(true);
                }}
              >
                문의 관리
              </button>
            )}
            <hr className="my-1" />
            <button
              type="button"
              className={MENU_ITEM}
              onClick={() => {
                setIsMenuOpen(false);
                void signOut();
              }}
            >
              로그아웃
            </button>
          </div>
        )}
      </div>

      <MyFeedbackDialog
        isOpen={isMyFeedbackOpen}
        onClose={() => setIsMyFeedbackOpen(false)}
        onSeen={setSeenAt}
      />
      {isAdmin && <AdminFeedbackDialog isOpen={isAdminOpen} onClose={closeAdmin} />}
    </>
  );
}
