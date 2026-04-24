import React, { useState, useEffect } from 'react';
import { goals as goalsApi, beneficiaries, caseworkers } from '../services/api';

export default function Goals() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [benList, setBenList] = useState([]);
  const [cwList, setCwList] = useState([]);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    beneficiary_id: '', caseworker_id: '', title: '', description: '',
    category: 'Employment', target_date: '', progress: 0, status: 'active',
  };

  const categories = [
    'Employment', 'Housing', 'Education', 'Health', 'Mental Health',
    'Recovery', 'Financial', 'Legal', 'Family', 'Safety', 'Career',
  ];

  const statusOptions = ['active', 'completed', 'on_hold', 'cancelled'];

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [gRes, bRes, cRes] = await Promise.all([
        goalsApi.list(), beneficiaries.list(), caseworkers.list(),
      ]);
      setItems(gRes.data);
      setBenList(bRes.data);
      setCwList(cRes.data);
    } catch (err) {
      console.error('Failed to fetch goals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const getBenName = (id) => {
    const b = benList.find((x) => x.id === id);
    return b ? `${b.first_name} ${b.last_name}` : '-';
  };

  const getCwName = (id) => {
    const c = cwList.find((x) => x.id === id);
    return c ? c.full_name || `${c.first_name} ${c.last_name}` : '-';
  };

  const openCreate = () => {
    setForm({ ...emptyForm });
    setEditing(false);
    setSelected(null);
    setShowModal(true);
  };

  const openDetail = async (item) => {
    try {
      const res = await goalsApi.get(item.id);
      setSelected(res.data);
      setEditing(false);
      setShowModal(true);
    } catch {
      showToast('Failed to load goal', 'error');
    }
  };

  const openEdit = () => {
    setForm({
      beneficiary_id: selected.beneficiary_id || '',
      caseworker_id: selected.caseworker_id || '',
      title: selected.title || '',
      description: selected.description || '',
      category: selected.category || 'Employment',
      target_date: selected.target_date ? selected.target_date.slice(0, 10) : '',
      progress: selected.progress || 0,
      status: selected.status || 'active',
    });
    setEditing(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = { ...form };
      if (payload.beneficiary_id) payload.beneficiary_id = Number(payload.beneficiary_id);
      if (payload.caseworker_id) payload.caseworker_id = Number(payload.caseworker_id);
      payload.progress = Number(payload.progress);

      if (selected && editing) {
        await goalsApi.update(selected.id, payload);
        showToast('Goal updated successfully');
      } else {
        await goalsApi.create(payload);
        showToast('Goal created successfully');
      }
      setShowModal(false);
      setSelected(null);
      setEditing(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save goal', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    try {
      await goalsApi.delete(selected.id);
      showToast('Goal deleted');
      setShowModal(false);
      setSelected(null);
      fetchData();
    } catch {
      showToast('Failed to delete goal', 'error');
    }
  };

  const filtered = items.filter((g) => {
    const term = search.toLowerCase();
    return (
      (g.title || '').toLowerCase().includes(term) ||
      getBenName(g.beneficiary_id).toLowerCase().includes(term) ||
      (g.category || '').toLowerCase().includes(term) ||
      (g.status || '').toLowerCase().includes(term)
    );
  });

  if (loading) return <div className="loading-spinner">Loading goals...</div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>Goals</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            {items.length} total goals
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ New Goal</button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ padding: 16 }}>
          <input
            type="text"
            placeholder="Search by title, beneficiary, category, or status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 400 }}
          />
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <h3>No goals found</h3>
            <p>Try adjusting your search or create a new goal.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Beneficiary</th>
                <th>Category</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Target Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr key={g.id} onClick={() => openDetail(g)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 500 }}>{g.title || '-'}</td>
                  <td>{getBenName(g.beneficiary_id)}</td>
                  <td><span className="badge badge-info">{g.category || '-'}</span></td>
                  <td style={{ minWidth: 120 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div className="progress-bar-fill" style={{ width: `${g.progress || 0}%` }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{g.progress || 0}%</span>
                    </div>
                  </td>
                  <td><span className={`badge badge-${g.status || 'active'}`}>{g.status || 'active'}</span></td>
                  <td>{formatDate(g.target_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setSelected(null); setEditing(false); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selected && !editing ? 'Goal Details' : editing ? 'Edit Goal' : 'New Goal'}</h2>
              <button className="btn-icon" onClick={() => { setShowModal(false); setSelected(null); setEditing(false); }} style={{ fontSize: 20 }}>&times;</button>
            </div>

            {selected && !editing ? (
              <>
                <div className="modal-body">
                  <div className="detail-grid">
                    <div className="detail-item"><label>Title</label><span>{selected.title || '-'}</span></div>
                    <div className="detail-item"><label>Beneficiary</label><span>{getBenName(selected.beneficiary_id)}</span></div>
                    <div className="detail-item"><label>Caseworker</label><span>{getCwName(selected.caseworker_id)}</span></div>
                    <div className="detail-item"><label>Category</label><span className="badge badge-info">{selected.category || '-'}</span></div>
                    <div className="detail-item"><label>Status</label><span className={`badge badge-${selected.status}`}>{selected.status || '-'}</span></div>
                    <div className="detail-item"><label>Target Date</label><span>{formatDate(selected.target_date)}</span></div>
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Progress</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="progress-bar" style={{ flex: 1, height: 12 }}>
                        <div className="progress-bar-fill" style={{ width: `${selected.progress || 0}%` }} />
                      </div>
                      <span style={{ fontWeight: 600 }}>{selected.progress || 0}%</span>
                    </div>
                  </div>
                  {selected.description && (
                    <div style={{ marginTop: 16 }}>
                      <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Description</label>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{selected.description}</p>
                    </div>
                  )}
                  {selected.milestones && selected.milestones.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>Milestones</label>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {selected.milestones.map((m, i) => (
                          <li key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 0', borderBottom: '1px solid var(--border-color, #eee)',
                          }}>
                            <input
                              type="checkbox"
                              checked={m.completed || false}
                              readOnly
                              style={{ width: 18, height: 18 }}
                            />
                            <span style={{
                              textDecoration: m.completed ? 'line-through' : 'none',
                              color: m.completed ? 'var(--text-secondary, #888)' : 'inherit',
                            }}>
                              {m.title || m.description || m}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
                  <button className="btn btn-outline" onClick={openEdit}>Edit</button>
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Beneficiary *</label>
                      <select name="beneficiary_id" value={form.beneficiary_id} onChange={handleChange} required>
                        <option value="">-- Select --</option>
                        {benList.map((b) => (
                          <option key={b.id} value={b.id}>{b.first_name} {b.last_name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Caseworker</label>
                      <select name="caseworker_id" value={form.caseworker_id} onChange={handleChange}>
                        <option value="">-- Select --</option>
                        {cwList.map((c) => (
                          <option key={c.id} value={c.id}>{c.full_name || `${c.first_name} ${c.last_name}`}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Title *</label>
                    <input name="title" value={form.title} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Category</label>
                      <select name="category" value={form.category} onChange={handleChange}>
                        {categories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select name="status" value={form.status} onChange={handleChange}>
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Target Date</label>
                      <input name="target_date" type="date" value={form.target_date} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Progress: {form.progress}%</label>
                      <input name="progress" type="range" min="0" max="100" value={form.progress} onChange={handleChange} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => { setShowModal(false); setSelected(null); setEditing(false); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : editing ? 'Update Goal' : 'Create Goal'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
