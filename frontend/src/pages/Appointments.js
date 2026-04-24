import React, { useState, useEffect } from 'react';
import { appointments as apptApi, beneficiaries, caseworkers } from '../services/api';

export default function Appointments() {
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
    appointment_date: '', duration_minutes: 30, location: '',
    appointment_type: 'Follow-up', status: 'scheduled', notes: '',
  };

  const appointmentTypes = [
    'Follow-up', 'Emergency', 'Check-in', 'Assessment', 'Counseling',
    'Medical', 'Education', 'Group', 'Career', 'Financial', 'Family Meeting', 'Safety',
  ];

  const statusOptions = ['scheduled', 'completed', 'cancelled', 'no_show'];

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [aRes, bRes, cRes] = await Promise.all([
        apptApi.list(), beneficiaries.list(), caseworkers.list(),
      ]);
      setItems(aRes.data);
      setBenList(bRes.data);
      setCwList(cRes.data);
    } catch (err) {
      console.error('Failed to fetch appointments', err);
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
      const res = await apptApi.get(item.id);
      setSelected(res.data);
      setEditing(false);
      setShowModal(true);
    } catch {
      showToast('Failed to load appointment', 'error');
    }
  };

  const openEdit = () => {
    setForm({
      beneficiary_id: selected.beneficiary_id || '',
      caseworker_id: selected.caseworker_id || '',
      title: selected.title || '',
      description: selected.description || '',
      appointment_date: selected.appointment_date ? selected.appointment_date.slice(0, 16) : '',
      duration_minutes: selected.duration_minutes || 30,
      location: selected.location || '',
      appointment_type: selected.appointment_type || 'Follow-up',
      status: selected.status || 'scheduled',
      notes: selected.notes || '',
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
      if (payload.duration_minutes) payload.duration_minutes = Number(payload.duration_minutes);

      if (selected && editing) {
        await apptApi.update(selected.id, payload);
        showToast('Appointment updated successfully');
      } else {
        await apptApi.create(payload);
        showToast('Appointment created successfully');
      }
      setShowModal(false);
      setSelected(null);
      setEditing(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save appointment', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;
    try {
      await apptApi.delete(selected.id);
      showToast('Appointment deleted');
      setShowModal(false);
      setSelected(null);
      fetchData();
    } catch {
      showToast('Failed to delete appointment', 'error');
    }
  };

  const filtered = items.filter((a) => {
    const term = search.toLowerCase();
    return (
      (a.title || '').toLowerCase().includes(term) ||
      getBenName(a.beneficiary_id).toLowerCase().includes(term) ||
      (a.location || '').toLowerCase().includes(term) ||
      (a.appointment_type || '').toLowerCase().includes(term)
    );
  });

  if (loading) return <div className="loading-spinner">Loading appointments...</div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>Appointments</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            {items.length} total appointments
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ New Appointment</button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ padding: 16 }}>
          <input
            type="text"
            placeholder="Search by title, beneficiary, location, or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 400 }}
          />
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <h3>No appointments found</h3>
            <p>Try adjusting your search or create a new appointment.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Beneficiary</th>
                <th>Date/Time</th>
                <th>Duration</th>
                <th>Location</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} onClick={() => openDetail(a)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 500 }}>{a.title || '-'}</td>
                  <td>{getBenName(a.beneficiary_id)}</td>
                  <td>{formatDate(a.appointment_date)}</td>
                  <td>{a.duration_minutes ? `${a.duration_minutes} min` : '-'}</td>
                  <td>{a.location || '-'}</td>
                  <td><span className="badge badge-info">{a.appointment_type || '-'}</span></td>
                  <td><span className={`badge badge-${a.status || 'scheduled'}`}>{a.status || 'scheduled'}</span></td>
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
              <h2>{selected && !editing ? 'Appointment Details' : editing ? 'Edit Appointment' : 'New Appointment'}</h2>
              <button className="btn-icon" onClick={() => { setShowModal(false); setSelected(null); setEditing(false); }} style={{ fontSize: 20 }}>&times;</button>
            </div>

            {selected && !editing ? (
              <>
                <div className="modal-body">
                  <div className="detail-grid">
                    <div className="detail-item"><label>Title</label><span>{selected.title || '-'}</span></div>
                    <div className="detail-item"><label>Beneficiary</label><span>{getBenName(selected.beneficiary_id)}</span></div>
                    <div className="detail-item"><label>Caseworker</label><span>{getCwName(selected.caseworker_id)}</span></div>
                    <div className="detail-item"><label>Date/Time</label><span>{formatDate(selected.appointment_date)}</span></div>
                    <div className="detail-item"><label>Duration</label><span>{selected.duration_minutes ? `${selected.duration_minutes} min` : '-'}</span></div>
                    <div className="detail-item"><label>Location</label><span>{selected.location || '-'}</span></div>
                    <div className="detail-item"><label>Type</label><span className={`badge badge-info`}>{selected.appointment_type || '-'}</span></div>
                    <div className="detail-item"><label>Status</label><span className={`badge badge-${selected.status}`}>{selected.status || '-'}</span></div>
                  </div>
                  {selected.description && (
                    <div style={{ marginTop: 16 }}>
                      <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Description</label>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{selected.description}</p>
                    </div>
                  )}
                  {selected.notes && (
                    <div style={{ marginTop: 16 }}>
                      <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Notes</label>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{selected.notes}</p>
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
                      <label>Date/Time *</label>
                      <input name="appointment_date" type="datetime-local" value={form.appointment_date} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label>Duration (minutes)</label>
                      <input name="duration_minutes" type="number" value={form.duration_minutes} onChange={handleChange} min={5} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Location</label>
                      <input name="location" value={form.location} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Type</label>
                      <select name="appointment_type" value={form.appointment_type} onChange={handleChange}>
                        {appointmentTypes.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Status</label>
                      <select name="status" value={form.status} onChange={handleChange}>
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Notes</label>
                    <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => { setShowModal(false); setSelected(null); setEditing(false); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : editing ? 'Update Appointment' : 'Create Appointment'}
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
