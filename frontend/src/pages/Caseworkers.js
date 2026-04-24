import React, { useState, useEffect } from 'react';
import { caseworkers } from '../services/api';

const initialForm = {
  first_name: '', last_name: '', email: '', phone: '',
  department: '', specialization: '', employee_id: '',
  max_caseload: 25, hire_date: '',
};

export default function Caseworkers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...initialForm });
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const fetchData = async () => {
    try {
      const res = await caseworkers.list();
      setItems(res.data);
    } catch (err) {
      showToast('Failed to load caseworkers', 'error');
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

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await caseworkers.create(form);
      showToast('Caseworker created successfully');
      setShowModal(false);
      setForm({ ...initialForm });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create caseworker', 'error');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await caseworkers.update(selected.id, form);
      showToast('Caseworker updated successfully');
      setEditing(false);
      setSelected(null);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update caseworker', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this caseworker?')) return;
    try {
      await caseworkers.delete(id);
      showToast('Caseworker deleted successfully');
      setSelected(null);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete caseworker', 'error');
    }
  };

  const openDetail = async (item) => {
    try {
      const res = await caseworkers.get(item.id);
      setSelected(res.data);
      setEditing(false);
    } catch {
      showToast('Failed to load caseworker details', 'error');
    }
  };

  const startEdit = () => {
    setForm({
      first_name: selected.first_name || '',
      last_name: selected.last_name || '',
      email: selected.email || '',
      phone: selected.phone || '',
      department: selected.department || '',
      specialization: selected.specialization || '',
      employee_id: selected.employee_id || '',
      max_caseload: selected.max_caseload || 25,
      hire_date: selected.hire_date ? selected.hire_date.slice(0, 10) : '',
    });
    setEditing(true);
  };

  const filtered = items.filter(i => {
    const s = search.toLowerCase();
    return (
      (i.first_name || '').toLowerCase().includes(s) ||
      (i.last_name || '').toLowerCase().includes(s) ||
      (i.email || '').toLowerCase().includes(s) ||
      (i.department || '').toLowerCase().includes(s) ||
      (i.specialization || '').toLowerCase().includes(s) ||
      (i.employee_id || '').toLowerCase().includes(s)
    );
  });

  if (loading) return <div className="loading-spinner">Loading caseworkers...</div>;

  return (
    <div className="fade-in">
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Caseworkers</h2>
            <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>({filtered.length})</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search caseworkers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 240 }}
            />
            <button className="btn btn-primary" onClick={() => { setForm({ ...initialForm }); setShowModal(true); }}>
              + New Caseworker
            </button>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <h3>No caseworkers found</h3>
              <p>Create a new caseworker to get started.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Employee ID</th>
                  <th>Department</th>
                  <th>Specialization</th>
                  <th>Active / Max</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} onClick={() => openDetail(item)}>
                    <td style={{ fontWeight: 500 }}>{item.first_name} {item.last_name}</td>
                    <td>{item.email}</td>
                    <td>{item.employee_id}</td>
                    <td>{item.department}</td>
                    <td>{item.specialization}</td>
                    <td>{item.active_cases ?? 0} / {item.max_caseload ?? 25}</td>
                    <td>
                      <span className={`badge badge-${item.status || 'active'}`}>
                        {item.status || 'active'}
                      </span>
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
              <h2>New Caseworker</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>&#x2715;</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <input name="first_name" value={form.first_name} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input name="last_name" value={form.last_name} onChange={handleChange} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input name="phone" value={form.phone} onChange={handleChange} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Department</label>
                    <input name="department" value={form.department} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Specialization</label>
                    <input name="specialization" value={form.specialization} onChange={handleChange} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Max Caseload</label>
                    <input type="number" name="max_caseload" value={form.max_caseload} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Hire Date</label>
                    <input type="date" name="hire_date" value={form.hire_date} onChange={handleChange} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Caseworker</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail / Edit Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => { setSelected(null); setEditing(false); }}>
          <div className="modal fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Caseworker' : 'Caseworker Details'}</h2>
              <button className="btn-icon" onClick={() => { setSelected(null); setEditing(false); }}>&#x2715;</button>
            </div>
            {editing ? (
              <form onSubmit={handleUpdate}>
                <div className="modal-body">
                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name</label>
                      <input name="first_name" value={form.first_name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input name="last_name" value={form.last_name} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" name="email" value={form.email} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <input name="phone" value={form.phone} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Department</label>
                      <input name="department" value={form.department} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Specialization</label>
                      <input name="specialization" value={form.specialization} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Max Caseload</label>
                      <input type="number" name="max_caseload" value={form.max_caseload} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>Hire Date</label>
                      <input type="date" name="hire_date" value={form.hire_date} onChange={handleChange} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            ) : (
              <>
                <div className="modal-body">
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Name</label>
                      <div className="value">{selected.first_name} {selected.last_name}</div>
                    </div>
                    <div className="detail-item">
                      <label>Email</label>
                      <div className="value">{selected.email}</div>
                    </div>
                    <div className="detail-item">
                      <label>Phone</label>
                      <div className="value">{selected.phone || '-'}</div>
                    </div>
                    <div className="detail-item">
                      <label>Employee ID</label>
                      <div className="value">{selected.employee_id || '-'}</div>
                    </div>
                    <div className="detail-item">
                      <label>Department</label>
                      <div className="value">{selected.department || '-'}</div>
                    </div>
                    <div className="detail-item">
                      <label>Specialization</label>
                      <div className="value">{selected.specialization || '-'}</div>
                    </div>
                    <div className="detail-item">
                      <label>Active Cases / Max</label>
                      <div className="value">{selected.active_cases ?? 0} / {selected.max_caseload ?? 25}</div>
                    </div>
                    <div className="detail-item">
                      <label>Status</label>
                      <div className="value">
                        <span className={`badge badge-${selected.status || 'active'}`}>
                          {selected.status || 'active'}
                        </span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <label>Hire Date</label>
                      <div className="value">
                        {selected.hire_date ? new Date(selected.hire_date).toLocaleDateString() : '-'}
                      </div>
                    </div>
                    <div className="detail-item">
                      <label>Created</label>
                      <div className="value">
                        {selected.created_at ? new Date(selected.created_at).toLocaleDateString() : '-'}
                      </div>
                    </div>
                  </div>
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
