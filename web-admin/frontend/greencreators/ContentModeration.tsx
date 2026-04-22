import ContentStats from "./ContentStats";
import ContentTable from "./ContentTable";
import AdminShell from "../shared/AdminShell";

const ContentModeration = () => {
  return (
    <AdminShell
      title="Kiểm duyệt nội dung"
      description="Duyệt bài đăng, hình ảnh và nội dung cộng đồng Green Creators."
      searchPlaceholder="Tìm kiếm bài đăng, tác giả..."
    >
      <ContentStats />
      <ContentTable />
    </AdminShell>
  );
};

export default ContentModeration;