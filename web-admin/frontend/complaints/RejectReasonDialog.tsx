import React from "react";

type Props = {
  open: boolean;
  loading?: boolean;
  initial?: string;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
};

export default function RejectReasonDialog({ open, loading = false, initial = "", onCancel, onConfirm }: Props) {
  const [value, setValue] = React.useState(initial);

  React.useEffect(() => {
    if (open) setValue(initial ?? "");
  }, [open, initial]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 bg-black/35"
        onClick={onCancel}
      />

      <div className="relative w-full max-w-lg rounded-xl border border-gray-100 bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">Lý do từ chối khiếu nại</h3>
        <p className="mt-2 text-sm leading-6 text-gray-600">Vui lòng nhập lý do từ chối để ghi vào hồ sơ.</p>

        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={6}
          className="mt-4 w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
        />

        <div className="mt-4 flex justify-end gap-3">
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
            onClick={() => onConfirm(value.trim())}
            disabled={loading || value.trim().length === 0}
            className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            Xác nhận từ chối
          </button>
        </div>
      </div>
    </div>
  );
}
