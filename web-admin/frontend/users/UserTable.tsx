import React, { useDeferredValue } from 'react';
import { Edit, Eye, Lock, Trash2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { userSearchStrategy } from '../shared/searchStrategies';

export type UserViewModel = {
  user_id: string;
  role_id: string | null;
  role_name: string | null;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  status: 'active' | 'inactive' | 'banned';
  created_at: string;
  image_url: string | null;
};

type UserTableProps = {
  users: UserViewModel[];
  loading: boolean;
  saving: boolean;
  customerRoleId: string | null;
  onAddUser: () => void;
  onViewUser: (user: UserViewModel) => void;
  onEditUser: (user: UserViewModel) => void;
  onRequestDisableUser: (user: UserViewModel) => void;
  onRequestDeleteUser: (user: UserViewModel) => void;
};

// Helper to render role badges with specific colors
const renderRoleBadge = (role: string) => {
  const styles: Record<string, string> = {
    Admin: 'bg-purple-100 text-purple-700',
    Manager: 'bg-blue-100 text-blue-700',
    Employee: 'bg-orange-100 text-orange-700',
    Customer: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${styles[role] || 'bg-gray-100 text-gray-700'}`}>
      {role}
    </span>
  );
};

const mapStatusLabel = (status: UserViewModel['status']) => {
  if (status === 'active') return 'Active';
  if (status === 'inactive') return 'Inactive';
  return 'Banned';
};

const mapStatusClass = (status: UserViewModel['status']) => {
  if (status === 'active') return 'bg-emerald-500 text-gray-700';
  if (status === 'inactive') return 'bg-amber-500 text-amber-700';
  return 'bg-red-500 text-red-600';
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('vi-VN').format(date);
};

const getInitial = (name: string) => {
  const normalized = name.trim();
  return normalized ? normalized[0]?.toUpperCase() ?? 'U' : 'U';
};

const PAGE_SIZE = 10;

const buildPageItems = (currentPage: number, totalPages: number): Array<number | 'ellipsis'> => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 'ellipsis', totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
};

const UserTable = ({
  users,
  loading,
  saving,
  customerRoleId,
  onAddUser,
  onViewUser,
  onEditUser,
  onRequestDisableUser,
  onRequestDeleteUser,
}: UserTableProps) => {
  const [activeTab, setActiveTab] = React.useState<'all' | 'customer' | 'staff'>('all');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [searchQuery, setSearchQuery] = React.useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const isCustomerUser = React.useCallback(
    (user: UserViewModel) => {
      if (customerRoleId && user.role_id === customerRoleId) {
        return true;
      }

      const roleName = (user.role_name ?? '').trim().toLowerCase();
      return roleName === 'customer';
    },
    [customerRoleId]
  );

  const filteredUsers = React.useMemo(() => {
    const scopedUsers = activeTab === 'all'
      ? users
      : activeTab === 'customer'
        ? users.filter((user) => isCustomerUser(user))
        : users.filter((user) => !isCustomerUser(user));

    return userSearchStrategy.filter(scopedUsers, deferredSearchQuery);
  }, [activeTab, deferredSearchQuery, isCustomerUser, users]);

  const totalItems = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, deferredSearchQuery]);

  React.useEffect(() => {
    setCurrentPage((previous) => {
      if (previous > totalPages) {
        return totalPages;
      }
      if (previous < 1) {
        return 1;
      }
      return previous;
    });
  }, [totalPages]);

  const paginatedUsers = React.useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredUsers.slice(start, end);
  }, [currentPage, filteredUsers]);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, totalItems);
  const pageItems = React.useMemo(() => buildPageItems(currentPage, totalPages), [currentPage, totalPages]);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      
      {/* Table Top Controls: Tabs & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-5 border-b border-gray-50 gap-4">
        {/* Tabs */}
        <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-lg">
          <button onClick={() => setActiveTab('all')} className={`px-4 py-1.5 text-sm font-medium rounded-md ${activeTab === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Tất cả</button>
          <button onClick={() => setActiveTab('customer')} className={`px-4 py-1.5 text-sm font-medium rounded-md ${activeTab === 'customer' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Khách hàng</button>
          <button onClick={() => setActiveTab('staff')} className={`px-4 py-1.5 text-sm font-medium rounded-md ${activeTab === 'staff' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Nhân viên & Quản trị</button>
        </div>

        {/* Filters (Placeholders) */}
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              type="text"
              placeholder="Tìm theo tên, email, role..."
              className="h-9 w-64 rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-3 text-sm text-gray-800 placeholder-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={() => {
              onAddUser();
            }}
            disabled={saving}
            className="h-9 px-4 border border-emerald-600 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60"
          >
            Thêm User
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-medium">Tài khoản</th>
              <th className="px-6 py-4 font-medium">Số điện thoại</th>
              <th className="px-6 py-4 font-medium">Vai trò (Role)</th>
              <th className="px-6 py-4 font-medium">Ngày tham gia</th>
              <th className="px-6 py-4 font-medium">Trạng thái</th>
              <th className="px-6 py-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Đang tải danh sách người dùng...</td>
              </tr>
            )}

            {!loading && filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Không có dữ liệu người dùng.</td>
              </tr>
            )}

            {!loading && paginatedUsers.map((user) => (
              <tr key={user.user_id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {user.image_url ? (
                      <img src={user.image_url} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {getInitial(user.name)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{user.phone ?? '-'}</td>
                <td className="px-6 py-4">{renderRoleBadge(user.role_name ?? 'Customer')}</td>
                <td className="px-6 py-4 text-gray-600">{formatDate(user.created_at)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${mapStatusClass(user.status).split(' ')[0]}`}></span>
                    <span className={`font-medium ${mapStatusClass(user.status).split(' ')[1]}`}>{mapStatusLabel(user.status)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => onViewUser(user)} className="p-2 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="Xem chi tiết" disabled={saving}>
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => onEditUser(user)} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Sửa" disabled={saving}>
                      <Edit className="w-4 h-4" />
                    </button>
                    {(user.role_name ?? '').toLowerCase() !== 'admin' && (
                      <button
                        onClick={() => onRequestDisableUser(user)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.status === 'active'
                            ? 'text-gray-500 hover:text-amber-600 hover:bg-amber-50'
                            : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={user.status === 'active' ? 'Khóa' : 'Mở khóa'}
                        disabled={saving}
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => onRequestDeleteUser(user)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa" disabled={saving}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
        <span className="text-sm text-gray-500">
          Hiển thị <span className="font-bold text-gray-900">{startItem} - {endItem}</span> trong tổng số <span className="font-bold text-gray-900">{totalItems}</span>
        </span>
        
        <div className="flex items-center gap-1">
          <button
            className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
            disabled={currentPage === 1}
            aria-label="Trang trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {pageItems.map((item, index) => {
            if (item === 'ellipsis') {
              return (
                <span key={`ellipsis-${index}`} className="px-1 text-gray-400">...</span>
              );
            }

            const isActive = item === currentPage;
            return (
              <button
                key={item}
                onClick={() => setCurrentPage(item)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium ${isActive ? 'border border-emerald-500 bg-emerald-500 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {item}
              </button>
            );
          })}

          <button
            className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            onClick={() => setCurrentPage((previous) => Math.min(totalPages, previous + 1))}
            disabled={currentPage === totalPages}
            aria-label="Trang sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};

export default UserTable;