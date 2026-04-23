"use client";

import React from "react";
import { X } from "lucide-react";
import type { RoleSummary } from "../../backend/modules/roles/role-management.types";

export type RoleFormValues = {
  roleName: string;
  description: string;
};

type RoleDrawerProps = {
  isOpen: boolean;
  saving: boolean;
  error: string | null;
  form: RoleFormValues;
  selectedRole: RoleSummary | null;
  onClose: () => void;
  onSubmit: () => void;
  onChange: (patch: Partial<RoleFormValues>) => void;
};

const RoleDrawer = ({
  isOpen,
  saving,
  error,
  form,
  selectedRole,
  onClose,
  onSubmit,
  onChange,
}: RoleDrawerProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? "" : "pointer-events-none"}`}>
      <button
        type="button"
        className={`absolute inset-0 bg-black/35 transition-opacity ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
        aria-label="Đóng"
      />

      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col font-sans">
          <div className="flex items-center justify-between border-b border-gray-100 p-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedRole ? "Chỉnh sửa Role" : "Thêm Role mới"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-gray-50 p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {error ? (
              <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
              }}
            >
              <div>
                <label className="mb-1.5 block text-sm font-bold text-gray-800">
                  Role name <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.roleName}
                  onChange={(event) => onChange({ roleName: event.target.value })}
                  type="text"
                  placeholder="Ví dụ: reviewer"
                  className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-gray-800">Description</label>
                <textarea
                  value={form.description}
                  onChange={(event) => onChange({ description: event.target.value })}
                  placeholder="Mô tả ngắn về role"
                  rows={5}
                  className="w-full resize-none rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                />
              </div>
            </form>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 bg-white p-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-6 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
              disabled={saving}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="rounded-md bg-[#1da453] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#168a44] disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Đang lưu..." : selectedRole ? "Cập nhật" : "Tạo Role"}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default RoleDrawer;
