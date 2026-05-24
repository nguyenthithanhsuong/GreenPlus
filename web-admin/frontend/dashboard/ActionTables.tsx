import Link from "next/link";
import { Image as ImageIcon, PlaySquare, Store } from "lucide-react";
import { SupplierRow } from "../../backend/modules/suppliers/supplier-management.types";
import { GreenCreatorPostRow } from "../../backend/modules/greencreators/greencreator-content.types";

type ActionTablesProps = {
  suppliers: SupplierRow[];
  posts: GreenCreatorPostRow[];
  loading: boolean;
};

const ActionTables = ({ suppliers, posts, loading }: ActionTablesProps) => {
  const pendingSuppliers = suppliers.filter((supplier) => supplier.status === "pending").slice(0, 5);
  const pendingPosts = posts.filter((post) => post.status === "pending").slice(0, 5);

  const getPostTypeLabel = (type: string) => {
    if (type === "video") {
      return "Video";
    }

    if (type === "image") {
      return "Hình ảnh";
    }

    return type;
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-50 p-5">
          <h3 className="flex items-center gap-2 font-bold text-gray-900">
            <Store className="h-4 w-4 text-gray-500" />
            Đối tác chờ duyệt
          </h3>
          <Link href="/suppliers" className="text-sm font-medium text-emerald-600 hover:underline">Xem tất cả</Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Tên nhà cung cấp</th>
                <th className="px-5 py-3 font-medium">Chứng nhận</th>
                <th className="px-5 py-3 font-medium text-right">Điều hướng</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-sm text-gray-500">Đang tải đối tác...</td>
                </tr>
              ) : pendingSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-sm text-gray-500">Không có đối tác chờ duyệt.</td>
                </tr>
              ) : (
                pendingSuppliers.map((supplier) => (
                  <tr key={supplier.supplier_id} className="border-b border-gray-50 last:border-b-0">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-900">{supplier.name}</p>
                      <p className="text-xs text-gray-400">
                        Đăng ký: {supplier.created_at ? new Date(supplier.created_at).toLocaleString("vi-VN") : "N/A"}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded border border-emerald-100 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-600">
                        {supplier.certificate ?? "Chưa cung cấp"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href="/suppliers" className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-600">
                        Kiểm duyệt
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-50 p-5">
          <h3 className="flex items-center gap-2 font-bold text-gray-900">
            <ImageIcon className="h-4 w-4 text-gray-500" />
            Nội dung chờ duyệt
          </h3>
          <Link href="/greencreators" className="text-sm font-medium text-emerald-600 hover:underline">Xem tất cả</Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Người dùng / Loại</th>
                <th className="px-5 py-3 font-medium">Nội dung tóm tắt</th>
                <th className="px-5 py-3 font-medium text-right">Điều hướng</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-sm text-gray-500">Đang tải nội dung...</td>
                </tr>
              ) : pendingPosts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-sm text-gray-500">Không có nội dung chờ duyệt.</td>
                </tr>
              ) : (
                pendingPosts.map((post) => (
                  <tr key={post.post_id} className="border-b border-gray-50 last:border-b-0">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-900">{post.author_name ?? "Người dùng ẩn danh"}</p>
                      <p className="flex items-center gap-1 text-xs text-blue-600">
                        {post.type === "video" ? <PlaySquare className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                        {getPostTypeLabel(post.type)}
                      </p>
                    </td>
                    <td className="max-w-[220px] truncate px-5 py-3 text-gray-600">{post.title}</td>
                    <td className="px-5 py-3 text-right">
                      <Link href="/greencreators" className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100">
                        Xử lý
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActionTables;