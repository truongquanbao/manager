import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Filter, 
  Car, 
  Bike, 
  Truck,
  Edit2,
  Trash2,
  X,
  Building2,
  User,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Vehicles: React.FC = () => {
  const { isAdmin, isManager, isResident, profile } = useAuth();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [formData, setFormData] = useState({
    ownerName: '',
    apartmentId: '',
    licensePlate: '',
    vehicleType: 'Car',
    brand: '',
    color: '',
    status: 'Active'
  });

  useEffect(() => {
    fetchVehicles();
  }, [profile]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      let q;
      if (isResident) {
        q = query(collection(db, 'vehicles'), where('apartmentId', '==', profile?.apartmentCode), orderBy('licensePlate', 'asc'));
      } else {
        q = query(collection(db, 'vehicles'), orderBy('licensePlate', 'asc'));
      }
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVehicle) {
        const { id, ...updateData } = formData as any;
        await updateDoc(doc(db, 'vehicles', editingVehicle.id), updateData);
      } else {
        await addDoc(collection(db, 'vehicles'), formData);
      }
      setIsModalOpen(false);
      setEditingVehicle(null);
      setFormData({
        ownerName: '',
        apartmentId: '',
        licensePlate: '',
        vehicleType: 'Car',
        brand: '',
        color: '',
        status: 'Active'
      });
      fetchVehicles();
    } catch (error) {
      console.error('Error saving vehicle:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phương tiện này?')) {
      try {
        await deleteDoc(doc(db, 'vehicles', id));
        fetchVehicles();
      } catch (error) {
        console.error('Error deleting vehicle:', error);
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Car': return <Car size={24} />;
      case 'Motorbike': return <Bike size={24} />;
      case 'Truck': return <Truck size={24} />;
      default: return <Car size={24} />;
    }
  };

  const filteredVehicles = vehicles.filter(v => 
    v.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.apartmentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quản lý phương tiện</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Quản lý danh sách xe của cư dân</p>
        </div>
        {(isAdmin || isManager) && (
          <button 
            onClick={() => { setEditingVehicle(null); setFormData({ ownerName: '', apartmentId: '', licensePlate: '', vehicleType: 'Car', brand: '', color: '', status: 'Active' }); setIsModalOpen(true); }}
            className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={18} className="mr-2" /> Thêm phương tiện
          </button>
        )}
      </div>

      <div className="card-base p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm biển số, chủ xe, căn hộ..." 
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
        ) : filteredVehicles.length > 0 ? (
          filteredVehicles.map((v) => (
            <motion.div 
              layout
              key={v.id} 
              className="card-base p-6 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                    v.vehicleType === 'Car' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                  }`}>
                    {getIcon(v.vehicleType)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{v.licensePlate}</h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{v.brand} - {v.color}</span>
                  </div>
                </div>
                {(isAdmin || isManager) && (
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => { setEditingVehicle(v); setFormData(v); setIsModalOpen(true); }}
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
                )}
              </div>
              
              <div className="space-y-3 pt-4 border-t border-slate-50 dark:border-slate-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center">
                    <User size={14} className="mr-2" /> Chủ xe:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{v.ownerName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center">
                    <Building2 size={14} className="mr-2" /> Căn hộ:
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{v.apartmentId}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <span className={`flex items-center text-xs font-bold ${
                  v.status === 'Active' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {v.status === 'Active' ? <CheckCircle2 size={14} className="mr-1" /> : <XCircle size={14} className="mr-1" />}
                  {v.status === 'Active' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                </span>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 card-base">
            <Car className="mx-auto text-slate-200 dark:text-slate-800 mb-4" size={64} />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Chưa có phương tiện nào</h3>
            <p className="text-slate-500 mb-6 max-w-xs mx-auto">Hãy thêm phương tiện mới để bắt đầu quản lý.</p>
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{editingVehicle ? 'Sửa phương tiện' : 'Thêm phương tiện mới'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Chủ sở hữu</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        required
                        className="input-field pl-10"
                        value={formData.ownerName}
                        onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label-text">Mã căn hộ</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        required
                        className="input-field pl-10"
                        value={formData.apartmentId}
                        onChange={(e) => setFormData({...formData, apartmentId: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Biển số xe</label>
                    <input 
                      type="text" 
                      required
                      className="input-field"
                      value={formData.licensePlate}
                      onChange={(e) => setFormData({...formData, licensePlate: e.target.value})}
                      placeholder="VD: 30A-123.45"
                    />
                  </div>
                  <div>
                    <label className="label-text">Loại xe</label>
                    <select 
                      className="input-field"
                      value={formData.vehicleType}
                      onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                    >
                      <option value="Car">Ô tô</option>
                      <option value="Motorbike">Xe máy</option>
                      <option value="Truck">Xe tải</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Hãng xe</label>
                    <input 
                      type="text" 
                      required
                      className="input-field"
                      value={formData.brand}
                      onChange={(e) => setFormData({...formData, brand: e.target.value})}
                      placeholder="VD: Toyota"
                    />
                  </div>
                  <div>
                    <label className="label-text">Màu sắc</label>
                    <input 
                      type="text" 
                      required
                      className="input-field"
                      value={formData.color}
                      onChange={(e) => setFormData({...formData, color: e.target.value})}
                      placeholder="VD: Trắng"
                    />
                  </div>
                </div>
                <div>
                  <label className="label-text">Trạng thái</label>
                  <select 
                    className="input-field"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="Active">Đang hoạt động</option>
                    <option value="Inactive">Ngừng hoạt động</option>
                  </select>
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
                    {editingVehicle ? 'Cập nhật' : 'Thêm mới'}
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

export default Vehicles;
