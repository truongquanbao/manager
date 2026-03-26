import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './components/Login';
import Register from './components/Register';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Apartments from './components/Apartments';
import Residents from './components/Residents';
import Invoices from './components/Invoices';
import Complaints from './components/Complaints';
import Notifications from './components/Notifications';
import Accounts from './components/Accounts';
import Vehicles from './components/Vehicles';
import Visitors from './components/Visitors';
import Assets from './components/Assets';
import Settings from './components/Settings';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, profile } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen">Đang tải...</div>;
  if (!user) return <Navigate to="/login" />;
  if (profile?.status === 'Pending') return <div className="flex items-center justify-center h-screen">Tài khoản đang chờ phê duyệt...</div>;
  if (profile?.status === 'Rejected') return <div className="flex items-center justify-center h-screen">Tài khoản đã bị từ chối. Vui lòng liên hệ hỗ trợ.</div>;

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/accounts" element={<Accounts />} />
                      <Route path="/apartments" element={<Apartments />} />
                      <Route path="/residents" element={<Residents />} />
                      <Route path="/invoices" element={<Invoices />} />
                      <Route path="/complaints" element={<Complaints />} />
                      <Route path="/notifications" element={<Notifications />} />
                      <Route path="/vehicles" element={<Vehicles />} />
                      <Route path="/visitors" element={<Visitors />} />
                      <Route path="/assets" element={<Assets />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                  </Layout>
                </PrivateRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
