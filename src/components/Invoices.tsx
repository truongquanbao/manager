import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Download, 
  Printer,
  X,
  CreditCard,
  Building2,
  Edit2,
  Trash2,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Invoices: React.FC = () => {
  const { isAdmin, isManager, isResident, profile } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [formData, setFormData] = useState({
    apartmentId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    totalAmount: 0,
    status: 'Unpaid',
    note: ''
  });

  useEffect(() => {
    fetchInvoices();
  }, [profile]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      let q;
      if (isResident) {
        q = query(collection(db, 'invoices'), where('apartmentId', '==', profile?.apartmentCode), orderBy('year', 'desc'), orderBy('month', 'desc'));
      } else {
        q = query(collection(db, 'invoices'), orderBy('year', 'desc'), orderBy('month', 'desc'));
      }
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingInvoice) {
        const { id, ...updateData } = formData as any;
        await updateDoc(doc(db, 'invoices', editingInvoice.id), updateData);
      } else {
        await addDoc(collection(db, 'invoices'), {
          ...formData,
          createdDate: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
      setEditingInvoice(null);
      setFormData({
        apartmentId: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        totalAmount: 0,
        status: 'Unpaid',
        note: ''
      });
      fetchInvoices();
    } catch (error) {
      console.error('Error saving invoice:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa hóa đơn này?')) {
      try {
        await deleteDoc(doc(db, 'invoices', id));
        fetchInvoices();
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };

  const handlePayment = async (id: string) => {
    if (window.confirm('Xác nhận đã thanh toán hóa đơn này?')) {
      try {
        await updateDoc(doc(db, 'invoices', id), { 
          status: 'Paid',
          paidDate: new Date().toISOString()
        });
        fetchInvoices();
      } catch (error) {
        console.error('Error updating payment:', error);
      }
    }
  };

  const handleDownload = (inv: any) => {
    const content = `
      HOÁ ĐƠN THANH TOÁN
      Mã HĐ: ${inv.id}
      Căn hộ: ${inv.apartmentId}
      Kỳ thanh toán: Tháng ${inv.month}/${inv.year}
      Tổng tiền: ${inv.totalAmount.toLocaleString('vi-VN')} VNĐ
      Trạng thái: ${inv.status === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
      Ghi chú: ${inv.note || 'Không có'}
      Ngày tạo: ${new Date(inv.createdDate).toLocaleString('vi-VN')}
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice_${inv.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý hóa đơn</h1>
          <p className="text-gray-500 text-sm">Theo dõi phí dịch vụ và tình trạng thanh toán</p>
        </div>
        {(isAdmin || isManager) && (
          <button 
            onClick={() => { setEditingInvoice(null); setFormData({ apartmentId: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), totalAmount: 0, status: 'Unpaid', note: '' }); setIsModalOpen(true); }}
            className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={18} className="mr-2" /> Tạo hóa đơn
          </button>
        )}
      </div>

      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mã HĐ</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Căn hộ</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Kỳ thanh toán</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng tiền</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">Đang tải dữ liệu...</td>
                </tr>
              ) : invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400">
                          <FileText size={20} />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">#{inv.id.slice(-6).toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-slate-900 dark:text-slate-100">
                        <Building2 size={14} className="mr-2 text-slate-400 dark:text-slate-500" />
                        {inv.apartmentId}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">Tháng {inv.month}/{inv.year}</td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{inv.totalAmount.toLocaleString('vi-VN')} VNĐ</span>
                    </td>
                    <td className="px-6 py-4">
                      {inv.status === 'Paid' ? (
                        <span className="px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-bold flex items-center w-fit">
                          <CheckCircle2 size={12} className="mr-1" /> Đã thanh toán
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-xs font-bold flex items-center w-fit">
                          <Clock size={12} className="mr-1" /> Chưa thanh toán
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => { setSelectedInvoice(inv); setIsViewModalOpen(true); }}
                          className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>
                        {inv.status === 'Unpaid' && (isAdmin || isManager) && (
                          <button 
                            onClick={() => handlePayment(inv.id)}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Xác nhận thanh toán"
                          >
                            <CreditCard size={16} />
                          </button>
                        )}
                        {(isAdmin || isManager) && (
                          <>
                            <button 
                              onClick={() => { setEditingInvoice(inv); setFormData(inv); setIsModalOpen(true); }}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Sửa"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(inv.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => window.print()}
                          className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                          title="In"
                        >
                          <Printer size={16} />
                        </button>
                        <button 
                          onClick={() => handleDownload(inv)}
                          className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                          title="Tải xuống"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <FileText className="mx-auto text-slate-200 dark:text-slate-800 mb-4" size={64} />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Chưa có hóa đơn nào</h3>
                    <p className="text-slate-500 mb-6 max-w-xs mx-auto">Hãy tạo hóa đơn mới để bắt đầu quản lý.</p>
                  </td>
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{editingInvoice ? 'Sửa hóa đơn' : 'Tạo hóa đơn mới'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 mb-2">
                  <p className="text-[10px] font-bold text-blue-400 uppercase mb-3 tracking-widest">Gợi ý mẫu nhanh</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { apartmentId: 'A101', totalAmount: 1500000, month: 3, year: 2026, status: 'Paid' },
                      { apartmentId: 'B201', totalAmount: 2200000, month: 3, year: 2026, status: 'Unpaid' },
                      { apartmentId: 'C505', totalAmount: 3500000, month: 3, year: 2026, status: 'Unpaid' },
                    ].map((ex, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, ...ex })}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl text-[11px] font-bold hover:bg-blue-600 hover:text-white transition-all border border-blue-200 dark:border-blue-900/50 shadow-sm"
                      >
                        Mẫu {ex.apartmentId}
                      </button>
                    ))}
                  </div>
                </div>

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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Tháng</label>
                    <select 
                      className="input-field"
                      value={formData.month}
                      onChange={(e) => setFormData({...formData, month: parseInt(e.target.value)})}
                    >
                      {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>Tháng {m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label-text">Năm</label>
                    <input 
                      type="number" 
                      required
                      className="input-field"
                      value={formData.year}
                      onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Tổng tiền (VNĐ)</label>
                    <input 
                      type="number" 
                      required
                      className="input-field"
                      value={formData.totalAmount}
                      onChange={(e) => setFormData({...formData, totalAmount: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="label-text">Trạng thái</label>
                    <select 
                      className="input-field"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="Unpaid">Chưa thanh toán</option>
                      <option value="Paid">Đã thanh toán</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label-text">Ghi chú</label>
                  <textarea 
                    className="input-field"
                    rows={3}
                    value={formData.note}
                    onChange={(e) => setFormData({...formData, note: e.target.value})}
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
                    className="btn-primary flex-1"
                  >
                    {editingInvoice ? 'Cập nhật' : 'Tạo hóa đơn'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {isViewModalOpen && selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Chi tiết hóa đơn</h3>
                <button onClick={() => setIsViewModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Mã hóa đơn:</span>
                  <span className="font-bold text-slate-900 dark:text-white">#{selectedInvoice.id.toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Căn hộ:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedInvoice.apartmentId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Kỳ thanh toán:</span>
                  <span className="font-bold text-slate-900 dark:text-white">Tháng {selectedInvoice.month}/{selectedInvoice.year}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Tổng tiền:</span>
                  <span className="font-bold text-blue-600">{selectedInvoice.totalAmount.toLocaleString('vi-VN')} VNĐ</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Trạng thái:</span>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${selectedInvoice.status === 'Paid' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                    {selectedInvoice.status === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </span>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-sm text-slate-500 block mb-2">Ghi chú:</span>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm text-slate-700 dark:text-slate-300 italic">
                    {selectedInvoice.note || 'Không có ghi chú'}
                  </div>
                </div>
                <button 
                  onClick={() => setIsViewModalOpen(false)}
                  className="w-full mt-4 px-4 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold text-sm"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Invoices;
