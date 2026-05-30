import React from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { UserViewModel } from "./UserTable";

export type UserDrawerMode = "create" | "edit" | "detail";

export type UserFormValues = {
  name: string;
  email: string;
  password: string;
  phone: string;
  roleId: string;
  address: string;
  imageUrl: string;
  status: "active" | "inactive" | "banned";
};

type RoleOption = {
  roleId: string;
  roleName: string;
};

type UserDrawerProps = {
  isOpen: boolean;
  mode: UserDrawerMode | null;
  saving: boolean;
  form: UserFormValues;
  showPassword: boolean;
  roleOptions: RoleOption[];
  selectedUser: UserViewModel | null;
  error: string | null;
  uploadingAvatar: boolean;
  onTogglePassword: () => void;
  onChange: (patch: Partial<UserFormValues>) => void;
  onUploadAvatar: (file: File) => Promise<void>;
  onClose: () => void;
  onSubmit: () => void;
  onSwitchToEdit: () => void;
  onDisableFromDetail: () => void;
  onDeleteFromDetail: () => void;
};

const statusLabel: Record<UserFormValues["status"], string> = {
  active: "Active",
  inactive: "Inactive",
  banned: "Banned",
};

const UserDrawer = ({
  isOpen,
  mode,
  saving,
  form,
  showPassword,
  roleOptions,
  selectedUser,
  error,
  uploadingAvatar,
  onTogglePassword,
  onChange,
  onUploadAvatar,
  onClose,
  onSubmit,
  onSwitchToEdit,
  onDisableFromDetail,
  onDeleteFromDetail,
}: UserDrawerProps) => {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  if (!mode) {
    return null;
  }

  const title =
    mode === "create"
      ? "Thêm Người Dùng Mới"
      : mode === "edit"
        ? "Cập Nhật Người Dùng"
        : "Chi Tiết Người Dùng";

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
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
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

            {mode === "detail" ? (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  {selectedUser?.image_url ? (
                    <img src={selectedUser.image_url} alt={selectedUser.name} className="h-16 w-16 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-xl font-semibold text-emerald-700">
                      {(selectedUser?.name.trim()[0] ?? "U").toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-bold text-gray-900">{selectedUser?.name}</p>
                    <p className="text-sm text-gray-500">{selectedUser?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Số điện thoại</p>
                    <p className="mt-1 text-sm text-gray-800">{selectedUser?.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Vai trò</p>
                    <p className="mt-1 text-sm text-gray-800">{selectedUser?.role_name || "Mặc định"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Trạng thái</p>
                    <p className="mt-1 text-sm text-gray-800">{selectedUser ? statusLabel[selectedUser.status] : "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ngày tham gia</p>
                    <p className="mt-1 text-sm text-gray-800">
                      {selectedUser?.created_at
                        ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(selectedUser.created_at))
                        : "-"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Địa chỉ</p>
                  <p className="mt-1 text-sm text-gray-800">{selectedUser?.address || "-"}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ảnh đại diện</p>
                  <p className="mt-1 break-all text-sm text-gray-800">{selectedUser?.image_url || "-"}</p>
                </div>
              </div>
            ) : (
              <form
                className="space-y-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  onSubmit();
                }}
              >
                <div className="mb-4 flex flex-col items-center">
                  <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-gray-300">
                    {form.imageUrl ? (
                      <img src={form.imageUrl} alt="avatar" className="h-20 w-20 rounded-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-400">Avatar</span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-[#1da453]">Tải ảnh đại diện lên (URL)</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) {
                        return;
                      }

                      void onUploadAvatar(file);
                      event.currentTarget.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 rounded-md border border-[#1da453] px-3 py-1.5 text-xs font-semibold text-[#1da453] hover:bg-emerald-50 disabled:opacity-60"
                    disabled={uploadingAvatar || saving}
                  >
                    {uploadingAvatar ? "Đang upload..." : "Chọn ảnh từ máy"}
                  </button>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-800">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={(event) => onChange({ name: event.target.value })}
                    type="text"
                    placeholder="Vd: Nguyễn Văn A"
                    className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-800">
                    Email đăng nhập <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.email}
                    onChange={(event) => onChange({ email: event.target.value })}
                    type="email"
                    placeholder="email@greenplus.vn"
                    className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                  />
                </div>

                {mode === "create" ? (
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-gray-800">
                      Mật khẩu khởi tạo <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        value={form.password}
                        onChange={(event) => onChange({ password: event.target.value })}
                        type={showPassword ? "text" : "password"}
                        placeholder="Tối thiểu 6 ký tự"
                        className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                      />
                      <button
                        type="button"
                        onClick={onTogglePassword}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Mật khẩu này sẽ được gửi đến email của người dùng.</p>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-gray-800">Số điện thoại</label>
                    <input
                      value={form.phone}
                      onChange={(event) => onChange({ phone: event.target.value })}
                      type="text"
                      placeholder="09xx..."
                      className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-gray-800">Phân quyền (Role)</label>
                    <select
                      value={form.roleId}
                      onChange={(event) => onChange({ roleId: event.target.value })}
                      className="w-full appearance-none rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                    >
                      <option value="">Mặc định hệ thống</option>
                      {roleOptions.map((role) => (
                        <option key={role.roleId} value={role.roleId}>
                          {role.roleName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-gray-800">Trạng thái</label>
                    <select
                      value={form.status}
                      onChange={(event) =>
                        onChange({ status: event.target.value as UserFormValues["status"] })
                      }
                      className="w-full appearance-none rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="banned">Banned</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-gray-800">Ảnh đại diện (URL)</label>
                    <input
                      value={form.imageUrl}
                      onChange={(event) => onChange({ imageUrl: event.target.value })}
                      type="text"
                      placeholder="https://..."
                      className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-gray-800">Địa chỉ</label>
                  <textarea
                    value={form.address}
                    onChange={(event) => onChange({ address: event.target.value })}
                    placeholder="Số nhà, đường, phường/xã..."
                    rows={3}
                    className="w-full resize-none rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                  />
                </div>
              </form>
            )}
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

            {mode === "detail" ? (
              <>
                <button
                  type="button"
                  onClick={onDisableFromDetail}
                  className="rounded-md bg-amber-500 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
                  disabled={saving}
                >
                  Khóa tài khoản
                </button>
                <button
                  type="button"
                  onClick={onSwitchToEdit}
                  className="rounded-md bg-[#1da453] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#168a44] disabled:opacity-60"
                  disabled={saving}
                >
                  Chỉnh sửa
                </button>
                <button
                  type="button"
                  onClick={onDeleteFromDetail}
                  className="rounded-md bg-rose-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
                  disabled={saving}
                >
                  Xóa
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                className="rounded-md bg-[#1da453] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#168a44] focus:outline-none focus:ring-2 focus:ring-[#1da453] focus:ring-offset-2 disabled:opacity-60"
                disabled={saving}
              >
                {mode === "create" ? "Lưu tài khoản" : "Lưu thay đổi"}
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default UserDrawer;