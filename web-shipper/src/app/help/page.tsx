import Link from 'next/link';
import ShipperShell from '../../frontend/shared/ShipperShell';
const help=[
  {title:'Nhận và xử lý đơn',text:'Chỉ nhận đơn được phân công và kiểm tra thông tin giao hàng trước khi di chuyển.',href:'/',label:'Xem đơn'},
  {title:'Điều hướng và vị trí',text:'Bật quyền vị trí khi giao hàng, không chia sẻ vị trí ngoài phiên làm việc; định tuyến có thể phụ thuộc nhà cung cấp bản đồ.',href:'/',label:'Bảng điều khiển'},
  {title:'Liên hệ khách hàng',text:'Tin nhắn chỉ được tạo từ đơn đã phân công. Không chia sẻ OTP hoặc thông tin thanh toán ngoài hệ thống.',href:'/support/live',label:'Mở tin nhắn'},
  {title:'Báo sự cố',text:'Nếu giao thất bại hoặc gặp sự cố thu COD, lưu lý do và liên hệ Manager để đối soát.',href:'/profile',label:'Hồ sơ'},
];
export default function ShipperHelpPage(){return <ShipperShell title="Trung tâm trợ giúp" description="Hướng dẫn giao vận và liên hệ cửa hàng" icon="help"><div className="grid gap-4 md:grid-cols-2">{help.map(item=><article key={item.title} className="gp-card p-5"><h2 className="text-lg font-bold text-emerald-950">{item.title}</h2><p className="my-3 text-base leading-7 text-slate-600">{item.text}</p><Link href={item.href} className="inline-flex rounded-xl bg-emerald-700 px-4 py-3 text-base font-bold text-white">{item.label}</Link></article>)}</div></ShipperShell>}
