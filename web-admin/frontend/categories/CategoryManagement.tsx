import React from 'react';
import Sidebar from './Sidebar'; // Ensure your Sidebar path is correct
import Header from './components/categories/Header';
import PageHeader from './components/categories/PageHeader';
import CategoryStats from './components/categories/CategoryStats';
import CategoryTable from './components/categories/CategoryTable';

const CategoryManagement = () => {
  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        
        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <PageHeader />
            <CategoryStats />
            <CategoryTable />
          </div>
        </main>
      </div>
    </div>
  );
};

export default CategoryManagement;