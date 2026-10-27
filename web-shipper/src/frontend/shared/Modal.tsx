"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X, type LucideIcon } from "lucide-react";

export default function Modal({
  title,
  description,
  icon: Icon,
  onClose,
  children,
  footer,
  wide = false,
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onCloseRef.current(); };
    document.addEventListener("keydown", onKey);
    closeButton.current?.focus();
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, []);
  return (
    <div className="gp-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-label={title} className={`gp-modal ${wide ? "gp-modal-wide" : ""}`}>
        <header className="gp-modal-header">
          <div className="gp-modal-heading"><span className="gp-heading-icon"><Icon size={21} /></span>
            <div><h2>{title}</h2>{description && <p>{description}</p>}</div>
          </div>
          <button ref={closeButton} type="button" className="gp-icon-button" onClick={onClose} aria-label="Đóng cửa sổ"><X size={19} /></button>
        </header>
        <div className="gp-modal-body">{children}</div>
        {footer && <footer className="gp-modal-footer">{footer}</footer>}
      </section>
    </div>
  );
}
