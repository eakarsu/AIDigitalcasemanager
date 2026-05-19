import React, { useEffect, useState } from 'react';
import { ai, beneficiaries as benApi, services as servicesApi } from '../services/api';

const card = { background: 'white', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
const btn = { padding: '10px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', cursor: 'pointer', fontWeight: 600 };
const btnSec = { padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' };
const input = { padding: 8, borderRadius: 6, border: '1px solid #d1d5db', width: '100%' };

export default function AITools() {
  const [bens, setBens] = useState([]);
  const [selBen, setSelBen] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [loadingKey, setLoadingKey] = useState(null);
  const [output, setOutput] = useState({ title: '', body: '', meta: null });
  const [services, setServices] = useState([]);
  const [showServices, setShowServices] = useState(false);
  const [newService, setNewService] = useState({ name: '', service_type: '', description: '', eligibility: '', contact_info: '', location: '' });

  useEffect(() => {
    benApi.list().then(r => {
      const data = r.data?.data || r.data || [];
      setBens(Array.isArray(data) ? data : []);
    }).catch(() => {});
    servicesApi.list().then(r => {
      const data = r.data?.data || r.data || [];
      setServices(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, []);

  const run = async (key, fn, title) => {
    setLoadingKey(key);
    setOutput({ title, body: 'Running...', meta: null });
    try {
      const res = await fn();
      const d = res.data;
      const text = d.recommendations || d.report || d.assessment || d.summary || JSON.stringify(d, null, 2);
      setOutput({ title, body: text, meta: d.ai_response });
    } catch (e) {
      setOutput({ title, body: e?.response?.data?.error || e.message || 'Error', meta: null });
    } finally {
      setLoadingKey(null);
    }
  };

  const addService = async () => {
    if (!newService.name || !newService.service_type) return alert('Name and type required');
    try {
      const res = await servicesApi.create(newService);
      setServices([res.data, ...services]);
      setNewService({ name: '', service_type: '', description: '', eligibility: '', contact_info: '', location: '' });
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed');
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>AI Tools</h2>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Specialized AI workflows: referral matching, caseload analysis, progress reports.</p>

      <div style={card}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Select Beneficiary</h3>
        <select style={input} value={selBen} onChange={e => setSelBen(e.target.value)}>
          <option value="">— Select beneficiary —</option>
          {bens.map(b => <option key={b.id} value={b.id}>{b.first_name} {b.last_name} ({b.program || 'No program'})</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={card}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Referral Matcher</h3>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 12 }}>Match beneficiary to top 3 services from directory using AI.</p>
          <button
            disabled={!selBen || loadingKey === 'ref'}
            style={{ ...btn, opacity: !selBen ? 0.5 : 1 }}
            onClick={() => run('ref', () => ai.referralMatcher({ beneficiary_id: parseInt(selBen) }), 'Referral Matcher Recommendations')}
          >
            {loadingKey === 'ref' ? 'Matching...' : 'Run Matcher'}
          </button>
          <button style={{ ...btnSec, marginLeft: 8 }} onClick={() => setShowServices(!showServices)}>
            {showServices ? 'Hide' : 'Manage'} Services ({services.length})
          </button>
        </div>

        <div style={card}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Caseload Analyzer</h3>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 12 }}>Identify overloaded caseworkers and get reassignment suggestions.</p>
          <button
            disabled={loadingKey === 'cw'}
            style={btn}
            onClick={() => run('cw', () => ai.caseloadAnalyzer(), 'Caseload Analysis')}
          >
            {loadingKey === 'cw' ? 'Analyzing...' : 'Analyze Workload'}
          </button>
        </div>

        <div style={card}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Progress Report</h3>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 12 }}>Generate a structured progress report for a date range.</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input type="date" style={input} value={start} onChange={e => setStart(e.target.value)} />
            <input type="date" style={input} value={end} onChange={e => setEnd(e.target.value)} />
          </div>
          <button
            disabled={!selBen || loadingKey === 'pr'}
            style={{ ...btn, opacity: !selBen ? 0.5 : 1 }}
            onClick={() => run('pr', () => ai.progressReport({
              beneficiary_id: parseInt(selBen),
              date_range: (start && end) ? { start, end } : undefined
            }), 'Progress Report')}
          >
            {loadingKey === 'pr' ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {showServices && (
        <div style={card}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Services Directory</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
            <input style={input} placeholder="Name" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} />
            <input style={input} placeholder="Type (housing, mental_health...)" value={newService.service_type} onChange={e => setNewService({...newService, service_type: e.target.value})} />
            <input style={input} placeholder="Eligibility" value={newService.eligibility} onChange={e => setNewService({...newService, eligibility: e.target.value})} />
            <input style={input} placeholder="Contact" value={newService.contact_info} onChange={e => setNewService({...newService, contact_info: e.target.value})} />
            <button style={btn} onClick={addService}>+ Add</button>
          </div>
          <textarea style={{...input, marginBottom: 12, minHeight: 60}} placeholder="Description" value={newService.description} onChange={e => setNewService({...newService, description: e.target.value})} />
          <table style={{ width: '100%', fontSize: 14 }}>
            <thead><tr style={{ textAlign: 'left', background: '#f9fafb' }}>
              <th style={{ padding: 8 }}>Name</th><th>Type</th><th>Eligibility</th><th>Contact</th><th></th>
            </tr></thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: 8 }}>{s.name}</td>
                  <td>{s.service_type}</td>
                  <td>{s.eligibility || '—'}</td>
                  <td>{s.contact_info || '—'}</td>
                  <td>
                    <button style={{...btnSec, padding: '4px 8px', fontSize: 12, color: '#dc2626'}} onClick={async () => {
                      if (!window.confirm(`Delete "${s.name}"?`)) return;
                      await servicesApi.delete(s.id);
                      setServices(services.filter(x => x.id !== s.id));
                    }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {output.body && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>{output.title}</h3>
            {output.meta?.model && <span style={{ fontSize: 12, color: '#6b7280' }}>Model: {output.meta.model}</span>}
          </div>
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 14, lineHeight: 1.5 }}>{output.body}</pre>
        </div>
      )}
    </div>
  );
}
