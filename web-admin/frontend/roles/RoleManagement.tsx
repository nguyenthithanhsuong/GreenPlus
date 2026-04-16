import React from 'react';
import Sidebar from './Sidebar'; // Ensure your Sidebar path is correct
import Header from './components/roles/Header';
import PageHeader from './components/roles/PageHeader';
import RoleGrid from './components/roles/RoleGrid';

const RoleManagement = () => {
  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        
        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-white/50">
          <div className="max-w-7xl mx-auto space-y-8">
            <PageHeader />
            <RoleGrid />
          </div>
        </main>
      </div>
    </div>
  );
};

export default RoleManagement;