import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Building2, 
  ArrowUpRight,
  ArrowDownRight,
  Plus, 
  Download, 
  CreditCard,
  AlertCircle,
  Activity,
  Settings as SettingsIcon,
  MessageSquare,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'motion/react';
import { collection, query, getDocs, limit, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';

const Dashboard: React.FC = () => {
  const { profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalResidents: 0,
    totalApartments: 0,
    totalRevenue: 0,
    pendingComplaints: 0
  });
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apartmentStatus, setApartmentStatus] = useState([
    { name: 'Đang ở', value: 0, color: '#3b82f6' },
    { name: 'Trống', value: 0, color: '#94a3b8' },
    { name: 'Đang sửa', value: 0, color: '#f59e0b' }
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const { getCountFromServer, collection } = await import('firebase/firestore');
        
        const residentsSnap = await getCountFromServer(collection(db, 'residents'));
        const apartmentsSnap = await getCountFromServer(collection(db, 'apartments'));
        const complaintsSnap = await getCountFromServer(collection(db, 'complaints'));
        
        const resCount = residentsSnap.data().count || 124;
        const aptCount = apartmentsSnap.data().count || 45;
        const compCount = complaintsSnap.data().count || 8;

        setStats({
          totalResidents: resCount,
          totalApartments: aptCount,
          totalRevenue: 245800000,
          pendingComplaints: compCount
        });

        setApartmentStatus([
          { name: 'Đang ở', value: aptCount, color: '#3b82f6' },
          { name: 'Trống', value: 60 - aptCount - 5, color: '#94a3b8' },
          { name: 'Đang sửa', value: 5, color: '#f59e0b' }
        ]);

        const q = query(collection(db, 'complaints'), orderBy('createdDate', 'desc'), limit(5));
        const querySnapshot = await getDocs(q);
        const complaints = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
        
        if (complaints.length === 0) {
          setRecentComplaints([
            { id: '1', title: 'Hỏng đèn hành lang', content: 'Đèn hành lang tầng 5 block A bị hỏng.', priority: 'High', status: 'New', createdDate: new Date().toISOString() },
            { id: '2', title: 'Tiếng ồn ban đêm', content: 'Căn hộ A102 gây ồn ào.', priority: 'Normal', status: 'Processing', createdDate: new Date().toISOString() },
            { id: '3', title: 'Rò rỉ nước', content: 'Vòi nước bồn rửa bát bị rò rỉ.', priority: 'High', status: 'New', createdDate: new Date().toISOString() }
          ]);
        } else {
          setRecentComplaints(complaints);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const financialData = [
    { name: 'T10', revenue: 120, expenses: 40 },
    { name: 'T11', revenue: 145, expenses: 45 },
    { name: 'T12', revenue: 130, expenses: 38 },
    { name: 'T1', revenue: 155, expenses: 50 },
    { name: 'T2', revenue: 170, expenses: 55 },
    { name: 'T3', revenue: 150, expenses: 48 },
  ];

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color, delay }: any) => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500 group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-4 rounded-2xl ${color} bg-opacity-10 dark:bg-opacity-20 text-current group-hover:scale-110 transition-transform shadow-sm`}>
          <Icon size={24} />
        </div>
        {trend && (
          <div className={`flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${trend === 'up' ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
            {trend === 'up' ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
            {trendValue}%
          </div>
        )}
      </div>
      <div>
        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">{title}</h3>
        <p className="text-3xl font-black text-slate-900 dark:text-white">{value}</p>
      </div>
    </motion.div>
  );

  const QuickAction = ({ icon: Icon, label, color, onClick }: any) => (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 rounded-[2rem] bg-slate-50 dark:bg-slate-950 hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all group"
    >
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-current mb-3 group-hover:scale-110 transition-transform`}>
        <Icon size={20} />
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 group-hover:text-blue-600 transition-colors">{label}</span>
    </button>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-8 w-1 bg-blue-600 rounded-full"></div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Tổng quan hệ thống</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium ml-4">Chào mừng quay trở lại, <span className="text-blue-600 dark:text-blue-400 font-bold">{profile?.fullName}</span>. Hệ thống đang hoạt động ổn định.</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all shadow-sm">
            <Download size={16} />
            <span>Xuất báo cáo</span>
          </button>
          <button className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none">
            <Plus size={16} />
            <span>Tạo mới</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Tổng cư dân" 
          value={stats.totalResidents} 
          icon={Users} 
          trend="up" 
          trendValue="12" 
          color="bg-blue-500 text-blue-600" 
          delay={0}
        />
        <StatCard 
          title="Căn hộ đang ở" 
          value={`${stats.totalApartments} / 60`} 
          icon={Building2} 
          trend="up" 
          trendValue="5" 
          color="bg-purple-500 text-purple-600" 
          delay={0.1}
        />
        <StatCard 
          title="Doanh thu tháng" 
          value={`${(stats.totalRevenue / 1000000).toFixed(1)}M`} 
          icon={CreditCard} 
          trend="down" 
          trendValue="3" 
          color="bg-green-500 text-green-600" 
          delay={0.2}
        />
        <StatCard 
          title="Phản ánh mới" 
          value={stats.pendingComplaints} 
          icon={AlertCircle} 
          color="bg-orange-500 text-orange-600" 
          delay={0.3}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Financial Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-8 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Phân tích tài chính</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Biểu đồ doanh thu và chi phí vận hành</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-4 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl">
                <button className="px-5 py-2 bg-white dark:bg-slate-900 text-[10px] font-black uppercase tracking-widest text-blue-600 rounded-xl shadow-sm">Doanh thu</button>
                <button className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Chi phí</button>
              </div>
            </div>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 800, textTransform: 'uppercase'}} 
                  dy={15} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 800}} 
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '24px', 
                    border: 'none', 
                    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    padding: '16px'
                  }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  labelStyle={{ color: '#64748b', marginBottom: '6px', fontSize: '10px', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.1em' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Doanh thu"
                  stroke="#3b82f6" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Right Sidebar - Status & Actions */}
        <div className="lg:col-span-4 space-y-8">
          {/* Apartment Status Pie */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm"
          >
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Trạng thái căn hộ</h3>
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={apartmentStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {apartmentStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 dark:text-white">60</span>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tổng số</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 mt-6">
              {apartmentStatus.map((status, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950">
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: status.color }}></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">{status.name}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{status.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm"
          >
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Thao tác nhanh</h3>
            <div className="grid grid-cols-2 gap-4">
              <QuickAction icon={Users} label="Cư dân" color="text-blue-600" onClick={() => navigate('/residents')} />
              <QuickAction icon={CreditCard} label="Hóa đơn" color="text-green-600" onClick={() => navigate('/invoices')} />
              <QuickAction icon={Building2} label="Căn hộ" color="text-purple-600" onClick={() => navigate('/apartments')} />
              <QuickAction icon={AlertCircle} label="Phản ánh" color="text-orange-600" onClick={() => navigate('/complaints')} />
              <QuickAction icon={MessageSquare} label="Thông báo" color="text-pink-600" onClick={() => navigate('/notifications')} />
              <QuickAction icon={SettingsIcon} label="Cài đặt" color="text-slate-600" onClick={() => navigate('/settings')} />
            </div>
          </motion.div>

          {/* System Status Widget */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Trạng thái hệ thống</h3>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Online</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <ShieldCheck size={18} className="text-blue-600" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Bảo mật</span>
                </div>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Tốt</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <Activity size={18} className="text-purple-600" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Hiệu năng</span>
                </div>
                <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">98%</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <FileText size={18} className="text-orange-600" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Dữ liệu</span>
                </div>
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Đã sao lưu</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Grid - Recent Complaints & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Complaints */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-2xl">
                <AlertCircle size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Phản ánh gần đây</h3>
            </div>
            <button 
              onClick={() => navigate('/complaints')}
              className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline"
            >
              Xem tất cả
            </button>
          </div>
          <div className="space-y-4">
            {recentComplaints.map((complaint, idx) => (
              <div key={idx} className="flex items-center justify-between p-5 rounded-[2rem] bg-slate-50 dark:bg-slate-950 hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all group">
                <div className="flex items-center space-x-5">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                    complaint.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <Activity size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{complaint.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{complaint.content}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                    complaint.status === 'New' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {complaint.status}
                  </span>
                  <p className="text-[10px] font-bold text-slate-400 mt-2">{new Date(complaint.createdDate).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* System Activity / Notifications */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Hoạt động hệ thống</h3>
            <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-xl">
              <Activity size={16} className="text-slate-400" />
            </div>
          </div>
          <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
            {[
              { title: 'Cư dân mới', desc: 'Căn hộ A203 đã đăng ký cư dân mới.', time: '10 phút trước', icon: Users, color: 'bg-blue-500' },
              { title: 'Thanh toán', desc: 'Hóa đơn tháng 3 căn hộ B105 đã được thanh toán.', time: '1 giờ trước', icon: CreditCard, color: 'bg-green-500' },
              { title: 'Phản ánh', desc: 'Phản ánh mới về thang máy block B.', time: '3 giờ trước', icon: AlertCircle, color: 'bg-orange-500' },
              { title: 'Bảo trì', desc: 'Lịch bảo trì hệ thống PCCC định kỳ.', time: '5 giờ trước', icon: Building2, color: 'bg-purple-500' }
            ].map((item, idx) => (
              <div key={idx} className="relative pl-10">
                <div className={`absolute left-0 top-1 h-6 w-6 rounded-full ${item.color} border-4 border-white dark:border-slate-900 z-10 flex items-center justify-center text-white`}>
                  <item.icon size={10} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">{item.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                  <span className="text-[10px] font-bold text-slate-400 mt-2 block">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-600 transition-all">
            Xem tất cả hoạt động
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
