"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import NavigationBar from "../../dashboard/components/NavigationBar";
import { useAuthStore } from "@/lib/stores/authStore";
import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  SCREEN_BACKGROUND_GRADIENT,
  SCREEN_CONTENT_PADDING_X,
  SCREEN_HEADER_PADDING_X,
  SCREEN_MAX_WIDTH_PX,
  SCREEN_SIDE_PADDING_PX,
} from "../../shared/screen.styles";

type ProfileResult = {
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  image_url: string | null;
  status: string;
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: SCREEN_BACKGROUND_GRADIENT,
    padding: `0 ${SCREEN_SIDE_PADDING_PX}`,
  },
  container: {
    position: "relative",
    width: "100%",
    maxWidth: SCREEN_MAX_WIDTH_PX,
    minHeight: "100vh",
    background: "#FFFFFF",
    fontFamily: "'Inter', sans-serif",
    margin: "0 auto",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
  },
  topNav: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `12px ${SCREEN_HEADER_PADDING_X}`,
    height: "48px",
    flexShrink: 0,
  },
  headerTitle: {
    fontWeight: 700,
    fontSize: "20px",
    color: "#1E1E1E",
    margin: 0,
  },
  backLink: {
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#1E1E1E",
    textDecoration: "none",
  },
  mainContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: `20px ${SCREEN_CONTENT_PADDING_X} 120px`,
    gap: "clamp(16px, 4vw, 24px)",
  },
  profileHero: {
    width: "100%",
    borderRadius: "24px",
    background:
      "linear-gradient(160deg, #0f172a 0%, #115e59 60%, #10b981 100%)",
    color: "#FFFFFF",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  avatarSection: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  avatar: {
    width: "104px",
    height: "104px",
    background: "#F9FAFB",
    border: "2px solid #EFEFEF",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  avatarUploadSection: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
  },
  avatarUploadLabel: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.45)",
    padding: "8px 12px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    color: "#ECFDF5",
    background: "rgba(15, 23, 42, 0.18)",
  },
  hiddenFileInput: {
    display: "none",
  },
  infoCard: {
    width: "100%",
    borderRadius: "18px",
    border: "1px solid #E5E7EB",
    background: "#FFFFFF",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  infoLabel: {
    margin: 0,
    fontSize: "12px",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#6B7280",
  },
  infoValue: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 700,
    color: "#1E1E1E",
  },
  statGrid: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  },
  statCard: {
    borderRadius: "16px",
    border: "1px solid #E5E7EB",
    background: "#F9FAFB",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  statTitle: {
    margin: 0,
    fontSize: "12px",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  statValue: {
    margin: 0,
    fontSize: "15px",
    fontWeight: 700,
    color: "#1A4331",
    wordBreak: "break-word",
  },
  infoText: {
    fontSize: "13px",
    color: "#6B7280",
    textAlign: "center",
    margin: 0,
    padding: "10px 0",
  },
  errorText: {
    fontSize: "13px",
    color: "#B91C1C",
    textAlign: "center",
    margin: 0,
    padding: "10px 0",
  },
  formGrid: {
    width: "100%",
    display: "grid",
    gap: "12px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  inputLabel: {
    margin: 0,
    fontSize: "12px",
    fontWeight: 700,
    color: "#374151",
  },
  textInput: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: "12px",
    border: "1px solid #D1D5DB",
    padding: "10px 12px",
    fontSize: "14px",
    color: "#111827",
    outline: "none",
    background: "#FFFFFF",
  },
  textArea: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: "12px",
    border: "1px solid #D1D5DB",
    padding: "10px 12px",
    fontSize: "14px",
    color: "#111827",
    outline: "none",
    background: "#FFFFFF",
    minHeight: "92px",
    resize: "vertical",
    fontFamily: "inherit",
  },
  formActions: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    flexWrap: "wrap",
  },
  submitButton: {
    border: "none",
    borderRadius: "14px",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    background: "#51B788",
    color: "#FFFFFF",
  },
  actionButton: {
    border: "none",
    borderRadius: "14px",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  actionPrimary: {
    background: "#51B788",
    color: "#FFFFFF",
  },
  actionSecondary: {
    background: "#F3F4F6",
    color: "#111827",
  },
};

