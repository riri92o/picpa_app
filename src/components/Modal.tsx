import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
export function Modal({
  open,
  onClose,
  children,
  title,
  headerAction,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  headerAction?: ReactNode;
  className?: string;
}) {
  const sheet = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const frame = requestAnimationFrame(() => {
      sheet.current
        ?.querySelector<HTMLButtonElement>("button:not(:disabled)")
        ?.focus();
    });
    return () => {
      cancelAnimationFrame(frame);
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus({ preventScroll: true });
    };
  }, [open]);
  const target = document.getElementById("modal-root");
  if (!target) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onKeyDown={(event) => {
            const top = [...document.querySelectorAll(".modal-backdrop")].at(
              -1,
            );
            if (top !== event.currentTarget) return;
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              onClose();
            }
            if (event.key === "Tab") {
              const items = [
                ...(sheet.current?.querySelectorAll<HTMLElement>(
                  'button:not(:disabled), input:not(:disabled):not([type="hidden"]), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]',
                ) ?? []),
              ].filter((element) => element.getClientRects().length > 0);
              const first = items[0],
                last = items.at(-1);
              if (!first) {
                event.preventDefault();
                return;
              }
              if (
                event.shiftKey &&
                (document.activeElement === first ||
                  !sheet.current?.contains(document.activeElement))
              ) {
                event.preventDefault();
                last?.focus();
              } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
              }
            }
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.section
            ref={sheet}
            className={`modal-sheet ${className}`}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="modal-handle" />
            <div className="modal-heading">
              <h2>{title}</h2>
              <div className="modal-heading-actions">
                {headerAction}
                <button
                  className="icon-button small"
                  onClick={onClose}
                  aria-label="閉じる"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            {children}
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>,
    target,
  );
}
