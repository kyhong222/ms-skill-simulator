import { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ColorModeButton from "./ColorModeButton";
import { useDismiss } from "./useDismiss";
import AuthButton from "../Cloud/AuthButton";
import FeedbackDialog from "../Feedback/FeedbackDialog";
import type { IHeaderAction } from "../../types/header";

interface HeaderProps {
  jobName?: string; // 직업 칩에 표시할 이름 (직업 선택 화면에서는 없음)
  actions?: IHeaderAction[]; // 페이지별 버튼. 문의하기는 헤더가 항상 앞에 붙인다
}

const ACTION_BASE =
  "whitespace-nowrap text-sm font-medium rounded disabled:opacity-40 disabled:cursor-not-allowed";

function actionColor({ variant, active }: IHeaderAction) {
  if (active) return "bg-green-200 text-green-900 hover:bg-green-300 dark:bg-green-800 dark:text-green-100 dark:hover:bg-green-700";
  if (variant === "highlight") return "bg-primary text-white hover:opacity-90 dark:bg-primary-dark dark:text-gray-900";
  if (variant === "danger") return "bg-transparent text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950";
  return "bg-transparent text-primary hover:bg-blue-50 dark:text-primary-dark dark:hover:bg-gray-700";
}

export default function Header({ jobName, actions = [] }: HeaderProps) {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useDismiss(menuRef, isMenuOpen, useCallback(() => setIsMenuOpen(false), []));

  const allActions: IHeaderAction[] = [
    { label: "문의하기", onClick: () => setIsFeedbackOpen(true) },
    ...actions,
  ];
  // 버튼이 문의하기뿐이면 접을 필요가 없다
  const hasMenu = actions.length > 0;

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 h-14 border-b border-gray-200 bg-white dark:bg-dark-paper">
        <div className="flex items-center gap-2 h-full px-3 md:px-4">
          <Link
            to="/"
            className="min-w-0 truncate text-sm font-extrabold text-gray-900 hover:text-gray-900 sm:text-lg dark:text-gray-100 dark:hover:text-gray-100"
          >
            <span className="sm:hidden">스킬 시뮬레이터</span>
            <span className="hidden sm:inline">메이플랜드 스킬 시뮬레이터</span>
          </Link>
          {jobName && (
            <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-white dark:bg-primary-dark dark:text-gray-900">
              {jobName}
            </span>
          )}

          <div className="flex-grow" />

          <ColorModeButton />

          {/* 넓은 화면: 버튼 줄 */}
          <nav className={`items-center gap-1 ${hasMenu ? "hidden xl:flex" : "flex"}`}>
            {allActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                disabled={action.disabled}
                className={`${ACTION_BASE} px-2 py-1.5 ${actionColor(action)}`}
              >
                {action.label}
              </button>
            ))}
          </nav>

          {/* 좁은 화면: 메뉴로 접기 */}
          {hasMenu && (
            <div ref={menuRef} className="relative flex-shrink-0 xl:hidden">
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                aria-expanded={isMenuOpen}
                aria-haspopup="true"
                className={`${ACTION_BASE} px-3 py-1.5 border-gray-300 bg-transparent text-primary dark:border-gray-600 dark:text-primary-dark`}
              >
                메뉴
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 flex w-44 flex-col gap-0.5 p-1 rounded-lg border border-gray-200 bg-white shadow-lg dark:bg-dark-raised">
                  {allActions.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      disabled={action.disabled}
                      onClick={() => {
                        setIsMenuOpen(false);
                        action.onClick();
                      }}
                      className={`${ACTION_BASE} w-full px-3 py-2 text-left ${actionColor(action)}`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <AuthButton />
        </div>
      </header>

      {/* fixed 헤더 높이만큼 본문을 밀어내는 스페이서 */}
      <div className="h-14 flex-shrink-0" aria-hidden="true" />

      <FeedbackDialog isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </>
  );
}
