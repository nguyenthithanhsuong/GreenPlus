import Image from "next/image";
import { Bell, MapPin, User } from "lucide-react";
import NavigationBar from "./NavigationBar";
import {
  SCREEN_BACKGROUND_GRADIENT,
  SCREEN_CONTENT_PADDING_X,
  SCREEN_HEADER_PADDING_X,
  SCREEN_MAX_WIDTH_PX,
} from "../shared/screen.styles";

const orders = [
  {
    id: "ORD-88898",
    assignedAt: "Phân công lúc 08:30",
    customer: "Trần Tuấn Kiệt",
    customerLabel: "Khách hàng",
    address: "123 Nguyễn Văn Linh, P. Linh Trung, Thủ Đức",
    cod: "350.000đ",
    codColor: "text-red-600",
    status: "Chờ lấy hàng",
  },
  {
    id: "ORD-88899",
    assignedAt: "Phân công lúc 09:15",
    customer: "Nguyễn Thị Hoa",
    customerLabel: "",
    address: "Vincom Landmark 81, Q. Bình Thạnh",
    cod: "0đ (Đã TT)",
    codColor: "text-[#15A651]",
    status: "Chờ lấy hàng",
  },
];

export default function Dashboard() {
  return (
    <main className="min-h-screen overflow-hidden" style={{ background: SCREEN_BACKGROUND_GRADIENT }}>
      <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#F9FAFB]" style={{ maxWidth: SCREEN_MAX_WIDTH_PX, margin: "0 auto" }}>
        <div className="pointer-events-none absolute -top-14 -right-10 h-36 w-36 rounded-full bg-green-300/35 blur-2xl" />
        <div className="pointer-events-none absolute top-1/3 -left-12 h-32 w-32 rounded-full bg-emerald-300/30 blur-2xl" />

        <header className="relative z-10 border-b border-white/10 bg-[#15A651]/96 px-5 pt-12 pb-4 backdrop-blur-sm" style={{ paddingLeft: SCREEN_HEADER_PADDING_X, paddingRight: SCREEN_HEADER_PADDING_X }}>
          <div className="flex w-full items-center justify-between gap-4">
            <div>
              <p className="mb-0.5 text-sm font-medium text-white/90">Xin chào, Giao Hàng</p>
              <h1 className="text-2xl font-bold text-white">Đơn của tôi</h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative rounded-full bg-black/10 p-2 text-white transition-colors hover:bg-black/20" type="button" aria-label="Thông báo">
                <Bell className="h-5 w-5" />
                <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-[#15A651] bg-red-500" />
              </button>
              <Image
                src="https://i.pravatar.cc/150?img=11"
                alt="Shipper Avatar"
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover border-2 border-white/20"
              />
            </div>
          </div>
        </header>

        <section className="relative z-10 flex-1 overflow-y-auto pb-[112px]">
          <div className="flex w-full flex-col">
            <div className="flex bg-white shadow-sm">
              <button className="flex-1 border-b-[3px] border-[#15A651] py-3.5 text-sm font-bold text-[#15A651]" type="button">
                Chờ lấy hàng
                <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] leading-none text-white">3</span>
              </button>
              <button className="flex-1 border-b-[3px] border-transparent py-3.5 text-sm font-semibold text-gray-500" type="button">
                Đang giao
                <span className="ml-1 rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] leading-none text-white">2</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 px-5 py-4 text-sm" style={{ paddingLeft: SCREEN_CONTENT_PADDING_X, paddingRight: SCREEN_CONTENT_PADDING_X }}>
              <span className="font-bold text-gray-600">Cần lấy: 3 đơn</span>
              <span className="flex items-center gap-1.5 text-right font-bold text-[#15A651]">
                <MapPin className="h-4 w-4 shrink-0 text-black" fill="currentColor" />
                Cửa hàng: GreenFarm Củ Chi
              </span>
            </div>

            <div className="space-y-4 px-4" style={{ paddingLeft: SCREEN_CONTENT_PADDING_X, paddingRight: SCREEN_CONTENT_PADDING_X }}>
              {orders.map((order, index) => (
                <article key={order.id} className="rounded-2xl bg-white p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)]">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-base font-bold text-gray-900">{order.id}</h2>
                      <p className="mt-0.5 text-xs text-gray-500">{order.assignedAt}</p>
                    </div>
                    <span className="rounded-md bg-yellow-100 px-3 py-1 text-[11px] font-bold text-yellow-800">{order.status}</span>
                  </div>

                  <div className="mb-5 space-y-4 rounded-xl bg-[#F8F9FA] p-4">
                    <div className="flex items-start gap-3">
                      <User className="mt-0.5 h-5 w-5 shrink-0 text-gray-900" />
                      <div>
                        <p className="text-sm font-bold text-gray-900">{order.customer}</p>
                        {index === 0 ? <p className="text-xs text-gray-500">{order.customerLabel}</p> : null}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gray-900" />
                      <p className="text-sm leading-snug text-gray-800">{order.address}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-4">
                    <div>
                      <p className="mb-0.5 text-xs text-gray-500">Tiền thu (COD)</p>
                      <p className={`text-lg font-bold ${order.codColor}`}>{order.cod}</p>
                    </div>
                    <button className="rounded-lg bg-[#15A651] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-transform active:scale-95" type="button">
                      Xác nhận Đã Lấy
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <NavigationBar />
      </div>
    </main>
  );
}
