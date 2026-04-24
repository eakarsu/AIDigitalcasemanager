import React, { useState, useEffect } from 'react';
import { assessments as assessApi, beneficiaries, caseworkers } from '../services/api';

export default function Assessments() {
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
    beneficiary_id: '', caseworker_id: '', assessment_type: '', title: '',
    score: '', max_score: 100, risk_level: 'low', findings: '',
    recommendations: '', next_assessment_date: '',
  };

  const riskLevels = ['low', 'medium', 'high', 'critical'];

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
      const [aRes, bRes, cRes] = await Promise.all([
        assessApi.list(), beneficiaries.list(), caseworkers.list(),
      ]);
      setItems(aRes.data);
      setBenList(bRes.data);
      setCwList(cRes.data);
    } catch (err) {
      console.error('Failed to fetch assessments', err);
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

  const getScorePercent = (score, max) => {
    if (!score || !max) return 0;
    return Math.min(Math.round((Number(score) / Number(max)) * 100), 100);
  };

  const openCreate = () => {
    setForm({ ...emptyForm });
    setEditing(false);
    setSelected(null);
    setShowModal(true);
  };

  const openDetail = async (item) => {
    try {
      const res = await assessApi.get(item.id);
      setSelected(res.data);
      setEditing(false);
      setShowModal(true);
    } catch {
      showToast('Failed to load assessment', 'error');
    }
  };

  const openEdit = () => {
    setForm({
      beneficiary_id: selected.beneficiary_id || '',
      caseworker_id: selected.caseworker_id || '',
      assessment_type: selected.assessment_type || '',
      title: selected.title || '',
      score: selected.score || '',
      max_score: selected.max_score || 100,
      risk_level: selected.risk_level || 'low',
      findings: selected.findings || '',
      recommendations: selected.recommendations || '',
      next_assessment_date: selected.next_assessment_date ? selected.next_assessment_date.slice(0, 10) : '',
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
      if (payload.score) payload.score = Number(payload.score);
      if (payload.max_score) payload.max_score = Number(payload.max_score);

      if (selected && editing) {
        await assessApi.update(selected.id, payload);
        showToast('Assessment updated successfully');
      } else {
        await assessApi.create(payload);
        showToast('Assessment created successfully');
      }
      setShowModal(false);
      setSelected(null);
      setEditing(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save assessment', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this assessment?')) return;
    try {
      await assessApi.delete(selected.id);
      showToast('Assessment deleted');
      setShowModal(false);
      setSelected(null);
      fetchData();
    } catch {
      showToast('Failed to delete assessment', 'error');
    }
  };

  const filtered = items.filter((a) => {
    const term = search.toLowerCase();
    return (
      (a.title || '').toLowerCase().includes(term) ||
      getBenName(a.beneficiary_id).toLowerCase().includes(term) ||
      (a.assessment_type || '').toLowerCase().includes(term) ||
      (a.risk_level || '').toLowerCase().includes(term)
    );
  });

  if (loading) return <div className="loading-spinner">Loading assessments...</div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>Assessments</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            {items.length} total assessments
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ New Assessment</button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ padding: 16 }}>
          <input
            type="text"
            placeholder="Search by title, beneficiary, type, or risk level..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 400 }}
          />
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <h3>No assessments found</h3>
            <p>Try adjusting your search or create a new assessment.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Beneficiary</th>
                <th>Type</th>
                <th>Score</th>
                <th>Risk Level</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} onClick={() => openDetail(a)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 500 }}>{a.title || '-'}</td>
                  <td>{getBenName(a.beneficiary_id)}</td>
                  <td><span className="badge badge-info">{a.assessment_type || '-'}</span></td>
                  <td style={{ minWidth: 140 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div className="progress-bar-fill" style={{ width: `${getScorePercent(a.score, a.max_score)}%` }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>
                        {a.score != null ? `${a.score}/${a.max_score || 100}` : '-'}
                      </span>
                    </div>
                  </td>
                  <td><span className={`badge badge-${a.risk_level || 'low'}`}>{a.risk_level || 'low'}</span></td>
                  <td>{formatDate(a.created_at)}</td>
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
              <h2>{selected && !editing ? 'Assessment Details' : editing ? 'Edit Assessment' : 'New Assessment'}</h2>
              <button className="btn-icon" onClick={() => { setShowModal(false); setSelected(null); setEditing(false); }} style={{ fontSize: 20 }}>&times;</button>
            </div>

            {selected && !editing ? (
              <>
                <div className="modal-body">
                  <div className="detail-grid">
                    <div className="detail-item"><label>Title</label><span>{selected.title || '-'}</span></div>
                    <div className="detail-item"><label>Beneficiary</label><span>{getBenName(selected.beneficiary_id)}</span></div>
                    <div className="detail-item"><label>Caseworker</label><span>{getCwName(selected.caseworker_id)}</span></div>
                    <div className="detail-item"><label>Assessment Type</label><span className="badge badge-info">{selected.assessment_type || '-'}</span></div>
                    <div className="detail-item"><label>Risk Level</label><span className={`badge badge-${selected.risk_level}`}>{selected.risk_level || '-'}</span></div>
                    <div className="detail-item"><label>Next Assessment</label><span>{formatDate(selected.next_assessment_date)}</span></div>
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Score</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="progress-bar" style={{ flex: 1, height: 12 }}>
                        <div className="progress-bar-fill" style={{ width: `${getScorePercent(selected.score, selected.max_score)}%` }} />
                      </div>
                      <span style={{ fontWeight: 600 }}>
                        {selected.score != null ? `${selected.score} / ${selected.max_score || 100}` : '-'}
                      </span>
                    </div>
                  </div>
                  {selected.findings && (
                    <div style={{ marginTop: 16 }}>
                      <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Findings</label>
                      <p style={{ whiteSpace: 'pre-wrap', background: 'var(--bg-secondary, #f9f9f9)', padding: 12, borderRadius: 8 }}>
                        {selected.findings}
                      </p>
                    </div>
                  )}
                  {selected.recommendations && (
                    <div style={{ marginTop: 16 }}>
                      <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Recommendations</label>
                      <p style={{ whiteSpace: 'pre-wrap', background: 'var(--bg-secondary, #f9f9f9)', padding: 12, borderRadius: 8 }}>
                        {selected.recommendations}
                      </p>
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
                      <label>Assessment Type *</label>
                      <input name="assessment_type" value={form.assessment_type} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label>Title *</label>
                      <input name="title" value={form.title} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Score</label>
                      <input name="score" type="number" value={form.score} onChange={handleChange} min={0} />
                    </div>
                    <div className="form-group">
                      <label>Max Score</label>
                      <input name="max_score" type="number" value={form.max_score} onChange={handleChange} min={1} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Risk Level</label>
                      <select name="risk_level" value={form.risk_level} onChange={handleChange}>
                        {riskLevels.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Next Assessment Date</label>
                      <input name="next_assessment_date" type="date" value={form.next_assessment_date} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Findings</label>
                    <textarea name="findings" value={form.findings} onChange={handleChange} rows={4} />
                  </div>
                  <div className="form-group">
                    <label>Recommendations</label>
                    <textarea name="recommendations" value={form.recommendations} onChange={handleChange} rows={4} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => { setShowModal(false); setSelected(null); setEditing(false); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : editing ? 'Update Assessment' : 'Create Assessment'}
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
