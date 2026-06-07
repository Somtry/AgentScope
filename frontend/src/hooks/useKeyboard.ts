import { useEffect, useCallback } from "react";

// 键盘快捷键 Hook
export function useKeyboard(handlers: Record<string, () => void>) {
  const stableHandlers = useCallback(() => handlers, [handlers])();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // 忽略输入框内的按键
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const key = e.key;
      if (stableHandlers[key]) {
        e.preventDefault();
        stableHandlers[key]();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stableHandlers]);
}
