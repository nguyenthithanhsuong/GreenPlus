"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const BACKEND_TEST_USER_STORAGE_KEY = "backend-testing-user-id";

type ProfileResult = {
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  image_url: string | null;
  status: string;
};

export default function BackendProfileTestPage() {
  const fakeProfile: ProfileResult = {
    user_id: "demo-profile-user-001",
    name: "Jamie Green",
    email: "jamie.green@example.com",
    phone: "+84 912 345 678",
    address: "42 Green Avenue, District 1, Ho Chi Minh City",
    image_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    status: "active",
  };

  const [userIdInput, setUserIdInput] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [activeUserId, setActiveUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);

  useEffect(() => {
    const savedUserId = window.localStorage.getItem(BACKEND_TEST_USER_STORAGE_KEY)?.trim() ?? "";
    setActiveUserId(savedUserId);
    setUserIdInput(savedUserId);
  }, []);

  const resolveUserId = (): string => {
    const normalized = userIdInput.trim() || activeUserId.trim();
    if (!normalized) {
      throw new Error("Vui lòng đăng nhập trước hoặc cung cấp userId.");
    }

    return normalized;
  };

  const loadProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      const userId = resolveUserId();
      const response = await fetch(`/api/account/profile?userId=${encodeURIComponent(userId)}`);
      const data = (await response.json()) as ProfileResult | { error: string };

      if (!response.ok) {
        throw new Error("error" in data ? data.error : "Không thể tải hồ sơ.");
      }

      const profile = data as ProfileResult;
      setResult(profile);
      setName(profile.name ?? "");
      setEmail(profile.email ?? "");
      setPhone(profile.phone ?? "");
      setAddress(profile.address ?? "");
      setImageUrl(profile.image_url ?? "");
      window.localStorage.setItem(BACKEND_TEST_USER_STORAGE_KEY, profile.user_id);
      setActiveUserId(profile.user_id);
      setUserIdInput(profile.user_id);
    } catch (requestError) {
      setResult(null);
      setError(requestError instanceof Error ? requestError.message : "Đã xảy ra lỗi không mong muốn.");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      const userId = resolveUserId();
      const response = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name,
          email,
          phone,
          address,
          imageUrl,
        }),
      });

      const data = (await response.json()) as ProfileResult | { error: string };
      if (!response.ok) {
        throw new Error("error" in data ? data.error : "Không thể cập nhật hồ sơ.");
      }

      const profile = data as ProfileResult;
      setResult(profile);
      setImageUrl(profile.image_url ?? "");
      window.localStorage.setItem(BACKEND_TEST_USER_STORAGE_KEY, profile.user_id);
      setActiveUserId(profile.user_id);
      setUserIdInput(profile.user_id);
    } catch (requestError) {
      setResult(null);
      setError(requestError instanceof Error ? requestError.message : "Đã xảy ra lỗi không mong muốn.");
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    setLoading(true);
    setError(null);

    try {
      const userId = resolveUserId();
      const response = await fetch("/api/account/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = (await response.json()) as { updated?: boolean; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Không thể đổi mật khẩu.");
      }

      setResult(data);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (requestError) {
      setResult(null);
      setError(requestError instanceof Error ? requestError.message : "Đã xảy ra lỗi không mong muốn.");
    } finally {
      setLoading(false);
    }
  };

  const showFakeProfile = () => {
    setResult(fakeProfile);
    setUserIdInput(fakeProfile.user_id);
    setName(fakeProfile.name);
    setEmail(fakeProfile.email);
    setPhone(fakeProfile.phone ?? "");
    setAddress(fakeProfile.address ?? "");
    setImageUrl(fakeProfile.image_url ?? "");
  };

  const previewImageSrc = imageUrl.trim() || fakeProfile.image_url || "https://placehold.co/160x160?text=No+Image";
  const previewName = name.trim() || fakeProfile.name;
  const previewEmail = email.trim() || fakeProfile.email;
  const previewAddress = address.trim() || fakeProfile.address || "No address";
  const previewPhone = phone.trim() || fakeProfile.phone || "No phone";

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-4">
        <section className="rounded-xl border border-slate-300 bg-white p-5">
          <h1 className="text-2xl font-bold">Kiểm thử backend: Hồ sơ</h1>
          <p className="mt-2 text-sm text-slate-600">Dùng trang này để kiểm tra /api/account/profile (GET và PUT).</p>
          <p className="mt-1 text-xs text-slate-500">Route: /backend/profile</p>
          <p className="mt-1 text-xs text-slate-500">Người dùng kiểm thử hiện tại: {activeUserId || "chưa thiết lập"}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Link href="/backend/register" className="rounded bg-slate-200 px-2 py-1 text-slate-800">
              Đi tới kiểm thử đăng ký
            </Link>
            <Link href="/backend/signin" className="rounded bg-slate-200 px-2 py-1 text-slate-800">
              Đi tới kiểm thử đăng nhập
            </Link>
            <Link href="/backend/products" className="rounded bg-slate-200 px-2 py-1 text-slate-800">
              Kiểm thử backend sản phẩm
            </Link>
          </div>
        </section>

        <section className="rounded-xl border border-slate-300 bg-white p-5">
          <h2 className="text-lg font-semibold">Biểu mẫu hồ sơ</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              value={userIdInput}
              onChange={(event) => setUserIdInput(event.target.value)}
              placeholder="userId"
              className="rounded border border-slate-300 px-3 py-2 text-sm md:col-span-2"
            />
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="tên"
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email"
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="số điện thoại"
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="địa chỉ"
              className="rounded border border-slate-300 px-3 py-2 text-sm md:col-span-2"
            />
            <input
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="image_url"
              className="rounded border border-slate-300 px-3 py-2 text-sm md:col-span-2"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => void loadProfile()}
              disabled={loading}
              className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? "Đang tải..." : "Tải hồ sơ"}
            </button>
            <button
              onClick={() => void updateProfile()}
              disabled={loading}
              className="rounded bg-amber-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? "Đang lưu..." : "Cập nhật hồ sơ"}
            </button>
            <button
              onClick={showFakeProfile}
              disabled={loading}
              className="rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              Hiển thị hồ sơ mẫu
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-300 bg-white p-5">
          <h2 className="text-lg font-semibold">Xem trước hồ sơ</h2>
          <p className="mt-1 text-xs text-slate-500">Phần xem trước dùng giá trị form và sẽ dùng hồ sơ demo nếu thiếu dữ liệu.</p>
          <div className="mt-4 rounded-xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-sky-50 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <img
                src={previewImageSrc}
                alt="Xem trước hồ sơ"
                className="h-24 w-24 rounded-full border border-slate-300 object-cover"
                onError={(event) => {
                  event.currentTarget.src = "https://placehold.co/160x160?text=Bad+URL";
                }}
              />
              <div className="space-y-1">
                <p className="text-xl font-bold text-slate-900">{previewName}</p>
                <p className="text-sm text-slate-600">{previewEmail}</p>
                <p className="text-sm text-slate-600">{previewPhone}</p>
                <p className="text-sm text-slate-600">{previewAddress}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-300 bg-white p-5">
          <h2 className="text-lg font-semibold">Đổi mật khẩu</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="mật khẩu hiện tại"
              type="password"
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="mật khẩu mới"
              type="password"
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="xác nhận mật khẩu"
              type="password"
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => void changePassword()}
              disabled={loading}
              className="rounded bg-rose-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? "Đang lưu..." : "Đổi mật khẩu"}
            </button>
          </div>
        </section>

        {error && <p className="text-sm text-rose-700">{error}</p>}
        {result !== null && (
          <pre className="overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </main>
  );
}
