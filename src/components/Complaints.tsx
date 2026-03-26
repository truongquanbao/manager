import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, where, onSnapshot, limit, getDocFromServer } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X,
  User,
  Building2,
  Send,
  MessageCircle,
  MoreVertical,
  Trash2,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const Complaints: React.FC = () => {
  const { isAdmin, isManager, isResident, profile, user } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'unprocessed' | 'processed'>('unprocessed');
  const [viewMode, setViewMode] = useState<'list' | 'messenger'>('list');
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'Normal',
    type: 'Maintenance'
  });

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    setLoading(true);
    let q;
    if (isResident) {
      q = query(collection(db, 'complaints'), where('userId', '==', user?.uid), orderBy('createdDate', 'desc'));
    } else {
      q = query(collection(db, 'complaints'), orderBy('createdDate', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      setComplaints(data);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'complaints');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isResident]);

  useEffect(() => {
    if (!selectedComplaint) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'complaints', selectedComplaint.id, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `complaints/${selectedComplaint.id}/messages`);
    });

    return () => unsubscribe();
  }, [selectedComplaint]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await addDoc(collection(db, 'complaints'), {
        ...formData,
        userId: user?.uid,
        residentName: profile?.fullName,
        apartmentId: profile?.apartmentCode,
        status: 'New',
        createdDate: new Date().toISOString()
      });
      setIsModalOpen(false);
      setFormData({ title: '', content: '', priority: 'Normal', type: 'Maintenance' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'complaints');
      setError('Không thể gửi phản ánh. Vui lòng thử lại.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComplaint) return;
    setError(null);
    try {
      await updateDoc(doc(db, 'complaints', editingComplaint.id), {
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        type: formData.type
      });
      setIsEditModalOpen(false);
      setEditingComplaint(null);
      setFormData({ title: '', content: '', priority: 'Normal', type: 'Maintenance' });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `complaints/${editingComplaint.id}`);
      setError('Không thể cập nhật phản ánh. Vui lòng thử lại.');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    setError(null);
    try {
      await updateDoc(doc(db, 'complaints', id), { 
        status,
        resolvedDate: status === 'Resolved' ? new Date().toISOString() : null
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `complaints/${id}`);
      setError('Không thể cập nhật trạng thái. Vui lòng thử lại.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedComplaint) return;

    const messageText = chatInput;
    setChatInput('');
    setError(null);

    try {
      await addDoc(collection(db, 'complaints', selectedComplaint.id, 'messages'), {
        text: messageText,
        senderId: user?.uid,
        senderName: profile?.fullName,
        senderRole: profile?.role,
        timestamp: new Date().toISOString()
      });

      // Update last message in complaint doc
      await updateDoc(doc(db, 'complaints', selectedComplaint.id), {
        lastMessage: messageText,
        lastMessageTime: new Date().toISOString()
      });

      // Automatic reply if it's the first message from resident
      if (isResident && messages.length === 0) {
        setTimeout(async () => {
          try {
            await addDoc(collection(db, 'complaints', selectedComplaint.id, 'messages'), {
              text: "Chào bạn! Ban quản lý đã tiếp nhận phản ánh của bạn. Chúng tôi sẽ phản hồi sớm nhất có thể. Cảm ơn bạn!",
              senderId: 'system',
              senderName: 'Hệ thống tự động',
              senderRole: 'System',
              timestamp: new Date().toISOString()
            });
          } catch (err) {
            console.error('System reply error:', err);
          }
        }, 1000);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `complaints/${selectedComplaint.id}/messages`);
      setError('Không thể gửi tin nhắn. Vui lòng thử lại.');
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await deleteDoc(doc(db, 'complaints', id));
      setDeleteConfirmId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `complaints/${id}`);
      setError('Không thể xóa phản ánh. Vui lòng thử lại.');
      setDeleteConfirmId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New': return <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">Mới</span>;
      case 'Processing': return <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-wider">Đang xử lý</span>;
      case 'Resolved': return <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-wider">Đã giải quyết</span>;
      default: return <span className="px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 text-[10px] font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  const unprocessedComplaints = complaints.filter(c => c.status === 'New' || c.status === 'Processing');
  const processedComplaints = complaints.filter(c => c.status === 'Resolved');

  const displayComplaints = activeTab === 'unprocessed' ? unprocessedComplaints : processedComplaints;

  const currentSelectedComplaint = selectedComplaint 
    ? complaints.find(c => c.id === selectedComplaint.id) || selectedComplaint 
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Phản ánh & Khiếu nại</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Tiếp nhận và xử lý ý kiến từ cư dân</p>
        </div>
        <div className="flex items-center gap-2">
          {(isAdmin || isManager) && (
            <button 
              onClick={() => setViewMode(viewMode === 'list' ? 'messenger' : 'list')}
              className={`flex items-center justify-center px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${
                viewMode === 'messenger' 
                  ? 'bg-slate-900 text-white shadow-slate-200 dark:shadow-none' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-slate-100 dark:shadow-none'
              }`}
            >
              <MessageSquare size={18} className="mr-2" /> {viewMode === 'list' ? 'Chế độ Messenger' : 'Chế độ Danh sách'}
            </button>
          )}
          {isResident && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
            >
              <Plus size={18} className="mr-2" /> Gửi phản ánh
            </button>
          )}
        </div>
      </div>

      {viewMode === 'list' ? (
        <>
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 w-full mb-6">
            <button 
              onClick={() => setActiveTab('unprocessed')}
              className={`px-6 py-3 text-sm font-bold transition-all relative ${
                activeTab === 'unprocessed' ? 'text-blue-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Chưa xử lý
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === 'unprocessed' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}>
                {unprocessedComplaints.length}
              </span>
              {activeTab === 'unprocessed' && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('processed')}
              className={`px-6 py-3 text-sm font-bold transition-all relative ${
                activeTab === 'processed' ? 'text-green-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Đã xử lý
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === 'processed' ? 'bg-green-100 text-green-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}>
                {processedComplaints.length}
              </span>
              {activeTab === 'processed' && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              <div className="text-center py-10 text-slate-500 dark:text-slate-400">Đang tải dữ liệu...</div>
            ) : displayComplaints.length > 0 ? (
              displayComplaints.map((comp) => (
                <motion.div 
                  layout
                  key={comp.id} 
                  className="card-base p-6 group cursor-pointer"
                  onClick={() => setSelectedComplaint(comp)}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-3">
                        {getStatusBadge(comp.status)}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          comp.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'
                        }`}>
                          {comp.priority === 'High' ? 'Ưu tiên cao' : 'Bình thường'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          {comp.type === 'Maintenance' ? 'Kỹ thuật' : comp.type === 'Security' ? 'An ninh' : 'Dịch vụ'}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">{comp.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{comp.content}</p>
                      <div className="flex flex-wrap items-center gap-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <div className="flex items-center">
                          <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mr-2">
                            <User size={12} className="text-slate-500" />
                          </div>
                          {comp.residentName}
                        </div>
                        <div className="flex items-center">
                          <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mr-2">
                            <Building2 size={12} className="text-slate-500" />
                          </div>
                          Căn hộ {comp.apartmentId}
                        </div>
                        <div className="flex items-center">
                          <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mr-2">
                            <Clock size={12} className="text-slate-500" />
                          </div>
                          {new Date(comp.createdDate).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col gap-2 items-center md:items-end">
                      <div className="flex gap-2">
                        {(isAdmin || isManager || (isResident && comp.status === 'New')) && (
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setEditingComplaint(comp);
                              setFormData({
                                title: comp.title,
                                content: comp.content,
                                priority: comp.priority,
                                type: comp.type
                              });
                              setIsEditModalOpen(true);
                            }}
                            className="h-10 w-10 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-600 rounded-xl flex items-center justify-center transition-all"
                          >
                            <Plus size={18} className="rotate-45" />
                          </button>
                        )}
                        {(isAdmin || isManager) && comp.status === 'New' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(comp.id, 'Processing'); }}
                            className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                          >
                            Tiếp nhận
                          </button>
                        )}
                        {(isAdmin || isManager) && comp.status === 'Processing' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus(comp.id, 'Resolved'); }}
                            className="px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all"
                          >
                            Hoàn tất
                          </button>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedComplaint(comp); }}
                          className="h-10 w-10 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl flex items-center justify-center transition-all group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20"
                        >
                          <MessageCircle size={18} />
                        </button>
                        {(isAdmin || isManager || (isResident && comp.status === 'New')) && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(comp.id); }}
                            className="h-10 w-10 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 rounded-xl flex items-center justify-center transition-all hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <MessageSquare className="mx-auto text-slate-200 dark:text-slate-800 mb-4" size={64} />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Chưa có phản ánh nào</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-xs mx-auto">Hãy gửi phản ánh mới hoặc khởi tạo dữ liệu mẫu để bắt đầu quản lý.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Messenger Mode for Admins */
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl h-[75vh] flex overflow-hidden border border-slate-100 dark:border-slate-800">
          {/* Sidebar */}
          <div className="w-80 border-r border-slate-100 dark:border-slate-800 flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Hộp thư phản ánh</h3>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {complaints.map((comp) => (
                <div 
                  key={comp.id}
                  onClick={() => setSelectedComplaint(comp)}
                  className={`p-4 border-b border-slate-50 dark:border-slate-800/50 cursor-pointer transition-all ${
                    currentSelectedComplaint?.id === comp.id ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-l-blue-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-sm font-bold truncate flex-1 ${currentSelectedComplaint?.id === comp.id ? 'text-blue-600' : 'text-slate-900 dark:text-white'}`}>
                      {comp.title}
                    </h4>
                    <span className="text-[9px] text-slate-400 font-bold ml-2">
                      {new Date(comp.createdDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex-1">
                      {comp.residentName} - {comp.apartmentId}
                    </p>
                    {getStatusBadge(comp.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          {currentSelectedComplaint ? (
            <div className="flex-1 flex flex-col">
              <div className="px-8 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{currentSelectedComplaint.residentName}</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Căn hộ {currentSelectedComplaint.apartmentId}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {currentSelectedComplaint.status !== 'Resolved' && (
                    <button 
                      onClick={() => handleUpdateStatus(currentSelectedComplaint.id, 'Resolved')}
                      className="px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all"
                    >
                      Hoàn tất
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 p-8 overflow-y-auto space-y-6 custom-scrollbar bg-slate-50/30 dark:bg-slate-950/10">
                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === user?.uid;
                  const isSystem = msg.senderRole === 'System';
                  
                  return (
                    <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] space-y-1 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className="flex items-center space-x-2 px-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{msg.senderName}</span>
                          <span className="text-[8px] text-slate-300 font-bold">{new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${
                          isMe 
                            ? 'bg-blue-600 text-white rounded-tr-none' 
                            : isSystem
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 italic rounded-tl-none'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none border border-slate-100 dark:border-slate-700'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
                  <input 
                    type="text" 
                    placeholder="Nhập tin nhắn xử lý..."
                    className="flex-1 px-6 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 dark:text-white"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  />
                  <button 
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="h-12 w-12 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-40">
              <MessageSquare size={64} className="text-slate-200 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Chọn một cuộc hội thoại</h3>
              <p className="text-sm text-slate-500">Chọn phản ánh từ danh sách bên trái để bắt đầu xử lý.</p>
            </div>
          )}
        </div>
      )}

      {/* Chat Modal (Resident) */}
      <AnimatePresence>
        {currentSelectedComplaint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center space-x-4">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                    currentSelectedComplaint.status === 'Resolved' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <MessageCircle size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{currentSelectedComplaint.title}</h3>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Căn hộ {currentSelectedComplaint.apartmentId}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentSelectedComplaint.residentName}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedComplaint(null)} 
                  className="h-12 w-12 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-50 dark:bg-slate-800 rounded-2xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Info Sidebar */}
                <div className="w-80 border-r border-slate-100 dark:border-slate-800 p-8 overflow-y-auto hidden lg:block bg-slate-50/50 dark:bg-slate-950/20">
                  <div className="space-y-8">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Trạng thái</p>
                      {getStatusBadge(currentSelectedComplaint.status)}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Nội dung phản ánh</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{currentSelectedComplaint.content}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Thời gian gửi</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{new Date(currentSelectedComplaint.createdDate).toLocaleString('vi-VN')}</p>
                    </div>
                    {(isAdmin || isManager) && (
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Thao tác nhanh</p>
                        <div className="space-y-2">
                          {currentSelectedComplaint.status !== 'Processing' && currentSelectedComplaint.status !== 'Resolved' && (
                            <button 
                              onClick={() => handleUpdateStatus(currentSelectedComplaint.id, 'Processing')}
                              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                            >
                              Tiếp nhận xử lý
                            </button>
                          )}
                          {currentSelectedComplaint.status !== 'Resolved' && (
                            <button 
                              onClick={() => handleUpdateStatus(currentSelectedComplaint.id, 'Resolved')}
                              className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-200"
                            >
                              Đánh dấu hoàn tất
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
                  <div className="flex-1 p-8 overflow-y-auto space-y-6 custom-scrollbar">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                        <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center">
                          <MessageSquare size={32} className="text-slate-400" />
                        </div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Bắt đầu cuộc trò chuyện</p>
                      </div>
                    ) : (
                      messages.map((msg, idx) => {
                        const isMe = msg.senderId === user?.uid;
                        const isSystem = msg.senderRole === 'System';
                        
                        return (
                          <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] space-y-1 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                              <div className="flex items-center space-x-2 px-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{msg.senderName}</span>
                                <span className="text-[9px] text-slate-300 font-bold">{new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <div className={`px-5 py-3.5 rounded-3xl text-sm leading-relaxed shadow-sm ${
                                isMe 
                                  ? 'bg-blue-600 text-white rounded-tr-none' 
                                  : isSystem
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 italic rounded-tl-none border border-slate-200 dark:border-slate-700'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none border border-slate-100 dark:border-slate-700'
                              }`}>
                                {msg.text}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
                      <div className="flex-1 relative">
                        <input 
                          type="text" 
                          placeholder="Nhập tin nhắn..."
                          className="w-full pl-6 pr-14 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 dark:text-white transition-all"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                        />
                        <button 
                          type="submit"
                          disabled={!chatInput.trim()}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none"
                        >
                          <Send size={18} />
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl flex items-center justify-center mb-6">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Xác nhận xóa</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Bạn có chắc chắn muốn xóa phản ánh này? Hành động này không thể hoàn tác.</p>
                <div className="grid grid-cols-2 gap-4 w-full">
                  <button 
                    onClick={() => setDeleteConfirmId(null)}
                    className="py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    Hủy
                  </button>
                  <button 
                    onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                    className="py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-200 dark:shadow-none"
                  >
                    Xóa ngay
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] bg-red-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-3"
          >
            <AlertCircle size={20} />
            <span className="text-sm font-bold">{error}</span>
            <button onClick={() => setError(null)} className="p-1 hover:bg-white/20 rounded-lg transition-all">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20"
            >
              <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Gửi phản ánh mới</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-5">
                <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30 mb-2">
                  <p className="text-[10px] font-black text-blue-400 uppercase mb-3 tracking-widest">Gợi ý mẫu nhanh</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { title: 'Hỏng đèn hành lang', type: 'Maintenance', content: 'Đèn hành lang tầng 5 block A bị hỏng, cần thay mới.', priority: 'Medium' },
                      { title: 'Tiếng ồn ban đêm', type: 'Security', content: 'Căn hộ A102 thường xuyên gây tiếng ồn sau 11h đêm.', priority: 'High' },
                    ].map((ex, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, ...ex })}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl text-[11px] font-bold hover:bg-blue-600 hover:text-white transition-all border border-blue-200 dark:border-blue-800 shadow-sm"
                      >
                        Mẫu {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tiêu đề</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 dark:text-white transition-all"
                    placeholder="Ví dụ: Hỏng đèn hành lang"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Loại phản ánh</label>
                    <select 
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 dark:text-white transition-all"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="Maintenance">Bảo trì / Kỹ thuật</option>
                      <option value="Security">An ninh</option>
                      <option value="Service">Dịch vụ</option>
                      <option value="Other">Khác</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Mức độ ưu tiên</label>
                    <select 
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 dark:text-white transition-all"
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    >
                      <option value="Normal">Bình thường</option>
                      <option value="High">Ưu tiên cao</option>
                      <option value="Low">Ưu tiên thấp</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nội dung chi tiết</label>
                  <textarea 
                    required
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 dark:text-white transition-all"
                    rows={4}
                    placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                  />
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
                    className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center"
                  >
                    <Send size={18} className="mr-2" /> Gửi phản ánh
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20"
            >
              <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Chỉnh sửa phản ánh</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="p-8 space-y-5">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tiêu đề</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 dark:text-white transition-all"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Loại phản ánh</label>
                    <select 
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 dark:text-white transition-all"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="Maintenance">Bảo trì / Kỹ thuật</option>
                      <option value="Security">An ninh</option>
                      <option value="Service">Dịch vụ</option>
                      <option value="Other">Khác</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Mức độ ưu tiên</label>
                    <select 
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 dark:text-white transition-all"
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    >
                      <option value="Normal">Bình thường</option>
                      <option value="High">Ưu tiên cao</option>
                      <option value="Low">Ưu tiên thấp</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nội dung chi tiết</label>
                  <textarea 
                    required
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 dark:text-white transition-all"
                    rows={4}
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                  />
                </div>
                <div className="pt-4 flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center"
                  >
                    Cập nhật
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

export default Complaints;
