import { useState, useCallback } from "react";

// 简易 toast hook
export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const [type, setType] = useState<"info" | "error">("info");

  const showToast = useCallback((msg: string, t: "info" | "error" = "info") => {
    setMessage(msg);
    setType(t);
    setTimeout(() => setMessage(null), 3000);
  }, []);

  return { message, type, showToast };
}
