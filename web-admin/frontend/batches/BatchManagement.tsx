import React from 'react';
import Sidebar from './Sidebar'; // Ensure your Sidebar path is correct
import Header from './components/batches/Header';
import PageHeader from './components/batches/PageHeader';
import BatchStats from './components/batches/BatchStats';
import BatchTable from './components/batches/BatchTable';

const BatchManagement = () => {
  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        
        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <PageHeader />
            <BatchStats />
            <BatchTable />
          </div>
        </main>
      </div>
    </div>
  );
};

export default BatchManagement;