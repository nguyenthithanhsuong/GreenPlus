import { ReactNode } from "react";
import AdminHeader from "./AdminHeader";
import AdminPageHeader from "./AdminPageHeader";
import AdminSidebar from "./AdminSidebar";

type AdminShellProps = {
  title: string;
  description?: string;
  pageActions?: ReactNode;
  searchPlaceholder?: string;
  children: ReactNode;
};

export default function AdminShell({
  title,
  description,
  pageActions,
  searchPlaceholder: _searchPlaceholder,
  children,
}: AdminShellProps) {
  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <AdminSidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AdminHeader />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <AdminPageHeader title={title} description={description} actions={pageActions} />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
