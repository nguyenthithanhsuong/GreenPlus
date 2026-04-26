import React from "react";
import { Edit, Trash2, Users } from "lucide-react";
import type { RoleSummary } from "../../backend/modules/roles/role-management.types";

type RoleGridProps = {
  roles: RoleSummary[];
  loading: boolean;
  saving: boolean;
  onEditRole: (role: RoleSummary) => void;
  onDeleteRole: (role: RoleSummary) => void;
  emptyMessage?: string;
};

function formatRoleLabel(roleName: string): string {
  const normalized = roleName.trim().toLowerCase();
  if (!normalized) {
    return "Role";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

const toFlagChips = (role: RoleSummary): string[] => {
  const chips: string[] = [];

  if (role.is_customer) chips.push("customer");
  if (role.is_admin) chips.push("admin");
  if (role.is_manager) chips.push("manager");
  if (role.is_employee) chips.push("employee");
  if (role.is_shipper) chips.push("shipper");

  return chips;
};

const RoleGrid = ({ roles, loading, saving, onEditRole, onDeleteRole, emptyMessage = "Chưa có role nào." }: RoleGridProps) => {
  if (loading) {
    return <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500">Đang tải danh sách role...</div>;
  }

  if (roles.length === 0) {
    return <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500">{emptyMessage}</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {roles.map((role) => {
        const description = role.description?.trim() || "Chưa có mô tả từ backend.";
        const flagChips = toFlagChips(role);
        const cardClassName = "bg-white border border-gray-100";
        const iconClassName = "bg-gray-100 text-gray-700";

        return (
          <div key={role.role_id} className={`relative flex h-full flex-col rounded-2xl p-6 ${cardClassName}`}>
            <div className="mb-4 flex items-start justify-between">
              <div className={`rounded-2xl p-3 ${iconClassName}`}>
                <Users className="h-6 w-6" strokeWidth={1.5} />
              </div>
            </div>

            <div className="flex-1">
              <h3 className="mb-2 text-lg font-bold text-gray-900">{formatRoleLabel(role.role_name)}</h3>
              <p className="mb-6 text-sm leading-relaxed text-gray-500">{description}</p>
              <div className="mb-4 flex flex-wrap gap-2">
                {flagChips.length > 0 ? (
                  flagChips.map((chip) => (
                    <span key={chip} className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                      {chip}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    no flags
                  </span>
                )}
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-gray-200/50 pt-4">
              <div className="flex items-center text-sm font-semibold text-gray-900">
                <Users className="mr-2 h-4 w-4 text-gray-500" />
                {role.user_count} <span className="ml-1 font-normal text-gray-500">tài khoản</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEditRole(role)}
                  disabled={saving}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/50 hover:text-gray-900 disabled:opacity-60"
                  title="Sửa"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteRole(role)}
                  disabled={saving}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/50 hover:text-red-600 disabled:opacity-60"
                  title="Xóa"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RoleGrid;
