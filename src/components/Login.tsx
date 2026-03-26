import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { Building2, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Allow shorthand for system accounts
    let loginEmail = email;
    if (email === 'superadmin') loginEmail = 'superadmin@system.local';
    else if (email === 'manager1') loginEmail = 'manager1@system.local';
    else if (email === 'resident1') loginEmail = 'resident1@system.local';
    else if (email === 'admin') loginEmail = 'superadmin@system.local';
    
    try {
      await signInWithEmailAndPassword(auth, loginEmail, password);
      navigate('/');
    } catch (err: any) {
      console.error('Login error code:', err.code);
      if (err.code === 'auth/user-not-found') {
        setError('Tài khoản demo chưa được khởi tạo. Vui lòng nhấn "Khởi tạo dữ liệu mẫu" bên dưới.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Mật khẩu không chính xác. Nếu là tài khoản admin, hãy thử nhấn "Khởi tạo dữ liệu mẫu" để đặt lại.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Phương thức đăng nhập Email/Mật khẩu chưa được bật trong Firebase Console. Vui lòng bật nó để sử dụng tài khoản admin.');
      } else {
        setError('Lỗi đăng nhập: ' + (err.message || 'Vui lòng kiểm tra lại thông tin.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user exists in Firestore, if not create
      const { doc, getDoc, setDoc } = await import('firebase/firestore');
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          username: user.email?.split('@')[0] || 'user',
          fullName: user.displayName || 'Google User',
          email: user.email,
          phone: user.phoneNumber || '',
          role: user.email === 'baotruong1109@gmail.com' ? 'Super Admin' : 'Resident',
          status: 'Active',
          isApproved: true,
          createdAt: new Date().toISOString()
        });
      }
      
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError('Đăng nhập Google thất bại: ' + (err.message || 'Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  };

  const seedSystemUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const { doc, setDoc, getDoc } = await import('firebase/firestore');

      const usersToSeed = [
        {
          email: 'superadmin@system.local',
          password: 'Admin@123456',
          data: {
            username: 'superadmin',
            fullName: 'System Super Admin',
            role: 'Super Admin',
            status: 'Active',
            isApproved: true
          }
        },
        {
          email: 'manager1@system.local',
          password: 'Manager@123',
          data: {
            username: 'manager1',
            fullName: 'Building Manager 1',
            role: 'Manager',
            status: 'Active',
            isApproved: true
          }
        },
        {
          email: 'resident1@system.local',
          password: 'Resident@123',
          data: {
            username: 'resident1',
            fullName: 'Resident 1',
            role: 'Resident',
            status: 'Active',
            isApproved: true
          }
        }
      ];

      for (const userData of usersToSeed) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            uid: userCredential.user.uid,
            ...userData.data,
            email: userData.email,
            createdAt: new Date().toISOString()
          });
        } catch (err: any) {
          if (err.code === 'auth/email-already-in-use') {
            // If user exists, just ensure Firestore data is correct
            console.log(`User ${userData.email} already exists in Auth.`);
          } else {
            throw err;
          }
        }
      }

      alert('Đã khởi tạo các tài khoản hệ thống thành công!');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Lỗi: Bạn cần bật phương thức "Email/Password" trong Firebase Console trước.');
      } else {
        setError('Lỗi khởi tạo: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100"
      >
        <div className="p-8 md:p-12">
          <div className="flex flex-col items-center mb-10">
            <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 mb-6">
              <Building2 size={32} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Chào mừng trở lại</h1>
            <p className="text-slate-500 mt-2 text-center">Hệ thống quản lý chung cư chuyên nghiệp</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center">
              <span className="mr-2">⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">Email / Tên đăng nhập</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="text"
                  required
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="admin hoặc email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="block text-sm font-semibold text-slate-700">Mật khẩu</label>
                <Link to="/forgot-password" title="Quên mật khẩu?" className="text-xs font-medium text-blue-600 hover:text-blue-700">Quên mật khẩu?</Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="block w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center ml-1">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded transition-all"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 cursor-pointer">
                Nhớ đăng nhập
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xử lý...
                </span>
              ) : (
                <span className="flex items-center">
                  Đăng nhập <ArrowRight size={20} className="ml-2" />
                </span>
              )}
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400 font-medium">Hoặc đăng nhập bằng</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-6 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 mr-3" />
              Đăng nhập bằng Google (Khuyên dùng)
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-bold text-blue-600 hover:text-blue-700 transition-colors">Đăng ký ngay</Link>
            </p>
          </div>
          <div className="mt-10 pt-8 border-t border-slate-100">
            <p className="text-center text-sm font-medium text-slate-400 mb-6 uppercase tracking-widest">Tài khoản mẫu (Demo)</p>
            
            <button 
              onClick={handleGoogleLogin}
              className="w-full mb-4 py-4 px-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all flex flex-col items-center justify-center shadow-lg shadow-blue-100 border-2 border-blue-400/20 group"
            >
              <span className="text-xs opacity-80 font-medium mb-1">DÀNH CHO BẠN</span>
              <span className="flex items-center gap-2">
                🔑 Đăng nhập nhanh Super Admin
              </span>
              <span className="text-[10px] opacity-60 mt-1">(Sử dụng Google: baotruong1109@gmail.com)</span>
            </button>

            <button 
              onClick={seedSystemUsers}
              className="w-full mb-6 py-3 px-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
            >
              <span>🚀 Khởi tạo tài khoản hệ thống</span>
            </button>

            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => { setEmail('superadmin'); setPassword('Admin@123456'); }}
                className="flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 text-slate-700 rounded-2xl transition-all border border-transparent hover:border-blue-100 group"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mr-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Lock size={18} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm">Super Admin</p>
                    <p className="text-xs text-slate-400">Toàn quyền hệ thống</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600" />
              </button>

              <button 
                onClick={() => { setEmail('manager1'); setPassword('Manager@123'); }}
                className="flex items-center justify-between p-4 bg-slate-50 hover:bg-indigo-50 text-slate-700 rounded-2xl transition-all border border-transparent hover:border-indigo-100 group"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Building2 size={18} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm">Quản lý (Manager)</p>
                    <p className="text-xs text-slate-400">Vận hành chung cư</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-600" />
              </button>

              <button 
                onClick={() => { setEmail('resident1'); setPassword('Resident@123'); }}
                className="flex items-center justify-between p-4 bg-slate-50 hover:bg-emerald-50 text-slate-700 rounded-2xl transition-all border border-transparent hover:border-emerald-100 group"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Mail size={18} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm">Cư dân (Resident)</p>
                    <p className="text-xs text-slate-400">Tra cứu & Phản ánh</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-emerald-600" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
