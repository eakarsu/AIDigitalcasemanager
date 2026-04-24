import React, { useState, useEffect } from 'react';
import { notes as notesApi, beneficiaries, caseworkers } from '../services/api';

const initialForm = {
  beneficiary_id: '', caseworker_id: '', meeting_date: '',
  meeting_type: 'In-Person', location: '', summary: '',
  detailed_notes: '', mood: '', follow_up_needed: false, follow_up_date: '',
};

const meetingTypes = ['In-Person', 'Phone', 'Video', 'Home Visit'];
const moods = ['positive', 'neutral', 'anxious', 'frustrated', 'hopeful', 'distressed'];

export default function CaseNotes() {
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
      const [notesRes, benRes, cwRes] = await Promise.all([
        notesApi.list(),
        beneficiaries.list(),
        caseworkers.list(),
      ]);
      setItems(notesRes.data);
      setBeneficiaryList(benRes.data);
      setCaseworkerList(cwRes.data);
    } catch (err) {
      showToast('Failed to load case notes', 'error');
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
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const getBeneficiaryName = (id) => {
    const b = beneficiaryList.find(x => x.id === id);
    return b ? `${b.first_name} ${b.last_name}` : '-';
  };

  const getCaseworkerName = (id) => {
    const c = caseworkerList.find(x => x.id === id);
    return c ? `${c.first_name} ${c.last_name}` : '-';
  };

  const moodBadgeClass = (mood) => {
    if (!mood) return 'badge';
    const m = mood.toLowerCase();
    if (['positive', 'hopeful'].includes(m)) return 'badge badge-low';
    if (['neutral'].includes(m)) return 'badge badge-medium';
    return 'badge badge-high';
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await notesApi.create(form);
      showToast('Case note created successfully');
      setShowModal(false);
      setForm({ ...initialForm });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create case note', 'error');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await notesApi.update(selected.id, form);
      showToast('Case note updated successfully');
      setEditing(false);
      setSelected(null);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update case note', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this case note?')) return;
    try {
      await notesApi.delete(id);
      showToast('Case note deleted successfully');
      setSelected(null);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete case note', 'error');
    }
  };

  const openDetail = async (item) => {
    try {
      const res = await notesApi.get(item.id);
      setSelected(res.data);
      setEditing(false);
    } catch {
      showToast('Failed to load note details', 'error');
    }
  };

  const startEdit = () => {
    setForm({
      beneficiary_id: selected.beneficiary_id || '',
      caseworker_id: selected.caseworker_id || '',
      meeting_date: selected.meeting_date ? selected.meeting_date.slice(0, 10) : '',
      meeting_type: selected.meeting_type || 'In-Person',
      location: selected.location || '',
      summary: selected.summary || '',
      detailed_notes: selected.detailed_notes || '',
      mood: selected.mood || '',
      follow_up_needed: selected.follow_up_needed || false,
      follow_up_date: selected.follow_up_date ? selected.follow_up_date.slice(0, 10) : '',
    });
    setEditing(true);
  };

  const filtered = items.filter(i => {
    const s = search.toLowerCase();
    return (
      (i.summary || '').toLowerCase().includes(s) ||
      (i.meeting_type || '').toLowerCase().includes(s) ||
      (i.mood || '').toLowerCase().includes(s) ||
      getBeneficiaryName(i.beneficiary_id).toLowerCase().includes(s)
    );
  });

  if (loading) return <div className="loading-spinner">Loading case notes...</div>;

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
        <div className="form-row">
          <div className="form-group">
            <label>Meeting Date</label>
            <input type="date" name="meeting_date" value={form.meeting_date} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Meeting Type</label>
            <select name="meeting_type" value={form.meeting_type} onChange={handleChange}>
              {meetingTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Location</label>
          <input name="location" value={form.location} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Summary</label>
          <input name="summary" value={form.summary} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Detailed Notes</label>
          <textarea name="detailed_notes" value={form.detailed_notes} onChange={handleChange} rows={4} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Mood</label>
            <select name="mood" value={form.mood} onChange={handleChange}>
              <option value="">Select mood...</option>
              {moods.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Follow-up Date</label>
            <input type="date" name="follow_up_date" value={form.follow_up_date} onChange={handleChange} />
          </div>
        </div>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="follow_up_needed"
              checked={form.follow_up_needed}
              onChange={handleChange}
              style={{ width: 'auto' }}
            />
            Follow-up Needed
          </label>
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
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Case Notes</h2>
            <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>({filtered.length})</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 240 }}
            />
            <button className="btn btn-primary" onClick={() => { setForm({ ...initialForm }); setShowModal(true); }}>
              + New Note
            </button>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <h3>No case notes found</h3>
              <p>Create a new case note to get started.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Beneficiary</th>
                  <th>Type</th>
                  <th>Summary</th>
                  <th>Mood</th>
                  <th>Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} onClick={() => openDetail(item)}>
                    <td>{item.meeting_date ? new Date(item.meeting_date).toLocaleDateString() : '-'}</td>
                    <td style={{ fontWeight: 500 }}>{getBeneficiaryName(item.beneficiary_id)}</td>
                    <td>{item.meeting_type}</td>
                    <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.summary}
                    </td>
                    <td>
                      {item.mood && <span className={moodBadgeClass(item.mood)}>{item.mood}</span>}
                    </td>
                    <td>
                      {item.follow_up_needed ? (
                        <span className="badge badge-pending">Yes</span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>No</span>
                      )}
                    </td>
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
              <h2>New Case Note</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>&#x2715;</button>
            </div>
            {renderForm(handleCreate, 'Create Note')}
          </div>
        </div>
      )}

      {/* Detail / Edit Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => { setSelected(null); setEditing(false); }}>
          <div className="modal fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Case Note' : 'Case Note Details'}</h2>
              <button className="btn-icon" onClick={() => { setSelected(null); setEditing(false); }}>&#x2715;</button>
            </div>
            {editing ? renderForm(handleUpdate, 'Save Changes') : (
              <>
                <div className="modal-body">
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Beneficiary</label>
                      <div className="value">{getBeneficiaryName(selected.beneficiary_id)}</div>
                    </div>
                    <div className="detail-item">
                      <label>Caseworker</label>
                      <div className="value">{getCaseworkerName(selected.caseworker_id)}</div>
                    </div>
                    <div className="detail-item">
                      <label>Meeting Date</label>
                      <div className="value">
                        {selected.meeting_date ? new Date(selected.meeting_date).toLocaleDateString() : '-'}
                      </div>
                    </div>
                    <div className="detail-item">
                      <label>Meeting Type</label>
                      <div className="value">{selected.meeting_type || '-'}</div>
                    </div>
                    <div className="detail-item">
                      <label>Location</label>
                      <div className="value">{selected.location || '-'}</div>
                    </div>
                    <div className="detail-item">
                      <label>Mood</label>
                      <div className="value">
                        {selected.mood ? <span className={moodBadgeClass(selected.mood)}>{selected.mood}</span> : '-'}
                      </div>
                    </div>
                    <div className="detail-item">
                      <label>Follow-up Needed</label>
                      <div className="value">
                        {selected.follow_up_needed ? (
                          <span className="badge badge-pending">Yes</span>
                        ) : 'No'}
                      </div>
                    </div>
                    <div className="detail-item">
                      <label>Follow-up Date</label>
                      <div className="value">
                        {selected.follow_up_date ? new Date(selected.follow_up_date).toLocaleDateString() : '-'}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 20 }}>
                    <label>Summary</label>
                    <div className="value" style={{ marginTop: 4 }}>{selected.summary || '-'}</div>
                  </div>
                  {selected.detailed_notes && (
                    <div style={{ marginTop: 16 }}>
                      <label>Detailed Notes</label>
                      <div style={{ marginTop: 4, whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.6 }}>
                        {selected.detailed_notes}
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
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
