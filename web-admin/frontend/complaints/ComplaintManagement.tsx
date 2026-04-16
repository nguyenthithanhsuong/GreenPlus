ComplaintManagement.tsximport React from 'react';
import Sidebar from './Sidebar'; // Ensure your Sidebar path is correct
import Header from './components/complaints/Header';
import PageHeader from './components/complaints/PageHeader';
import ComplaintStats from './components/complaints/ComplaintStats';
import ComplaintTable from './components/complaints/ComplaintTable';

const ComplaintManagement = () => {
  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        
        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <PageHeader />
            <ComplaintStats />
            <ComplaintTable />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ComplaintManagement;