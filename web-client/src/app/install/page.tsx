import Link from "next/link";

export const metadata = { title: "Cài ứng dụng GreenPlus" };

export default function InstallPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-5 bg-emerald-50 p-6 text-slate-800">
      <h1 className="text-2xl font-bold">Cài GreenPlus Khách hàng</h1>
      <p>
        Dùng Chrome trên Android để mở website HTTPS của GreenPlus. Nếu trình
        duyệt xác nhận ứng dụng đủ điều kiện, nút <strong>Cài GreenPlus</strong>{" "}
        sẽ xuất hiện trên trang.
      </p>
      <p>
        Nếu chỉ thấy <strong>Tạo lối tắt</strong>, hãy kiểm tra manifest và các
        icon 192/512, sau đó thử Chrome trên thiết bị có Google Play Services.
        Không phải mọi trình duyệt đều tạo WebAPK.
      </p>
      <p>
        Trên iPhone/iPad, dùng menu Chia sẻ của trình duyệt và chọn{" "}
        <strong>Thêm vào Màn hình chính</strong>. Cách cài đặt có thể khác theo
        phiên bản iOS.
      </p>
      <p>Đây là PWA, chưa phải APK/TWA do GreenPlus tự ký và phát hành.</p>
      <Link
        className="inline-flex w-fit rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white"
        href="/"
      >
        Trở về GreenPlus
      </Link>
    </main>
  );
}
