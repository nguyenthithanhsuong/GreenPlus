import React from 'react';
import { X, Edit, Info, PencilLine } from 'lucide-react';

// Mock Data
const suppliers = [
  {
    id: 1,
    initials: 'ND',
    avatarBg: 'bg-yellow-100 text-yellow-700',
    name: 'Nông trại Rau Sạch Đà Lạt',
    address: 'Phường 8, TP. Đà Lạt, Lâm Đồng',
    contactName: 'Nguyễn Văn Lên',
    contactPhone: '0933.111.222',
    certs: ['VietGAP'],
    date: '19/03/2026',
    status: 'Pending',
  },
  {
    id: 2,
    initials: 'BF',
    avatarBg: 'bg-yellow-100 text-yellow-700',
    name: 'Trang trại Heo Hữu Cơ BAF',
    address: 'Huyện Trảng Bom, Đồng Nai',
    contactName: 'Trần Đại Quang',
    contactPhone: '0988.333.444',
    certs: ['GlobalGAP'],
    date: '18/03/2026',
    status: 'Pending',
  },
  {
    id: 3,
    initials: 'GF',
    avatarBg: 'bg-emerald-100 text-emerald-700',
    name: 'Green Farm Củ Chi',
    address: 'Xã An Nhơn Tây, Củ Chi, TP.HCM',
    contactName: 'Lê Hữu Nghĩa',
    contactPhone: '0912.456.789',
    certs: ['Organic', 'VietGAP'],
    date: '15/01/2026',
    status: 'Approved',
  },
  {
    id: 4,
    initials: 'OL',
    avatarBg: 'bg-blue-100 text-blue-700',
    name: 'Organic Life Cần Thơ',
    address: 'Quận Bình Thủy, TP. Cần Thơ',
    contactName: 'Phạm Băng Băng',
    contactPhone: '0909.888.999',
    certs: ['GlobalGAP'],
    date: '10/02/2026',
    status: 'Approved',
  },
  {
    id: 5,
    initials: 'SC',
    avatarBg: 'bg-gray-200 text-gray-700',
    name: 'Thủy hải sản Sáu Cua',
    address: 'Huyện Cần Giờ, TP.HCM',
    contactName: 'Trần Văn Sáu',
    contactPhone: '0977.666.555',
    certs: [],
    date: '05/03/2026',
    status: 'Rejected',
  },
];

const renderCertPill = (cert: string) => {
  if (cert === 'VietGAP') return <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[11px] font-semibold border border-emerald-100">VietGAP</span>;
  if (cert === 'GlobalGAP') return <span className="px-2 py-1 bg-teal-50 text-teal-600 rounded text-[11px] font-semibold border border-teal-100">GlobalGAP</span>;
  if (cert === 'Organic') return <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[11px] font-semibold border border-blue-100">Organic</span>;
  return null;
};

const SupplierTable = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      
      {/* Table Top Controls: Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-5 border-b border-gray-50 gap-4">
        <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-lg overflow-x-auto">
          <button className="px-4 py-1.5 text-sm font-medium bg-white shadow-sm rounded-md text-gray-900 whitespace-nowrap">Tất cả</button>
          <button className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-md whitespace-nowrap">Đang hoạt động</button>
          <button className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-md whitespace-nowrap flex items-center gap-1.5">
            Chờ duyệt
            <span className="flex items-center justify-center w-5 h-5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-full">3</span>
          </button>
          <button className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-md whitespace-nowrap">Đã từ chối/Khóa</button>
        </div>

        <div className="flex items-center gap-2">
           <div className="h-9 w-40 border border-gray-200 rounded-lg bg-gray-50 hidden sm:block"></div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-medium">Tên Nhà cung cấp</th>
              <th className="px-6 py-4 font-medium">Liên hệ (Contact)</th>
              <th className="px-6 py-4 font-medium">Chứng nhận</th>
              <th className="px-6 py-4 font-medium">Ngày tham gia/Đăng ký</th>
              <th className="px-6 py-4 font-medium">Trạng thái</th>
              <th className="px-6 py-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${supplier.avatarBg}`}>
                      {supplier.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{supplier.name}</p>
                      <p className="text-xs text-gray-500">{supplier.address}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-800">{supplier.contactName}</p>
                  <p className="text-xs text-gray-500">{supplier.contactPhone}</p>
                </td>
                <td className="px-6 py-4">
                  {supplier.certs.length > 0 ? (
                    <div className="flex flex-col gap-1 items-start">
                      {supplier.certs.map(cert => <div key={cert}>{renderCertPill(cert)}</div>)}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">Không có</span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-600">{supplier.date}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${supplier.status === 'Approved' ? 'bg-[#059669]' : supplier.status === 'Pending' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                    <span className={`font-medium ${supplier.status === 'Approved' ? 'text-gray-700' : supplier.status === 'Pending' ? 'text-yellow-600' : 'text-red-600'}`}>
                      {supplier.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right align-middle">
                  <div className="flex items-center justify-end gap-3">
                    {supplier.status === 'Pending' && (
                      <>
                        <button className="px-3 py-1.5 bg-[#059669] hover:bg-[#047857] text-white rounded-md text-xs font-semibold transition-colors shadow-sm">
                          Duyệt ngay
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors border border-gray-200">
                           <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {supplier.status === 'Approved' && (
                       <>
                         <button className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors"><Edit className="w-4 h-4" /></button>
                         <button className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors"><PencilLine className="w-4 h-4" /></button>
                       </>
                    )}
                    {supplier.status === 'Rejected' && (
                       <button className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors"><Info className="w-4 h-4" /></button>
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
          Hiển thị <span className="font-bold text-gray-900">1 - 5</span> trong tổng số <span className="font-bold text-gray-900">156</span>
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

export default SupplierTable;