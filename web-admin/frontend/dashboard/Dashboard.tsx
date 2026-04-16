import React from 'react';
import Sidebar from './Sidebar'; // Ensure this matches your Sidebar path
import Header from './components/dashboard/Header';
import StatCards from './components/dashboard/StatCards';
import Charts from './components/dashboard/Charts';
import ActionTables from './components/dashboard/ActionTables';
import { Calendar } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        
        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tổng quan hệ thống</h1>
                <p className="text-gray-500 text-sm mt-1">Chào mừng quay trở lại. Đây là tình hình hoạt động của GreenPlus hôm nay.</p>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm text-sm font-medium text-gray-700">
                <Calendar className="w-4 h-4" />
                <span>19 Tháng 3, 2026</span>
              </div>
            </div>

            <StatCards />
            <Charts />
            <ActionTables />
            
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;