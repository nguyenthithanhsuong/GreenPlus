import { ReactNode } from "react";
import AdminHeader from "./AdminHeader";
import AdminPageHeader from "./AdminPageHeader";
import AdminSidebar from "./AdminSidebar";
import PageGuard from "./PageGuard";

type AdminShellProps = {
  title: string;
  description?: string;
  pageActions?: ReactNode;
  searchPlaceholder?: string;
  children: ReactNode;
  fullWidth?: boolean;
};

export default function AdminShell({
  title,
  description,
  pageActions,
  searchPlaceholder: _searchPlaceholder,
  children,
  fullWidth = false,
}: AdminShellProps) {
  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      <div className="min-w-0 flex-1 flex flex-col h-screen overflow-hidden">
        <AdminHeader />
        <details className="relative z-40 border-b bg-white px-4 py-2 lg:hidden">
          <summary className="cursor-pointer text-sm font-semibold text-emerald-700">
            ☰ Mở menu quản trị
          </summary>
          <div className="absolute left-0 top-full max-h-[70vh] w-[270px] max-w-full overflow-auto bg-white shadow-xl">
            <AdminSidebar />
          </div>
        </details>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div
            className={`${fullWidth ? "w-full" : "max-w-7xl mx-auto"} space-y-6`}
          >
            <AdminPageHeader
              title={title}
              description={description}
              actions={pageActions}
            />
            <PageGuard>{children}</PageGuard>
          </div>
        </main>
      </div>
    </div>
  );
}
