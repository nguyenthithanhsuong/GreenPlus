"use client";

import React from 'react';
import { Camera, Home, Save } from 'lucide-react';
import { useCurrentUserProfile } from '../shared/useCurrentUserProfile';
import { useAuthStore } from '../../src/lib/stores/authStore';

const ProfileForm = () => {
  const { profile, loading, initialized, refreshProfile } = useCurrentUserProfile();
  const accessToken = useAuthStore((state) => state.session?.access_token ?? '');
  const avatarInputRef = React.useRef<HTMLInputElement | null>(null);
  const [formValues, setFormValues] = React.useState({
    name: '',
    email: '',
    phone: '',
    role: 'Admin',
    address: '',
  });
  const [imageUrl, setImageUrl] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [avatarError, setAvatarError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!profile) {
      return;
    }

    setFormValues({
      name: profile.name ?? '',
      email: profile.email ?? '',
      phone: profile.phone ?? '',
      role: profile.roleName ?? 'Admin',
      address: profile.address ?? '',
    });
    setImageUrl(profile.imageUrl ?? '');
  }, [profile]);

  const currentAvatarSrc = imageUrl || profile?.imageUrl || 'https://i.pravatar.cc/150?u=greenplus-default-user';

  const openAvatarPicker = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    event.target.value = '';

    if (!selectedFile) {
      return;
    }

    if (!profile?.userId) {
      setAvatarError('Không tìm thấy tài khoản để cập nhật ảnh đại diện.');
      return;
    }

    if (!selectedFile.type.startsWith('image/')) {
      setAvatarError('Chỉ hỗ trợ tệp ảnh cho ảnh đại diện.');
      return;
    }

    const maxBytes = 5 * 1024 * 1024;
    if (selectedFile.size > maxBytes) {
      setAvatarError('Ảnh đại diện phải nhỏ hơn 5MB.');
      return;
    }

    setAvatarError(null);
    setSaveMessage(null);
    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('userId', profile.userId);
      formData.append('file', selectedFile);

      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        body: formData,
      });

      const payload = (await response.json().catch(() => ({}))) as { publicUrl?: string; error?: string };

      if (!response.ok || !payload.publicUrl) {
        throw new Error(payload.error ?? 'Không thể upload ảnh đại diện.');
      }

      setImageUrl(payload.publicUrl);
      setSaveMessage("Upload ảnh đại diện thành công. Nhấn 'Lưu thay đổi' để cập nhật hồ sơ.");
      setSaveError(null);
      refreshProfile();
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'Không thể upload ảnh đại diện.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profile?.userId) {
      setSaveError('Không tìm thấy tài khoản hiện tại để lưu.');
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);
    setSaveError(null);
    setAvatarError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          name: formValues.name,
          email: formValues.email,
          phone: formValues.phone,
          address: formValues.address,
          imageUrl: imageUrl || profile.imageUrl || '',
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        item?: {
          userId?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          address?: string | null;
          imageUrl?: string | null;
          roleName?: string | null;
          status?: string;
        };
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? 'Không thể lưu thay đổi');
      }

      const updatedProfile = payload.item;
      if (updatedProfile) {
        setFormValues({
          name: updatedProfile.name ?? '',
          email: updatedProfile.email ?? '',
          phone: updatedProfile.phone ?? '',
          role: updatedProfile.roleName ?? 'Admin',
          address: updatedProfile.address ?? '',
        });
        setImageUrl(updatedProfile.imageUrl ?? '');
      }

      refreshProfile();
      setSaveMessage('Đã lưu thay đổi thành công.');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Không thể lưu thay đổi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange =
    (field: keyof typeof formValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormValues((previous) => ({
        ...previous,
        [field]: event.target.value,
      }));
    };

  return (
    <form className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm p-6 md:p-8" onSubmit={handleSubmit}>
      
      <div className="mb-8 border-b border-gray-100 pb-4">
        <h2 className="text-lg font-bold text-gray-900">Thông tin cơ bản</h2>
        <p className="text-sm text-gray-500 mt-1">
          Cập nhật ảnh đại diện và chi tiết liên hệ của tài khoản quản lý.
        </p>
      </div>

      {saveMessage ? (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {saveMessage}
        </div>
      ) : null}

      {saveError ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveError}
        </div>
      ) : null}

      {avatarError ? (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {avatarError}
        </div>
      ) : null}

      <div className="flex items-center gap-6 mb-8">
        <div className="relative">
          <img 
            src={currentAvatarSrc}
            alt="Avatar" 
            className="w-20 h-20 rounded-full object-cover border border-gray-200"
          />
          <button
            type="button"
            onClick={openAvatarPicker}
            disabled={isUploadingAvatar}
            className="absolute bottom-0 right-0 p-1.5 bg-[#059669] text-white rounded-full border-2 border-white hover:bg-[#047857] disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
            disabled={isUploadingAvatar}
          />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">{profile?.name ?? 'Người dùng'}</h3>
          <p className="text-sm text-gray-500 mb-2">
            {formValues.role || 'Admin'}
            {profile?.status ? <span className="font-semibold text-gray-700"> • {profile.status}</span> : null}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openAvatarPicker}
              disabled={isUploadingAvatar}
              className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploadingAvatar ? 'Đang upload...' : 'Đổi ảnh'}
            </button>
            <button
              type="button"
              onClick={() => {
                setImageUrl('');
                setAvatarError(null);
                setSaveMessage('Đã xóa ảnh hiển thị tạm thời. Nhấn “Lưu thay đổi” để áp dụng.');
              }}
              className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
            >
              Xóa
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Họ và tên</label>
          <input 
            type="text" 
            value={formValues.name}
            onChange={handleChange('name')}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
          <input 
            type="email" 
            value={formValues.email}
            onChange={handleChange('email')}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Số điện thoại</label>
          <input 
            type="text" 
            value={formValues.phone}
            onChange={handleChange('phone')}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Vai trò (Role)</label>
          <input 
            type="text" 
            value={formValues.role}
            disabled
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed"
          />
        </div>
      </div>

      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6 flex gap-3">
        <Home className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-blue-900">Thông tin Cơ sở</h4>
          <p className="text-xs text-blue-700 mt-1">Đây là địa chỉ lấy hàng mặc định cho các Shipper thuộc quản lý của bạn.</p>
        </div>
      </div>

      <div className="space-y-6 mb-8">
        {/* <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Tên Cửa hàng / Kho vận</label>
          <input 
            type="text" 
            value={formValues.role ? `${formValues.role} workspace` : 'Admin workspace'}
            readOnly
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent transition-colors"
          />
        </div> */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Địa chỉ cửa hàng</label>
          <textarea 
            rows={3}
            value={formValues.address}
            onChange={handleChange('address')}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:border-transparent transition-colors resize-none"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={isSaving || loading || !initialized || isUploadingAvatar}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#059669] hover:bg-[#047857] disabled:cursor-not-allowed disabled:opacity-60 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>

    </form>
  );
};

export default ProfileForm;