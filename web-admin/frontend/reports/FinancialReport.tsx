import React from 'react';
import Sidebar from './Sidebar'; // Ensure your Sidebar path is correct
import Header from './components/reports/Header';
import PageHeader from './components/reports/PageHeader';
import ReportStats from './components/reports/ReportStats';
import ReportCharts from './components/reports/ReportCharts';
import TransactionHistory from './components/reports/TransactionHistory';

const FinancialReport = () => {
  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        
        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <PageHeader />
            <ReportStats />
            <ReportCharts />
            <TransactionHistory />
          </div>
        </main>
      </div>
    </div>
  );
};

export default FinancialReport;