import Link from 'next/link';
import AdminShell from '../../../frontend/shared/AdminShell';
const items=[
  {title:'Quản lý cửa hàng và dữ liệu',body:'Chọn đúng cửa hàng trước khi cập nhật sản phẩm, giá hoặc kho. Quản lý chỉ được xem cửa hàng mình được phân quyền.',href:'/settings/stores',label:'Quản lý cửa hàng'},
  {title:'Cấu hình giao hàng',body:'Thiết lập mức phí cơ bản và giới hạn vùng giao, lưu và kiểm tra báo giá trước khi mở bán.',href:'/settings/shipping',label:'Thiết lập phí ship'},
  {title:'Trợ lý AI và tri thức',body:'FAQ phải được duyệt mới được dùng làm nguồn trả lời. Mức Cao có thể phụ thuộc hạn mức provider.',href:'/ai/knowledge',label:'Quản lý tri thức'},
  {title:'Trao đổi với khách hàng',body:'Hỗ trợ hội thoại chung không cần đơn hàng, và giữ nguyên luồng tin nhắn theo đơn để điều phối giao vận.',href:'/ai/support/live',label:'Mở hội thoại'},
  {title:'Nhật ký vận hành',body:'Kiểm tra nhật ký audit và chỉ truy cập thông tin trong phạm vi quyền.',href:'/audit',label:'Xem audit'},
];
export default function AdminHelpPage(){return <AdminShell title="Trung tâm trợ giúp" description="Tài liệu thao tác dành cho Admin và Manager"><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{items.map(item=><article key={item.title} className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold text-emerald-950">{item.title}</h2><p className="mt-3 min-h-20 text-base leading-7 text-slate-600">{item.body}</p><Link href={item.href} className="mt-5 inline-flex rounded-xl bg-emerald-700 px-5 py-3 text-base font-semibold text-white transition hover:bg-emerald-800">{item.label}</Link></article>)}</div></AdminShell>}
