import { useEffect, useState } from "react";
import {
  COLOR_MODE_LABEL,
  COLOR_MODE_STORAGE_KEY,
  NEXT_COLOR_MODE,
  type ColorMode,
} from "../../constants/colorMode";

// Material Symbols 경로 (light_mode / dark_mode / brightness_auto)
const ICON: Record<ColorMode, string> = {
  light:
    "M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 0 0 0-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z",
  dark: "M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z",
  system:
    "M10.85 12.65h2.3L12 9l-1.15 3.65zM20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zM14.3 16l-.7-2h-3.2l-.7 2H7.8L11 7h2l3.2 9h-1.9z",
};

function readStoredMode(): ColorMode {
  try {
    const stored = localStorage.getItem(COLOR_MODE_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // 저장소 접근이 막힌 환경은 시스템 설정을 따른다
  }
  return "system";
}

function saveMode(mode: ColorMode) {
  try {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
  } catch {
    // 저장에 실패해도 이번 방문 동안은 화면 모드가 유지된다
  }
}

export default function ColorModeButton() {
  const [mode, setMode] = useState<ColorMode>(readStoredMode);

  // 시스템 모드에서는 OS 설정이 바뀌면 바로 따라간다
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const isDark = mode === "dark" || (mode === "system" && media.matches);
      document.documentElement.classList.toggle("dark", isDark);
    };

    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [mode]);

  const handleClick = () => {
    const next = NEXT_COLOR_MODE[mode];
    setMode(next);
    saveMode(next);
  };

  const label = `${COLOR_MODE_LABEL[mode]} (눌러서 ${COLOR_MODE_LABEL[NEXT_COLOR_MODE[mode]]}로)`;

  return (
    <button
      type="button"
      onClick={handleClick}
      title={label}
      aria-label={label}
      className="flex items-center justify-center flex-shrink-0 w-8 h-8 p-0 rounded bg-transparent text-gray-700 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700"
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
        <path d={ICON[mode]} />
      </svg>
    </button>
  );
}
