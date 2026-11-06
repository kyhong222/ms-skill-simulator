module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // 모든 소스 폴더를 포함해야 함
  ],
  theme: {
    extend: {
      colors: {
        // mapleland.st 세팅 시뮬레이터와 같은 색
        primary: { DEFAULT: "#3b6fd6", dark: "#6c9bf0" },
        dark: { page: "#121417", paper: "#1b1e23", raised: "#262a31" },
      },
    },
  },
  plugins: [],
  darkMode: "class", // <html>의 dark 클래스로 전환 (ColorModeButton, index.html 초기화 스크립트)
}
