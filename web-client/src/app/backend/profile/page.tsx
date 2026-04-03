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
      throw new Error("Please sign in first or provide userId");
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
        throw new Error("error" in data ? data.error : "Load profile failed");
      }

      const profile = data as ProfileResult;
      setResult(profile);
      setName(profile.name ?? "");
      setPhone(profile.phone ?? "");
      setAddress(profile.address ?? "");
      setImageUrl(profile.image_url ?? "");
      window.localStorage.setItem(BACKEND_TEST_USER_STORAGE_KEY, profile.user_id);
      setActiveUserId(profile.user_id);
      setUserIdInput(profile.user_id);
    } catch (requestError) {
      setResult(null);
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
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
          phone,
          address,
          imageUrl,
        }),
      });

      const data = (await response.json()) as ProfileResult | { error: string };
      if (!response.ok) {
        throw new Error("error" in data ? data.error : "Update profile failed");
      }

      const profile = data as ProfileResult;
      setResult(profile);
      setImageUrl(profile.image_url ?? "");
      window.localStorage.setItem(BACKEND_TEST_USER_STORAGE_KEY, profile.user_id);
      setActiveUserId(profile.user_id);
      setUserIdInput(profile.user_id);
    } catch (requestError) {
      setResult(null);
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
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
        throw new Error(data.error ?? "Change password failed");
      }

      setResult(data);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (requestError) {
      setResult(null);
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const showFakeProfile = () => {
    setResult(fakeProfile);
    setUserIdInput(fakeProfile.user_id);
    setName(fakeProfile.name);
    setPhone(fakeProfile.phone ?? "");
    setAddress(fakeProfile.address ?? "");
    setImageUrl(fakeProfile.image_url ?? "");
  };

  const previewImageSrc = imageUrl.trim() || fakeProfile.image_url || "https://placehold.co/160x160?text=No+Image";
  const previewName = name.trim() || fakeProfile.name;
  const previewAddress = address.trim() || fakeProfile.address || "No address";
  const previewPhone = phone.trim() || fakeProfile.phone || "No phone";

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-4">
        <section className="rounded-xl border border-slate-300 bg-white p-5">
          <h1 className="text-2xl font-bold">Backend Test: Profile</h1>
          <p className="mt-2 text-sm text-slate-600">Use this page to test /api/account/profile (GET and PUT).</p>
          <p className="mt-1 text-xs text-slate-500">Route: /backend/profile</p>
          <p className="mt-1 text-xs text-slate-500">Active test user: {activeUserId || "not set"}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Link href="/backend/register" className="rounded bg-slate-200 px-2 py-1 text-slate-800">
              Go to Register Test
            </Link>
            <Link href="/backend/signin" className="rounded bg-slate-200 px-2 py-1 text-slate-800">
              Go to Sign In Test
            </Link>
            <Link href="/backend/products" className="rounded bg-slate-200 px-2 py-1 text-slate-800">
              Product Backend Test
            </Link>
          </div>
        </section>

        <section className="rounded-xl border border-slate-300 bg-white p-5">
          <h2 className="text-lg font-semibold">Profile Form</h2>
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
              placeholder="name"
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="phone"
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="address"
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
              {loading ? "Loading..." : "Load Profile"}
            </button>
            <button
              onClick={() => void updateProfile()}
              disabled={loading}
              className="rounded bg-amber-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? "Saving..." : "Update Profile"}
            </button>
            <button
              onClick={showFakeProfile}
              disabled={loading}
              className="rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              Show Fake Profile
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-300 bg-white p-5">
          <h2 className="text-lg font-semibold">Formatted Profile Preview</h2>
          <p className="mt-1 text-xs text-slate-500">Preview uses form values and falls back to a fake demo profile.</p>
          <div className="mt-4 rounded-xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-sky-50 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <img
                src={previewImageSrc}
                alt="Profile preview"
                className="h-24 w-24 rounded-full border border-slate-300 object-cover"
                onError={(event) => {
                  event.currentTarget.src = "https://placehold.co/160x160?text=Bad+URL";
                }}
              />
              <div className="space-y-1">
                <p className="text-xl font-bold text-slate-900">{previewName}</p>
                <p className="text-sm text-slate-600">{previewPhone}</p>
                <p className="text-sm text-slate-600">{previewAddress}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-300 bg-white p-5">
          <h2 className="text-lg font-semibold">Change Password</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="current password"
              type="password"
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="new password"
              type="password"
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="confirm password"
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
              {loading ? "Saving..." : "Change Password"}
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
