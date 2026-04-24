import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { beneficiaries, caseworkers } from '../services/api';

export default function Beneficiaries() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [cwList, setCwList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    date_of_birth: '', address: '', city: '', state: '', zip_code: '',
    emergency_contact: '', emergency_phone: '',
    risk_level: 'low', program: '', assigned_caseworker_id: '', notes: '',
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bRes, cwRes] = await Promise.all([beneficiaries.list(), caseworkers.list()]);
      setData(bRes.data);
      setCwList(cwRes.data);
    } catch (err) {
      console.error('Failed to fetch beneficiaries', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = { ...form };
      if (payload.assigned_caseworker_id) {
        payload.assigned_caseworker_id = Number(payload.assigned_caseworker_id);
      } else {
        delete payload.assigned_caseworker_id;
      }
      await beneficiaries.create(payload);
      showToast('Beneficiary created successfully');
      setShowModal(false);
      setForm({
        first_name: '', last_name: '', email: '', phone: '',
        date_of_birth: '', address: '', city: '', state: '', zip_code: '',
        emergency_contact: '', emergency_phone: '',
        risk_level: 'low', program: '', assigned_caseworker_id: '', notes: '',
      });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create beneficiary', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filtered = data.filter((b) => {
    const term = search.toLowerCase();
    const name = `${b.first_name} ${b.last_name}`.toLowerCase();
    return (
      name.includes(term) ||
      (b.email || '').toLowerCase().includes(term) ||
      (b.phone || '').toLowerCase().includes(term) ||
      (b.program || '').toLowerCase().includes(term)
    );
  });

  const getCaseworkerName = (id) => {
    const cw = cwList.find((c) => c.id === id);
    return cw ? cw.full_name || `${cw.first_name} ${cw.last_name}` : '-';
  };

  if (loading) return <div className="loading-spinner">Loading beneficiaries...</div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>Beneficiaries</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            {data.length} total beneficiaries
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + New Beneficiary
        </button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ padding: 16 }}>
          <input
            type="text"
            placeholder="Search by name, email, phone, or program..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 400 }}
          />
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <h3>No beneficiaries found</h3>
            <p>Try adjusting your search or add a new beneficiary.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Program</th>
                <th>Risk Level</th>
                <th>Status</th>
                <th>Caseworker</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} onClick={() => navigate(`/beneficiaries/${b.id}`)}>
                  <td style={{ fontWeight: 500 }}>{b.first_name} {b.last_name}</td>
                  <td>{b.email || '-'}</td>
                  <td>{b.phone || '-'}</td>
                  <td>{b.program || '-'}</td>
                  <td>
                    <span className={`badge badge-${b.risk_level || 'low'}`}>
                      {b.risk_level || 'low'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${b.status || 'active'}`}>
                      {b.status || 'active'}
                    </span>
                  </td>
                  <td>{getCaseworkerName(b.assigned_caseworker_id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Beneficiary</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)} style={{ fontSize: 20 }}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input name="first_name" value={form.first_name} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input name="last_name" value={form.last_name} onChange={handleChange} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input name="phone" value={form.phone} onChange={handleChange} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Program</label>
                    <input name="program" value={form.program} onChange={handleChange} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input name="address" value={form.address} onChange={handleChange} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input name="city" value={form.city} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input name="state" value={form.state} onChange={handleChange} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Zip Code</label>
                  <input name="zip_code" value={form.zip_code} onChange={handleChange} style={{ maxWidth: 200 }} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Emergency Contact</label>
                    <input name="emergency_contact" value={form.emergency_contact} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Emergency Phone</label>
                    <input name="emergency_phone" value={form.emergency_phone} onChange={handleChange} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Risk Level</label>
                    <select name="risk_level" value={form.risk_level} onChange={handleChange}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Assigned Caseworker</label>
                    <select name="assigned_caseworker_id" value={form.assigned_caseworker_id} onChange={handleChange}>
                      <option value="">-- Select --</option>
                      {cwList.map((cw) => (
                        <option key={cw.id} value={cw.id}>
                          {cw.full_name || `${cw.first_name} ${cw.last_name}`}
                        </option>
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
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Beneficiary'}
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
