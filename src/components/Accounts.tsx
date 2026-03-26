import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  ShieldCheck,
  UserCheck,
  UserX,
  X,
  UserPlus,
  Mail,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Accounts: React.FC = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'Manager',
    status: 'Active',
    apartmentCode: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const { id, ...updateData } = formData as any;
        await updateDoc(doc(db, 'users', editingUser.id), updateData);
      } else {
        await addDoc(collection(db, 'users'), {
          ...formData,
          createdAt: new Date().toISOString(),
          isApproved: formData.status === 'Active'
        });
      }
      setIsModalOpen(false);
      setEditingUser(null);
      setFormData({
        fullName: '',
        email: '',
        role: 'Manager',
        status: 'Active',
        apartmentCode: ''
      });
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      try {
        await deleteDoc(doc(db, 'users', id));
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { 
        status: newStatus,
        isApproved: newStatus === 'Active'
      });
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) return <div className="p-10 text-center">Bạn không có quyền truy cập trang này.</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quản lý tài khoản</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Phê duyệt và quản lý phân quyền người dùng</p>
        </div>
        <button 
          onClick={() => { setEditingUser(null); setFormData({ fullName: '', email: '', role: 'Manager', status: 'Active', apartmentCode: '' }); setIsModalOpen(true); }}
          className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <Plus size={18} className="mr-2" /> Thêm tài khoản
        </button>
      </div>

      <div className="card-base p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên, email..." 
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Người dùng</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vai trò</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ngày tạo</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">Đang tải dữ liệu...</td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold">
                          {user.fullName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{user.fullName}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        user.role === 'Super Admin' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' :
                        user.role === 'Manager' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 
                        'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center w-fit ${
                        user.status === 'Active' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                        user.status === 'Pending' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' : 
                        'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {user.status === 'Active' ? <UserCheck size={12} className="mr-1" /> : <UserX size={12} className="mr-1" />}
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {user.status === 'Pending' && (
                          <button 
                            onClick={() => handleStatusChange(user.id, 'Active')}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                          >
                            Phê duyệt
                          </button>
                        )}
                        <button 
                          onClick={() => { setEditingUser(user); setFormData(user); setIsModalOpen(true); }}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        {user.role !== 'Super Admin' && (
                          <button 
                            onClick={() => handleDelete(user.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">Không tìm thấy tài khoản nào</td>
                </tr>
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{editingUser ? 'Sửa tài khoản' : 'Thêm tài khoản mới'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="label-text">Họ và tên</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      required
                      className="input-field pl-10"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="label-text">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" 
                      required
                      className="input-field pl-10"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Vai trò</label>
                    <select 
                      className="input-field"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                    >
                      <option value="Manager">Quản lý</option>
                      <option value="Resident">Cư dân</option>
                      <option value="Staff">Nhân viên</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-text">Trạng thái</label>
                    <select 
                      className="input-field"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="Active">Hoạt động</option>
                      <option value="Pending">Chờ duyệt</option>
                      <option value="Rejected">Đã khóa</option>
                    </select>
                  </div>
                </div>
                {formData.role === 'Resident' && (
                  <div>
                    <label className="label-text">Mã căn hộ</label>
                    <input 
                      type="text" 
                      className="input-field"
                      value={formData.apartmentCode}
                      onChange={(e) => setFormData({...formData, apartmentCode: e.target.value})}
                      placeholder="VD: A101"
                    />
                  </div>
                )}
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
                    {editingUser ? 'Cập nhật' : 'Thêm mới'}
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

export default Accounts;
