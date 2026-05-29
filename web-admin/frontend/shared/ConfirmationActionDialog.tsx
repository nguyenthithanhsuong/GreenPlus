"use client";

import type React from "react";
import { compose, withErrorBoundary } from "@/lib";

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

const toneClassName: Record<NonNullable<ConfirmationDialogProps["confirmTone"]>, string> = {
  danger: "border-red-600 bg-red-600 text-white hover:bg-red-700",
  primary: "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700",
  warning: "border-amber-600 bg-amber-600 text-white hover:bg-amber-700",
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
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/45 p-6 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl">
        <h3 className="m-0 text-base font-bold leading-6 text-gray-900">
          {title}
        </h3>
        <p className="m-0 text-sm leading-5 text-gray-600">{message}</p>

        <div className="mt-1 flex gap-3">
          <button
            type="button"
            className="h-11 flex-1 rounded-xl border border-gray-300 bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`h-11 flex-1 rounded-xl border text-sm font-bold shadow-sm disabled:opacity-60 ${toneClassName[confirmTone]}`}
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

export default compose(withErrorBoundary)(BaseConfirmationActionDialog);
