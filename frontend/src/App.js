import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Beneficiaries from './pages/Beneficiaries';
import BeneficiaryDetail from './pages/BeneficiaryDetail';
import Caseworkers from './pages/Caseworkers';
import CaseNotes from './pages/CaseNotes';
import ActionPlans from './pages/ActionPlans';
import Tasks from './pages/Tasks';
import Appointments from './pages/Appointments';
import Documents from './pages/Documents';
import Referrals from './pages/Referrals';
import Goals from './pages/Goals';
import Assessments from './pages/Assessments';
import Communications from './pages/Communications';
import Notifications from './pages/Notifications';
import AISummaries from './pages/AISummaries';
import { notifications as notifApi } from './services/api';

function Layout({ children, user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    notifApi.unreadCount().then(r => setUnreadCount(r.data.count)).catch(() => {});
    const interval = setInterval(() => {
      notifApi.unreadCount().then(r => setUnreadCount(r.data.count)).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/beneficiaries', label: 'Beneficiaries', icon: '👥' },
    { path: '/caseworkers', label: 'Caseworkers', icon: '👤' },
    { path: '/notes', label: 'Case Notes', icon: '📝' },
    { path: '/action-plans', label: 'Action Plans', icon: '📋' },
    { path: '/tasks', label: 'Tasks', icon: '✅' },
    { path: '/appointments', label: 'Appointments', icon: '📅' },
    { path: '/documents', label: 'Documents', icon: '📁' },
    { path: '/referrals', label: 'Referrals', icon: '🔗' },
    { path: '/goals', label: 'Goals', icon: '🎯' },
    { path: '/assessments', label: 'Assessments', icon: '📊' },
    { path: '/communications', label: 'Communications', icon: '💬' },
    { path: '/ai-summaries', label: 'AI Summaries', icon: '🤖' },
    { path: '/notifications', label: 'Notifications', icon: '🔔', badge: unreadCount },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: sidebarOpen ? 260 : 70,
        background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)',
        color: 'white',
        transition: 'width 0.3s ease',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #818cf8, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>AI</div>
          {sidebarOpen && <div><div style={{ fontWeight: 700, fontSize: 15 }}>Case Manager</div><div style={{ fontSize: 11, opacity: 0.7 }}>AI-Powered Platform</div></div>}
        </div>
        <nav style={{ flex: 1, padding: '12px 8px' }}>
          {menuItems.map(item => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link key={item.path} to={item.path} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8,
                marginBottom: 2, background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: isActive ? 'white' : 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: isActive ? 600 : 400,
                transition: 'all 0.2s', textDecoration: 'none', position: 'relative',
              }}>
                <span style={{ fontSize: 18, flexShrink: 0, width: 24, textAlign: 'center' }}>{item.icon}</span>
                {sidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                {sidebarOpen && item.badge > 0 && (
                  <span style={{
                    marginLeft: 'auto', background: '#ef4444', color: 'white', fontSize: 11,
                    fontWeight: 700, padding: '2px 8px', borderRadius: 10, minWidth: 20, textAlign: 'center'
                  }}>{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
            width: '100%', padding: '8px', background: 'rgba(255,255,255,0.1)', border: 'none',
            borderRadius: 8, color: 'white', cursor: 'pointer', fontSize: 18
          }}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, marginLeft: sidebarOpen ? 260 : 70, transition: 'margin-left 0.3s ease' }}>
        <header style={{
          background: 'white', padding: '0 32px', height: 64, display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>
            {menuItems.find(m => m.path === location.pathname)?.label || 'Case Manager'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => navigate('/notifications')} style={{
              position: 'relative', background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, padding: 4
            }}>
              🔔
              {unreadCount > 0 && <span style={{
                position: 'absolute', top: -2, right: -2, background: '#ef4444', color: 'white',
                fontSize: 10, fontWeight: 700, width: 18, height: 18, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>{unreadCount}</span>}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: 14
              }}>
                {user?.full_name?.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{user?.full_name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{user?.role}</div>
              </div>
            </div>
            <button onClick={onLogout} className="btn btn-outline btn-sm">Logout</button>
          </div>
        </header>
        <main style={{ padding: 32 }}>{children}</main>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<Login onLogin={handleLogin} />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/beneficiaries" element={<Beneficiaries />} />
          <Route path="/beneficiaries/:id" element={<BeneficiaryDetail />} />
          <Route path="/caseworkers" element={<Caseworkers />} />
          <Route path="/notes" element={<CaseNotes />} />
          <Route path="/action-plans" element={<ActionPlans />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/assessments" element={<Assessments />} />
          <Route path="/communications" element={<Communications />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/ai-summaries" element={<AISummaries />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
