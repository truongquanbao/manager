import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Building2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Apartments: React.FC = () => {
  const { isAdmin, isManager } = useAuth();
  const [apartments, setApartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApartment, setEditingApartment] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: '',
    building: 'Apartment Pro',
    block: 'A',
    floor: 1,
    area: 75.5,
    type: '2BR',
    status: 'Empty',
    maxResidents: 4
  });

  useEffect(() => {
    fetchApartments();
  }, []);

  const fetchApartments = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'apartments'), orderBy('code', 'asc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      setApartments(data);
    } catch (error) {
      console.error('Error fetching apartments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingApartment) {
        await updateDoc(doc(db, 'apartments', editingApartment.id), formData);
      } else {
        await addDoc(collection(db, 'apartments'), formData);
      }
      setIsModalOpen(false);
      setEditingApartment(null);
      setFormData({
        code: '',
        building: 'Apartment Pro',
        block: 'A',
        floor: 1,
        area: 75.5,
        type: '2BR',
        status: 'Empty',
        maxResidents: 4
      });
      fetchApartments();
    } catch (error) {
      console.error('Error saving apartment:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa căn hộ này?')) {
      try {
        await deleteDoc(doc(db, 'apartments', id));
        fetchApartments();
      } catch (error) {
        console.error('Error deleting apartment:', error);
      }
    }
  };

  const filteredApartments = apartments.filter(apt => 
    apt.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.block.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Occupied': return <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center w-fit"><CheckCircle2 size={12} className="mr-1" /> Đang ở</span>;
      case 'Empty': return <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-xs font-bold flex items-center w-fit"><Clock size={12} className="mr-1" /> Trống</span>;
      case 'Maintenance': return <span className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-bold flex items-center w-fit"><AlertCircle size={12} className="mr-1" /> Bảo trì</span>;
      default: return <span className="px-2.5 py-1 rounded-full bg-gray-50 text-gray-600 text-xs font-bold flex items-center w-fit">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý căn hộ</h1>
          <p className="text-gray-500 text-sm">Danh sách toàn bộ căn hộ trong khu chung cư</p>
        </div>
        {(isAdmin || isManager) && (
          <button 
            onClick={() => { setEditingApartment(null); setIsModalOpen(true); }}
            className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={18} className="mr-2" /> Thêm căn hộ
          </button>
        )}
      </div>

      <div className="card-base p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo mã căn hộ, block..." 
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
            <Filter size={18} className="mr-2" /> Lọc
          </button>
          <button className="flex items-center px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
            Xuất Excel
          </button>
        </div>
      </div>

      <div className="card-base overflow-hidden">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-500">Đang tải dữ liệu...</p>
          </div>
        ) : filteredApartments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mã căn hộ</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vị trí</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Diện tích</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Loại</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredApartments.map((apt) => (
                <tr key={apt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Building2 size={20} />
                      </div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{apt.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-900 dark:text-slate-100">Block {apt.block}</div>
                    <div className="text-xs text-slate-500">Tầng {apt.floor}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">{apt.area} m²</td>
                  <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">{apt.type}</td>
                  <td className="px-6 py-4">{getStatusBadge(apt.status)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingApartment(apt); setFormData(apt); setIsModalOpen(true); }}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(apt.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        ) : (
          <div className="text-center py-20">
            <Building2 className="mx-auto text-slate-200 dark:text-slate-800 mb-4" size={64} />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Chưa có căn hộ nào</h3>
            <p className="text-slate-500 mb-6 max-w-xs mx-auto">Hãy thêm căn hộ mới để bắt đầu quản lý.</p>
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{editingApartment ? 'Sửa căn hộ' : 'Thêm căn hộ mới'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 mb-2">
                  <p className="text-[10px] font-bold text-blue-400 uppercase mb-3 tracking-widest">Gợi ý mẫu nhanh</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { code: 'A101', block: 'A', floor: 1, area: 75.5, type: '2BR', status: 'Occupied' },
                      { code: 'B205', block: 'B', floor: 2, area: 55.0, type: '1BR', status: 'Empty' },
                      { code: 'C501', block: 'C', floor: 5, area: 150.0, type: 'Penthouse', status: 'Maintenance' },
                    ].map((ex, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, ...ex })}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl text-[11px] font-bold hover:bg-blue-600 hover:text-white transition-all border border-blue-200 dark:border-blue-900/50 shadow-sm"
                      >
                        Mẫu {ex.code}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Mã căn hộ</label>
                    <input 
                      type="text" 
                      required
                      className="input-field"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="label-text">Block</label>
                    <select 
                      className="input-field"
                      value={formData.block}
                      onChange={(e) => setFormData({...formData, block: e.target.value})}
                    >
                      <option value="A">Block A</option>
                      <option value="B">Block B</option>
                      <option value="C">Block C</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Tầng</label>
                    <input 
                      type="number" 
                      required
                      className="input-field"
                      value={formData.floor}
                      onChange={(e) => setFormData({...formData, floor: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="label-text">Diện tích (m²)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      required
                      className="input-field"
                      value={formData.area}
                      onChange={(e) => setFormData({...formData, area: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Loại căn hộ</label>
                    <select 
                      className="input-field"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="Studio">Studio</option>
                      <option value="1BR">1 Phòng ngủ</option>
                      <option value="2BR">2 Phòng ngủ</option>
                      <option value="3BR">3 Phòng ngủ</option>
                      <option value="Penthouse">Penthouse</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-text">Trạng thái</label>
                    <select 
                      className="input-field"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="Empty">Trống</option>
                      <option value="Occupied">Đang ở</option>
                      <option value="Rented">Đang thuê</option>
                      <option value="Maintenance">Bảo trì</option>
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
                    {editingApartment ? 'Cập nhật' : 'Thêm mới'}
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

export default Apartments;
