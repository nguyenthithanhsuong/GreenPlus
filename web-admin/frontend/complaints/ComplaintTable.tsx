import React from 'react';
import { CreditCard, RefreshCcw, MessageSquare, Package, Eye, Info } from 'lucide-react';

// Mock Data
const complaints = [
  {
    id: 1,
    customer: 'Nguyễn Minh Trí',
    avatar: 'https://i.pravatar.cc/150?u=21',
    orderId: 'ORD-9981',
    type: 'Hoàn tiền',
    reasonTitle: 'Thực phẩm bị dập nát',
    reasonDesc: 'Hộp cà chua cherry và dâu tây giao đến nơi bị dập nát chảy nước không sử dụng được. Yêu cầu hoà...',
    time: '08:30 AM',
    date: '20/03/2026',
    statusText: 'Pending',
    statusColor: 'text-red-500',
    dotColor: 'bg-red-500',
    actionType: 'primary', // Green button
  },
  {
    id: 2,
    customer: 'Trần Lan Ngọc',
    avatar: 'https://i.pravatar.cc/150?u=22',
    orderId: 'ORD-9982',
    type: 'Đổi trả hàng',
    reasonTitle: 'Giao nhầm sản phẩm',
    reasonDesc: 'Mình đặt rau xà lách thủy canh nhưng shop lại giao cải thìa. Xin vui lòng đổi lại giúp mình.',
    time: '19:15 PM',
    date: '19/03/2026',
    statusText: 'Pending',
    statusColor: 'text-red-500',
    dotColor: 'bg-red-500',
    actionType: 'primary',
  },
  {
    id: 3,
    customer: 'Lê Hải Đăng',
    avatar: 'https://i.pravatar.cc/150?u=23',
    orderId: 'Phản hồi chung',
    isGeneral: true,
    type: 'Góp ý',
    reasonTitle: 'Ứng dụng chậm',
    reasonDesc: 'Khi tìm kiếm sản phẩm vào giờ cao điểm app load rất lâu, mong đội ngũ kỹ thuật tối ưu lại.',
    time: '14:20 PM',
    date: '19/03/2026',
    statusText: 'Pending',
    statusColor: 'text-yellow-600',
    dotColor: 'bg-yellow-500',
    actionType: 'secondary', // Gray button
  },
  {
    id: 4,
    customer: 'Phạm Băng',
    avatar: 'https://i.pravatar.cc/150?u=24',
    orderId: 'ORD-9910',
    type: 'Hoàn tiền',
    reasonTitle: 'Giao thiếu 1kg khoai tây Đà Lạt.',
    reasonDesc: '',
    time: '10:00 AM',
    date: '18/03/2026',
    statusText: 'Resolved',
    statusColor: 'text-[#059669]',
    dotColor: 'bg-[#059669]',
    actionType: 'icon', // Eye icon
  },
  {
    id: 5,
    customer: 'Kiều Trinh',
    avatar: 'https://i.pravatar.cc/150?u=25',
    orderId: 'ORD-9950',
    type: 'Đổi trả hàng',
    reasonTitle: 'Rau héo không tươi như hình.',
    reasonDesc: '',
    violation: 'Bằng chứng không hợp lệ (hình mờ).',
    time: '15:00 PM',
    date: '17/03/2026',
    statusText: 'Rejected',
    statusColor: 'text-gray-500',
    dotColor: 'bg-gray-400',
    actionType: 'icon',
  },
];

// Helper to render the Type Badge
const renderTypeBadge = (type: string) => {
  if (type === 'Hoàn tiền') return (
    <span className="px-2.5 py-1.5 bg-red-50 text-red-600 rounded-md text-xs font-semibold flex items-center w-fit gap-1.5 border border-red-100">
      <CreditCard className="w-3.5 h-3.5" /> Hoàn tiền
    </span>
  );
  if (type === 'Đổi trả hàng') return (
    <span className="px-2.5 py-1.5 bg-orange-50 text-orange-600 rounded-md text-xs font-semibold flex items-center w-fit gap-1.5 border border-orange-100">
      <RefreshCcw className="w-3.5 h-3.5" /> Đổi trả hàng
    </span>
  );
  if (type === 'Góp ý') return (
    <span className="px-2.5 py-1.5 bg-blue-50 text-blue-600 rounded-md text-xs font-semibold flex items-center w-fit gap-1.5 border border-blue-100">
      <MessageSquare className="w-3.5 h-3.5" /> Góp ý
    </span>
  );
  return null;
};

