import Link from "next/link";

export default function ProfileScreen() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900">
      <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
          GreenPlus Shipper
        </p>
        <h1 className="mt-3 text-2xl font-bold">Hồ sơ</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Thông tin hồ sơ shipper sẽ được kết nối với phiên đăng nhập và dữ liệu
          phân công giao hàng.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Về trang chính
        </Link>
      </section>
    </main>
  );
}
