
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel h-16 flex items-center px-8 justify-between border-b border-slate-200 shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-md">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">库存导师</h1>
          <p className="text-xs font-bold text-slate-500 tracking-[1px] uppercase mt-1">存储论全景交互分析</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-6">
        <div className="hidden md:flex items-center space-x-2 px-4 py-1.5 bg-green-50 border border-green-100 rounded-full">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-bold text-green-700 uppercase">系统运行正常</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
