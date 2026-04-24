import React, { useState, useEffect } from 'react';
import { actionPlans, beneficiaries, caseworkers } from '../services/api';

const initialForm = {
  beneficiary_id: '', caseworker_id: '', title: '',
  plan_content: '', status: 'draft', start_date: '', end_date: '',
};

const statuses = ['draft', 'active', 'approved', 'completed'];

export default function ActionPlans() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...initialForm });
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [beneficiaryList, setBeneficiaryList] = useState([]);
  const [caseworkerList, setCaseworkerList] = useState([]);

  const fetchData = async () => {
    try {
      const [plansRes, benRes, cwRes] = await Promise.all([
        actionPlans.list(),
        beneficiaries.list(),
        caseworkers.list(),
      ]);
      setItems(plansRes.data);
      setBeneficiaryList(benRes.data);
      setCaseworkerList(cwRes.data);
    } catch (err) {
      showToast('Failed to load action plans', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const getBeneficiaryName = (id) => {
    const b = beneficiaryList.find(x => x.id === id);
    return b ? `${b.first_name} ${b.last_name}` : '-';
  };

  const getCaseworkerName = (id) => {
    const c = caseworkerList.find(x => x.id === id);
    return c ? `${c.first_name} ${c.last_name}` : '-';
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await actionPlans.create(form);
      showToast('Action plan created successfully');
      setShowModal(false);
      setForm({ ...initialForm });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create action plan', 'error');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await actionPlans.update(selected.id, form);
      showToast('Action plan updated successfully');
      setEditing(false);
      setSelected(null);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update action plan', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this action plan?')) return;
    try {
      await actionPlans.delete(id);
      showToast('Action plan deleted successfully');
      setSelected(null);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete action plan', 'error');
    }
  };

  const handleApprove = async (id) => {
    try {
      await actionPlans.approve(id);
      showToast('Action plan approved successfully');
      setSelected(null);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to approve action plan', 'error');
    }
  };

  const openDetail = async (item) => {
    try {
      const res = await actionPlans.get(item.id);
      setSelected(res.data);
      setEditing(false);
    } catch {
      showToast('Failed to load action plan details', 'error');
    }
  };

  const startEdit = () => {
    setForm({
      beneficiary_id: selected.beneficiary_id || '',
      caseworker_id: selected.caseworker_id || '',
      title: selected.title || '',
      plan_content: selected.plan_content || '',
      status: selected.status || 'draft',
      start_date: selected.start_date ? selected.start_date.slice(0, 10) : '',
      end_date: selected.end_date ? selected.end_date.slice(0, 10) : '',
    });
    setEditing(true);
  };

  const filtered = items.filter(i => {
    const s = search.toLowerCase();
    return (
      (i.title || '').toLowerCase().includes(s) ||
      (i.status || '').toLowerCase().includes(s) ||
      getBeneficiaryName(i.beneficiary_id).toLowerCase().includes(s)
    );
  });

  if (loading) return <div className="loading-spinner">Loading action plans...</div>;

  const renderForm = (onSubmit, submitLabel) => (
    <form onSubmit={onSubmit}>
      <div className="modal-body">
        <div className="form-row">
          <div className="form-group">
            <label>Beneficiary</label>
            <select name="beneficiary_id" value={form.beneficiary_id} onChange={handleChange} required>
              <option value="">Select beneficiary...</option>
              {beneficiaryList.map(b => (
                <option key={b.id} value={b.id}>{b.first_name} {b.last_name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Caseworker</label>
            <select name="caseworker_id" value={form.caseworker_id} onChange={handleChange} required>
              <option value="">Select caseworker...</option>
              {caseworkerList.map(c => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Title</label>
          <input name="title" value={form.title} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Plan Content</label>
          <textarea name="plan_content" value={form.plan_content} onChange={handleChange} rows={6} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Start Date</label>
            <input type="date" name="start_date" value={form.start_date} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input type="date" name="end_date" value={form.end_date} onChange={handleChange} />
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-outline" onClick={() => { setShowModal(false); setEditing(false); }}>Cancel</button>
        <button type="submit" className="btn btn-primary">{submitLabel}</button>
      </div>
    </form>
  );

  return (
    <div className="fade-in">
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Action Plans</h2>
            <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>({filtered.length})</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search action plans..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 240 }}
            />
            <button className="btn btn-primary" onClick={() => { setForm({ ...initialForm }); setShowModal(true); }}>
              + New Action Plan
            </button>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <h3>No action plans found</h3>
              <p>Create a new action plan to get started.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Beneficiary</th>
                  <th>Status</th>
                  <th>AI Generated</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} onClick={() => openDetail(item)}>
                    <td style={{ fontWeight: 500 }}>{item.title}</td>
                    <td>{getBeneficiaryName(item.beneficiary_id)}</td>
                    <td>
                      <span className={`badge badge-${item.status || 'draft'}`}>
                        {item.status || 'draft'}
                      </span>
                    </td>
                    <td>
                      {item.ai_generated ? (
                        <span className="badge" style={{
                          background: 'linear-gradient(135deg, #ede9fe, #fae8ff)',
                          color: '#7c3aed',
                        }}>AI Generated</span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>Manual</span>
                      )}
                    </td>
                    <td>{item.start_date ? new Date(item.start_date).toLocaleDateString() : '-'}</td>
                    <td>{item.end_date ? new Date(item.end_date).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Action Plan</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>&#x2715;</button>
            </div>
            {renderForm(handleCreate, 'Create Plan')}
          </div>
        </div>
      )}

      {/* Detail / Edit Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => { setSelected(null); setEditing(false); }}>
          <div className="modal fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Action Plan' : 'Action Plan Details'}</h2>
              <button className="btn-icon" onClick={() => { setSelected(null); setEditing(false); }}>&#x2715;</button>
            </div>
            {editing ? renderForm(handleUpdate, 'Save Changes') : (
              <>
                <div className="modal-body">
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Title</label>
                      <div className="value">{selected.title}</div>
                    </div>
                    <div className="detail-item">
                      <label>Beneficiary</label>
                      <div className="value">{getBeneficiaryName(selected.beneficiary_id)}</div>
                    </div>
                    <div className="detail-item">
                      <label>Caseworker</label>
                      <div className="value">{getCaseworkerName(selected.caseworker_id)}</div>
                    </div>
                    <div className="detail-item">
                      <label>Status</label>
                      <div className="value">
                        <span className={`badge badge-${selected.status || 'draft'}`}>
                          {selected.status || 'draft'}
                        </span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <label>AI Generated</label>
                      <div className="value">
                        {selected.ai_generated ? (
                          <span className="badge" style={{
                            background: 'linear-gradient(135deg, #ede9fe, #fae8ff)',
                            color: '#7c3aed',
                          }}>AI Generated</span>
                        ) : 'Manual'}
                      </div>
                    </div>
                    <div className="detail-item">
                      <label>Start Date</label>
                      <div className="value">
                        {selected.start_date ? new Date(selected.start_date).toLocaleDateString() : '-'}
                      </div>
                    </div>
                    <div className="detail-item">
                      <label>End Date</label>
                      <div className="value">
                        {selected.end_date ? new Date(selected.end_date).toLocaleDateString() : '-'}
                      </div>
                    </div>
                    <div className="detail-item">
                      <label>Created</label>
                      <div className="value">
                        {selected.created_at ? new Date(selected.created_at).toLocaleDateString() : '-'}
                      </div>
                    </div>
                  </div>
                  {selected.plan_content && (
                    <div style={{ marginTop: 20 }}>
                      <label>Plan Content</label>
                      <div style={{
                        marginTop: 8,
                        padding: 20,
                        background: selected.ai_generated
                          ? 'linear-gradient(135deg, #f0f0ff 0%, #f5f0ff 50%, #fff0f5 100%)'
                          : '#f9fafb',
                        border: `1px solid ${selected.ai_generated ? '#e0d4fc' : 'var(--border)'}`,
                        borderRadius: 'var(--radius)',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.7,
                        fontSize: 14,
                      }}>
                        {selected.plan_content}
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
                  {(selected.status === 'draft' || selected.status === 'active') && (
                    <button className="btn btn-success btn-sm" onClick={() => handleApprove(selected.id)}>
                      Approve
                    </button>
                  )}
                  <button className="btn btn-primary btn-sm" onClick={startEdit}>Edit</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
}
