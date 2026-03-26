import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, where, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { 
  Bell, 
  Plus, 
  X, 
  Clock, 
  AlertTriangle, 
  Info, 
  CheckCircle2,
  Send,
  Trash2,
  Check,
  Circle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Notifications: React.FC = () => {
  const { isAdmin, isManager, isResident, profile, user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'General',
    targetRole: 'All',
    isUrgent: false,
    status: 'Uncompleted'
  });

  useEffect(() => {
    fetchNotifications();
  }, [profile]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      let q;
      if (isResident) {
        q = query(collection(db, 'notifications'), where('targetRole', 'in', ['All', 'Resident']), orderBy('createdDate', 'desc'));
      } else {
        q = query(collection(db, 'notifications'), orderBy('createdDate', 'desc'));
      }
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'notifications'), {
        ...formData,
        createdBy: profile?.fullName || 'Ban Quản Lý',
        createdDate: new Date().toISOString(),
        readBy: []
      });
      setIsModalOpen(false);
      setFormData({ title: '', content: '', type: 'General', targetRole: 'All', isUrgent: false, status: 'Uncompleted' });
      fetchNotifications();
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thông báo này?')) return;
    try {
      await deleteDoc(doc(db, 'notifications', id));
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'notifications', id), {
        readBy: arrayUnion(user.uid)
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), {
        status: newStatus
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getIcon = (type: string, isUrgent: boolean) => {
    if (isUrgent) return <AlertTriangle className="text-red-500" size={20} />;
    switch (type) {
      case 'Maintenance': return <Info className="text-orange-500" size={20} />;
      case 'Payment': return <CheckCircle2 className="text-green-500" size={20} />;
      default: return <Bell className="text-blue-500" size={20} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
          <p className="text-gray-500 text-sm">Cập nhật tin tức và thông báo từ ban quản lý</p>
        </div>
        {(isAdmin || isManager) && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={18} className="mr-2" /> Tạo thông báo
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>
        ) : notifications.length > 0 ? (
          notifications.map((notif) => (
            <motion.div 
              layout
              key={notif.id} 
              className={`card-base p-6 border ${
                notif.isUrgent ? 'border-red-100 dark:border-red-900/30 bg-red-50/10' : 'border-slate-100 dark:border-slate-800'
              } hover:shadow-md transition-all`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-xl ${
                  notif.isUrgent ? 'bg-red-50 dark:bg-red-900/20' : 'bg-blue-50 dark:bg-blue-900/20'
                }`}>
                  {getIcon(notif.type, notif.isUrgent)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-lg font-bold ${notif.isUrgent ? 'text-red-700 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                        {notif.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        notif.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {notif.status === 'Completed' ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center">
                      <Clock size={12} className="mr-1" /> {new Date(notif.createdDate).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 whitespace-pre-wrap">{notif.content}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 dark:text-slate-500">Người gửi: {notif.createdBy}</span>
                    <div className="flex items-center space-x-3">
                      {notif.readBy?.includes(user?.uid) ? (
                        <span className="flex items-center text-xs font-bold text-green-600 dark:text-green-400">
                          <Check size={14} className="mr-1" /> Đã đọc
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                        >
                          <Circle size={14} className="mr-1" /> Đánh dấu đã đọc
                        </button>
                      )}
                      {(isAdmin || isManager) && (
                        <div className="flex items-center gap-2 border-l border-slate-100 dark:border-slate-800 pl-3 ml-3">
                          <button 
                            onClick={() => handleStatusChange(notif.id, notif.status === 'Completed' ? 'Uncompleted' : 'Completed')}
                            className={`text-xs font-bold hover:underline ${notif.status === 'Completed' ? 'text-orange-600' : 'text-green-600'}`}
                          >
                            {notif.status === 'Completed' ? 'Chưa HT' : 'Hoàn thành'}
                          </button>
                          <button 
                            onClick={() => handleDelete(notif.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <Bell className="mx-auto text-gray-200 mb-4" size={64} />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa có thông báo nào</h3>
            <p className="text-gray-500 mb-6 max-w-xs mx-auto">Hãy tạo thông báo mới hoặc khởi tạo dữ liệu mẫu để bắt đầu quản lý.</p>
            {isAdmin && (
              <button 
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all"
              >
                Về Dashboard để khởi tạo mẫu
              </button>
            )}
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Tạo thông báo mới</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 mb-2">
                  <p className="text-[10px] font-bold text-blue-400 uppercase mb-3 tracking-widest">Gợi ý mẫu nhanh</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { title: 'Bảo trì thang máy Block A', type: 'Maintenance', content: 'Thang máy số 1 Block A sẽ được bảo trì từ 9h-11h ngày 27/03.', targetRole: 'All', isUrgent: true, status: 'Uncompleted' },
                      { title: 'Nhắc thanh toán tiền nước tháng 3', type: 'Payment', content: 'Quý cư dân vui lòng thanh toán tiền nước tháng 3 trước ngày 30/03.', targetRole: 'Resident', isUrgent: false, status: 'Uncompleted' },
                      { title: 'Họp cư dân định kỳ', type: 'General', content: 'Kính mời quý cư dân tham gia buổi họp định kỳ vào 19h tối thứ 7 tuần này.', targetRole: 'Resident', isUrgent: false, status: 'Uncompleted' },
                    ].map((ex, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, ...ex })}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl text-[11px] font-bold hover:bg-blue-600 hover:text-white transition-all border border-blue-200 dark:border-blue-900/50 shadow-sm"
                      >
                        Mẫu {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label-text">Tiêu đề</label>
                  <input 
                    type="text" 
                    required
                    className="input-field"
                    placeholder="Ví dụ: Thông báo bảo trì thang máy"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Loại thông báo</label>
                    <select 
                      className="input-field"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="General">Thông báo chung</option>
                      <option value="Urgent">Thông báo khẩn</option>
                      <option value="Maintenance">Bảo trì / Kỹ thuật</option>
                      <option value="Payment">Nhắc thanh toán</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-text">Đối tượng nhận</label>
                    <select 
                      className="input-field"
                      value={formData.targetRole}
                      onChange={(e) => setFormData({...formData, targetRole: e.target.value})}
                    >
                      <option value="All">Tất cả</option>
                      <option value="Resident">Cư dân</option>
                      <option value="Manager">Quản lý</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center space-x-2 py-2">
                  <input 
                    type="checkbox" 
                    id="isUrgent"
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-slate-300 dark:border-slate-700 rounded"
                    checked={formData.isUrgent}
                    onChange={(e) => setFormData({...formData, isUrgent: e.target.checked})}
                  />
                  <label htmlFor="isUrgent" className="text-sm font-bold text-red-600 cursor-pointer">Đánh dấu là thông báo khẩn cấp</label>
                </div>
                <div>
                  <label className="label-text">Nội dung thông báo</label>
                  <textarea 
                    required
                    className="input-field"
                    rows={6}
                    placeholder="Nhập nội dung thông báo chi tiết..."
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                  />
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
                    className="btn-primary flex-1 flex items-center justify-center"
                  >
                    <Send size={18} className="mr-2" /> Đăng thông báo
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

export default Notifications;
