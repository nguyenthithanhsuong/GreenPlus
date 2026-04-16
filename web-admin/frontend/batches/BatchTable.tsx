import React from 'react';
import { Package, Tag, Plus, Copy, QrCode, Edit2, Trash2 } from 'lucide-react';

// Mock Data
const batches = [
  {
    id: 1,
    batchCode: 'BCH-20260320-01',
    productName: 'Cà chua Cherry Thủy Canh',
    supplier: 'Nông trại Đà Lạt',
    harvestDate: '20/03/2026',
    expiryDate: '27/03/2026',
    expiryNote: 'Còn 7 ngày',
    expiryColor: 'text-[#059669]',
    quantity: 150,
    status: 'Available',
    statusBg: 'bg-emerald-50',
    statusText: 'text-[#059669]',
    canInQR: true,
    canEdit: true,
  },
  {
    id: 2,
    batchCode: 'BCH-20260318-05',
    productName: 'Xà Lách Thủy Canh',
    supplier: 'Nông trại Đà Lạt',
    harvestDate: '18/03/2026',
    expiryDate: '22/03/2026',
    expiryNote: 'Còn 2 ngày!',
    expiryColor: 'text-orange-500 font-bold',
    quantity: 50,
    status: 'Available',
    statusBg: 'bg-emerald-50',
    statusText: 'text-[#059669]',
    canInQR: true,
    canEdit: true,
  },
  {
    id: 3,
    batchCode: 'BCH-20260310-02',
    productName: 'Nấm Đùi Gà',
    supplier: 'GreenFarm Củ Chi',
    harvestDate: '10/03/2026',
    expiryDate: '15/03/2026',
    expiryNote: 'Đã hết hạn',
    expiryColor: 'text-red-500 font-bold',
    quantity: 30,
    status: 'Expired',
    statusBg: 'bg-red-50',
    statusText: 'text-red-600',
    canInQR: false,
    canEdit: false,
  },
];

const BatchTable = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      
      {/* Tabs */}
      <div className="flex items-center gap-6 px-6 border-b border-gray-100">
        <button className="flex items-center gap-2 py-4 text-sm font-bold text-[#059669] border-b-2 border-[#059669]">
          <Package className="w-4 h-4" /> Quản lý Lô hàng (Batches)
        </button>
        <button className="flex items-center gap-2 py-4 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
          <Tag className="w-4 h-4" /> Bảng giá & Lịch sử giá (Prices)
        </button>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-5 border-b border-gray-50 gap-4">
        <div className="flex items-center gap-3">
           <div className="h-9 w-40 md:w-48 border border-gray-200 rounded-lg bg-white"></div>
           <div className="h-9 w-40 md:w-48 border border-gray-200 rounded-lg bg-white"></div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Nhập lô mới
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 bg-white border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-medium">Mã Lô (Batch ID)</th>
              <th className="px-6 py-4 font-medium">Sản phẩm</th>
              <th className="px-6 py-4 font-medium">Ngày Thu Hoạch</th>
              <th className="px-6 py-4 font-medium">Hạn Sử Dụng</th>
              <th className="px-6 py-4 font-medium text-center">SL Khởi tạo</th>
              <th className="px-6 py-4 font-medium">Trạng thái</th>
              <th className="px-6 py-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 w-28 leading-tight">{batch.batchCode.replace('-', '-\n')}</span>
                    <button className="text-gray-400 hover:text-gray-600 transition-colors" title="Copy mã">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900 mb-0.5">{batch.productName}</p>
                  <p className="text-[11px] text-gray-500">NCC: {batch.supplier}</p>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {batch.harvestDate}
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-800 mb-0.5">{batch.expiryDate}</p>
                  <p className={`text-[11px] ${batch.expiryColor}`}>{batch.expiryNote}</p>
                </td>
                <td className="px-6 py-4 text-center font-bold text-gray-900">
                  {batch.quantity}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded text-[11px] font-bold ${batch.statusBg} ${batch.statusText}`}>
                    {batch.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {batch.canInQR && (
                      <button className="flex items-center gap-1.5 px-2 py-1.5 bg-emerald-50 text-[#059669] hover:bg-emerald-100 rounded text-[11px] font-bold transition-colors">
                        <QrCode className="w-3.5 h-3.5" /> In QR
                      </button>
                    )}
                    {batch.canEdit ? (
                      <button className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors" title="Sửa">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Xóa">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default BatchTable;