import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { beneficiaries, notes, actionPlans, tasks, goals, assessments, ai, caseworkers } from '../services/api';

const TABS = ['Overview', 'Notes', 'Action Plans', 'Tasks', 'Goals', 'Assessments', 'AI Tools'];

export default function BeneficiaryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [beneficiary, setBeneficiary] = useState(null);
  const [cwList, setCwList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [toast, setToast] = useState(null);

  // Related data
  const [notesList, setNotesList] = useState([]);
  const [plansList, setPlansList] = useState([]);
  const [tasksList, setTasksList] = useState([]);
  const [goalsList, setGoalsList] = useState([]);
  const [assessmentsList, setAssessmentsList] = useState([]);

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Expanded items
  const [expandedItems, setExpandedItems] = useState({});

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [bRes, cwRes, nRes, apRes, tRes, gRes, aRes] = await Promise.all([
        beneficiaries.get(id),
        caseworkers.list(),
        notes.list(id),
        actionPlans.list(id),
        tasks.list({ beneficiary_id: id }),
        goals.list(id),
        assessments.list(id),
      ]);
      setBeneficiary(bRes.data);
      setCwList(cwRes.data);
      setNotesList(nRes.data);
      setPlansList(apRes.data);
      setTasksList(tRes.data);
      setGoalsList(gRes.data);
      setAssessmentsList(aRes.data);
    } catch (err) {
      console.error('Failed to load beneficiary', err);
      showToast('Failed to load beneficiary data', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleEditOpen = () => {
    setEditForm({ ...beneficiary });
    setShowEdit(true);
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = { ...editForm };
      if (payload.assigned_caseworker_id) {
        payload.assigned_caseworker_id = Number(payload.assigned_caseworker_id);
      }
      await beneficiaries.update(id, payload);
      showToast('Beneficiary updated successfully');
      setShowEdit(false);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await beneficiaries.delete(id);
      showToast('Beneficiary deleted');
      navigate('/beneficiaries');
    } catch (err) {
      showToast('Failed to delete beneficiary', 'error');
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteItem = async (type, itemId) => {
    try {
      const apiMap = { notes, actionPlans, tasks, goals, assessments };
      await apiMap[type].delete(itemId);
      showToast('Item deleted successfully');
      fetchAll();
    } catch (err) {
      showToast('Failed to delete item', 'error');
    }
  };

  const toggleExpand = (key) => {
    setExpandedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // AI handlers
  const handleAI = async (type) => {
    try {
      setAiLoading(true);
      setAiResult(null);
      let res;
      if (type === 'action-plan') {
        res = await ai.generateActionPlan({ beneficiary_id: Number(id) });
      } else if (type === 'summary') {
        res = await ai.generateSummary({ beneficiary_id: Number(id) });
      } else if (type === 'risk') {
        res = await ai.generateRiskAssessment({ beneficiary_id: Number(id) });
      }
      setAiResult(res.data);
    } catch (err) {
      showToast('AI generation failed', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const getCaseworkerName = (cwId) => {
    const cw = cwList.find((c) => c.id === cwId);
    return cw ? cw.full_name || `${cw.first_name} ${cw.last_name}` : '-';
  };

  if (loading) return <div className="loading-spinner">Loading beneficiary details...</div>;
  if (!beneficiary) return <div className="empty-state"><h3>Beneficiary not found</h3></div>;

  const b = beneficiary;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/beneficiaries')}>
            &larr; Back
          </button>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700 }}>{b.first_name} {b.last_name}</h2>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <span className={`badge badge-${b.risk_level || 'low'}`}>{b.risk_level || 'low'} risk</span>
              <span className={`badge badge-${b.status || 'active'}`}>{b.status || 'active'}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={handleEditOpen}>Edit</button>
          <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>Delete</button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Profile Information</h3>
        </div>
        <div className="card-body">
          <div className="detail-grid">
            <div className="detail-item">
              <label>Full Name</label>
              <div className="value">{b.first_name} {b.last_name}</div>
            </div>
            <div className="detail-item">
              <label>Email</label>
              <div className="value">{b.email || '-'}</div>
            </div>
            <div className="detail-item">
              <label>Phone</label>
              <div className="value">{b.phone || '-'}</div>
            </div>
            <div className="detail-item">
              <label>Date of Birth</label>
              <div className="value">{b.date_of_birth ? new Date(b.date_of_birth).toLocaleDateString() : '-'}</div>
            </div>
            <div className="detail-item">
              <label>Address</label>
              <div className="value">{b.address || '-'}</div>
            </div>
            <div className="detail-item">
              <label>City</label>
              <div className="value">{b.city || '-'}</div>
            </div>
            <div className="detail-item">
              <label>State</label>
              <div className="value">{b.state || '-'}</div>
            </div>
            <div className="detail-item">
              <label>Zip Code</label>
              <div className="value">{b.zip_code || '-'}</div>
            </div>
            <div className="detail-item">
              <label>Program</label>
              <div className="value">{b.program || '-'}</div>
            </div>
            <div className="detail-item">
              <label>Risk Level</label>
              <div className="value">
                <span className={`badge badge-${b.risk_level || 'low'}`}>{b.risk_level || 'low'}</span>
              </div>
            </div>
            <div className="detail-item">
              <label>Caseworker</label>
              <div className="value">{getCaseworkerName(b.assigned_caseworker_id)}</div>
            </div>
            <div className="detail-item">
              <label>Emergency Contact</label>
              <div className="value">{b.emergency_contact || '-'}</div>
            </div>
            <div className="detail-item">
              <label>Emergency Phone</label>
              <div className="value">{b.emergency_phone || '-'}</div>
            </div>
            <div className="detail-item">
              <label>Status</label>
              <div className="value">
                <span className={`badge badge-${b.status || 'active'}`}>{b.status || 'active'}</span>
              </div>
            </div>
          </div>
          {b.notes && (
            <div style={{ marginTop: 16 }}>
              <label>Notes</label>
              <div className="value" style={{ marginTop: 4, fontSize: 14, lineHeight: 1.6 }}>{b.notes}</div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid var(--border)', paddingBottom: 0 }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeTab === tab ? 'var(--primary)' : 'transparent',
              color: activeTab === tab ? 'white' : 'var(--text-secondary)',
              borderRadius: '8px 8px 0 0',
              fontWeight: activeTab === tab ? 600 : 400,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--primary)' }}>{notesList.length}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>Case Notes</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--primary)' }}>{plansList.length}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>Action Plans</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--primary)' }}>{tasksList.length}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>Tasks</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--primary)' }}>{goalsList.length}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>Goals</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--primary)' }}>{assessmentsList.length}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>Assessments</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Notes' && (
        <div>
          {notesList.length === 0 ? (
            <div className="empty-state"><h3>No notes yet</h3><p>Case notes will appear here.</p></div>
          ) : (
            notesList.map((item) => (
              <div key={item.id} className="card" style={{ marginBottom: 12 }}>
                <div
                  className="card-header"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleExpand(`note-${item.id}`)}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{item.title || item.subject || 'Note'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                      {item.type && <span className="badge" style={{ marginLeft: 8 }}>{item.type}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); handleDeleteItem('notes', item.id); }}>
                      Delete
                    </button>
                  </div>
                </div>
                {expandedItems[`note-${item.id}`] && (
                  <div className="card-body" style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {item.content || item.body || item.notes || 'No content.'}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'Action Plans' && (
        <div>
          {plansList.length === 0 ? (
            <div className="empty-state"><h3>No action plans yet</h3><p>Action plans will appear here.</p></div>
          ) : (
            plansList.map((item) => (
              <div key={item.id} className="card" style={{ marginBottom: 12 }}>
                <div
                  className="card-header"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleExpand(`plan-${item.id}`)}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{item.title || 'Action Plan'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {item.status && <span className={`badge badge-${item.status}`}>{item.status}</span>}
                      {item.created_at && <span style={{ marginLeft: 8 }}>{new Date(item.created_at).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); handleDeleteItem('actionPlans', item.id); }}>
                      Delete
                    </button>
                  </div>
                </div>
                {expandedItems[`plan-${item.id}`] && (
                  <div className="card-body" style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {item.description || item.content || item.details || 'No details.'}
                    {item.goals && <div style={{ marginTop: 12 }}><strong>Goals:</strong> {item.goals}</div>}
                    {item.start_date && <div style={{ marginTop: 8 }}><strong>Start:</strong> {new Date(item.start_date).toLocaleDateString()}</div>}
                    {item.end_date && <div><strong>End:</strong> {new Date(item.end_date).toLocaleDateString()}</div>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'Tasks' && (
        <div>
          {tasksList.length === 0 ? (
            <div className="empty-state"><h3>No tasks yet</h3><p>Tasks will appear here.</p></div>
          ) : (
            tasksList.map((item) => (
              <div key={item.id} className="card" style={{ marginBottom: 12 }}>
                <div
                  className="card-header"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleExpand(`task-${item.id}`)}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{item.title || 'Task'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {item.status && <span className={`badge badge-${item.status}`}>{item.status}</span>}
                      {item.priority && <span className={`badge badge-${item.priority}`} style={{ marginLeft: 8 }}>{item.priority}</span>}
                      {item.due_date && <span style={{ marginLeft: 8 }}>Due: {new Date(item.due_date).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); handleDeleteItem('tasks', item.id); }}>
                      Delete
                    </button>
                  </div>
                </div>
                {expandedItems[`task-${item.id}`] && (
                  <div className="card-body" style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {item.description || 'No description.'}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'Goals' && (
        <div>
          {goalsList.length === 0 ? (
            <div className="empty-state"><h3>No goals yet</h3><p>Goals will appear here.</p></div>
          ) : (
            goalsList.map((item) => (
              <div key={item.id} className="card" style={{ marginBottom: 12 }}>
                <div
                  className="card-header"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleExpand(`goal-${item.id}`)}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{item.title || 'Goal'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {item.status && <span className={`badge badge-${item.status}`}>{item.status}</span>}
                      {item.target_date && <span style={{ marginLeft: 8 }}>Target: {new Date(item.target_date).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); handleDeleteItem('goals', item.id); }}>
                      Delete
                    </button>
                  </div>
                </div>
                {expandedItems[`goal-${item.id}`] && (
                  <div className="card-body" style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {item.description || 'No description.'}
                    {item.progress !== undefined && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 13, marginBottom: 4 }}>Progress: {item.progress}%</div>
                        <div className="progress-bar">
                          <div className="progress-bar-fill" style={{ width: `${item.progress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'Assessments' && (
        <div>
          {assessmentsList.length === 0 ? (
            <div className="empty-state"><h3>No assessments yet</h3><p>Assessments will appear here.</p></div>
          ) : (
            assessmentsList.map((item) => (
              <div key={item.id} className="card" style={{ marginBottom: 12 }}>
                <div
                  className="card-header"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleExpand(`assessment-${item.id}`)}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{item.title || item.type || 'Assessment'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {item.status && <span className={`badge badge-${item.status}`}>{item.status}</span>}
                      {item.created_at && <span style={{ marginLeft: 8 }}>{new Date(item.created_at).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); handleDeleteItem('assessments', item.id); }}>
                      Delete
                    </button>
                  </div>
                </div>
                {expandedItems[`assessment-${item.id}`] && (
                  <div className="card-body" style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {item.content || item.summary || item.findings || item.description || 'No details.'}
                    {item.score !== undefined && <div style={{ marginTop: 8 }}><strong>Score:</strong> {item.score}</div>}
                    {item.recommendations && <div style={{ marginTop: 8 }}><strong>Recommendations:</strong> {item.recommendations}</div>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'AI Tools' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <button
              className="btn btn-primary"
              onClick={() => handleAI('action-plan')}
              disabled={aiLoading}
            >
              Generate Action Plan
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handleAI('summary')}
              disabled={aiLoading}
            >
              Generate Case Summary
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handleAI('risk')}
              disabled={aiLoading}
            >
              Generate Risk Assessment
            </button>
          </div>

          {aiLoading && (
            <div className="loading-spinner">AI is generating content...</div>
          )}

          {aiResult && !aiLoading && (
            <div className="card">
              <div className="card-body">
                <div className="ai-output">
                  {aiResult.content || aiResult.summary || aiResult.plan || aiResult.assessment || aiResult.result || JSON.stringify(aiResult, null, 2)}
                </div>
                <div className="ai-meta">
                  {aiResult.model && (
                    <span>Model: {aiResult.model}</span>
                  )}
                  {aiResult.usage && (
                    <>
                      {aiResult.usage.prompt_tokens !== undefined && (
                        <span>Prompt tokens: {aiResult.usage.prompt_tokens}</span>
                      )}
                      {aiResult.usage.completion_tokens !== undefined && (
                        <span>Completion tokens: {aiResult.usage.completion_tokens}</span>
                      )}
                      {aiResult.usage.total_tokens !== undefined && (
                        <span>Total tokens: {aiResult.usage.total_tokens}</span>
                      )}
                    </>
                  )}
                  {aiResult.tokens_used !== undefined && (
                    <span>Tokens used: {aiResult.tokens_used}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Beneficiary</h2>
              <button className="btn-icon" onClick={() => setShowEdit(false)} style={{ fontSize: 20 }}>
                &times;
              </button>
            </div>
            <form onSubmit={handleEditSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input name="first_name" value={editForm.first_name || ''} onChange={handleEditChange} required />
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input name="last_name" value={editForm.last_name || ''} onChange={handleEditChange} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input name="email" type="email" value={editForm.email || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input name="phone" value={editForm.phone || ''} onChange={handleEditChange} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input name="date_of_birth" type="date" value={editForm.date_of_birth ? editForm.date_of_birth.substring(0, 10) : ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label>Program</label>
                    <input name="program" value={editForm.program || ''} onChange={handleEditChange} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input name="address" value={editForm.address || ''} onChange={handleEditChange} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input name="city" value={editForm.city || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input name="state" value={editForm.state || ''} onChange={handleEditChange} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Zip Code</label>
                  <input name="zip_code" value={editForm.zip_code || ''} onChange={handleEditChange} style={{ maxWidth: 200 }} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Emergency Contact</label>
                    <input name="emergency_contact" value={editForm.emergency_contact || ''} onChange={handleEditChange} />
                  </div>
                  <div className="form-group">
                    <label>Emergency Phone</label>
                    <input name="emergency_phone" value={editForm.emergency_phone || ''} onChange={handleEditChange} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Risk Level</label>
                    <select name="risk_level" value={editForm.risk_level || 'low'} onChange={handleEditChange}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Assigned Caseworker</label>
                    <select name="assigned_caseworker_id" value={editForm.assigned_caseworker_id || ''} onChange={handleEditChange}>
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
                  <textarea name="notes" value={editForm.notes || ''} onChange={handleEditChange} rows={3} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowEdit(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
              <button className="btn-icon" onClick={() => setShowDeleteConfirm(false)} style={{ fontSize: 20 }}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{b.first_name} {b.last_name}</strong>? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
}
