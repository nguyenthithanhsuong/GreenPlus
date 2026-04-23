import React from "react";

type ConfirmActionDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant?: "danger" | "warning";
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const ConfirmActionDialog = ({
  open,
  title,
  message,
  confirmLabel,
  confirmVariant = "danger",
  loading = false,
  onCancel,
  onConfirm,
}: ConfirmActionDialogProps) => {
  if (!open) {
    return null;
  }

  const confirmClass =
    confirmVariant === "warning"
      ? "bg-amber-500 hover:bg-amber-600"
      : "bg-rose-600 hover:bg-rose-700";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Đóng xác nhận"
        className="absolute inset-0 bg-black/35"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md rounded-xl border border-gray-100 bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-gray-600">{message}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmActionDialog;