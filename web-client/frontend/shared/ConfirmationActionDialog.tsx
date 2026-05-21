"use client";

import { useMemo } from "react";
import type React from "react";
import { ModalBuilder } from "@/lib/builder";
import { compose, withErrorBoundary } from "@/lib/decorators";

type ConfirmationDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmTone?: "danger" | "primary" | "warning";
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
  confirmWarning: {
    border: "1px solid #D97706",
    background: "#D97706",
    color: "#FFFFFF",
    boxShadow: "0px 6px 14px -4px rgba(217, 119, 6, 0.45)",
  },
};

function BaseConfirmationActionDialog({
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
  const modalConfig = useMemo(
    () =>
      new ModalBuilder()
        .setTitle(title)
        .setContent(message)
        .setSize("small")
        .setCloseOnBackdropClick(true)
        .setShowCloseButton(false)
        .addButton(cancelLabel, "secondary", onCancel)
        .addButton(
          confirmLabel,
          confirmTone === "danger" ? "danger" : "primary",
          onConfirm,
        )
        .build(),
    [title, message, cancelLabel, confirmLabel, confirmTone, onConfirm, onCancel],
  );

  const cancelButton = modalConfig.buttons[0];
  const confirmButton = modalConfig.buttons[1];

  if (!open) {
    return null;
  }

  return (
    <div
      style={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label={modalConfig.title}
    >
      <div style={styles.panel}>
        <h3 style={styles.title}>{modalConfig.title}</h3>
        <p style={styles.message}>{String(modalConfig.children)}</p>

        <div style={styles.actions}>
          <button
            type="button"
            style={styles.buttonBase}
            onClick={cancelButton?.onClick ?? onCancel}
            disabled={busy}
          >
            {cancelButton?.label ?? cancelLabel}
          </button>
          <button
            type="button"
            style={{
              ...styles.buttonBase,
              ...(confirmTone === "danger"
                ? styles.confirmDanger
                : confirmTone === "warning"
                  ? styles.confirmWarning
                  : styles.confirmPrimary),
            }}
            onClick={confirmButton?.onClick ?? onConfirm}
            disabled={busy}
          >
            {busy ? "Đang xử lý..." : (confirmButton?.label ?? confirmLabel)}
          </button>
        </div>
      </div>
    </div>
  );
}

export default compose(withErrorBoundary)(BaseConfirmationActionDialog);
