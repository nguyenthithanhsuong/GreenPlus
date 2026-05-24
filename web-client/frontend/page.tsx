import Link from "next/link";
import { APP_USE_CASES, CLIENT_VISIBLE_TABLES, ROLE_POLICIES } from "@greenplus/supabase-shared/accessPolicy";

export default function ClientFrontendPage() {
  const useCases = APP_USE_CASES["web-client"];
  const customerPolicy = ROLE_POLICIES.find((policy) => policy.role === "customer");

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Cấu hình web khách hàng</h1>
              <p className="mt-2 text-sm text-slate-600">
                Quyền truy cập khách hàng tuân theo hướng dẫn RLS của Supabase: khách chỉ có thể xem dữ liệu danh mục
                đang hoạt động và chỉ quản lý hồ sơ, giỏ hàng, đơn hàng, đánh giá của chính mình.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100"
              >
                Đi tới đăng nhập
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Đi tới đăng ký
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold">Các tình huống sử dụng cho khách hàng</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {useCases.map((item) => (
              <article key={item.key} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Bảng dữ liệu</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.tables.map((table) => (
                    <span key={table} className="rounded bg-slate-200 px-2 py-1 text-xs text-slate-800">
                      {table}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold">Tóm tắt quyền truy cập khách hàng</h2>
          {customerPolicy && (
            <div className="mt-3 rounded-lg border border-blue-300 bg-blue-50 p-3 text-sm text-slate-700">
              <p className="font-semibold">Vai trò: khách hàng</p>
              <p>{customerPolicy.description}</p>
              <p className="mt-1 text-xs">
                Các thao tác ghi chỉ nên giới hạn theo hàng sở hữu qua RLS (hồ sơ, giỏ hàng, đơn hàng, đánh giá, đăng ký của chính mình).
              </p>
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold">Các bảng khách hàng có thể xem</h2>
          <p className="mt-1 text-sm text-slate-600">
            Đây là các bảng có thể truy vấn trong luồng khách hàng, với ràng buộc sở hữu cho dữ liệu riêng tư.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {CLIENT_VISIBLE_TABLES.map((table) => (
              <span key={table} className="rounded bg-slate-200 px-2 py-1 text-xs text-slate-800">
                {table}
              </span>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
