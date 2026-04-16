import React from 'react';
import { Search, Bell } from 'lucide-react';

const Header = () => {
  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 md:px-8 shrink-0">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input 
          type="text" 
          placeholder="Tìm kiếm bài viết, tác giả..." 
          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] focus:bg-white transition-colors"
        />
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
        </button>
        
        <div className="flex items-center gap-3 border-l border-gray-100 pl-6 cursor-pointer">
          <img 
            src="https://i.pravatar.cc/150?u=a042581f4e29026704d" 
            alt="User avatar" 
            className="w-9 h-9 rounded-full object-cover"
          />
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-900 leading-tight">Chí Cường</p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;