export default function ProfileMine() {
  const router = useRouter();
  const initialized = useAuthStore((state) => state.initialized);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const updateUser = useAuthStore((state) => state.updateUser);
  const userId = user?.user_id;
  const lastLoadedUserIdRef = useRef<string | null>(null);
  const hasLoadedProfileRef = useRef(false);

  const [profile, setProfile] = useState<ProfileResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [addressCheck, setAddressCheck] = useState<{address:string;latitude:number;longitude:number}|null>(null);
  const [addressOptions, setAddressOptions] = useState<Array<{address:string;latitude:number;longitude:number}>>([]);
  const [addressError, setAddressError] = useState<string|null>(null);
  const [checkingAddress, setCheckingAddress] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!isAuthenticated || !userId) {
      router.replace("/login");
      return;
    }

    if (lastLoadedUserIdRef.current !== userId) {
      lastLoadedUserIdRef.current = userId;
      hasLoadedProfileRef.current = false;
    }

    const controller = new AbortController();

    const loadProfile = async () => {
      if (!hasLoadedProfileRef.current) {
        setLoading(true);
      }
      setError(null);

      try {
        const response = await fetch(
          `/api/account/profile?userId=${encodeURIComponent(userId)}`,
          {
            signal: controller.signal,
          },
        );
        const data = (await response.json()) as
          ProfileResult | { error?: string };

        if (!response.ok) {
          const message =
            typeof data === "object" && data && "error" in data
              ? String(data.error ?? "")
              : "";
          throw new Error(message || "Không thể tải hồ sơ.");
        }

        const nextProfile = data as ProfileResult;
        setProfile(nextProfile);
        setNameInput(nextProfile.name ?? "");
        setEmailInput(nextProfile.email ?? "");
        setPhoneInput(nextProfile.phone ?? "");
        setAddressInput(nextProfile.address ?? "");
      setAddressOptions([]);
      setAddressCheck(null);
        setImageUrlInput(nextProfile.image_url ?? "");
        updateUser({
          name: nextProfile.name,
          email: nextProfile.email,
          phone: nextProfile.phone,
          address: nextProfile.address,
          image_url: nextProfile.image_url,
          status: nextProfile.status,
        });
        hasLoadedProfileRef.current = true;
      } catch (requestError) {
        if ((requestError as Error).name === "AbortError") {
          return;
        }

        setProfile(null);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Không thể tải hồ sơ.",
        );
        hasLoadedProfileRef.current = true;
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();

    return () => {
      controller.abort();
    };
  }, [initialized, isAuthenticated, router, updateUser, userId]);

  const displayName = profile?.name ?? user?.name ?? "Người dùng";
  const displayEmail = profile?.email ?? user?.email ?? "";
  const displayPhone = profile?.phone ?? "Chưa cập nhật";
  const displayAddress = profile?.address ?? "Chưa cập nhật";
  const displayStatus = profile?.status ?? user?.status ?? "unknown";
  const displayAvatar =
    imageUrlInput || profile?.image_url || user?.image_url || "";

  const profileFields = useMemo(
    () => [
      { label: "Email", value: displayEmail || "-" },
      { label: "Số điện thoại", value: displayPhone },
      { label: "Địa chỉ", value: displayAddress },
      { label: "Trạng thái", value: displayStatus },
    ],
    [displayAddress, displayEmail, displayPhone, displayStatus],
  );

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } finally {
      clearAuth();
      await fetch("/api/auth/sync", { method: "DELETE" }).catch(
        () => undefined,
      );
      setIsLoggingOut(false);
      router.replace("/login");
    }
  };

  const verifyAddress = async () => {
    setCheckingAddress(true);
    setSaveMessage(null);
    setAddressError(null);
    try {
      const response = await fetch(`/api/location?q=${encodeURIComponent(addressInput.trim())}`);
      const data = await response.json() as {items?:Array<{address:string;latitude:number;longitude:number}>;error?:string};
      if (!response.ok || !data.items?.length) throw new Error(data.error || "Không tìm thấy địa chỉ chi tiết");
      setAddressOptions(data.items);
      setAddressCheck(data.items[0]);
    } catch(error) {setAddressCheck(null);setAddressOptions([]);setAddressError(error instanceof Error?error.message:"Không kiểm tra được địa chỉ");}
    finally {setCheckingAddress(false);}
  };

  const handleSaveProfile = async () => {
    if (!userId) {
      setSaveMessage("Không tìm thấy tài khoản để cập nhật hồ sơ.");
      return;
    }

    if (!nameInput.trim()) {
      setSaveMessage("Không thể cập nhật do thiếu tên tài khoản.");
      return;
    }

    if (!emailInput.trim()) {
      setSaveMessage("Không thể cập nhật do thiếu email.");
      return;
    }

    const addressChanged = addressInput.trim() !== (profile?.address ?? "").trim();
    if (!addressInput.trim()) {
      setSaveMessage("Vui lòng nhập địa chỉ giao hàng đầy đủ.");
      return;
    }
    if (addressChanged && !addressCheck) {
      setSaveMessage("Hãy bấm xác minh địa chỉ và chọn vị trí trước khi lưu.");
      return;
    }
    setSaveMessage(null);
    setSaving(true);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          name: nameInput,
          email: emailInput,
          phone: phoneInput,
          ...(addressChanged ? {address:addressInput.trim(), locationHint:addressCheck ? {latitude:addressCheck.latitude,longitude:addressCheck.longitude} : undefined} : {}),
          imageUrl:
            imageUrlInput || profile?.image_url || user?.image_url || "",
        }),
      });

      const data = (await response.json()) as
        ProfileResult | { error?: string };
      if (!response.ok) {
        const message =
          typeof data === "object" && data && "error" in data
            ? String(data.error ?? "")
            : "";
        throw new Error(message || "Không thể cập nhật hồ sơ.");
      }

      const nextProfile = data as ProfileResult;
      setProfile(nextProfile);
      setNameInput(nextProfile.name ?? "");
      setEmailInput(nextProfile.email ?? "");
      setPhoneInput(nextProfile.phone ?? "");
      setAddressInput(nextProfile.address ?? "");
      setAddressOptions([]);
      setAddressCheck(null);
      setImageUrlInput(nextProfile.image_url ?? "");
      updateUser({
        name: nextProfile.name,
        email: nextProfile.email,
        phone: nextProfile.phone,
        address: nextProfile.address,
        image_url: nextProfile.image_url,
        status: nextProfile.status,
      });
      setSaveMessage(
        "Đã cập nhật avatar, tên, email, số điện thoại và địa chỉ.",
      );
    } catch (requestError) {
      setSaveMessage(
        requestError instanceof Error
          ? requestError.message
          : "Không thể cập nhật hồ sơ.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    console.log("handleAvatarChange fired", event.target.files);
    const selectedFile = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!selectedFile) {
      return;
    }

    if (!userId) {
      setSaveMessage("Không tìm thấy tài khoản để cập nhật ảnh đại diện.");
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setSaveMessage("Chỉ hỗ trợ tệp ảnh cho ảnh đại diện.");
      return;
    }

    const maxBytes = 5 * 1024 * 1024;
    if (selectedFile.size > maxBytes) {
      setSaveMessage("Ảnh đại diện phải nhỏ hơn 5MB.");
      return;
    }

    setUploadingAvatar(true);
    setSaveMessage(null);

    try {
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("file", selectedFile);

      const uploadResponse = await fetch("/api/account/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const uploadData = (await uploadResponse.json()) as {
        publicUrl?: string;
        error?: string;
      };
      if (!uploadResponse.ok || !uploadData.publicUrl) {
        throw new Error(uploadData.error ?? "Không thể upload ảnh đại diện.");
      }

      setImageUrlInput(uploadData.publicUrl);
      setProfile((current) =>
        current
          ? { ...current, image_url: uploadData.publicUrl ?? null }
          : current,
      );
      updateUser({ image_url: uploadData.publicUrl });
      setSaveMessage(
        "Upload ảnh đại diện thành công. Nhấn 'Lưu thay đổi' để cập nhật hồ sơ.",
      );
    } catch (uploadError) {
      setSaveMessage(
        uploadError instanceof Error
          ? uploadError.message
          : "Không thể upload ảnh đại diện.",
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.topNav}>
          <Link
            href="/profile"
            style={styles.backLink}
            aria-label="Quay lại profile"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18L9 12L15 6"
                stroke="#1E1E1E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <h1 style={styles.headerTitle}>Profile của tôi</h1>
          <div style={{ width: "24px" }} />
        </header>

        <main style={styles.mainContent}>
          {loading && <p style={styles.infoText}>Đang tải hồ sơ...</p>}
          {error && <p style={styles.errorText}>{error}</p>}

          {!loading && !error && (
            <>
              <section style={styles.profileHero}>
                <div style={styles.avatarSection}>
                  <div style={styles.avatar}>
                    {displayAvatar ? (
                      <img
                        src={displayAvatar}
                        alt={displayName}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#AAAAAA"
                        strokeWidth="1.5"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    )}
                  </div>
                </div>
                <div style={styles.avatarUploadSection}>
                  <label
                    style={styles.avatarUploadLabel}
                    htmlFor="profile-avatar-upload"
                  >
                    {uploadingAvatar
                      ? "Đang upload ảnh..."
                      : "Đổi ảnh đại diện"}
                  </label>
                  <input
                    id="profile-avatar-upload"
                    type="file"
                    accept="image/*"
                    style={styles.hiddenFileInput}
                    onChange={(event) => {
                      void handleAvatarChange(event);
                    }}
                    disabled={uploadingAvatar}
                  />
                </div>
                <div>
                  <p style={styles.infoLabel}>Hồ sơ của</p>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "24px",
                      lineHeight: "30px",
                      fontWeight: 800,
                    }}
                  >
                    {displayName}
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      color: "rgba(236, 253, 245, 0.9)",
                    }}
                  >
                    {displayEmail}
                  </p>
                </div>
              </section>

              <section style={styles.infoCard}>
                <div style={styles.statGrid}>
                  {profileFields.map((field) => (
                    <div key={field.label} style={styles.statCard}>
                      <p style={styles.statTitle}>{field.label}</p>
                      <p style={styles.statValue}>{field.value}</p>
                    </div>
                  ))}
                </div>

                <div style={styles.formGrid}>
                  <div style={styles.inputGroup}>
                    <p style={styles.inputLabel}>Tên</p>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(event) => setNameInput(event.target.value)}
                      style={styles.textInput}
                      placeholder="Nhập tên hiển thị"
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <p style={styles.inputLabel}>Email</p>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(event) => setEmailInput(event.target.value)}
                      style={styles.textInput}
                      placeholder="Nhập email"
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <p style={styles.inputLabel}>Số điện thoại</p>
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(event) => setPhoneInput(event.target.value)}
                      style={styles.textInput}
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <p style={styles.inputLabel}>Địa chỉ</p>
                    <textarea
                      value={addressInput}
                      onChange={(event) => { setAddressInput(event.target.value);setAddressCheck(null);setAddressOptions([]);setAddressError(null); }}
                      style={styles.textArea}
                      placeholder="Nhập địa chỉ giao hàng"
                    />
                  </div>
                  <section aria-label="Xác minh vị trí giao hàng" style={{display:"flex",flexDirection:"column",gap:10,width:"100%",padding:14,borderRadius:18,border:"1px solid #bbf7d0",background:"#f0fdf4"}}>
                    <strong style={{color:"#064e3b",fontSize:15}}>Xác minh vị trí giao hàng</strong>
                    <span style={{fontSize:12,color:"#475569",lineHeight:1.6}}>Nhập đầy đủ số nhà, tên đường, phường/xã và tỉnh/thành phố. Chỉ chọn vị trí đúng với địa chỉ nhận hàng của bạn.</span>
                    <button type="button" disabled={checkingAddress || !addressInput.trim()} onClick={() => void verifyAddress()}
                      style={{padding:"12px 14px",borderRadius:12,background:"#047857",color:"white",fontWeight:700,opacity:checkingAddress?0.6:1,border:"none",cursor:"pointer"}}>
                      {checkingAddress ? "Đang tìm vị trí..." : "Tìm địa chỉ & lấy tọa độ"}
                    </button>
                    {addressError && <div role="alert" style={{border:"1px solid #fecaca",background:"#fff1f2",color:"#9f1239",padding:12,borderRadius:12,fontSize:12,lineHeight:1.6}}>{addressError}</div>}
                    {addressOptions.length > 0 && (
                      <fieldset style={{border:"none",margin:0,padding:0,display:"flex",flexDirection:"column",gap:8}}>
                        <legend style={{fontSize:13,fontWeight:700,color:"#064e3b",marginBottom:8}}>Chọn điểm giao phù hợp ({addressOptions.length} kết quả)</legend>
                        {addressOptions.map((location,i) => {
                          const selected = addressCheck?.latitude === location.latitude && addressCheck?.longitude === location.longitude;
                          return <label key={`${location.latitude}-${location.longitude}-${i}`}
                            style={{display:"flex",alignItems:"flex-start",gap:10,padding:12,borderRadius:12,border:selected?"1px solid #059669":"1px solid #e2e8f0",background:selected?"#d1fae5":"#fff",cursor:"pointer"}}>
                            <input type="radio" name="delivery-location" checked={selected} onChange={()=>setAddressCheck(location)} style={{marginTop:4,accentColor:"#047857"}} />
                            <span style={{fontSize:12,color:"#334155",lineHeight:1.6,wordBreak:"break-word"}}>{location.address}</span>
                          </label>;
                        })}
                      </fieldset>
                    )}
                    {addressCheck && (
                      <div role="status" style={{background:"white",borderRadius:14,overflow:"hidden",border:"1px solid #bbf7d0"}}>
                        <p style={{padding:"12px 12px 0",color:"#065f46",fontWeight:700,fontSize:13}}>Vị trí đã chọn — xem kỹ ghim trên bản đồ</p>
                        <p style={{padding:"4px 12px 10px",fontSize:12,color:"#475569"}}>{addressCheck.address}</p>
                        <iframe title="Bản đồ vị trí giao hàng" loading="lazy" referrerPolicy="no-referrer"
                          style={{width:"100%",height:210,border:0}}
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${addressCheck.longitude-0.004}%2C${addressCheck.latitude-0.003}%2C${addressCheck.longitude+0.004}%2C${addressCheck.latitude+0.003}&layer=mapnik&marker=${addressCheck.latitude}%2C${addressCheck.longitude}`} />
                        <a target="_blank" rel="noopener noreferrer"
                          href={`https://www.openstreetmap.org/?mlat=${addressCheck.latitude}&mlon=${addressCheck.longitude}#map=18/${addressCheck.latitude}/${addressCheck.longitude}`}
                          style={{display:"block",padding:"10px 12px",color:"#047857",fontSize:12,fontWeight:700,textDecoration:"underline"}}>Xem bản đồ lớn</a>
                      </div>
                    )}
                    <small style={{fontSize:11,color:"#64748b",lineHeight:1.6}}>GreenPlus chỉ gửi địa chỉ cho dịch vụ OpenStreetMap khi bạn bấm tìm. Đây là tọa độ ước tính từ bản đồ, không chứng minh số nhà tồn tại hoặc người nhận có mặt. © OpenStreetMap contributors.</small>
                  </section>
                  <div style={styles.formActions}>
                    <button
                      type="button"
                      style={styles.submitButton}
                      onClick={() => void handleSaveProfile()}
                      disabled={saving}
                    >
                      {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                    {saveMessage ? (
                      <p style={styles.infoText}>{saveMessage}</p>
                    ) : null}
                  </div>
                </div>
              </section>
            </>
          )}
        </main>

        <NavigationBar />
      </div>
    </div>
  );
}
