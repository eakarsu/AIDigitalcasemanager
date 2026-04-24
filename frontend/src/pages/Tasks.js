import React, { useState, useEffect } from 'react';
import { tasks as tasksApi, beneficiaries, caseworkers } from '../services/api';

const initialForm = {
  beneficiary_id: '', caseworker_id: '', title: '',
  description: '', priority: 'medium', status: 'pending', due_date: '',
};

const priorities = ['low', 'medium', 'high', 'urgent'];
const statusOptions = ['pending', 'in_progress', 'completed'];

export default function Tasks() {
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
      const [tasksRes, benRes, cwRes] = await Promise.all([
        tasksApi.list(),
        beneficiaries.list(),
        caseworkers.list(),
      ]);
      setItems(tasksRes.data);
      setBeneficiaryList(benRes.data);
      setCaseworkerList(cwRes.data);
    } catch (err) {
      showToast('Failed to load tasks', 'error');
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

  const isOverdue = (item) => {
    if (!item.due_date || item.status === 'completed') return false;
    return new Date(item.due_date) < new Date();
  };

  const priorityBadgeClass = (priority) => {
    if (!priority) return 'badge';
    const p = priority.toLowerCase();
    if (p === 'urgent' || p === 'high') return 'badge badge-high';
    if (p === 'medium') return 'badge badge-medium';
    return 'badge badge-low';
  };

  const statusBadgeClass = (status) => {
    if (!status) return 'badge';
    return `badge badge-${status}`;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await tasksApi.create(form);
      showToast('Task created successfully');
      setShowModal(false);
      setForm({ ...initialForm });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create task', 'error');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await tasksApi.update(selected.id, form);
      showToast('Task updated successfully');
      setEditing(false);
      setSelected(null);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update task', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await tasksApi.delete(id);
      showToast('Task deleted successfully');
      setSelected(null);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete task', 'error');
    }
  };

  const openDetail = async (item) => {
    try {
      const res = await tasksApi.get(item.id);
      setSelected(res.data);
      setEditing(false);
    } catch {
      showToast('Failed to load task details', 'error');
    }
  };

  const startEdit = () => {
    setForm({
      beneficiary_id: selected.beneficiary_id || '',
      caseworker_id: selected.caseworker_id || '',
      title: selected.title || '',
      description: selected.description || '',
      priority: selected.priority || 'medium',
      status: selected.status || 'pending',
      due_date: selected.due_date ? selected.due_date.slice(0, 10) : '',
    });
    setEditing(true);
  };

  const filtered = items.filter(i => {
    const s = search.toLowerCase();
    return (
      (i.title || '').toLowerCase().includes(s) ||
      (i.priority || '').toLowerCase().includes(s) ||
      (i.status || '').toLowerCase().includes(s) ||
      getBeneficiaryName(i.beneficiary_id).toLowerCase().includes(s)
    );
  });

  if (loading) return <div className="loading-spinner">Loading tasks...</div>;

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
          <label>Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Priority</label>
            <select name="priority" value={form.priority} onChange={handleChange}>
              {priorities.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              {statusOptions.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Due Date</label>
          <input type="date" name="due_date" value={form.due_date} onChange={handleChange} />
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
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Tasks</h2>
            <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>({filtered.length})</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 240 }}
            />
            <button className="btn btn-primary" onClick={() => { setForm({ ...initialForm }); setShowModal(true); }}>
              + New Task
            </button>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <h3>No tasks found</h3>
              <p>Create a new task to get started.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Beneficiary</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr
                    key={item.id}
                    onClick={() => openDetail(item)}
                    style={isOverdue(item) ? { background: '#fef2f2' } : undefined}
                  >
                    <td style={{ fontWeight: 500 }}>
                      {item.title}
                      {isOverdue(item) && (
                        <span style={{ color: 'var(--danger)', fontSize: 12, marginLeft: 8, fontWeight: 600 }}>
                          OVERDUE
                        </span>
                      )}
                    </td>
                    <td>{getBeneficiaryName(item.beneficiary_id)}</td>
                    <td>
                      <span className={priorityBadgeClass(item.priority)}>
                        {item.priority || 'medium'}
                      </span>
                    </td>
                    <td>
                      <span className={statusBadgeClass(item.status)}>
                        {(item.status || 'pending').replace('_', ' ')}
                      </span>
                    </td>
                    <td style={isOverdue(item) ? { color: 'var(--danger)', fontWeight: 600 } : undefined}>
                      {item.due_date ? new Date(item.due_date).toLocaleDateString() : '-'}
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
              <h2>New Task</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>&#x2715;</button>
            </div>
            {renderForm(handleCreate, 'Create Task')}
          </div>
        </div>
      )}

      {/* Detail / Edit Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => { setSelected(null); setEditing(false); }}>
          <div className="modal fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Task' : 'Task Details'}</h2>
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
                      <label>Priority</label>
                      <div className="value">
                        <span className={priorityBadgeClass(selected.priority)}>
                          {selected.priority || 'medium'}
                        </span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <label>Status</label>
                      <div className="value">
                        <span className={statusBadgeClass(selected.status)}>
                          {(selected.status || 'pending').replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <label>Due Date</label>
                      <div className="value" style={isOverdue(selected) ? { color: 'var(--danger)', fontWeight: 600 } : undefined}>
                        {selected.due_date ? new Date(selected.due_date).toLocaleDateString() : '-'}
                        {isOverdue(selected) && ' (OVERDUE)'}
                      </div>
                    </div>
                    <div className="detail-item">
                      <label>Created</label>
                      <div className="value">
                        {selected.created_at ? new Date(selected.created_at).toLocaleDateString() : '-'}
                      </div>
                    </div>
                  </div>
                  {selected.description && (
                    <div style={{ marginTop: 20 }}>
                      <label>Description</label>
                      <div style={{ marginTop: 4, whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.6 }}>
                        {selected.description}
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
