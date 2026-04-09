"use client";

import type React from "react";

type ConfirmationDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmTone?: "danger" | "primary";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.45)",
    backdropFilter: "blur(2px)",
    zIndex: 70,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  panel: {
    width: "100%",
    maxWidth: "360px",
    borderRadius: "20px",
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    boxShadow: "0px 24px 48px rgba(15, 23, 42, 0.18)",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  title: {
    margin: 0,
    color: "#111827",
    fontSize: "16px",
    lineHeight: "24px",
    fontWeight: 700,
  },
  message: {
    margin: 0,
    color: "#4B5563",
    fontSize: "13px",
    lineHeight: "20px",
  },
  actions: {
    marginTop: "2px",
    display: "flex",
    gap: "10px",
  },
  buttonBase: {
    flex: 1,
    height: "42px",
    borderRadius: "12px",
    border: "1px solid #D1D5DB",
    background: "#FFFFFF",
    color: "#374151",
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 700,
    cursor: "pointer",
  },
  confirmPrimary: {
    border: "1px solid #4EA96A",
    background: "#4EA96A",
    color: "#FFFFFF",
    boxShadow: "0px 6px 14px -4px rgba(78, 169, 106, 0.45)",
  },
  confirmDanger: {
    border: "1px solid #DC2626",
    background: "#DC2626",
    color: "#FFFFFF",
    boxShadow: "0px 6px 14px -4px rgba(220, 38, 38, 0.45)",
  },
};

export default function ConfirmationDialog({
  open,
  title,
  message,
  confirmLabel = "Xác nhận",
  cancelLabel = "Đóng",
  confirmTone = "primary",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div style={styles.backdrop} role="dialog" aria-modal="true" aria-label={title}>
      <div style={styles.panel}>
        <h3 style={styles.title}>{title}</h3>
        <p style={styles.message}>{message}</p>

        <div style={styles.actions}>
          <button type="button" style={styles.buttonBase} onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            style={{
              ...styles.buttonBase,
              ...(confirmTone === "danger" ? styles.confirmDanger : styles.confirmPrimary),
            }}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Đang xử lý..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}