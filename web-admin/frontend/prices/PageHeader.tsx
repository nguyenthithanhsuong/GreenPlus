import React from 'react';

const PageHeader = () => {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-bold text-gray-900">Lô hàng & Bảng giá</h1>
      <p className="text-gray-500 text-sm">
        Quản lý lô hàng nhập (Batches), hạn sử dụng và thiết lập giá bán (Prices).
      </p>
    </div>
  );
};

export default PageHeader;