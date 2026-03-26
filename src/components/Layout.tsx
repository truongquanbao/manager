import React from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Bell, Search, Settings as SettingsIcon } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-8 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm z-10">
          <div className="flex items-center flex-1">
            <div className="relative w-96 hidden lg:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Tìm kiếm cư dân, căn hộ, hóa đơn..." 
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-transparent focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 rounded-2xl text-sm transition-all outline-none dark:text-white"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button className="p-2.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors relative bg-slate-50 dark:bg-slate-800 rounded-xl group">
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900 group-hover:animate-ping"></span>
              </button>
              <button className="p-2.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-slate-50 dark:bg-slate-800 rounded-xl">
                <SettingsIcon size={20} />
              </button>
            </div>
            
            <div className="flex items-center space-x-4 border-l border-slate-100 dark:border-slate-800 pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{profile?.fullName}</p>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">{profile?.role}</p>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 cursor-pointer hover:scale-105 transition-transform">
                <User size={20} />
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-slate-950 p-8">
          {children}
        </main>
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex justify-between items-center">
          <div className="flex items-center">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-2 animate-pulse"></div>
            Hệ thống: <span className="text-green-500 ml-1">Đang hoạt động</span>
          </div>
          <div>Apartment Manager Pro v1.0.0 | {new Date().getFullYear()} © Building Care Inspired</div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
