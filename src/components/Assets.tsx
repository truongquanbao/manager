import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  X,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Assets: React.FC = () => {
  const { isAdmin, isManager } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [formData, setFormData] = useState({
    assetName: '',
    location: '',
    lastMaintenance: new Date().toISOString().split('T')[0],
    status: 'Good'
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'assets'), orderBy('assetName', 'asc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      setAssets(data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAsset) {
        const { id, ...updateData } = formData as any;
        await updateDoc(doc(db, 'assets', editingAsset.id), updateData);
      } else {
        await addDoc(collection(db, 'assets'), formData);
      }
      setIsModalOpen(false);
      setEditingAsset(null);
      setFormData({
        assetName: '',
        location: '',
        lastMaintenance: new Date().toISOString().split('T')[0],
        status: 'Good'
      });
      fetchAssets();
    } catch (error) {
      console.error('Error saving asset:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài sản này?')) {
      try {
        await deleteDoc(doc(db, 'assets', id));
        fetchAssets();
      } catch (error) {
        console.error('Error deleting asset:', error);
      }
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'assets', id), { status: newStatus });
      fetchAssets();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filteredAssets = assets.filter(a => 
    a.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quản lý tài sản</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Quản lý trang thiết bị và tài sản tòa nhà</p>
        </div>
        {(isAdmin || isManager) && (
          <button 
            onClick={() => { setEditingAsset(null); setFormData({ assetName: '', location: '', lastMaintenance: new Date().toISOString().split('T')[0], status: 'Good' }); setIsModalOpen(true); }}
            className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={18} className="mr-2" /> Thêm tài sản
          </button>
        )}
      </div>

      <div className="card-base p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm tên tài sản, vị trí..." 
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
        ) : filteredAssets.length > 0 ? (
          filteredAssets.map((a) => (
            <motion.div 
              layout
              key={a.id} 
              className="card-base p-6 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                  a.status === 'Good' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'
                }`}>
                  <Package size={24} />
                </div>
                {(isAdmin || isManager) && (
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => { setEditingAsset(a); setFormData(a); setIsModalOpen(true); }}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(a.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{a.assetName}</h3>

              <div className="space-y-3 pt-4 border-t border-slate-50 dark:border-slate-800">
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <MapPin size={16} className="mr-2 text-slate-400" />
                  <span className="font-medium">{a.location}</span>
                </div>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <Calendar size={16} className="mr-2 text-slate-400" />
                  <span>Bảo trì: {new Date(a.lastMaintenance).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <select 
                  value={a.status}
                  onChange={(e) => updateStatus(a.id, e.target.value)}
                  disabled={!isAdmin && !isManager}
                  className={`text-xs font-bold px-3 py-1 rounded-full border-none focus:ring-0 cursor-pointer ${
                    a.status === 'Good' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }`}
                >
                  <option value="Good">Hoạt động tốt</option>
                  <option value="Maintenance">Cần bảo trì</option>
                </select>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 card-base">
            <Package className="mx-auto text-slate-200 dark:text-slate-800 mb-4" size={64} />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Chưa có tài sản nào</h3>
            <p className="text-slate-500 mb-6 max-w-xs mx-auto">Hãy thêm tài sản mới để bắt đầu quản lý.</p>
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{editingAsset ? 'Sửa tài sản' : 'Thêm tài sản mới'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="label-text">Tên tài sản</label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      required
                      className="input-field pl-10"
                      value={formData.assetName}
                      onChange={(e) => setFormData({...formData, assetName: e.target.value})}
                      placeholder="VD: Máy phát điện"
                    />
                  </div>
                </div>
                <div>
                  <label className="label-text">Vị trí</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      required
                      className="input-field pl-10"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="VD: Tầng hầm B1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Ngày bảo trì cuối</label>
                    <input 
                      type="date" 
                      required
                      className="input-field"
                      value={formData.lastMaintenance}
                      onChange={(e) => setFormData({...formData, lastMaintenance: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="label-text">Trạng thái</label>
                    <select 
                      className="input-field"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="Good">Hoạt động tốt</option>
                      <option value="Maintenance">Cần bảo trì</option>
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
                    {editingAsset ? 'Cập nhật' : 'Thêm mới'}
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

export default Assets;
