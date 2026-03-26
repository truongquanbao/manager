import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileText, 
  MessageSquare, 
  Bell, 
  Car, 
  UserPlus, 
  Settings, 
  ShieldCheck,
  Package,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { profile, isAdmin, isManager, isResident } = useAuth();

  const handleLogout = () => {
    signOut(auth);
  };

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['Super Admin', 'Manager', 'Resident'] },
    { name: 'Quản lý tài khoản', icon: ShieldCheck, path: '/accounts', roles: ['Super Admin'] },
    { name: 'Căn hộ', icon: Building2, path: '/apartments', roles: ['Super Admin', 'Manager', 'Resident'] },
    { name: 'Cư dân', icon: Users, path: '/residents', roles: ['Super Admin', 'Manager'] },
    { name: 'Hóa đơn', icon: FileText, path: '/invoices', roles: ['Super Admin', 'Manager', 'Resident'] },
    { name: 'Phản ánh', icon: MessageSquare, path: '/complaints', roles: ['Super Admin', 'Manager', 'Resident'] },
    { name: 'Thông báo', icon: Bell, path: '/notifications', roles: ['Super Admin', 'Manager', 'Resident'] },
    { name: 'Phương tiện', icon: Car, path: '/vehicles', roles: ['Super Admin', 'Manager', 'Resident'] },
    { name: 'Khách ra vào', icon: UserPlus, path: '/visitors', roles: ['Super Admin', 'Manager', 'Resident'] },
    { name: 'Tài sản', icon: Package, path: '/assets', roles: ['Super Admin', 'Manager'] },
    { name: 'Cấu hình', icon: Settings, path: '/settings', roles: ['Super Admin'] },
  ];

  const filteredMenu = menuItems.filter(item => {
    if (isAdmin) return item.roles.includes('Super Admin');
    if (isManager) return item.roles.includes('Manager');
    if (isResident) return item.roles.includes('Resident');
    return false;
  });

  return (
    <div className="w-72 bg-slate-900 dark:bg-slate-950 text-white flex flex-col border-r border-slate-800 transition-all duration-300 relative z-20">
      {/* Logo Section */}
      <div className="p-8 flex items-center space-x-4">
        <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Building2 size={28} className="text-white" />
        </div>
        <div>
          <span className="text-xl font-black tracking-tight block">APM <span className="text-blue-500">PRO</span></span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Management</span>
        </div>
      </div>
      
      {/* Navigation Section */}
      <nav className="flex-1 py-4 overflow-y-auto no-scrollbar">
        <div className="px-6 mb-4">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-6 px-4">Menu chính</p>
          <ul className="space-y-1.5">
            {filteredMenu.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                    location.pathname === item.path 
                      ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" 
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  )}
                >
                  <div className="flex items-center space-x-4">
                    <item.icon size={20} className={cn(
                      "transition-all duration-300",
                      location.pathname === item.path ? "scale-110" : "text-slate-500 group-hover:text-slate-300 group-hover:scale-110"
                    )} />
                    <span className="text-sm font-bold tracking-tight">{item.name}</span>
                  </div>
                  {location.pathname === item.path ? (
                    <motion.div 
                      layoutId="active-pill"
                      className="h-1.5 w-1.5 rounded-full bg-white"
                    />
                  ) : (
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-slate-600" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Footer Section - User Profile & Logout */}
      <div className="p-6 border-t border-slate-800/50">
        <div className="bg-slate-800/40 rounded-[2rem] p-4 border border-slate-700/30">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-600/20">
              {profile?.fullName?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white truncate">{profile?.fullName}</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">{profile?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all group"
          >
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Đăng xuất</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
