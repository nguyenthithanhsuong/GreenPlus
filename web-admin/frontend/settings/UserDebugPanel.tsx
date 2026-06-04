"use client";

import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useCurrentUserProfile } from '../shared/useCurrentUserProfile';
import { useAuthStore } from '../../src/lib/stores/authStore';

const UserDebugPanel = () => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const { profile, loading, initialized } = useCurrentUserProfile();
  const { user, session } = useAuthStore();

  return (
    <div className="w-full bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-sm font-bold text-amber-900 hover:text-amber-800 transition-colors"
      >
        <span className="flex items-center gap-2">
          🔍 DEBUG: Thông tin người dùng (User Login Info)
          {loading && <span className="text-xs text-amber-700">(đang tải...)</span>}
        </span>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4 text-xs text-amber-900">
          <div className="bg-white rounded border border-amber-200 p-3">
            <h4 className="font-bold text-amber-900 mb-2">1. Auth Store (từ Supabase)</h4>
            <pre className="bg-amber-50 p-2 rounded overflow-auto max-h-48 text-[11px]">
{JSON.stringify({
  initialized,
  user: user ? {
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata,
    app_metadata: user.app_metadata,
  } : null,
  session: session ? {
    access_token: `${session.access_token?.substring(0, 20)}...`,
    expires_in: session.expires_in,
    refresh_token: `${session.refresh_token?.substring(0, 20) ?? 'null'}...`,
  } : null,
}, null, 2)}
            </pre>
          </div>

          <div className="bg-white rounded border border-amber-200 p-3">
            <h4 className="font-bold text-amber-900 mb-2">2. Current User Profile (từ /api/users/me)</h4>
            <pre className="bg-amber-50 p-2 rounded overflow-auto max-h-48 text-[11px]">
{JSON.stringify(profile, null, 2)}
            </pre>
          </div>

          <div className="bg-white rounded border border-amber-200 p-3">
            <h4 className="font-bold text-amber-900 mb-2">3. Trạng thái tải dữ liệu</h4>
            <ul className="space-y-1">
              <li>Auth Initialized: <span className={loading ? 'text-yellow-600' : initialized ? 'text-green-600 font-bold' : 'text-red-600'}>{initialized ? '✓ Có' : '✗ Không'}</span></li>
              <li>User từ Session: <span className={user ? 'text-green-600 font-bold' : 'text-red-600'}>{user ? `✓ Có (${user.email})` : '✗ Không'}</span></li>
              <li>Session Access Token: <span className={session?.access_token ? 'text-green-600 font-bold' : 'text-red-600'}>{session?.access_token ? '✓ Có' : '✗ Không'}</span></li>
              <li>Profile từ API: <span className={profile ? 'text-green-600 font-bold' : 'text-red-600'}>{profile ? `✓ Có (${profile.email})` : '✗ Không'}</span></li>
              <li>Đang tải: <span className={loading ? 'text-yellow-600 font-bold' : 'text-gray-600'}>{loading ? '🔄 Có' : '✗ Không'}</span></li>
            </ul>
          </div>

          <div className="bg-white rounded border border-amber-200 p-3">
            <h4 className="font-bold text-amber-900 mb-2">4. Ánh xạ dữ liệu (Data Mapping)</h4>
            {profile && (
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="bg-amber-100">
                    <th className="border border-amber-200 p-1 text-left">Trường (Field)</th>
                    <th className="border border-amber-200 p-1 text-left">Giá trị (Value)</th>
                    <th className="border border-amber-200 p-1 text-left">Nguồn (Source)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-amber-100">
                    <td className="border border-amber-200 p-1 font-bold">userId</td>
                    <td className="border border-amber-200 p-1 font-mono">{profile.userId}</td>
                    <td className="border border-amber-200 p-1 text-[10px]">dbUser.user_id || user.id</td>
                  </tr>
                  <tr className="border-b border-amber-100">
                    <td className="border border-amber-200 p-1 font-bold">name</td>
                    <td className="border border-amber-200 p-1 font-mono">{profile.name}</td>
                    <td className="border border-amber-200 p-1 text-[10px]">DB → user_metadata.full_name → email</td>
                  </tr>
                  <tr className="border-b border-amber-100">
                    <td className="border border-amber-200 p-1 font-bold">email</td>
                    <td className="border border-amber-200 p-1 font-mono">{profile.email}</td>
                    <td className="border border-amber-200 p-1 text-[10px]">dbUser.email || user.email</td>
                  </tr>
                  <tr className="border-b border-amber-100">
                    <td className="border border-amber-200 p-1 font-bold">phone</td>
                    <td className="border border-amber-200 p-1 font-mono">{profile.phone || '(empty)'}</td>
                    <td className="border border-amber-200 p-1 text-[10px]">dbUser.phone</td>
                  </tr>
                  <tr className="border-b border-amber-100">
                    <td className="border border-amber-200 p-1 font-bold">address</td>
                    <td className="border border-amber-200 p-1 font-mono">{profile.address || '(empty)'}</td>
                    <td className="border border-amber-200 p-1 text-[10px]">dbUser.address</td>
                  </tr>
                  <tr className="border-b border-amber-100">
                    <td className="border border-amber-200 p-1 font-bold">imageUrl</td>
                    <td className="border border-amber-200 p-1 font-mono">{profile.imageUrl?.substring(0, 30)}...</td>
                    <td className="border border-amber-200 p-1 text-[10px]">DB → user_metadata.avatar_url</td>
                  </tr>
                  <tr className="border-b border-amber-100">
                    <td className="border border-amber-200 p-1 font-bold">roleName</td>
                    <td className="border border-amber-200 p-1 font-mono">{profile.roleName}</td>
                    <td className="border border-amber-200 p-1 text-[10px]">DB → app_metadata.role</td>
                  </tr>
                  <tr>
                    <td className="border border-amber-200 p-1 font-bold">status</td>
                    <td className="border border-amber-200 p-1 font-mono">{profile.status}</td>
                    <td className="border border-amber-200 p-1 text-[10px]">dbUser.status</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-white rounded border border-amber-200 p-3">
            <h4 className="font-bold text-amber-900 mb-2">📋 Cách kiểm tra (How to check):</h4>
            <ol className="space-y-1 list-decimal list-inside">
              <li>Nếu bất kỳ phần nào hiển thị ✗ hoặc không có dữ liệu, có vấn đề với việc truyền thông tin</li>
              <li>Kiểm tra Network tab (F12) để xem request/response của /api/users/me</li>
              <li>Xem Console để tìm lỗi liên quan đến Authorization header</li>
              <li>Đảm bảo session access token hợp lệ và không hết hạn</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDebugPanel;