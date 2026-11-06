// 헤더 버튼 1개. 넓은 화면의 버튼 줄과 좁은 화면의 메뉴가 같은 목록을 렌더링한다
export interface IHeaderAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "highlight" | "danger";
  active?: boolean; // 켜진 토글 표시 (4차 이후만)
  disabled?: boolean;
}
