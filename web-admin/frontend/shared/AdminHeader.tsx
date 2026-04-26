import { Bell } from "lucide-react";

export default function AdminHeader() {
  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 md:px-8 shrink-0">
      
      {/* LEFT SIDE */}
      <div>
        {/* Put logo / title here if needed */}
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-6">
        <button
          className="relative p-2 text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
          aria-label="Thông báo"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full" />
        </button>

        <div className="flex items-center gap-3 border-l border-gray-100 pl-6 cursor-pointer">
          <img
            src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
            alt="User avatar"
            className="w-9 h-9 rounded-full object-cover"
          />
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              Thanh Sương
            </p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
