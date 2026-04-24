"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import UserStats from "./UserStats";
import UserTable, { UserViewModel } from "./UserTable";
import UserDrawer, { UserDrawerMode, UserFormValues } from "./UserDrawer";
import ConfirmActionDialog from "./ConfirmActionDialog";
import AdminShell from "../shared/AdminShell";

type RoleOption = {
  roleId: string;
  roleName: string;
};

const emptyForm: UserFormValues = {
  name: "",
  email: "",
  password: "",
  phone: "",
  roleId: "",
  address: "",
  imageUrl: "",
  status: "active",
};

const UserManagement = () => {
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
  const [confirmState, setConfirmState] = useState<
    | {
      type: "ban" | "unban" | "delete";
      user: UserViewModel;
    }
    | null
  >(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/users");
      const data = (await response.json()) as { items?: UserViewModel[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Không thể tải danh sách người dùng");
      }

      setUsers(Array.isArray(data.items) ? data.items : []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể tải danh sách người dùng");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRoles = useCallback(async () => {
    try {
      const response = await fetch("/api/roles");
      const data = (await response.json()) as { items?: Array<{ role_id?: string; role_name?: string }>; error?: string };

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
          }))
      );
    } catch {
      setRoleOptions([]);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
    void loadRoles();
  }, [loadRoles, loadUsers]);

  const withSaving = useCallback(async (work: () => Promise<void>) => {
    setSaving(true);
    setError(null);

    try {
      await work();
      await loadUsers();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Thao tác thất bại";
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, [loadUsers]);

  const handleCreateUser = useCallback(async (payload: {
    name: string;
    email: string;
    password: string;
    roleId?: string | null;
    phone?: string;
    address?: string;
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
  }, [withSaving]);

  const handleUpdateUser = useCallback(async (userId: string, payload: {
    name?: string;
    email?: string;
    roleId?: string | null;
    phone?: string;
    address?: string;
    imageUrl?: string;
    status?: "active" | "inactive" | "banned";
  }) => {
    await withSaving(async () => {
      const response = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Cập nhật user thất bại");
      }
    });
  }, [withSaving]);

  const handleToggleBanStatus = useCallback(async (userId: string, newStatus: "active" | "banned") => {
    await withSaving(async () => {
      const response = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Cập nhật trạng thái user thất bại");
      }
    });
  }, [withSaving]);

  const handleDeleteUser = useCallback(async (userId: string) => {
    await withSaving(async () => {
      const response = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Xóa user thất bại");
      }
    });
  }, [withSaving]);

  const stats = useMemo(() => {
    const activeUsers = users.filter((user) => user.status === "active").length;
    return {
      totalUsers: users.length,
      activeUsers,
      inactiveOrBannedUsers: users.length - activeUsers,
    };
  }, [users]);

  const customerRoleId = useMemo(
    () => roleOptions.find((role) => role.roleName.trim().toLowerCase() === "customer")?.roleId ?? null,
    [roleOptions]
  );

  const openCreateDrawer = useCallback(() => {
    setSelectedUser(null);
    setShowPassword(false);
    setForm(emptyForm);
    setDrawerMode("create");
  }, []);

  const openDetailDrawer = useCallback((user: UserViewModel) => {
    setSelectedUser(user);
    setDrawerMode("detail");
  }, []);

  const openEditDrawer = useCallback((user: UserViewModel) => {
    setSelectedUser(user);
    setShowPassword(false);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      phone: user.phone ?? "",
      roleId: user.role_id ?? "",
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
    // If active, ban them. If banned, unban them (restore to active).
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
    setForm((previous) => ({ ...previous, ...patch }));
  }, []);

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
          phone: form.phone.trim() || undefined,
          address: form.address.trim() || undefined,
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
          roleId: form.roleId || null,
          phone: form.phone.trim() || undefined,
          address: form.address.trim() || undefined,
          imageUrl: form.imageUrl.trim() || undefined,
          status: form.status,
        });

        closeDrawer();
      }
    } catch {
      // Error state is already handled by withSaving.
    }
  }, [
    closeDrawer,
    drawerMode,
    form,
    handleCreateUser,
    handleUpdateUser,
    selectedUser,
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

      const data = (await response.json()) as { publicUrl?: string; error?: string };
      if (!response.ok || !data.publicUrl) {
        throw new Error(data.error ?? "Upload ảnh thất bại");
      }

      setForm((previous) => ({
        ...previous,
        imageUrl: data.publicUrl ?? previous.imageUrl,
      }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Upload ảnh thất bại");
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
    } catch {
      // Error state is already handled by withSaving.
    }
  }, [closeDrawer, confirmState, handleDeleteUser, handleToggleBanStatus, selectedUser]);

  return (
    <AdminShell
      title="Quản lý người dùng"
      description="Quản trị danh sách tài khoản, phân quyền và trạng thái hoạt động trên hệ thống."
      searchPlaceholder="Tìm kiếm người dùng bằng tên, email..."
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
        onAddUser={openCreateDrawer}
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
        selectedUser={selectedUser}
        error={error}
        uploadingAvatar={uploadingAvatar}
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
        confirmVariant={
          confirmState?.type === "delete"
            ? "danger"
            : "warning"
        }
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