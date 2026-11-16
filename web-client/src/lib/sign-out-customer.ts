export async function signOutCustomerSession(): Promise<void> {
  const response = await fetch("/api/auth/sync", {
    method: "DELETE",
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Không thể kết thúc phiên đăng nhập. Vui lòng thử lại.");
  }
}
