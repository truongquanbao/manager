import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  User,
  Phone,
  Mail,
  CreditCard,
  Building2,
  X,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Residents: React.FC = () => {
  const { isAdmin, isManager } = useAuth();
  const [residents, setResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    cccd: '',
    phone: '',
    email: '',
    apartmentId: '',
    residentType: 'Owner',
    status: 'Active'
  });

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'residents'), orderBy('fullName', 'asc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      setResidents(data);
    } catch (error) {
      console.error('Error fetching residents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingResident) {
        const { id, ...updateData } = formData as any;
        await updateDoc(doc(db, 'residents', editingResident.id), updateData);
      } else {
        await addDoc(collection(db, 'residents'), formData);
      }
      setIsModalOpen(false);
      setEditingResident(null);
      setFormData({
        fullName: '',
        cccd: '',
        phone: '',
        email: '',
        apartmentId: '',
        residentType: 'Owner',
        status: 'Active'
      });
      fetchResidents();
    } catch (error) {
      console.error('Error saving resident:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa cư dân này?')) {
      try {
        await deleteDoc(doc(db, 'residents', id));
        fetchResidents();
      } catch (error) {
        console.error('Error deleting resident:', error);
      }
    }
  };

  const filteredResidents = residents.filter(res => 
    res.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.cccd.includes(searchTerm) ||
    res.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý cư dân</h1>
          <p className="text-gray-500 text-sm">Quản lý thông tin cư dân và chủ hộ</p>
        </div>
        {(isAdmin || isManager) && (
          <button 
            onClick={() => { setEditingResident(null); setIsModalOpen(true); }}
            className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={18} className="mr-2" /> Thêm cư dân
          </button>
        )}
      </div>

      <div className="card-base p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên, CCCD, số điện thoại..." 
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
            <Filter size={18} className="mr-2" /> Lọc
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-10 text-slate-500">Đang tải dữ liệu...</div>
        ) : filteredResidents.length > 0 ? (
          filteredResidents.map((res) => (
            <motion.div 
              layout
              key={res.id} 
              className="card-base p-6 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">{res.fullName}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      res.residentType === 'Owner' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                    }`}>
                      {res.residentType === 'Owner' ? 'Chủ hộ' : 'Người thuê'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { setEditingResident(res); setFormData(res); setIsModalOpen(true); }}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(res.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <CreditCard size={16} className="mr-3 text-slate-400 dark:text-slate-500" />
                  <span>{res.cccd}</span>
                </div>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <Phone size={16} className="mr-3 text-slate-400 dark:text-slate-500" />
                  <span>{res.phone}</span>
                </div>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <Mail size={16} className="mr-3 text-slate-400 dark:text-slate-500" />
                  <span className="truncate">{res.email}</span>
                </div>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <Building2 size={16} className="mr-3 text-slate-400 dark:text-slate-500" />
                  <span className="font-medium text-blue-600 dark:text-blue-400">Căn hộ: {res.apartmentId}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <span className={`flex items-center text-xs font-bold ${
                  res.status === 'Active' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {res.status === 'Active' ? <CheckCircle2 size={14} className="mr-1" /> : <XCircle size={14} className="mr-1" />}
                  {res.status === 'Active' ? 'Đang cư trú' : 'Đã chuyển đi'}
                </span>
                <button className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">Xem chi tiết</button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 card-base">
            <User className="mx-auto text-slate-200 dark:text-slate-800 mb-4" size={64} />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Chưa có cư dân nào</h3>
            <p className="text-slate-500 mb-6 max-w-xs mx-auto">Hãy thêm cư dân mới để bắt đầu quản lý.</p>
          </div>
        )}
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{editingResident ? 'Sửa thông tin cư dân' : 'Thêm cư dân mới'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 mb-2">
                  <p className="text-[10px] font-bold text-blue-400 uppercase mb-3 tracking-widest">Gợi ý mẫu nhanh</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { fullName: 'Nguyễn Văn A', cccd: '012345678901', phone: '0901234567', email: 'vana@gmail.com', apartmentId: 'A101', residentType: 'Owner' },
                      { fullName: 'Trần Thị B', cccd: '012345678902', phone: '0907654321', email: 'thib@gmail.com', apartmentId: 'B201', residentType: 'Owner' },
                      { fullName: 'Lê Văn C', cccd: '012345678903', phone: '0912345678', email: 'vanc@gmail.com', apartmentId: 'C505', residentType: 'Tenant' },
                    ].map((ex, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, ...ex })}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl text-[11px] font-bold hover:bg-blue-600 hover:text-white transition-all border border-blue-200 dark:border-blue-900/50 shadow-sm"
                      >
                        Mẫu {ex.fullName.split(' ').pop()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label-text">Họ và tên</label>
                  <input 
                    type="text" 
                    required
                    className="input-field"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Số CCCD</label>
                    <input 
                      type="text" 
                      required
                      className="input-field"
                      value={formData.cccd}
                      onChange={(e) => setFormData({...formData, cccd: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="label-text">Số điện thoại</label>
                    <input 
                      type="tel" 
                      required
                      className="input-field"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="label-text">Email</label>
                  <input 
                    type="email" 
                    className="input-field"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Mã căn hộ</label>
                    <input 
                      type="text" 
                      required
                      className="input-field"
                      value={formData.apartmentId}
                      onChange={(e) => setFormData({...formData, apartmentId: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="label-text">Loại cư dân</label>
                    <select 
                      className="input-field"
                      value={formData.residentType}
                      onChange={(e) => setFormData({...formData, residentType: e.target.value})}
                    >
                      <option value="Owner">Chủ hộ</option>
                      <option value="Tenant">Người thuê</option>
                      <option value="Member">Thành viên</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit"
                    className="btn-primary flex-1"
                  >
                    {editingResident ? 'Cập nhật' : 'Thêm mới'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Residents;
