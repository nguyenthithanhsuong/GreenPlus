"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { usePermissions } from "@/lib/usePermissions";
import UserStats from "./UserStats";
import UserTable, { UserViewModel } from "./UserTable";
import UserDrawer, { UserDrawerMode, UserFormValues } from "./UserDrawer";
import ConfirmActionDialog from "./ConfirmActionDialog";
import AdminShell from "../shared/AdminShell";
import { useAuthStore } from "@/lib/stores/authStore";
import { asPortalRole } from "@/lib/portal-access";

type RoleOption = {
  roleId: string;
  roleName: string;
};

type StoreOption = {
  storeId: string;
  storeName: string;
};

const emptyForm: UserFormValues = {
  name: "",
  email: "",
  password: "",
  phone: "",
  roleId: "",
  storeId: "",
  address: "",
  imageUrl: "",
  status: "active",
};

const UserManagement = () => {
  const portalRole = asPortalRole(
    useAuthStore((state) => state.user?.role_name ?? state.session?.role_name),
  );
  const [users, setUsers] = useState<UserViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<UserDrawerMode | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserViewModel | null>(null);
  const [form, setForm] = useState<UserFormValues>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [storeOptions, setStoreOptions] = useState<StoreOption[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [verifyingAddress, setVerifyingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string|null>(null);
  type AddressMatch = {address:string;latitude:number;longitude:number;source?:string};
  const [addressMatches, setAddressMatches] = useState<AddressMatch[]>([]);
  const [verifiedAddress, setVerifiedAddress] = useState<({query:string}&AddressMatch)|null>(null);
  const [confirmState, setConfirmState] = useState<{
    type: "ban" | "unban" | "delete";
    user: UserViewModel;
  } | null>(null);

  const { hasPermission, loading: permLoading } = usePermissions();

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(selectedStoreId ? `/api/users?storeId=${encodeURIComponent(selectedStoreId)}` : "/api/users");
      const data = (await response.json()) as {
        items?: UserViewModel[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể tải danh sách người dùng");
      }

      setUsers(Array.isArray(data.items) ? data.items : []);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể tải danh sách người dùng",
      );
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [selectedStoreId]);

  const loadRoles = useCallback(async () => {
    try {
      const response = await fetch("/api/roles");
      const data = (await response.json()) as {
        items?: Array<{ role_id?: string; role_name?: string }>;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể tải danh sách vai trò");
      }

      const items = Array.isArray(data.items) ? data.items : [];
      setRoleOptions(
        items
          .filter((role) => Boolean(role.role_id) && Boolean(role.role_name))
          .map((role) => ({
            roleId: role.role_id as string,
            roleName: (role.role_name ?? "")
              .trim()
              .toLowerCase()
              .replace(/^[a-z]/, (character) => character.toUpperCase()),
          })),
      );
    } catch {
      setRoleOptions([]);
    }
  }, []);

  const loadStores = useCallback(async () => {
    try {
      const response = await fetch("/api/stores");
      const data = (await response.json()) as {
        items?: Array<{ store_id?: string; name?: string }>;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể tải danh sách cửa hàng");
      }

      const items = Array.isArray(data.items) ? data.items : [];
      setStoreOptions(
        items
          .filter((store) => Boolean(store.store_id) && Boolean(store.name))
          .map((store) => ({
            storeId: store.store_id as string,
            storeName: (store.name ?? "").trim(),
          })),
      );
    } catch {
      setStoreOptions([]);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
    void loadRoles();
    void loadStores();
  }, [loadRoles, loadStores, loadUsers]);

  const withSaving = useCallback(
    async (work: () => Promise<void>) => {
      setSaving(true);
      setError(null);

      try {
        await work();
        await loadUsers();
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Thao tác thất bại";
        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [loadUsers],
  );

  const handleCreateUser = useCallback(
    async (payload: {
      name: string;
      email: string;
      password: string;
      roleId?: string | null;
      storeId?: string | null;
      phone?: string;
      address?: string;
      locationHint?: {latitude:number;longitude:number};
      imageUrl?: string;
      status?: "active" | "inactive" | "banned";
    }) => {
      await withSaving(async () => {
        const response = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "Tạo user thất bại");
        }
      });
    },
    [withSaving],
  );

  const handleUpdateUser = useCallback(
    async (
      userId: string,
      payload: {
        name?: string;
        email?: string;
        roleId?: string | null;
        storeId?: string | null;
        phone?: string;
        address?: string;
        locationHint?: {latitude:number;longitude:number};
        imageUrl?: string;
        status?: "active" | "inactive" | "banned";
      },
    ) => {
      await withSaving(async () => {
        const response = await fetch(
          `/api/users/${encodeURIComponent(userId)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );

        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "Cập nhật user thất bại");
        }
      });
    },
    [withSaving],
  );

  const handleToggleBanStatus = useCallback(
    async (userId: string, newStatus: "active" | "banned") => {
      await withSaving(async () => {
        const response = await fetch(
          `/api/users/${encodeURIComponent(userId)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          },
        );

        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "Cập nhật trạng thái user thất bại");
        }
      });
    },
    [withSaving],
  );

  const handleDeleteUser = useCallback(
    async (userId: string) => {
      await withSaving(async () => {
        const response = await fetch(
          `/api/users/${encodeURIComponent(userId)}`,
          {
            method: "DELETE",
          },
        );

        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "Xóa user thất bại");
        }
      });
    },
    [withSaving],
  );

  const stats = useMemo(() => {
    const activeUsers = users.filter((user) => user.status === "active").length;
    return {
      totalUsers: users.length,
      activeUsers,
      inactiveOrBannedUsers: users.length - activeUsers,
    };
  }, [users]);

  const customerRoleId = useMemo(
    () =>
      roleOptions.find(
        (role) => role.roleName.trim().toLowerCase() === "customer",
      )?.roleId ?? null,
    [roleOptions],
  );

  const openCreateDrawer = useCallback(() => {
    setSelectedUser(null);
    setShowPassword(false);
    setForm(emptyForm);
    setVerifiedAddress(null);
    setAddressMatches([]);
    setAddressError(null);
    setDrawerMode("create");
  }, []);

  const openDetailDrawer = useCallback((user: UserViewModel) => {
    setSelectedUser(user);
    setDrawerMode("detail");
  }, []);

  const openEditDrawer = useCallback((user: UserViewModel) => {
    setSelectedUser(user);
    setShowPassword(false);
    setVerifiedAddress(null);
    setAddressMatches([]);
    setAddressError(null);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      phone: user.phone ?? "",
      roleId: user.role_id ?? "",
      storeId: user.store_id ?? "",
      address: user.address ?? "",
      imageUrl: user.image_url ?? "",
      status: user.status,
    });
    setDrawerMode("edit");
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerMode(null);
    setSelectedUser(null);
    setShowPassword(false);
  }, []);

  const requestToggleBanStatus = useCallback((user: UserViewModel) => {
    const type = user.status === "active" ? "ban" : "unban";
    setConfirmState({ type, user });
  }, []);

  const requestDeleteUser = useCallback((user: UserViewModel) => {
    setConfirmState({ type: "delete", user });
  }, []);

  const closeConfirmDialog = useCallback(() => {
    setConfirmState(null);
  }, []);

  const patchForm = useCallback((patch: Partial<UserFormValues>) => {
    if ("address" in patch) { setVerifiedAddress(null); setAddressMatches([]); setAddressError(null); }
    setForm((previous) => ({ ...previous, ...patch }));
  }, []);

  const verifyFormAddress = useCallback(async () => {
    const query = form.address.trim();
    if (!query) { setAddressError("Vui lòng nhập địa chỉ trước khi xác minh."); return; }
    setVerifyingAddress(true); setError(null); setAddressError(null); setVerifiedAddress(null); setAddressMatches([]);
    try {
      const response = await fetch(`/api/location?q=${encodeURIComponent(query)}`, {cache:"no-store"});
      const data = await response.json() as {items?:Array<{address:string;latitude:number;longitude:number}>;error?:string};
      if (!response.ok || !data.items?.length) throw new Error(data.error || "Địa chỉ chưa xác minh được");
      const location = data.items[0];
      if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) throw new Error("Tọa độ không hợp lệ");
      setAddressMatches(data.items);
      setVerifiedAddress({query, ...location});
    } catch (e) {
      setAddressError(e instanceof Error ? e.message : "Không thể xác minh địa chỉ");
    } finally { setVerifyingAddress(false); }
  }, [form.address]);

  const handleSubmitDrawer = useCallback(async () => {
    if (!drawerMode) {
      return;
    }

    if (!form.name.trim()) {
      setError("Tên người dùng là bắt buộc");
      return;
    }

    if (!form.email.trim()) {
      setError("Email đăng nhập là bắt buộc");
      return;
    }

    const addressChanged = drawerMode === "create" || (drawerMode === "edit" && form.address.trim() !== (selectedUser?.address ?? "").trim());
    if (addressChanged && (!verifiedAddress || verifiedAddress.query !== form.address.trim())) {
      setError("Hãy xác minh địa chỉ và tọa độ trước khi lưu tài khoản.");
      return;
    }

    try {
      if (drawerMode === "create") {
        if (form.password.length < 6) {
          setError("Mật khẩu khởi tạo phải có tối thiểu 6 ký tự");
          return;
        }

        await handleCreateUser({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          roleId: form.roleId || null,
          storeId: form.storeId || null,
          phone: form.phone.trim() || undefined,
          address: form.address.trim(),
          locationHint: verifiedAddress ? {latitude:verifiedAddress.latitude,longitude:verifiedAddress.longitude} : undefined,
          imageUrl: form.imageUrl.trim() || undefined,
          status: form.status,
        });

        closeDrawer();
        return;
      }

      if (drawerMode === "edit" && selectedUser) {
        await handleUpdateUser(selectedUser.user_id, {
          name: form.name.trim(),
          email: form.email.trim(),
          ...(portalRole === "manager"
            ? {}
            : { roleId: form.roleId || null, storeId: form.storeId || null }),
          phone: form.phone.trim() || undefined,
          ...(addressChanged ? {address: form.address.trim(), locationHint: verifiedAddress ? {latitude:verifiedAddress.latitude,longitude:verifiedAddress.longitude} : undefined} : {}),
          imageUrl: form.imageUrl.trim() || undefined,
          status: form.status,
        });

        closeDrawer();
      }
    } catch {}
  }, [
    closeDrawer,
    drawerMode,
    form,
    handleCreateUser,
    handleUpdateUser,
    portalRole,
    selectedUser,
    verifiedAddress,
  ]);

  const handleDisableFromDetail = useCallback(async () => {
    if (!selectedUser) {
      return;
    }

    requestToggleBanStatus(selectedUser);
  }, [requestToggleBanStatus, selectedUser]);

  const handleDeleteFromDetail = useCallback(async () => {
    if (!selectedUser) {
      return;
    }

    requestDeleteUser(selectedUser);
  }, [requestDeleteUser, selectedUser]);

  const switchDetailToEdit = useCallback(() => {
    if (!selectedUser) {
      return;
    }

    openEditDrawer(selectedUser);
  }, [openEditDrawer, selectedUser]);

  const handleUploadAvatar = useCallback(async (file: File) => {
    setUploadingAvatar(true);
    setError(null);

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch("/api/users/avatar", {
        method: "POST",
        body,
      });

      const data = (await response.json()) as {
        publicUrl?: string;
        error?: string;
      };
      if (!response.ok || !data.publicUrl) {
        throw new Error(data.error ?? "Upload ảnh thất bại");
      }

      setForm((previous) => ({
        ...previous,
        imageUrl: data.publicUrl ?? previous.imageUrl,
      }));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Upload ảnh thất bại",
      );
    } finally {
      setUploadingAvatar(false);
    }
  }, []);

  const handleConfirmAction = useCallback(async () => {
    if (!confirmState) {
      return;
    }

    try {
      if (confirmState.type === "ban") {
        await handleToggleBanStatus(confirmState.user.user_id, "banned");
      } else if (confirmState.type === "unban") {
        await handleToggleBanStatus(confirmState.user.user_id, "active");
      } else {
        await handleDeleteUser(confirmState.user.user_id);
      }

      if (selectedUser?.user_id === confirmState.user.user_id) {
        closeDrawer();
      }

      setConfirmState(null);
    } catch {}
  }, [
    closeDrawer,
    confirmState,
    handleDeleteUser,
    handleToggleBanStatus,
    selectedUser,
  ]);

  const reloadData = useCallback(async () => {
    await Promise.all([loadUsers(), loadRoles(), loadStores()]);
  }, [loadRoles, loadStores, loadUsers]);

  return (
    <AdminShell
      title="Quản lý người dùng"
      description="Quản trị danh sách tài khoản, phân quyền và trạng thái hoạt động trên hệ thống."
      searchPlaceholder="Tìm kiếm người dùng bằng tên, email..."
      pageActions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void reloadData()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
            disabled={loading || saving}
          >
            <RefreshCw className="h-4 w-4" />
            Tải lại
          </button>
          {/* Create button controlled by permissions */}
          {!permLoading && hasPermission("users.create") && (
            <button
              type="button"
              onClick={openCreateDrawer}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-60"
              disabled={loading || saving}
            >
              <Plus className="h-4 w-4" />
              Thêm User
            </button>
          )}
        </div>
      }
    >
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      <UserStats
        totalUsers={stats.totalUsers}
        activeUsers={stats.activeUsers}
        inactiveOrBannedUsers={stats.inactiveOrBannedUsers}
      />
      <UserTable
        users={users}
        loading={loading}
        saving={saving}
        customerRoleId={customerRoleId}
        storeOptions={storeOptions}
        selectedStoreId={selectedStoreId}
        onSelectStore={setSelectedStoreId}
        portalRole={portalRole}
        onViewUser={openDetailDrawer}
        onEditUser={openEditDrawer}
        onRequestDisableUser={requestToggleBanStatus}
        onRequestDeleteUser={requestDeleteUser}
      />

      <UserDrawer
        isOpen={Boolean(drawerMode)}
        mode={drawerMode}
        saving={saving}
        form={form}
        showPassword={showPassword}
        roleOptions={roleOptions}
        storeOptions={storeOptions}
        selectedUser={selectedUser}
        error={error}
        uploadingAvatar={uploadingAvatar}
        verifyingAddress={verifyingAddress}
        verifiedAddress={verifiedAddress}
        addressMatches={addressMatches}
        addressError={addressError}
        onSelectAddress={(location) => setVerifiedAddress({ query:form.address.trim(), ...location })}
        onVerifyAddress={() => void verifyFormAddress()}
        canManageSelected={portalRole !== "manager" || selectedUser?.role_name?.toLowerCase() === "employee"}
        onTogglePassword={() => setShowPassword((previous) => !previous)}
        onChange={patchForm}
        onUploadAvatar={handleUploadAvatar}
        onClose={closeDrawer}
        onSubmit={handleSubmitDrawer}
        onSwitchToEdit={switchDetailToEdit}
        onDisableFromDetail={handleDisableFromDetail}
        onDeleteFromDetail={handleDeleteFromDetail}
      />

      <ConfirmActionDialog
        open={Boolean(confirmState)}
        title={
          confirmState?.type === "ban"
            ? "Xác nhận khóa tài khoản"
            : confirmState?.type === "unban"
              ? "Xác nhận mở khóa tài khoản"
              : "Xác nhận xóa tài khoản"
        }
        message={
          confirmState
            ? confirmState.type === "ban"
              ? `Bạn có chắc muốn khóa tài khoản ${confirmState.user.name}?`
              : confirmState.type === "unban"
                ? `Bạn có chắc muốn mở khóa tài khoản ${confirmState.user.name}?`
                : `Bạn có chắc muốn xóa tài khoản ${confirmState.user.name}? Hành động này không thể hoàn tác.`
            : ""
        }
        confirmLabel={
          confirmState?.type === "ban"
            ? "Khóa tài khoản"
            : confirmState?.type === "unban"
              ? "Mở khóa tài khoản"
              : "Xóa tài khoản"
        }
        confirmVariant={confirmState?.type === "delete" ? "danger" : "warning"}
        loading={saving}
        onCancel={closeConfirmDialog}
        onConfirm={() => {
          void handleConfirmAction();
        }}
      />
    </AdminShell>
  );
};

export default UserManagement;
