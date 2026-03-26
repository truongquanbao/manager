import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Plus,
  Edit2,
  Trash2,
  X,
  Phone,
  Building2,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Visitors: React.FC = () => {
  const { isAdmin, isManager, isResident, profile } = useAuth();
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<any>(null);
  const [formData, setFormData] = useState({
    visitorName: '',
    phone: '',
    apartmentId: '',
    visitDate: new Date().toISOString().split('T')[0],
    status: 'Pending',
    note: ''
  });

  useEffect(() => {
    fetchVisitors();
  }, [profile]);

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      let q;
      if (isResident) {
        q = query(collection(db, 'visitors'), where('apartmentId', '==', profile?.apartmentCode), orderBy('visitDate', 'desc'));
      } else {
        q = query(collection(db, 'visitors'), orderBy('visitDate', 'desc'));
      }
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      setVisitors(data);
    } catch (error) {
      console.error('Error fetching visitors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVisitor) {
        const { id, ...updateData } = formData as any;
        await updateDoc(doc(db, 'visitors', editingVisitor.id), updateData);
      } else {
        await addDoc(collection(db, 'visitors'), formData);
      }
      setIsModalOpen(false);
      setEditingVisitor(null);
      setFormData({
        visitorName: '',
        phone: '',
        apartmentId: '',
        visitDate: new Date().toISOString().split('T')[0],
        status: 'Pending',
        note: ''
      });
      fetchVisitors();
    } catch (error) {
      console.error('Error saving visitor:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khách này?')) {
      try {
        await deleteDoc(doc(db, 'visitors', id));
        fetchVisitors();
      } catch (error) {
        console.error('Error deleting visitor:', error);
      }
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'visitors', id), { status: newStatus });
      fetchVisitors();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filteredVisitors = visitors.filter(v => 
    v.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.apartmentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quản lý khách ra vào</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Theo dõi danh sách khách đến thăm tòa nhà</p>
        </div>
        {(isAdmin || isManager || isResident) && (
          <button 
            onClick={() => { setEditingVisitor(null); setFormData({ visitorName: '', phone: '', apartmentId: isResident ? profile?.apartmentCode : '', visitDate: new Date().toISOString().split('T')[0], status: 'Pending', note: '' }); setIsModalOpen(true); }}
            className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={18} className="mr-2" /> Đăng ký khách
          </button>
        )}
      </div>

      <div className="card-base p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm tên khách, căn hộ..." 
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

      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tên khách</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Số điện thoại</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Căn hộ</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ngày đến</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ghi chú</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-slate-500">Đang tải dữ liệu...</td></tr>
              ) : filteredVisitors.length > 0 ? (
                filteredVisitors.map((v) => (
                  <motion.tr 
                    layout
                    key={v.id} 
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mr-3">
                          <User size={18} />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">{v.visitorName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{v.phone}</td>
                    <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">{v.apartmentId}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      <div className="flex items-center">
                        <Clock size={14} className="mr-2 text-slate-400" />
                        {new Date(v.visitDate).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={v.status}
                        onChange={(e) => updateStatus(v.id, e.target.value)}
                        disabled={isResident}
                        className={`text-xs font-bold px-3 py-1 rounded-full border-none focus:ring-0 cursor-pointer ${
                          v.status === 'Approved' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}
                      >
                        <option value="Pending">Chờ duyệt</option>
                        <option value="Approved">Đã duyệt</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm max-w-xs truncate">{v.note || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setEditingVisitor(v); setFormData(v); setIsModalOpen(true); }}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(v.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr><td colSpan={7} className="px-6 py-20 text-center text-slate-500">Không tìm thấy khách nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{editingVisitor ? 'Sửa thông tin khách' : 'Đăng ký khách mới'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="label-text">Tên khách</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      required
                      className="input-field pl-10"
                      value={formData.visitorName}
                      onChange={(e) => setFormData({...formData, visitorName: e.target.value})}
                      placeholder="VD: Nguyễn Văn A"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Số điện thoại</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="tel" 
                        required
                        className="input-field pl-10"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="0987..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label-text">Căn hộ đến thăm</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        required
                        disabled={isResident}
                        className="input-field pl-10"
                        value={formData.apartmentId}
                        onChange={(e) => setFormData({...formData, apartmentId: e.target.value})}
                        placeholder="VD: A101"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Ngày đến</label>
                    <input 
                      type="date" 
                      required
                      className="input-field"
                      value={formData.visitDate}
                      onChange={(e) => setFormData({...formData, visitDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="label-text">Trạng thái</label>
                    <select 
                      className="input-field"
                      disabled={isResident}
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="Pending">Chờ duyệt</option>
                      <option value="Approved">Đã duyệt</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label-text">Ghi chú</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 text-slate-400" size={18} />
                    <textarea 
                      className="input-field pl-10 min-h-[100px] py-2"
                      value={formData.note}
                      onChange={(e) => setFormData({...formData, note: e.target.value})}
                      placeholder="Lý do đến thăm, giao hàng..."
                    />
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
                    {editingVisitor ? 'Cập nhật' : 'Đăng ký'}
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

export default Visitors;
