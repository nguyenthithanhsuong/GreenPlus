import React from 'react';
import Sidebar from './Sidebar'; // Ensure your Sidebar path is correct
import Header from './components/inventories/Header';
import PageHeader from './components/inventories/PageHeader';
import InventoryStats from './components/inventories/InventoryStats';
import InventoryTable from './components/inventories/InventoryTable';

const InventoryManagement = () => {
  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        
        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <PageHeader />
            <InventoryStats />
            <InventoryTable />
          </div>
        </main>
      </div>
    </div>
  );
};

export default InventoryManagement;