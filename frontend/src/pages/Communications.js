import React, { useState, useEffect } from 'react';
import { communications as commApi, beneficiaries, caseworkers } from '../services/api';

export default function Communications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    beneficiary_id: '', caseworker_id: '', comm_type: 'call',
    direction: 'inbound', subject: '', content: '', contact_method: 'phone',
  });
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [benList, setBenList] = useState([]);
  const [cwList, setCwList] = useState([]);
  const [detailModal, setDetailModal] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [commRes, benRes, cwRes] = await Promise.all([
        commApi.list(), beneficiaries.list(), caseworkers.list(),
      ]);
      setItems(commRes.data);
      setBenList(benRes.data);
      setCwList(cwRes.data);
    } catch (err) {
      console.error('Failed to fetch communications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      beneficiary_id: '', caseworker_id: '', comm_type: 'call',
      direction: 'inbound', subject: '', content: '', contact_method: 'phone',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...form,
        beneficiary_id: Number(form.beneficiary_id),
        caseworker_id: form.caseworker_id ? Number(form.caseworker_id) : undefined,
      };
      if (editing && selected) {
        await commApi.update(selected.id, payload);
        showToast('Communication updated successfully');
      } else {
        await commApi.create(payload);
        showToast('Communication created successfully');
      }
      setShowModal(false);
      setEditing(false);
      setSelected(null);
      resetForm();
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save communication', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setForm({
      beneficiary_id: item.beneficiary_id || '',
      caseworker_id: item.caseworker_id || '',
      comm_type: item.comm_type || 'call',
      direction: item.direction || 'inbound',
      subject: item.subject || '',
      content: item.content || '',
      contact_method: item.contact_method || 'phone',
    });
    setSelected(item);
    setEditing(true);
    setDetailModal(false);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this communication?')) return;
    try {
      await commApi.delete(id);
      showToast('Communication deleted');
      setDetailModal(false);
      setSelected(null);
      fetchData();
    } catch (err) {
      showToast('Failed to delete communication', 'error');
    }
  };

  const handleRowClick = (item) => {
    setSelected(item);
    setDetailModal(true);
  };

  const typeIcon = { call: '\u{1F4DE}', email: '\u{1F4E7}', text: '\u{1F4AC}' };

  const getBeneficiaryName = (id) => {
    const b = benList.find((x) => x.id === id);
    return b ? `${b.first_name} ${b.last_name}` : '-';
  };

  const getCaseworkerName = (id) => {
    const cw = cwList.find((x) => x.id === id);
    return cw ? cw.full_name || `${cw.first_name} ${cw.last_name}` : '-';
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const filtered = items.filter((c) => {
    const term = search.toLowerCase();
    return (
      (c.subject || '').toLowerCase().includes(term) ||
      (c.content || '').toLowerCase().includes(term) ||
      (c.comm_type || '').toLowerCase().includes(term) ||
      getBeneficiaryName(c.beneficiary_id).toLowerCase().includes(term)
    );
  });

  if (loading) return <div className="loading-spinner">Loading communications...</div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>Communications</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            {items.length} total communications
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setEditing(false); setSelected(null); setShowModal(true); }}>
          + New Communication
        </button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ padding: 16 }}>
          <input
            type="text"
            placeholder="Search by subject, content, type, or beneficiary..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 400 }}
          />
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <h3>No communications found</h3>
            <p>Try adjusting your search or log a new communication.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Beneficiary</th>
                <th>Type</th>
                <th>Direction</th>
                <th>Method</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} onClick={() => handleRowClick(c)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 500 }}>{c.subject || '-'}</td>
                  <td>{getBeneficiaryName(c.beneficiary_id)}</td>
                  <td>
                    <span style={{ marginRight: 6 }}>{typeIcon[c.comm_type] || ''}</span>
                    {c.comm_type || '-'}
                  </td>
                  <td>
                    <span style={{
                      color: c.direction === 'inbound' ? '#16a34a' : '#2563eb',
                      fontWeight: 600,
                      fontSize: 16,
                      marginRight: 4,
                    }}>
                      {c.direction === 'inbound' ? '\u2193' : '\u2191'}
                    </span>
                    {c.direction || '-'}
                  </td>
                  <td>{c.contact_method || '-'}</td>
                  <td>{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {detailModal && selected && (
        <div className="modal-overlay" onClick={() => { setDetailModal(false); setSelected(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selected.subject || 'Communication Detail'}</h2>
              <button className="btn-icon" onClick={() => { setDetailModal(false); setSelected(null); }} style={{ fontSize: 20 }}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Beneficiary</label>
                  <p>{getBeneficiaryName(selected.beneficiary_id)}</p>
                </div>
                <div>
                  <label style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Caseworker</label>
                  <p>{getCaseworkerName(selected.caseworker_id)}</p>
                </div>
                <div>
                  <label style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Type</label>
                  <p>{typeIcon[selected.comm_type] || ''} {selected.comm_type || '-'}</p>
                </div>
                <div>
                  <label style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Direction</label>
                  <p>
                    <span style={{ color: selected.direction === 'inbound' ? '#16a34a' : '#2563eb', fontWeight: 600 }}>
                      {selected.direction === 'inbound' ? '\u2193' : '\u2191'}
                    </span>{' '}
                    {selected.direction || '-'}
                  </p>
                </div>
                <div>
                  <label style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Method</label>
                  <p>{selected.contact_method || '-'}</p>
                </div>
                <div>
                  <label style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Date</label>
                  <p>{formatDate(selected.created_at)}</p>
                </div>
              </div>
              <div>
                <label style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Content</label>
                <div style={{
                  marginTop: 8, padding: 16, background: 'var(--bg-secondary, #f9fafb)',
                  borderRadius: 8, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                }}>
                  {selected.content || 'No content recorded.'}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>
                Delete
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditing(false); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Communication' : 'New Communication'}</h2>
              <button className="btn-icon" onClick={() => { setShowModal(false); setEditing(false); }} style={{ fontSize: 20 }}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Beneficiary *</label>
                    <select name="beneficiary_id" value={form.beneficiary_id} onChange={handleChange} required>
                      <option value="">-- Select Beneficiary --</option>
                      {benList.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.first_name} {b.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Caseworker</label>
                    <select name="caseworker_id" value={form.caseworker_id} onChange={handleChange}>
                      <option value="">-- Select Caseworker --</option>
                      {cwList.map((cw) => (
                        <option key={cw.id} value={cw.id}>
                          {cw.full_name || `${cw.first_name} ${cw.last_name}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Type *</label>
                    <select name="comm_type" value={form.comm_type} onChange={handleChange} required>
                      <option value="call">Call</option>
                      <option value="email">Email</option>
                      <option value="text">Text</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Direction *</label>
                    <select name="direction" value={form.direction} onChange={handleChange} required>
                      <option value="inbound">Inbound</option>
                      <option value="outbound">Outbound</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Subject *</label>
                    <input name="subject" value={form.subject} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Contact Method</label>
                    <select name="contact_method" value={form.contact_method} onChange={handleChange}>
                      <option value="phone">Phone</option>
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                      <option value="in-person">In-Person</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Content</label>
                  <textarea name="content" value={form.content} onChange={handleChange} rows={5} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => { setShowModal(false); setEditing(false); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Update Communication' : 'Create Communication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
}
