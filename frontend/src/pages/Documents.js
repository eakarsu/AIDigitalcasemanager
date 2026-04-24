import React, { useState, useEffect } from 'react';
import { documents as docsApi, beneficiaries } from '../services/api';

export default function Documents() {
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
    beneficiary_id: '', title: '', description: '',
    document_type: 'Other', file_name: '', file_size: '',
  };

  const documentTypes = [
    'Assessment', 'Application', 'Legal', 'Medical', 'Certificate',
    'Financial', 'Government', 'Military', 'Safety', 'Other',
  ];

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

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    const size = Number(bytes);
    if (isNaN(size)) return '-';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dRes, bRes] = await Promise.all([
        docsApi.list(), beneficiaries.list(),
      ]);
      setItems(dRes.data);
      setBenList(bRes.data);
    } catch (err) {
      console.error('Failed to fetch documents', err);
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

  const openCreate = () => {
    setForm({ ...emptyForm });
    setEditing(false);
    setSelected(null);
    setShowModal(true);
  };

  const openDetail = async (item) => {
    try {
      const res = await docsApi.get(item.id);
      setSelected(res.data);
      setEditing(false);
      setShowModal(true);
    } catch {
      showToast('Failed to load document', 'error');
    }
  };

  const openEdit = () => {
    setForm({
      beneficiary_id: selected.beneficiary_id || '',
      title: selected.title || '',
      description: selected.description || '',
      document_type: selected.document_type || 'Other',
      file_name: selected.file_name || '',
      file_size: selected.file_size || '',
    });
    setEditing(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = { ...form };
      if (payload.beneficiary_id) payload.beneficiary_id = Number(payload.beneficiary_id);
      if (payload.file_size) payload.file_size = Number(payload.file_size);

      if (selected && editing) {
        await docsApi.update(selected.id, payload);
        showToast('Document updated successfully');
      } else {
        await docsApi.create(payload);
        showToast('Document created successfully');
      }
      setShowModal(false);
      setSelected(null);
      setEditing(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save document', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await docsApi.delete(selected.id);
      showToast('Document deleted');
      setShowModal(false);
      setSelected(null);
      fetchData();
    } catch {
      showToast('Failed to delete document', 'error');
    }
  };

  const filtered = items.filter((d) => {
    const term = search.toLowerCase();
    return (
      (d.title || '').toLowerCase().includes(term) ||
      getBenName(d.beneficiary_id).toLowerCase().includes(term) ||
      (d.document_type || '').toLowerCase().includes(term) ||
      (d.file_name || '').toLowerCase().includes(term)
    );
  });

  if (loading) return <div className="loading-spinner">Loading documents...</div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>Documents</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            {items.length} total documents
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ New Document</button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ padding: 16 }}>
          <input
            type="text"
            placeholder="Search by title, beneficiary, type, or file name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 400 }}
          />
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <h3>No documents found</h3>
            <p>Try adjusting your search or add a new document.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Beneficiary</th>
                <th>Type</th>
                <th>File Name</th>
                <th>Size</th>
                <th>Uploaded By</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} onClick={() => openDetail(d)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 500 }}>{d.title || '-'}</td>
                  <td>{getBenName(d.beneficiary_id)}</td>
                  <td><span className="badge badge-info">{d.document_type || '-'}</span></td>
                  <td>{d.file_name || '-'}</td>
                  <td>{formatFileSize(d.file_size)}</td>
                  <td>{d.uploaded_by || '-'}</td>
                  <td>{formatDate(d.created_at)}</td>
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
              <h2>{selected && !editing ? 'Document Details' : editing ? 'Edit Document' : 'New Document'}</h2>
              <button className="btn-icon" onClick={() => { setShowModal(false); setSelected(null); setEditing(false); }} style={{ fontSize: 20 }}>&times;</button>
            </div>

            {selected && !editing ? (
              <>
                <div className="modal-body">
                  <div className="detail-grid">
                    <div className="detail-item"><label>Title</label><span>{selected.title || '-'}</span></div>
                    <div className="detail-item"><label>Beneficiary</label><span>{getBenName(selected.beneficiary_id)}</span></div>
                    <div className="detail-item"><label>Document Type</label><span className="badge badge-info">{selected.document_type || '-'}</span></div>
                    <div className="detail-item"><label>File Name</label><span>{selected.file_name || '-'}</span></div>
                    <div className="detail-item"><label>File Size</label><span>{formatFileSize(selected.file_size)}</span></div>
                    <div className="detail-item"><label>Uploaded By</label><span>{selected.uploaded_by || '-'}</span></div>
                    <div className="detail-item"><label>Created</label><span>{formatDate(selected.created_at)}</span></div>
                    <div className="detail-item"><label>Updated</label><span>{formatDate(selected.updated_at)}</span></div>
                  </div>
                  {selected.description && (
                    <div style={{ marginTop: 16 }}>
                      <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>Description</label>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{selected.description}</p>
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
                    <label>Title *</label>
                    <input name="title" value={form.title} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Document Type</label>
                      <select name="document_type" value={form.document_type} onChange={handleChange}>
                        {documentTypes.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>File Name</label>
                      <input name="file_name" value={form.file_name} onChange={handleChange} placeholder="e.g. report.pdf" />
                    </div>
                    <div className="form-group">
                      <label>File Size (bytes)</label>
                      <input name="file_size" type="number" value={form.file_size} onChange={handleChange} min={0} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => { setShowModal(false); setSelected(null); setEditing(false); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : editing ? 'Update Document' : 'Create Document'}
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
