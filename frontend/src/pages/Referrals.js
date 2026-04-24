import React, { useState, useEffect } from 'react';
import { referrals as refApi, beneficiaries, caseworkers } from '../services/api';

export default function Referrals() {
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
    beneficiary_id: '', caseworker_id: '', referred_to: '', organization: '',
    referral_type: '', reason: '', contact_name: '', contact_phone: '',
    contact_email: '', follow_up_date: '', status: 'pending',
  };

  const statusOptions = ['pending', 'active', 'completed', 'declined'];

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
      const [rRes, bRes, cRes] = await Promise.all([
        refApi.list(), beneficiaries.list(), caseworkers.list(),
      ]);
      setItems(rRes.data);
      setBenList(bRes.data);
      setCwList(cRes.data);
    } catch (err) {
      console.error('Failed to fetch referrals', err);
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
      const res = await refApi.get(item.id);
      setSelected(res.data);
      setEditing(false);
      setShowModal(true);
    } catch {
      showToast('Failed to load referral', 'error');
    }
  };

  const openEdit = () => {
    setForm({
      beneficiary_id: selected.beneficiary_id || '',
      caseworker_id: selected.caseworker_id || '',
      referred_to: selected.referred_to || '',
      organization: selected.organization || '',
      referral_type: selected.referral_type || '',
      reason: selected.reason || '',
      contact_name: selected.contact_name || '',
      contact_phone: selected.contact_phone || '',
      contact_email: selected.contact_email || '',
      follow_up_date: selected.follow_up_date ? selected.follow_up_date.slice(0, 10) : '',
      status: selected.status || 'pending',
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

      if (selected && editing) {
        await refApi.update(selected.id, payload);
        showToast('Referral updated successfully');
      } else {
        await refApi.create(payload);
        showToast('Referral created successfully');
      }
      setShowModal(false);
      setSelected(null);
      setEditing(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save referral', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this referral?')) return;
    try {
      await refApi.delete(selected.id);
      showToast('Referral deleted');
      setShowModal(false);
      setSelected(null);
      fetchData();
    } catch {
      showToast('Failed to delete referral', 'error');
    }
  };

  const filtered = items.filter((r) => {
    const term = search.toLowerCase();
    return (
      (r.referred_to || '').toLowerCase().includes(term) ||
      getBenName(r.beneficiary_id).toLowerCase().includes(term) ||
      (r.organization || '').toLowerCase().includes(term) ||
      (r.referral_type || '').toLowerCase().includes(term)
    );
  });

  if (loading) return <div className="loading-spinner">Loading referrals...</div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>Referrals</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            {items.length} total referrals
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ New Referral</button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ padding: 16 }}>
          <input
            type="text"
            placeholder="Search by referred to, beneficiary, organization, or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 400 }}
          />
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <h3>No referrals found</h3>
            <p>Try adjusting your search or create a new referral.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Referred To</th>
                <th>Beneficiary</th>
                <th>Organization</th>
                <th>Type</th>
                <th>Status</th>
                <th>Follow-up Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} onClick={() => openDetail(r)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 500 }}>{r.referred_to || '-'}</td>
                  <td>{getBenName(r.beneficiary_id)}</td>
                  <td>{r.organization || '-'}</td>
                  <td><span className="badge badge-info">{r.referral_type || '-'}</span></td>
                  <td><span className={`badge badge-${r.status || 'pending'}`}>{r.status || 'pending'}</span></td>
                  <td>{formatDate(r.follow_up_date)}</td>
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
              <h2>{selected && !editing ? 'Referral Details' : editing ? 'Edit Referral' : 'New Referral'}</h2>
              <button className="btn-icon" onClick={() => { setShowModal(false); setSelected(null); setEditing(false); }} style={{ fontSize: 20 }}>&times;</button>
            </div>

            {selected && !editing ? (
              <>
                <div className="modal-body">
                  <div className="detail-grid">
                    <div className="detail-item"><label>Referred To</label><span>{selected.referred_to || '-'}</span></div>
                    <div className="detail-item"><label>Beneficiary</label><span>{getBenName(selected.beneficiary_id)}</span></div>
                    <div className="detail-item"><label>Caseworker</label><span>{getCwName(selected.caseworker_id)}</span></div>
                    <div className="detail-item"><label>Organization</label><span>{selected.organization || '-'}</span></div>
                    <div className="detail-item"><label>Type</label><span className="badge badge-info">{selected.referral_type || '-'}</span></div>
                    <div className="detail-item"><label>Status</label><span className={`badge badge-${selected.status}`}>{selected.status || '-'}</span></div>
                    <div className="detail-item"><label>Follow-up Date</label><span>{formatDate(selected.follow_up_date)}</span></div>
                  </div>
                  {selected.reason && (
                    <div style={{ marginTop: 16 }}>
                      <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Reason</label>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{selected.reason}</p>
                    </div>
                  )}
                  <div style={{ marginTop: 16 }}>
                    <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>Contact Information</label>
                    <div className="detail-grid">
                      <div className="detail-item"><label>Contact Name</label><span>{selected.contact_name || '-'}</span></div>
                      <div className="detail-item"><label>Contact Phone</label><span>{selected.contact_phone || '-'}</span></div>
                      <div className="detail-item"><label>Contact Email</label><span>{selected.contact_email || '-'}</span></div>
                    </div>
                  </div>
                  {selected.outcome && (
                    <div style={{ marginTop: 16 }}>
                      <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Outcome</label>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{selected.outcome}</p>
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
                  <div className="form-row">
                    <div className="form-group">
                      <label>Referred To *</label>
                      <input name="referred_to" value={form.referred_to} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label>Organization</label>
                      <input name="organization" value={form.organization} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Referral Type</label>
                      <input name="referral_type" value={form.referral_type} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select name="status" value={form.status} onChange={handleChange}>
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Reason</label>
                    <textarea name="reason" value={form.reason} onChange={handleChange} rows={3} />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Contact Name</label>
                      <input name="contact_name" value={form.contact_name} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Contact Phone</label>
                      <input name="contact_phone" value={form.contact_phone} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Contact Email</label>
                      <input name="contact_email" type="email" value={form.contact_email} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Follow-up Date</label>
                      <input name="follow_up_date" type="date" value={form.follow_up_date} onChange={handleChange} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => { setShowModal(false); setSelected(null); setEditing(false); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : editing ? 'Update Referral' : 'Create Referral'}
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
