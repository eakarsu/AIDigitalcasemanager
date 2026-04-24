import React, { useState, useEffect } from 'react';
import { notifications as notifApi } from '../services/api';

const typeIcons = {
  action_plan: '\u{1F4CB}',
  alert: '\u26A0\uFE0F',
  task_due: '\u2705',
  appointment: '\u{1F4C5}',
  milestone: '\u{1F3AF}',
  follow_up: '\u{1F504}',
  update: '\u{1F4E3}',
  medical: '\u{1F3E5}',
  safety: '\u{1F6E1}\uFE0F',
  admin: '\u2699\uFE0F',
  system: '\u{1F4BB}',
  referral: '\u{1F517}',
};

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await notifApi.list();
      setItems(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleMarkRead = async (item) => {
    if (item.read) return;
    try {
      await notifApi.markRead(item.id);
      setItems((prev) => prev.map((n) => n.id === item.id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notifApi.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      showToast('All notifications marked as read');
    } catch (err) {
      showToast('Failed to mark all as read', 'error');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await notifApi.delete(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
      showToast('Notification deleted');
    } catch (err) {
      showToast('Failed to delete notification', 'error');
    }
  };

  const unreadCount = items.filter((n) => !n.read).length;

  const filtered = items.filter((n) => {
    const term = search.toLowerCase();
    return (
      (n.title || '').toLowerCase().includes(term) ||
      (n.message || '').toLowerCase().includes(term) ||
      (n.type || '').toLowerCase().includes(term)
    );
  });

  if (loading) return <div className="loading-spinner">Loading notifications...</div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>Notifications</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'} &middot; {items.length} total
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-primary" onClick={handleMarkAllRead}>
            Mark All Read
          </button>
        )}
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ padding: 16 }}>
          <input
            type="text"
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 400 }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <h3>No notifications</h3>
            <p>You're all caught up! Check back later.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((n) => (
            <div
              key={n.id}
              className="card"
              onClick={() => handleMarkRead(n)}
              style={{
                cursor: 'pointer',
                borderLeft: !n.read ? '4px solid var(--primary)' : '4px solid transparent',
                transition: 'all 0.2s ease',
                opacity: n.read ? 0.75 : 1,
              }}
            >
              <div className="card-body" style={{
                display: 'flex', alignItems: 'flex-start', gap: 16, padding: '16px 20px',
              }}>
                {/* Icon */}
                <div style={{
                  fontSize: 24, flexShrink: 0, width: 44, height: 44,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 12, background: 'var(--bg-secondary, #f3f4f6)',
                }}>
                  {typeIcons[n.type] || '\u{1F514}'}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: n.read ? 500 : 700, fontSize: 15 }}>
                      {n.title || 'Notification'}
                    </span>
                    {!n.read && (
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: 'var(--primary)', display: 'inline-block', flexShrink: 0,
                      }} />
                    )}
                  </div>
                  <p style={{
                    fontSize: 13, color: 'var(--text-secondary)', margin: 0,
                    lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>
                    {n.message || ''}
                  </p>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, display: 'block' }}>
                    {timeAgo(n.created_at)}
                  </span>
                </div>

                {/* Delete button */}
                <button
                  className="btn btn-outline btn-sm"
                  onClick={(e) => handleDelete(e, n.id)}
                  style={{ flexShrink: 0, color: '#ef4444', borderColor: '#fecaca', fontSize: 12 }}
                  title="Delete notification"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
}
