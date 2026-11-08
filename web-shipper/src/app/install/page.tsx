import Link from "next/link";

export const metadata = { title: "Cài ứng dụng GreenPlus Shipper" };

export default function InstallPage() {
  return (
    <main className="mx-auto min-h-screen max-w-lg bg-emerald-50 p-5 text-slate-900">
      <div className="space-y-5 rounded-2xl bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-emerald-900">Cài GreenPlus Shipper</h1>
        <p className="text-sm leading-6">Sử dụng ứng dụng từ màn hình chính, không cần tải Flutter. Đây là bản PWA của website GreenPlus.</p>
        <section className="space-y-2" aria-labelledby="android-title">
          <h2 id="android-title" className="font-bold">Android (Chrome)</h2>
          <p className="text-sm leading-6">Mở GreenPlus qua HTTPS trong Chrome → menu ba chấm → <strong>Cài đặt ứng dụng</strong> (nếu có). Khi Chrome cho phép, nút Cài GreenPlus cũng xuất hiện trên website.</p>
          <p className="text-sm leading-6">Nếu chỉ có <strong>Tạo lối tắt</strong>, thiết bị/trình duyệt có thể không hỗ trợ WebAPK hoặc website chưa đạt điều kiện cài đặt. Lối tắt không tương đương TWA đã xác minh. Hãy thử Chrome trên thiết bị Android có Google Play Services.</p>
        </section>
        <section className="space-y-2" aria-labelledby="ios-title">
          <h2 id="ios-title" className="font-bold">iPhone / iPad</h2>
          <p className="text-sm leading-6">Mở website bằng Safari → Chia sẻ → <strong>Thêm vào Màn hình chính</strong> → xác nhận. iOS không hỗ trợ hộp thoại cài đặt của Chrome Android.</p>
        </section>
        <section className="space-y-2" aria-labelledby="offline-title">
          <h2 id="offline-title" className="font-bold">Offline, cập nhật và quyền thiết bị</h2>
          <p className="text-sm leading-6">{"Cập nhật giao hàng, bản đồ và xác thực Shipper chỉ hoạt động khi có Internet."}</p>
          <p className="text-sm leading-6">Khi có bản cập nhật, GreenPlus sẽ cho bạn chủ động bấm cập nhật sau khi hoàn tất thao tác đang làm. Camera/GPS chỉ được sử dụng khi bạn cho phép.</p>
        </section>
        <p className="text-xs text-slate-600">APK Android/TWA là một bước phát hành khác, cần bản build ký số và xác minh website với chứng chỉ của ứng dụng.</p>
        <Link href="/" className="inline-flex rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white">Trở về GreenPlus</Link>
      </div>
    </main>
  );
}
