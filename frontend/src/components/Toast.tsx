import { CheckCircle2, X } from "lucide-react";
import { useEffect, type CSSProperties } from "react";

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, onClose, duration = 5_000 }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [duration, message, onClose]);

  return (
    <div
      className="toast"
      role="status"
      style={{ "--toast-duration": `${duration}ms` } as CSSProperties}
    >
      <CheckCircle2 size={20} />
      <span>{message}</span>
      <button type="button" aria-label="Закрыть уведомление" onClick={onClose}>
        <X size={17} />
      </button>
    </div>
  );
}