const ComplaintTable = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      
      {/* Table Top Controls: Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-5 border-b border-gray-50 gap-4">
        <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-lg overflow-x-auto">
          <button className="px-4 py-1.5 text-sm font-medium bg-white shadow-sm rounded-md text-gray-900 whitespace-nowrap">Tất cả</button>
          <button className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-md whitespace-nowrap flex items-center gap-1.5">
            Chờ xử lý
            <span className="flex items-center justify-center px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">5</span>
          </button>
          <button className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-md whitespace-nowrap">Đã giải quyết</button>
          <button className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-md whitespace-nowrap">Đã từ chối</button>
        </div>

        <div className="flex items-center gap-2">
           <div className="h-9 w-32 border border-gray-200 rounded-lg bg-gray-50 hidden sm:block"></div>
           <div className="h-9 w-32 border border-gray-200 rounded-lg bg-gray-50 hidden sm:block"></div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-medium">Khách hàng / Mã Đơn</th>
              <th className="px-6 py-4 font-medium">Phân loại (Type)</th>
              <th className="px-6 py-4 font-medium w-1/3">Nội dung (Reason)</th>
              <th className="px-6 py-4 font-medium">Ngày gửi</th>
              <th className="px-6 py-4 font-medium">Trạng thái</th>
              <th className="px-6 py-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((item) => (
              <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={item.avatar} alt={item.customer} className="w-10 h-10 rounded-full object-cover shrink-0" />
                    <div>
                      <p className="font-bold text-gray-900 mb-0.5">{item.customer}</p>
                      <p className={`text-[11px] font-medium flex items-center gap-1 ${item.isGeneral ? 'text-gray-500' : 'text-[#059669]'}`}>
                        {!item.isGeneral && <Package className="w-3 h-3" />}
                        {item.orderId}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 align-top pt-5">
                  {renderTypeBadge(item.type)}
                </td>
                <td className="px-6 py-4 align-top">
                  <p className="font-bold text-gray-800 mb-1">{item.reasonTitle}</p>
                  {item.reasonDesc && (
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{item.reasonDesc}</p>
                  )}
                  {item.violation && (
                    <p className="text-[11px] font-medium text-red-500 flex items-center gap-1 mt-1">
                      <Info className="w-3.5 h-3.5" />
                      {item.violation}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4 align-top pt-5">
                  <p className="text-gray-500 text-xs mb-0.5">{item.time}</p>
                  <p className="text-gray-400 text-xs">{item.date}</p>
                </td>
                <td className="px-6 py-4 align-top pt-5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${item.dotColor}`}></span>
                    <span className={`font-semibold text-[13px] ${item.statusColor}`}>
                      {item.statusText}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right align-top pt-4">
                  <div className="flex items-center justify-end">
                    {item.actionType === 'primary' && (
                      <button className="px-4 py-1.5 bg-[#059669] hover:bg-[#047857] text-white rounded-md text-xs font-semibold transition-colors shadow-sm">
                        Xử lý ngay
                      </button>
                    )}
                    {item.actionType === 'secondary' && (
                      <button className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-xs font-semibold transition-colors shadow-sm">
                        Xem & Đóng
                      </button>
                    )}
                    {item.actionType === 'icon' && (
                      <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors" title="Xem chi tiết">
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
        <span className="text-sm text-gray-500">
          Hiển thị <span className="font-bold text-gray-900">1 - 5</span> trong tổng số <span className="font-bold text-gray-900">138</span> khiếu nại
        </span>
        
        <div className="flex items-center gap-1">
          <button className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">&lt;</button>
          <button className="w-8 h-8 flex items-center justify-center border border-[#059669] bg-[#059669] text-white rounded-lg text-sm font-medium">1</button>
          <button className="w-8 h-8 flex items-center justify-center border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium">2</button>
          <button className="w-8 h-8 flex items-center justify-center border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium">3</button>
          <span className="px-1 text-gray-400">...</span>
          <button className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">&gt;</button>
        </div>
      </div>

    </div>
  );
};

export default ComplaintTable;