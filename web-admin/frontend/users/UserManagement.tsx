import React from 'react';
import Sidebar from './Sidebar'; // Adjust path if needed
import Header from './components/users/Header';
import PageHeader from './components/users/PageHeader';
import UserStats from './components/users/UserStats';
import UserTable from './components/users/UserTable';

const UserManagement = () => {
  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        
        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <PageHeader />
            <UserStats />
            <UserTable />
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserManagement;