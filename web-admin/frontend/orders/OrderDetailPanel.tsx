import React from 'react';
import { X, MapPin, Phone, Calendar, Package, CreditCard, Check, XCircle } from 'lucide-react';

interface OrderDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

const OrderDetailPanel: React.FC<OrderDetailPanelProps> = ({ isOpen, onClose, orderId }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-3xl bg-gray-50 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Chi tiết Đơn hàng: #{orderId}</h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>10:30 AM, 20/03/2026</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-yellow-50 text-yellow-600 rounded-full text-xs font-bold flex items-center gap-1.5 border border-yellow-100">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
              Pending
            </span>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Top Row: Shipping Info & Tracking (Side by Side) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Shipping Info */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#059669]" /> Thông tin Nhận hàng
              </h3>
              <div className="space-y-3 text-sm flex-1">
                <p className="font-bold text-gray-900 text-base">Lê Văn Khoa</p>
                <p className="text-gray-600 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" /> 090 123 4567
                </p>
                <p className="text-gray-600 flex items-start gap-2 leading-relaxed">
                  <span className="text-gray-400 mt-0.5">≈</span>
                  Số 123, Đường Nguyễn Văn Linh, Phường Linh Trung, TP. Thủ Đức, TP.HCM
                </p>
              </div>
              
              {/* Note */}
              <div className="mt-4 p-3 bg-yellow-50/50 border border-yellow-100 rounded-lg">
                <p className="text-xs font-bold text-yellow-700 mb-1">Ghi chú của khách (Note):</p>
                <p className="text-sm text-gray-700 italic">&quot;Rau xà lách chọn cây non giúp mình, cà chua để riêng đừng đè lên nha.&quot;</p>
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Package className="w-4 h-4 text-[#059669]" /> Trạng thái Đơn hàng (Tracking)
              </h3>
              
              <div className="relative pl-3 space-y-6 before:absolute before:inset-y-2 before:left-[15px] before:w-0.5 before:bg-gray-100">
                {/* Step 1 - Active */}
                <div className="relative pl-6">
                  <div className="absolute left-[-5px] top-1 w-3 h-3 rounded-full bg-[#059669] ring-4 ring-emerald-50"></div>
                  <p className="font-bold text-gray-900 text-sm">Đơn hàng đã đặt (Pending)</p>
                  <p className="text-xs text-gray-400 mt-0.5">10:30 AM, 20/03/2026</p>
                </div>
                {/* Step 2 */}
                <div className="relative pl-6">
                  <div className="absolute left-[-5px] top-1 w-3 h-3 rounded-full bg-gray-200"></div>
                  <p className="font-medium text-gray-400 text-sm">Đã xác nhận (Confirmed)</p>
                </div>
                {/* Step 3 */}
                <div className="relative pl-6">
                  <div className="absolute left-[-5px] top-1 w-3 h-3 rounded-full bg-gray-200"></div>
                  <p className="font-medium text-gray-400 text-sm">Đang chuẩn bị hàng (Preparing)</p>
                </div>
                {/* Step 4 */}
                <div className="relative pl-6">
                  <div className="absolute left-[-5px] top-1 w-3 h-3 rounded-full bg-gray-200"></div>
                  <p className="font-medium text-gray-400 text-sm">Đang giao hàng (Delivering)</p>
                </div>
                {/* Step 5 */}
                <div className="relative pl-6">
                  <div className="absolute left-[-5px] top-1 w-3 h-3 rounded-full bg-gray-200"></div>
                  <p className="font-medium text-gray-400 text-sm">Giao thành công (Completed)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-[#059669]" /> Danh sách Sản phẩm (Items)
              </h3>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 font-medium">Sản phẩm</th>
                  <th className="px-5 py-3 font-medium text-center">SL</th>
                  <th className="px-5 py-3 font-medium text-right">Đơn giá</th>
                  <th className="px-5 py-3 font-medium text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img src="https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=50&h=50&fit=crop" alt="Xà lách" className="w-10 h-10 rounded-lg border border-gray-100" />
                      <div>
                        <p className="font-bold text-gray-900">Xà Lách Thủy Canh</p>
                        <p className="text-xs text-gray-500">Kg</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center font-bold text-gray-900">2</td>
                  <td className="px-5 py-3 text-right text-gray-600">45.000 đ</td>
                  <td className="px-5 py-3 text-right font-bold text-gray-900">90.000 đ</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=50&h=50&fit=crop" alt="Cà chua" className="w-10 h-10 rounded-lg border border-gray-100" />
                      <div>
                        <p className="font-bold text-gray-900">Cà chua Cherry Thủy Canh</p>
                        <p className="text-xs text-gray-500">Hộp 500g</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center font-bold text-gray-900">4</td>
                  <td className="px-5 py-3 text-right text-gray-600">65.000 đ</td>
                  <td className="px-5 py-3 text-right font-bold text-gray-900">260.000 đ</td>
                </tr>
              </tbody>
            </table>
            
            {/* Payment & Summary */}
            <div className="p-5 bg-gray-50/50 flex flex-col md:flex-row justify-between gap-6">
              {/* Payment Info */}
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#059669]" /> Thanh toán (Payment)
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between md:justify-start md:gap-8">
                    <span className="text-gray-500">Phương thức:</span>
                    <span className="font-bold text-gray-900">Tiền mặt (COD)</span>
                  </div>
                  <div className="flex justify-between md:justify-start md:gap-8">
                    <span className="text-gray-500">Trạng thái:</span>
                    <span className="font-bold text-red-500">Pending (Chưa thu)</span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="flex-1 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tạm tính (Subtotal):</span>
                  <span className="text-gray-900">350.000 đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phí giao hàng (Shipping Fee):</span>
                  <span className="text-gray-900">+ 20.000 đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Chiết khấu (Discount):</span>
                  <span className="text-gray-900">- 20.000 đ</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200 mt-3">
                  <span className="font-bold text-gray-900 text-base">Tổng cộng:</span>
                  <span className="font-bold text-[#059669] text-lg">350.000 đ</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-white border-t border-gray-100 shrink-0 flex items-center justify-between">
          <button className="flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-600 transition-colors">
            <XCircle className="w-4 h-4" /> Từ chối / Hủy đơn
          </button>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors"
            >
              Đóng
            </button>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-[#059669] hover:bg-[#047857] text-white rounded-lg text-sm font-bold transition-colors shadow-sm">
              Xác nhận Đơn hàng <Check className="w-4 h-4" strokeWidth={3} />
            </button>
          </div>
        </div>

      </div>
    </>
  );
};

export default OrderDetailPanel;