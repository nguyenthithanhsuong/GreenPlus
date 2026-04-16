import React from 'react';

const PageHeader = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Khiếu nại (Complaints)</h1>
        <p className="text-gray-500 text-sm mt-1">
          Xử lý các yêu cầu hoàn tiền, đổi trả và phản hồi từ khách hàng.
        </p>
      </div>
      {/* No action buttons required on the right for this specific page design */}
    </div>
  );
};

export default PageHeader;