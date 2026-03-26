import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Settings as SettingsIcon, 
  Save, 
  Building, 
  Phone, 
  Mail, 
  MapPin,
  Shield,
  Bell,
  Globe,
  Moon,
  Sun,
  Plus,
  Trash2,
  X,
  Zap,
  Droplets,
  Wrench,
  Hammer,
  Truck,
  Wifi,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Settings: React.FC = () => {
  const { isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    buildingName: 'Chung cư Apartment Manager Pro',
    address: '123 Đường ABC, Quận 1, TP. Hồ Chí Minh',
    hotline: '1900 1234',
    email: 'contact@apartmentpro.com',
    maintenanceFee: 10000,
    waterPrice: 15000,
    electricityPrice: 3500,
    parkingFeeMotorbike: 100000,
    parkingFeeCar: 1200000,
    allowResidentRegister: true,
    autoApproveResidents: false,
    enableNotifications: true,
    maintenanceMode: false
  });

  const iconOptions = [
    { name: 'Settings', icon: SettingsIcon },
    { name: 'Zap', icon: Zap },
    { name: 'Shield', icon: Shield },
    { name: 'Trash2', icon: Trash2 },
    { name: 'Droplets', icon: Droplets },
    { name: 'Wrench', icon: Wrench },
    { name: 'Hammer', icon: Hammer },
    { name: 'Truck', icon: Truck },
    { name: 'Wifi', icon: Wifi },
    { name: 'Lock', icon: Lock },
  ];

  const getIconComponent = (iconName: string) => {
    const option = iconOptions.find(opt => opt.name === iconName);
    const IconComp = option ? option.icon : SettingsIcon;
    return <IconComp size={20} />;
  };

  const [serviceCategories, setServiceCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', icon: 'Settings' });

  useEffect(() => {
    fetchConfig();
    fetchServiceCategories();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const docSnap = await getDoc(doc(db, 'system', 'config'));
      if (docSnap.exists()) {
        setConfig({ ...config, ...docSnap.data() });
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'service_categories'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (data.length === 0) {
        setServiceCategories([
          { id: 'sc1', name: 'Điện nước', description: 'Sửa chữa hệ thống điện, nước', icon: 'Zap' },
          { id: 'sc2', name: 'An ninh', description: 'Các vấn đề về an ninh, trật tự', icon: 'Shield' },
          { id: 'sc3', name: 'Vệ sinh', description: 'Dịch vụ vệ sinh, rác thải', icon: 'Trash2' }
        ]);
      } else {
        setServiceCategories(data);
      }
    } catch (error) {
      console.error('Error fetching service categories:', error);
    }
  };

  const handleSaveConfig = async () => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'system', 'config'), config);
      alert('Cấu hình đã được lưu thành công!');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Lỗi khi lưu cấu hình.');
    } finally {
      setSaving(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await setDoc(doc(db, 'service_categories', editingCategory.id), categoryForm);
      } else {
        await addDoc(collection(db, 'service_categories'), categoryForm);
      }
      setIsModalOpen(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', icon: 'Settings' });
      fetchServiceCategories();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa loại dịch vụ này?')) return;
    try {
      await deleteDoc(doc(db, 'service_categories', id));
      fetchServiceCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <Shield size={64} className="mx-auto text-red-100" />
          <h2 className="text-xl font-bold text-gray-900">Quyền truy cập bị từ chối</h2>
          <p className="text-gray-500">Chỉ Super Admin mới có quyền truy cập vào cấu hình hệ thống.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
            <SettingsIcon className="mr-2" /> Cấu hình hệ thống
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Quản lý thông tin tòa nhà và các tham số hệ thống</p>
        </div>
        <button 
          onClick={handleSaveConfig}
          disabled={saving}
          className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
        >
          {saving ? 'Đang lưu...' : <><Save size={18} className="mr-2" /> Lưu cấu hình</>}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 dark:text-slate-400">Đang tải cấu hình...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
          {/* Building Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-base p-6 space-y-4"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center border-b border-slate-50 dark:border-slate-800 pb-3">
              <Building size={20} className="mr-2 text-blue-500" /> Thông tin tòa nhà
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label-text">Tên tòa nhà</label>
                <input 
                  type="text"
                  className="input-field"
                  value={config.buildingName}
                  onChange={(e) => setConfig({...config, buildingName: e.target.value})}
                />
              </div>
              <div>
                <label className="label-text">Địa chỉ</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    className="input-field pl-10"
                    value={config.address}
                    onChange={(e) => setConfig({...config, address: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Hotline</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      className="input-field pl-10"
                      value={config.hotline}
                      onChange={(e) => setConfig({...config, hotline: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="label-text">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="email"
                      className="input-field pl-10"
                      value={config.email}
                      onChange={(e) => setConfig({...config, email: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Pricing Config */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-base p-6 space-y-4"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center border-b border-slate-50 dark:border-slate-800 pb-3">
              <Globe size={20} className="mr-2 text-green-500" /> Đơn giá dịch vụ
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label-text">Phí quản lý (VNĐ/m2)</label>
                <input 
                  type="number"
                  className="input-field"
                  value={config.maintenanceFee}
                  onChange={(e) => setConfig({...config, maintenanceFee: Number(e.target.value)})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Giá nước (VNĐ/m3)</label>
                  <input 
                    type="number"
                    className="input-field"
                    value={config.waterPrice}
                    onChange={(e) => setConfig({...config, waterPrice: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="label-text">Giá điện (VNĐ/kWh)</label>
                  <input 
                    type="number"
                    className="input-field"
                    value={config.electricityPrice}
                    onChange={(e) => setConfig({...config, electricityPrice: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Phí gửi xe máy (VNĐ/tháng)</label>
                  <input 
                    type="number"
                    className="input-field"
                    value={config.parkingFeeMotorbike}
                    onChange={(e) => setConfig({...config, parkingFeeMotorbike: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="label-text">Phí gửi ô tô (VNĐ/tháng)</label>
                  <input 
                    type="number"
                    className="input-field"
                    value={config.parkingFeeCar}
                    onChange={(e) => setConfig({...config, parkingFeeCar: Number(e.target.value)})}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Service Categories CRUD */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card-base p-6 space-y-4 md:col-span-2"
          >
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                <SettingsIcon size={20} className="mr-2 text-purple-500" /> Danh mục dịch vụ
              </h3>
              <button 
                onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', description: '', icon: 'Settings' }); setIsModalOpen(true); }}
                className="flex items-center px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all"
              >
                <Plus size={14} className="mr-1" /> Thêm mới
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {serviceCategories.map((cat) => (
                <div key={cat.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 group relative">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="h-10 w-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-purple-600 shadow-sm">
                      {getIconComponent(cat.icon)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{cat.name}</h4>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">Dịch vụ</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{cat.description}</p>
                  <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => { setEditingCategory(cat); setCategoryForm({ name: cat.name, description: cat.description, icon: cat.icon || 'Settings' }); setIsModalOpen(true); }}
                      className="p-1.5 bg-white dark:bg-slate-800 text-blue-600 rounded-lg shadow-sm hover:bg-blue-50"
                    >
                      <Wrench size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1.5 bg-white dark:bg-slate-800 text-red-600 rounded-lg shadow-sm hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* System Settings */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-base p-6 space-y-4 md:col-span-2"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center border-b border-slate-50 dark:border-slate-800 pb-3">
              <Bell size={20} className="mr-2 text-orange-500" /> Cài đặt hệ thống
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Cho phép cư dân đăng ký</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Cư dân có thể tự tạo tài khoản trên ứng dụng</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={config.allowResidentRegister}
                    onChange={(e) => setConfig({...config, allowResidentRegister: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Tự động phê duyệt cư dân</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tài khoản mới sẽ được kích hoạt ngay lập tức</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={config.autoApproveResidents}
                    onChange={(e) => setConfig({...config, autoApproveResidents: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </motion.div>

          {/* Theme Settings */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-base p-6 space-y-4 md:col-span-2"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center border-b border-slate-50 dark:border-slate-800 pb-3">
              <Sun size={20} className="mr-2 text-yellow-500" /> Giao diện người dùng
            </h3>
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Chế độ hiển thị</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Chuyển đổi giữa giao diện Sáng và Tối</p>
              </div>
              <button 
                onClick={toggleTheme}
                className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                {theme === 'light' ? (
                  <><Sun size={18} className="text-yellow-500" /> <span className="text-sm font-bold text-slate-900">Sáng</span></>
                ) : (
                  <><Moon size={18} className="text-blue-400" /> <span className="text-sm font-bold text-white">Tối</span></>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Category Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20"
            >
              <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleCategorySubmit} className="p-8 space-y-6">
                <div>
                  <label className="label-text">Tên danh mục</label>
                  <input 
                    type="text" 
                    required
                    className="input-field"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                    placeholder="VD: Điện nước"
                  />
                </div>
                <div>
                  <label className="label-text">Mô tả</label>
                  <textarea 
                    className="input-field min-h-[100px] py-4"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                    placeholder="Mô tả ngắn gọn về loại dịch vụ này..."
                  />
                </div>
                <div>
                  <label className="label-text">Biểu tượng</label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {iconOptions.map((opt) => (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => setCategoryForm({...categoryForm, icon: opt.name})}
                        className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                          categoryForm.icon === opt.name 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <opt.icon size={20} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-4 flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit"
                    className="btn-primary flex-1"
                  >
                    {editingCategory ? 'Cập nhật' : 'Thêm mới'}
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

export default Settings;
