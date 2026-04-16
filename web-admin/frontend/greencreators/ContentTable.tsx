import React from 'react';
import { Eye, Check, X, Image as ImageIcon, PlaySquare, AlignLeft } from 'lucide-react';

// Mock Data
const contentItems = [
  {
    id: 1,
    title: 'Bữa sáng xanh mát...',
    snippet: 'Sáng nay mình thử kết hợp bơ hữu cơ mua từ...',
    thumbnail: 'https://images.unsplash.com/photo-1490645935967-10de6ba810e6?w=100&q=80',
    type: 'Community',
    author: 'Trần Ngọc Bích',
    authorAvatar: 'https://i.pravatar.cc/150?u=11',
    time: '10:30 AM',
    date: '19/03/2026',
    status: 'Pending',
    violation: null,
  },
  {
    id: 2,
    title: 'Đập hộp thùng rau...',
    snippet: 'Mọi người cùng xem rau tươi rói được giao đến...',
    thumbnail: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100&q=80',
    type: 'Video',
    author: 'Hoàng Nhật Huy',
    authorAvatar: 'https://i.pravatar.cc/150?u=12',
    time: '09:15 AM',
    date: '19/03/2026',
    status: 'Pending',
    violation: null,
  },
  {
    id: 3,
    title: '5 lợi ích tuyệt vời...',
    snippet: 'Bài viết cung cấp thông tin khoa học về hàm lượng...',
    thumbnail: null, // Fallback to icon
    type: 'Blog',
    author: 'Chuyên gia Dinh dưỡng',
    authorAvatar: 'https://i.pravatar.cc/150?u=13',
    time: '15:20 PM',
    date: '18/03/2026',
    status: 'Approved',
    violation: null,
  },
  {
    id: 4,
    title: 'Review nhà hàng...',
    snippet: 'Đến đây ăn rất ngon, menu phong phú...',
    thumbnail: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100&q=80',
    type: 'Community',
    author: 'Vương Gia Hân',
    authorAvatar: 'https://i.pravatar.cc/150?u=14',
    time: '11:00 AM',
    date: '17/03/2026',
    status: 'Rejected',
    violation: 'Vi phạm: Nội dung quảng cáo ngoài hệ...',
  },
];

const renderTypeBadge = (type: string) => {
  if (type === 'Community') return (
    <span className="px-2.5 py-1.5 bg-orange-50 text-orange-700 rounded-md text-xs font-semibold flex items-center w-fit gap-1.5">
      <ImageIcon className="w-3.5 h-3.5" /> Community
    </span>
  );
  if (type === 'Video') return (
    <span className="px-2.5 py-1.5 bg-purple-50 text-purple-700 rounded-md text-xs font-semibold flex items-center w-fit gap-1.5">
      <PlaySquare className="w-3.5 h-3.5" /> Video
    </span>
  );
  if (type === 'Blog') return (
    <span className="px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold flex items-center w-fit gap-1.5">
      <AlignLeft className="w-3.5 h-3.5" /> Blog
    </span>
  );
  return null;
};

const ContentTable = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      
      {/* Table Top Controls: Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-5 border-b border-gray-50 gap-4">
        <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-lg overflow-x-auto">
          <button className="px-4 py-1.5 text-sm font-medium bg-white shadow-sm rounded-md text-gray-900 whitespace-nowrap">Tất cả</button>
          <button className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-md whitespace-nowrap flex items-center gap-1.5">
            Chờ duyệt
            <span className="flex items-center justify-center px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-full">24</span>
          </button>
          <button className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-md whitespace-nowrap">Đã duyệt</button>
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
              <th className="px-6 py-4 font-medium w-[30%]">Nội dung (Title & Snippet)</th>
              <th className="px-6 py-4 font-medium">Loại (Type)</th>
              <th className="px-6 py-4 font-medium">Tác giả (Author)</th>
              <th className="px-6 py-4 font-medium">Ngày gửi</th>
              <th className="px-6 py-4 font-medium">Trạng thái</th>
              <th className="px-6 py-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {contentItems.map((item) => (
              <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-start gap-4">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.title} className="w-14 h-10 rounded-lg object-cover border border-gray-100 shrink-0" />
                    ) : (
                      <div className="w-14 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-400 border border-blue-100 shrink-0">
                        <AlignLeft className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-gray-900 mb-0.5">{item.title}</p>
                      {item.violation ? (
                        <p className="text-[11px] font-medium text-red-500 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          {item.violation}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 line-clamp-1">{item.snippet}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 align-top">
                  {renderTypeBadge(item.type)}
                </td>
                <td className="px-6 py-4 align-top">
                  <div className="flex items-center gap-2">
                    <img src={item.authorAvatar} alt={item.author} className="w-6 h-6 rounded-full object-cover" />
                    <span className="font-semibold text-gray-800">{item.author}</span>
                  </div>
                </td>
                <td className="px-6 py-4 align-top">
                  <p className="text-gray-500 text-xs mb-0.5">{item.time}</p>
                  <p className="text-gray-400 text-xs">{item.date}</p>
                </td>
                <td className="px-6 py-4 align-top">
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'Approved' ? 'bg-[#059669]' : item.status === 'Pending' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                    <span className={`font-semibold text-[13px] ${item.status === 'Approved' ? 'text-[#059669]' : item.status === 'Pending' ? 'text-yellow-600' : 'text-red-500'}`}>
                      {item.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right align-top">
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <button className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors" title="Xem chi tiết">
                      <Eye className="w-4 h-4" />
                    </button>
                    {item.status === 'Pending' && (
                      <>
                        <button className="p-1.5 text-gray-400 hover:text-[#059669] hover:bg-emerald-50 rounded-full transition-colors" title="Duyệt">
                          <Check className="w-4 h-4" strokeWidth={2.5} />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Từ chối">
                          <X className="w-4 h-4" strokeWidth={2.5} />
                        </button>
                      </>
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
          Hiển thị <span className="font-bold text-gray-900">1 - 4</span> trong tổng số <span className="font-bold text-gray-900">4,520</span> nội dung
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

export default ContentTable;