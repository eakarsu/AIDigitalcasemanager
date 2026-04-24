import React, { useState, useEffect } from 'react';
import { ai, beneficiaries } from '../services/api';

const summaryTypeBadgeColors = {
  case_summary: '#2563eb',
  risk_assessment: '#dc2626',
  action_plan: '#7c3aed',
  meeting_summary: '#16a34a',
};

const summaryTypeLabels = {
  case_summary: 'Case Summary',
  risk_assessment: 'Risk Assessment',
  action_plan: 'Action Plan',
  meeting_summary: 'Meeting Summary',
};

export default function AISummaries() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [benList, setBenList] = useState([]);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchBeneficiaries = async () => {
    try {
      const res = await beneficiaries.list();
      setBenList(res.data);
    } catch (err) {
      console.error('Failed to fetch beneficiaries', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBeneficiaries(); }, []);

  const fetchSummaries = async (benId) => {
    if (!benId) {
      setItems([]);
      return;
    }
    try {
      setLoading(true);
      const res = await ai.getSummaries(benId);
      setItems(res.data);
    } catch (err) {
      console.error('Failed to fetch summaries', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBeneficiaryChange = (e) => {
    const benId = e.target.value;
    setSelectedBeneficiary(benId);
    setAiResult(null);
    if (benId) {
      fetchSummaries(benId);
    } else {
      setItems([]);
    }
  };

  const handleGenerate = async (type) => {
    if (!selectedBeneficiary) {
      showToast('Please select a beneficiary first', 'error');
      return;
    }
    try {
      setGenerating(true);
      setAiResult(null);
      let res;
      const payload = { beneficiary_id: Number(selectedBeneficiary) };
      if (type === 'action_plan') {
        res = await ai.generateActionPlan(payload);
      } else if (type === 'case_summary') {
        res = await ai.generateSummary(payload);
      } else if (type === 'risk_assessment') {
        res = await ai.generateRiskAssessment(payload);
      }
      setAiResult(res.data);
      showToast(`${summaryTypeLabels[type] || type} generated successfully`);
      fetchSummaries(selectedBeneficiary);
    } catch (err) {
      showToast(err.response?.data?.error || `Failed to generate ${type}`, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getBeneficiaryName = (id) => {
    const b = benList.find((x) => x.id === Number(id));
    return b ? `${b.first_name} ${b.last_name}` : '';
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const filteredItems = items.filter((s) => {
    const term = search.toLowerCase();
    return (
      (s.summary_type || s.type || '').toLowerCase().includes(term) ||
      (s.content || s.summary || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>AI Summaries</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            AI-powered insights and summaries
          </p>
        </div>
      </div>

      {/* Beneficiary Selector */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ padding: 20 }}>
          <div className="form-group" style={{ marginBottom: 0, maxWidth: 400 }}>
            <label style={{ fontWeight: 600 }}>Select Beneficiary</label>
            <select value={selectedBeneficiary} onChange={handleBeneficiaryChange}>
              <option value="">-- Choose a Beneficiary --</option>
              {benList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.first_name} {b.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* AI Action Buttons */}
      {selectedBeneficiary && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header" style={{ padding: '16px 20px' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
              Generate AI Insights for {getBeneficiaryName(selectedBeneficiary)}
            </h3>
          </div>
          <div className="card-body" style={{ padding: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => handleGenerate('action_plan')}
              disabled={generating}
              style={{ background: '#7c3aed' }}
            >
              {'\u{1F4CB}'} Generate Action Plan
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handleGenerate('case_summary')}
              disabled={generating}
              style={{ background: '#2563eb' }}
            >
              {'\u{1F4DD}'} Generate Case Summary
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handleGenerate('risk_assessment')}
              disabled={generating}
              style={{ background: '#dc2626' }}
            >
              {'\u26A0\uFE0F'} Generate Risk Assessment
            </button>
          </div>
        </div>
      )}

      {/* Loading Spinner */}
      {generating && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-body" style={{ padding: 40, textAlign: 'center' }}>
            <div className="loading-spinner">AI is generating insights. This may take a moment...</div>
          </div>
        </div>
      )}

      {/* AI Result Output */}
      {aiResult && !generating && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header" style={{ padding: '16px 20px' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>AI Generated Result</h3>
          </div>
          <div className="card-body" style={{ padding: 20 }}>
            <div className="ai-output" style={{
              padding: 20, background: 'var(--bg-secondary, #f9fafb)',
              borderRadius: 8, lineHeight: 1.7, whiteSpace: 'pre-wrap',
              fontSize: 14, border: '1px solid var(--border-color, #e5e7eb)',
            }}>
              {aiResult.content || aiResult.summary || aiResult.plan || aiResult.assessment || JSON.stringify(aiResult, null, 2)}
            </div>
            {(aiResult.model || aiResult.usage) && (
              <div className="ai-meta" style={{
                marginTop: 12, padding: '10px 16px', background: '#f0f0ff',
                borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)',
                display: 'flex', gap: 20, flexWrap: 'wrap',
              }}>
                {aiResult.model && (
                  <span>Model: <strong>{aiResult.model}</strong></span>
                )}
                {aiResult.usage?.prompt_tokens && (
                  <span>Prompt tokens: <strong>{aiResult.usage.prompt_tokens}</strong></span>
                )}
                {aiResult.usage?.completion_tokens && (
                  <span>Completion tokens: <strong>{aiResult.usage.completion_tokens}</strong></span>
                )}
                {aiResult.usage?.total_tokens && (
                  <span>Total tokens: <strong>{aiResult.usage.total_tokens}</strong></span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Previous Summaries */}
      {selectedBeneficiary && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600 }}>Previous Summaries</h3>
            {items.length > 0 && (
              <div style={{ maxWidth: 300 }}>
                <input
                  type="text"
                  placeholder="Search summaries..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ fontSize: 13 }}
                />
              </div>
            )}
          </div>

          {loading ? (
            <div className="loading-spinner">Loading summaries...</div>
          ) : filteredItems.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <h3>No summaries yet</h3>
                <p>Generate your first AI summary using the buttons above.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredItems.map((s) => {
                const sType = s.summary_type || s.type || 'case_summary';
                const badgeColor = summaryTypeBadgeColors[sType] || '#6b7280';
                const isExpanded = expandedIds.has(s.id);
                const content = s.content || s.summary || '';

                return (
                  <div key={s.id} className="card" style={{ overflow: 'hidden' }}>
                    <div
                      className="card-header"
                      onClick={() => toggleExpand(s.id)}
                      style={{
                        padding: '14px 20px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span
                          className="badge"
                          style={{
                            background: badgeColor, color: '#fff',
                            padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                          }}
                        >
                          {summaryTypeLabels[sType] || sType}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          {formatDate(s.created_at)}
                        </span>
                      </div>
                      <span style={{ fontSize: 14, color: 'var(--text-secondary)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>
                        &#9660;
                      </span>
                    </div>
                    {isExpanded && (
                      <div className="card-body" style={{ padding: 20 }}>
                        <div className="ai-output" style={{
                          padding: 16, background: 'var(--bg-secondary, #f9fafb)',
                          borderRadius: 8, lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: 14,
                        }}>
                          {content || 'No content available.'}
                        </div>
                        {(s.model || s.usage) && (
                          <div className="ai-meta" style={{
                            marginTop: 10, padding: '8px 14px', background: '#f0f0ff',
                            borderRadius: 8, fontSize: 11, color: 'var(--text-secondary)',
                            display: 'flex', gap: 16, flexWrap: 'wrap',
                          }}>
                            {s.model && <span>Model: <strong>{s.model}</strong></span>}
                            {s.usage?.total_tokens && <span>Tokens: <strong>{s.usage.total_tokens}</strong></span>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
}
