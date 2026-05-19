import React, { useEffect, useState } from 'react';

/**
 * NON-VIZ 2: Workflow Rules Editor.
 * CRUD over stage-transition rules at /api/custom-views/workflow-rules.
 */
export default function WorkflowRulesEditor() {
  const [stages, setStages] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState({ from_stage: '', to_stage: '', condition: '', auto_assign: false });

  function authHeaders() {
    const t = localStorage.getItem('token');
    return t ? { Authorization: `Bearer ${t}` } : {};
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/custom-views/workflow-rules', { headers: authHeaders() });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setStages(j.stages || []);
      setRules(j.rules || []);
      if (!draft.from_stage && j.stages && j.stages.length) {
        setDraft(d => ({ ...d, from_stage: j.stages[0], to_stage: j.stages[1] || j.stages[0] }));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function mutate(op, rule) {
    setError(null);
    try {
      const r = await fetch('/api/custom-views/workflow-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ op, rule }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setRules(j.rules || []);
    } catch (e) {
      setError(e.message);
    }
  }

  async function addRule() {
    if (!draft.from_stage || !draft.to_stage) { setError('Pick from/to stage'); return; }
    await mutate('create', draft);
    setDraft(d => ({ ...d, condition: '', auto_assign: false }));
  }

  return (
    <div data-testid="workflow-rules-editor" style={{ background: '#fff', padding: 20, borderRadius: 10, border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0, color: '#111827' }}>Workflow Rules Editor</h3>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Define case-stage transition rules.</div>
        </div>
        <button onClick={() => mutate('reset')} style={{
          padding: '6px 12px', background: '#6b7280', color: '#fff',
          border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer',
        }}>Reset Defaults</button>
      </div>

      {error && <div style={{ color: '#dc2626', marginBottom: 8 }}>Error: {error}</div>}
      {loading && <div style={{ color: '#6b7280' }}>Loading rules...</div>}

      <div style={{
        display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 2fr 0.6fr 1fr', gap: 8,
        alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e5e7eb', fontSize: 12, color: '#6b7280',
      }}>
        <div>From Stage</div><div>To Stage</div><div>Condition</div><div>Auto-Assign</div><div>Actions</div>
      </div>

      {rules.map(r => (
        <RuleRow key={r.id} rule={r} stages={stages} onSave={(u) => mutate('update', u)} onDelete={() => mutate('delete', { id: r.id })} />
      ))}

      <div style={{
        display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 2fr 0.6fr 1fr', gap: 8,
        alignItems: 'center', padding: '12px 0', marginTop: 8, borderTop: '2px solid #e5e7eb',
      }}>
        <select value={draft.from_stage} onChange={e => setDraft({ ...draft, from_stage: e.target.value })}
          style={{ padding: 6, border: '1px solid #d1d5db', borderRadius: 6 }}>
          {stages.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={draft.to_stage} onChange={e => setDraft({ ...draft, to_stage: e.target.value })}
          style={{ padding: 6, border: '1px solid #d1d5db', borderRadius: 6 }}>
          {stages.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input value={draft.condition} onChange={e => setDraft({ ...draft, condition: e.target.value })}
          placeholder="Condition / trigger"
          style={{ padding: 6, border: '1px solid #d1d5db', borderRadius: 6 }} />
        <input type="checkbox" checked={draft.auto_assign} onChange={e => setDraft({ ...draft, auto_assign: e.target.checked })} />
        <button onClick={addRule} style={{
          padding: '6px 12px', background: '#10b981', color: '#fff',
          border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer',
        }}>Add Rule</button>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: '#6b7280' }}>{rules.length} rule(s) configured.</div>
    </div>
  );
}

function RuleRow({ rule, stages, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(rule);

  useEffect(() => { setDraft(rule); }, [rule]);

  if (!editing) {
    return (
      <div style={{
        display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 2fr 0.6fr 1fr', gap: 8,
        alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13,
      }}>
        <div style={{ textTransform: 'capitalize' }}>{rule.from_stage}</div>
        <div style={{ textTransform: 'capitalize' }}>{rule.to_stage}</div>
        <div>{rule.condition}</div>
        <div>{rule.auto_assign ? 'Yes' : 'No'}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setEditing(true)} style={btnStyle('#4f46e5')}>Edit</button>
          <button onClick={onDelete} style={btnStyle('#dc2626')}>Del</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 2fr 0.6fr 1fr', gap: 8,
      alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6',
    }}>
      <select value={draft.from_stage} onChange={e => setDraft({ ...draft, from_stage: e.target.value })}
        style={{ padding: 6, border: '1px solid #d1d5db', borderRadius: 6 }}>
        {stages.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <select value={draft.to_stage} onChange={e => setDraft({ ...draft, to_stage: e.target.value })}
        style={{ padding: 6, border: '1px solid #d1d5db', borderRadius: 6 }}>
        {stages.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <input value={draft.condition || ''} onChange={e => setDraft({ ...draft, condition: e.target.value })}
        style={{ padding: 6, border: '1px solid #d1d5db', borderRadius: 6 }} />
      <input type="checkbox" checked={!!draft.auto_assign} onChange={e => setDraft({ ...draft, auto_assign: e.target.checked })} />
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => { onSave(draft); setEditing(false); }} style={btnStyle('#10b981')}>Save</button>
        <button onClick={() => { setDraft(rule); setEditing(false); }} style={btnStyle('#6b7280')}>X</button>
      </div>
    </div>
  );
}

function btnStyle(bg) {
  return { padding: '4px 10px', background: bg, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' };
}
