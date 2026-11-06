import html2canvas from "html2canvas";

// 요소를 PNG용 캔버스로 캡처한다.
// 공유용 이미지가 화면 모드에 따라 달라지지 않도록 복제 문서에서 다크 클래스를 뺀다 (항상 라이트)
export async function captureElement(target: HTMLElement): Promise<HTMLCanvasElement> {
  await document.fonts.ready;
  await new Promise((resolve) => requestAnimationFrame(resolve));

  return html2canvas(target, {
    backgroundColor: "white",
    scale: 2,
    useCORS: true,
    ignoreElements: (element) => element.classList.contains("exclude-from-capture"),
    onclone: (clonedDocument) => clonedDocument.documentElement.classList.remove("dark"),
  });
}
