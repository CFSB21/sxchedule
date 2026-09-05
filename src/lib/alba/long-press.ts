import { useRef, type MouseEvent, type PointerEvent } from "react";

export function useLongPress(onLong: () => void, ms = 480) {
  const timer = useRef<number | null>(null);
  const armed = useRef(false);
  const start = useRef({ x: 0, y: 0 });

  function clear() {
    if (timer.current != null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }

  return {
    onPointerDown: (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      armed.current = false;
      start.current = { x: e.clientX, y: e.clientY };
      clear();
      timer.current = window.setTimeout(() => {
        armed.current = true;
        timer.current = null;
        onLong();
      }, ms);
    },
    onPointerMove: (e: PointerEvent) => {
      const dx = e.clientX - start.current.x;
      const dy = e.clientY - start.current.y;
      if (dx * dx + dy * dy > 64) clear();
    },
    onPointerUp: clear,
    onPointerCancel: clear,
    onContextMenu: (e: MouseEvent) => {
      e.preventDefault();
      clear();
      armed.current = true;
      onLong();
    },
    onClickCapture: (e: MouseEvent) => {
      if (!armed.current) return;
      e.preventDefault();
      e.stopPropagation();
      armed.current = false;
    },
  };
}
