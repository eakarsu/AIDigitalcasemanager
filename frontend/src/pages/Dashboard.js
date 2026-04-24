import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboard, beneficiaries, tasks } from '../services/api';

const statConfig = [
  { key: 'activeBeneficiaries', label: 'Active Beneficiaries', icon: '\u{1F465}', color: '#4f46e5', bg: 'linear-gradient(135deg, #4f46e5, #7c3aed)', route: '/beneficiaries' },
  { key: 'activeCaseworkers', label: 'Active Caseworkers', icon: '\u{1F9D1}\u200D\u{1F4BC}', color: '#0891b2', bg: 'linear-gradient(135deg, #0891b2, #06b6d4)', route: '/caseworkers' },
  { key: 'pendingTasks', label: 'Pending Tasks', icon: '\u{1F4CB}', color: '#d97706', bg: 'linear-gradient(135deg, #d97706, #f59e0b)', route: '/tasks' },
  { key: 'upcomingAppointments', label: 'Upcoming Appointments', icon: '\u{1F4C5}', color: '#059669', bg: 'linear-gradient(135deg, #059669, #10b981)', route: '/appointments' },
  { key: 'highRiskCases', label: 'High Risk Cases', icon: '\u26A0\uFE0F', color: '#dc2626', bg: 'linear-gradient(135deg, #dc2626, #ef4444)', route: '/beneficiaries' },
  { key: 'activeReferrals', label: 'Active Referrals', icon: '\u{1F517}', color: '#7c3aed', bg: 'linear-gradient(135deg, #7c3aed, #a78bfa)', route: '/referrals' },
  { key: 'totalNotes', label: 'Total Notes', icon: '\u{1F4DD}', color: '#2563eb', bg: 'linear-gradient(135deg, #2563eb, #3b82f6)', route: '/notes' },
  { key: 'actionPlans', label: 'Action Plans', icon: '\u{1F3AF}', color: '#0d9488', bg: 'linear-gradient(135deg, #0d9488, #14b8a6)', route: '/action-plans' },
];

const riskColors = {
  high: { bg: '#fef2f2', color: '#dc2626', barColor: '#ef4444' },
  medium: { bg: '#fffbeb', color: '#d97706', barColor: '#f59e0b' },
  low: { bg: '#ecfdf5', color: '#059669', barColor: '#10b981' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [riskDist, setRiskDist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activityRes, riskRes] = await Promise.allSettled([
          dashboard.stats(),
          dashboard.recentActivity(),
          dashboard.riskDistribution(),
        ]);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        if (activityRes.status === 'fulfilled') setActivity(activityRes.value.data || []);
        if (riskRes.status === 'fulfilled') setRiskDist(riskRes.value.data || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '120px' }}>
        <div className="loading-spinner">Loading dashboard...</div>
      </div>
    );
  }

  const totalRisk = riskDist.reduce((sum, r) => sum + (r.count || 0), 0) || 1;

  return (
    <div className="fade-in" style={{ padding: '0' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a2e' }}>Dashboard</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
          Welcome back. Here is an overview of your case management activity.
        </p>
      </div>

      {/* Stat Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
        gap: '16px',
        marginBottom: '28px',
      }}>
        {statConfig.map((cfg) => {
          const value = stats?.[cfg.key] ?? 0;
          return (
            <div
              key={cfg.key}
              className="card"
              onClick={() => navigate(cfg.route)}
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              {/* Top gradient accent */}
              <div style={{
                height: '4px',
                background: cfg.bg,
              }} />
              <div style={{
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: cfg.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', flexShrink: 0,
                  boxShadow: `0 4px 12px ${cfg.color}33`,
                }}>
                  {cfg.icon}
                </div>
                <div>
                  <div style={{
                    fontSize: '28px', fontWeight: '700', color: '#1a1a2e', lineHeight: 1.1,
                  }}>
                    {value}
                  </div>
                  <div style={{
                    fontSize: '13px', color: '#6b7280', marginTop: '2px', fontWeight: '500',
                  }}>
                    {cfg.label}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom row: Recent Activity + Risk Distribution */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '20px',
      }}>
        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Recent Activity</h3>
          </div>
          <div className="card-body" style={{ padding: '0' }}>
            {activity.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <h3>No recent activity</h3>
                <p>Activity will appear here as you use the system.</p>
              </div>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {activity.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '12px',
                      padding: '14px 24px',
                      borderBottom: idx < activity.length - 1 ? '1px solid #f3f4f6' : 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: '#f3f4f6', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', flexShrink: 0, marginTop: '2px',
                    }}>
                      {item.type === 'note' ? '\u{1F4DD}' :
                       item.type === 'task' ? '\u2705' :
                       item.type === 'appointment' ? '\u{1F4C5}' :
                       item.type === 'beneficiary' ? '\u{1F464}' :
                       item.type === 'referral' ? '\u{1F517}' : '\u{1F4CC}'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a2e' }}>
                        {item.description || item.title || 'Activity'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                        {item.timestamp ? new Date(item.timestamp).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        }) : ''}
                        {item.user && ` \u2022 ${item.user}`}
                      </div>
                    </div>
                    {item.status && (
                      <span className={`badge badge-${item.status}`} style={{ flexShrink: 0 }}>
                        {item.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Risk Distribution</h3>
          </div>
          <div className="card-body">
            {riskDist.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 10px' }}>
                <h3>No data yet</h3>
                <p>Risk data will appear as beneficiaries are assessed.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {riskDist.map((item) => {
                  const level = (item.risk_level || item.level || '').toLowerCase();
                  const colors = riskColors[level] || { bg: '#f3f4f6', color: '#6b7280', barColor: '#9ca3af' };
                  const pct = Math.round(((item.count || 0) / totalRisk) * 100);
                  return (
                    <div key={level}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', marginBottom: '8px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`badge badge-${level}`}>
                            {level}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '20px', fontWeight: '700', color: colors.color,
                        }}>
                          {item.count || 0}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${pct}%`,
                            background: colors.barColor,
                          }}
                        />
                      </div>
                      <div style={{
                        fontSize: '12px', color: '#9ca3af', marginTop: '4px', textAlign: 'right',
                      }}>
                        {pct}% of total
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
