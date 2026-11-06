import { useEffect, type RefObject } from "react";

// 드롭다운을 바깥 클릭이나 ESC로 닫는다
export function useDismiss(ref: RefObject<HTMLElement | null>, isOpen: boolean, onDismiss: () => void) {
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onDismiss();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [ref, isOpen, onDismiss]);
}
