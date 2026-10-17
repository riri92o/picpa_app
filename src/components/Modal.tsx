import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { ReactNode } from "react";
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
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.section
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
