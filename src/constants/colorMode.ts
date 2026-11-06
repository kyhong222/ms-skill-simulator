export type ColorMode = "system" | "light" | "dark";

// index.html의 초기화 스크립트와 같은 키를 써야 한다
export const COLOR_MODE_STORAGE_KEY = "skillSimulator_colorMode";

// 시스템 → 라이트 → 다크 순으로 순환
export const NEXT_COLOR_MODE: Record<ColorMode, ColorMode> = {
  system: "light",
  light: "dark",
  dark: "system",
};

export const COLOR_MODE_LABEL: Record<ColorMode, string> = {
  system: "시스템 설정",
  light: "라이트 모드",
  dark: "다크 모드",
};
