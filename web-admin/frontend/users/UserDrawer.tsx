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
  storeId: string;
  address: string;
  imageUrl: string;
  status: "active" | "inactive" | "banned";
};

type RoleOption = {
  roleId: string;
  roleName: string;
};

type StoreOption = {
  storeId: string;
  storeName: string;
};

type UserDrawerProps = {
  isOpen: boolean;
  mode: UserDrawerMode | null;
  saving: boolean;
  form: UserFormValues;
  showPassword: boolean;
  roleOptions: RoleOption[];
  storeOptions: StoreOption[];
  selectedUser: UserViewModel | null;
  error: string | null;
  uploadingAvatar: boolean;
  verifyingAddress: boolean;
  verifiedAddress: {query:string;address:string;latitude:number;longitude:number}|null;
  addressMatches: Array<{address:string;latitude:number;longitude:number;source?:string}>;
  addressError: string|null;
  onSelectAddress: (location:{address:string;latitude:number;longitude:number;source?:string}) => void;
  onVerifyAddress: () => void;
  canManageSelected: boolean;
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
  storeOptions,
  selectedUser,
  error,
  uploadingAvatar,
  verifyingAddress,
  verifiedAddress,
  addressMatches,
  addressError,
  onSelectAddress,
  onVerifyAddress,
  canManageSelected,
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
    <div
      className={`fixed inset-0 z-50 ${isOpen ? "" : "pointer-events-none"}`}
    >
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
                    <img
                      src={selectedUser.image_url}
                      alt={selectedUser.name}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-xl font-semibold text-emerald-700">
                      {(selectedUser?.name.trim()[0] ?? "U").toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedUser?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedUser?.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Số điện thoại
                    </p>
                    <p className="mt-1 text-sm text-gray-800">
                      {selectedUser?.phone || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Vai trò
                    </p>
                    <p className="mt-1 text-sm text-gray-800">
                      {selectedUser?.role_name || "Mặc định"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Cửa hàng
                    </p>
                    <p className="mt-1 text-sm text-gray-800">
                      {(selectedUser?.store_ids?.length ? selectedUser.store_ids : selectedUser?.store_id ? [selectedUser.store_id] : [])
                        .map((storeId) => storeOptions.find((store) => store.storeId === storeId)?.storeName ?? storeId)
                        .join(", ") || "Chưa có liên kết cửa hàng"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Trạng thái
                    </p>
                    <p className="mt-1 text-sm text-gray-800">
                      {selectedUser ? statusLabel[selectedUser.status] : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Ngày tham gia
                    </p>
                    <p className="mt-1 text-sm text-gray-800">
                      {selectedUser?.created_at
                        ? new Intl.DateTimeFormat("vi-VN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(selectedUser.created_at))
                        : "-"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Địa chỉ
                  </p>
                  <p className="mt-1 text-sm text-gray-800">
                    {selectedUser?.address || "-"}
                  </p>
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
                      <img
                        src={form.imageUrl}
                        alt="avatar"
                        className="h-20 w-20 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">Avatar</span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-[#1da453]">
                    Tải ảnh đại diện lên (URL)
                  </span>
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
                    onChange={(event) =>
                      onChange({ email: event.target.value })
                    }
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
                        onChange={(event) =>
                          onChange({ password: event.target.value })
                        }
                        type={showPassword ? "text" : "password"}
                        placeholder="Tối thiểu 6 ký tự"
                        className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                      />
                      <button
                        type="button"
                        onClick={onTogglePassword}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Mật khẩu này sẽ được gửi đến email của người dùng.
                    </p>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-gray-800">
                      Số điện thoại
                    </label>
                    <input
                      value={form.phone}
                      onChange={(event) =>
                        onChange({ phone: event.target.value })
                      }
                      type="text"
                      placeholder="09xx..."
                      className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-gray-800">
                      Phân quyền (Role)
                    </label>
                    <select
                      value={form.roleId}
                      onChange={(event) =>
                        onChange({ roleId: event.target.value })
                      }
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
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-gray-800">
                      Cửa hàng
                    </label>
                    <select
                      value={form.storeId}
                      onChange={(event) =>
                        onChange({ storeId: event.target.value })
                      }
                      className="w-full appearance-none rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                    >
                      <option value="">Chưa gán cửa hàng</option>
                      {storeOptions.map((store) => (
                        <option key={store.storeId} value={store.storeId}>
                          {store.storeName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-gray-800">
                      Trạng thái
                    </label>
                    <select
                      value={form.status}
                      onChange={(event) =>
                        onChange({
                          status: event.target
                            .value as UserFormValues["status"],
                        })
                      }
                      className="w-full appearance-none rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="banned">Banned</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-gray-800">
                      Ảnh đại diện (URL)
                    </label>
                    <input
                      value={form.imageUrl}
                      onChange={(event) =>
                        onChange({ imageUrl: event.target.value })
                      }
                      type="text"
                      placeholder="https://..."
                      className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[#1da453] focus:outline-none focus:ring-1 focus:ring-[#1da453]"
                    />
                  </div>
                </div>

                <section className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 sm:p-5" aria-label="Xác minh địa chỉ người dùng">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-emerald-950">Địa chỉ & vị trí giao nhận</h3>
                      <p className="mt-1 text-xs leading-5 text-slate-600">Nhập địa chỉ chi tiết, kiểm tra vị trí trên bản đồ và chọn kết quả phù hợp trước khi lưu.</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700">Việt Nam</span>
                  </div>
                  <label htmlFor="admin-user-address" className="mt-4 mb-1.5 block text-sm font-semibold text-gray-800">
                    Số nhà, tên đường, phường/xã, tỉnh/thành phố <span className="text-rose-600">*</span>
                  </label>
                  <textarea id="admin-user-address"
                    value={form.address}
                    onChange={event => onChange({address:event.target.value})}
                    placeholder="Ví dụ: 12 Nguyễn Huệ, phường Sài Gòn, TP. Hồ Chí Minh"
                    rows={3}
                    className="w-full resize-y rounded-xl border border-emerald-200 bg-white p-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                  <button type="button" onClick={onVerifyAddress}
                    disabled={saving || verifyingAddress || !form.address.trim()}
                    className="mt-3 w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
                    {verifyingAddress ? "Đang tìm tọa độ..." : "Tìm & xác minh vị trí"}
                  </button>
                  {addressError && <p role="alert" className="mt-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-700">{addressError}</p>}
                  {addressMatches.length > 0 && (
                    <fieldset className="mt-4 space-y-2">
                      <legend className="mb-2 text-sm font-bold text-slate-800">Chọn điểm phù hợp ({addressMatches.length} kết quả)</legend>
                      {addressMatches.map((match,i) => {
                        const selected = verifiedAddress?.latitude === match.latitude && verifiedAddress?.longitude === match.longitude;
                        return <label key={`${match.latitude}-${match.longitude}-${i}`}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-xs leading-5 ${selected ? "border-emerald-500 bg-emerald-100/70" : "border-slate-200 bg-white hover:border-emerald-300"}`}>
                          <input type="radio" name="user-address-match" className="mt-1 accent-emerald-700"
                            checked={selected} onChange={() => onSelectAddress(match)} />
                          <span className="flex-1 text-slate-700">{match.address}</span>
                        </label>;
                      })}
                    </fieldset>
                  )}
                  {verifiedAddress && verifiedAddress.query === form.address.trim() && (
                    <div role="status" className="mt-4 overflow-hidden rounded-xl border border-emerald-200 bg-white">
                      <div className="p-3 text-xs text-emerald-900">
                        <p className="font-bold">Ghim đang chọn — kiểm tra trên bản đồ</p>
                        <p className="mt-1 break-words">{verifiedAddress.address}</p>
                        <p className="mt-1 font-mono text-slate-600">{verifiedAddress.latitude.toFixed(6)}, {verifiedAddress.longitude.toFixed(6)}</p>
                      </div>
                      <iframe title="Bản đồ vị trí đã chọn" loading="lazy" referrerPolicy="no-referrer"
                        className="h-52 w-full border-0"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${verifiedAddress.longitude-0.004}%2C${verifiedAddress.latitude-0.003}%2C${verifiedAddress.longitude+0.004}%2C${verifiedAddress.latitude+0.003}&layer=mapnik&marker=${verifiedAddress.latitude}%2C${verifiedAddress.longitude}`} />
                      <a href={`https://www.openstreetmap.org/?mlat=${verifiedAddress.latitude}&mlon=${verifiedAddress.longitude}#map=18/${verifiedAddress.latitude}/${verifiedAddress.longitude}`}
                        target="_blank" rel="noopener noreferrer" className="block border-t border-emerald-100 px-3 py-2 text-xs font-bold text-emerald-700 underline">
                        Mở bản đồ lớn để đối chiếu
                      </a>
                    </div>
                  )}
                  <p className="mt-3 text-xs leading-5 text-slate-500">Địa chỉ nhập sẽ được gửi đến dịch vụ bản đồ ngoài GreenPlus chỉ khi bạn bấm tìm. Kết quả là vị trí ước tính; hãy xác nhận số nhà và vị trí giao nhận trước khi lưu. Dữ liệu © OpenStreetMap contributors.</p>
                </section>
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
                {canManageSelected && <button
                  type="button"
                  onClick={onDisableFromDetail}
                  className="rounded-md bg-amber-500 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
                  disabled={saving}
                >
                  Khóa tài khoản
                </button>}
                {canManageSelected && <button
                  type="button"
                  onClick={onSwitchToEdit}
                  className="rounded-md bg-[#1da453] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#168a44] disabled:opacity-60"
                  disabled={saving}
                >
                  Chỉnh sửa
                </button>}
                {canManageSelected && <button
                  type="button"
                  onClick={onDeleteFromDetail}
                  className="rounded-md bg-rose-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
                  disabled={saving}
                >
                  Xóa
                </button>}
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
