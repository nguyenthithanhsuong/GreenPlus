import React from 'react';
import Sidebar from './Sidebar'; // Ensure your Sidebar path is correct
import Header from './components/orders/Header';
import PageHeader from './components/orders/PageHeader';
import OrderStats from './components/orders/OrderStats';
import OrderTable from './components/orders/OrderTable';

const OrderManagement = () => {
  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        
        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <PageHeader />
            <OrderStats />
            <OrderTable />
          </div>
        </main>
      </div>
    </div>
  );
};

export default OrderManagement;