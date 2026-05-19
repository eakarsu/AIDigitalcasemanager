import React, { useState } from 'react';

/**
 * NON-VIZ 1: Case File Summary PDF generator.
 * Calls /api/custom-views/case-file-pdf and lets user view + download
 * a printable summary (text). Opens print dialog for PDF export.
 */
export default function CaseFilePdfPanel() {
  const [beneficiaryId, setBeneficiaryId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function generate() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/custom-views/case-file-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(beneficiaryId.trim() ? { beneficiary_id: Number(beneficiaryId) } : {}),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setResult(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function downloadText() {
    if (!result) return;
    const blob = new Blob([result.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename || 'case_file.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function printPdf() {
    if (!result) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(
      `<html><head><title>${result.filename || 'Case File'}</title>
        <style>body{font-family:monospace;white-space:pre-wrap;padding:24px;font-size:12px;}</style>
       </head><body>${result.text.replace(/</g, '&lt;')}</body></html>`
    );
    w.document.close();
    setTimeout(() => w.print(), 250);
  }

  return (
    <div data-testid="case-file-pdf-panel" style={{ background: '#fff', padding: 20, borderRadius: 10, border: '1px solid #e5e7eb' }}>
      <h3 style={{ margin: '0 0 6px 0', color: '#111827' }}>Case File Summary PDF</h3>
      <p style={{ marginTop: 0, color: '#6b7280', fontSize: 13 }}>
        Generate a printable case-file summary (notes, action plans, tasks) for a beneficiary.
      </p>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <input
          type="number"
          min="1"
          placeholder="Beneficiary ID (blank = first active)"
          value={beneficiaryId}
          onChange={e => setBeneficiaryId(e.target.value)}
          style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, width: 280, fontSize: 13 }}
        />
        <button
          onClick={generate}
          disabled={loading}
          style={{
            padding: '8px 14px', background: loading ? '#9ca3af' : '#4f46e5',
            color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Generating...' : 'Generate Case File'}
        </button>
        {result && (
          <>
            <button onClick={downloadText} style={{
              padding: '8px 12px', background: '#10b981', color: '#fff',
              border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer',
            }}>Download .txt</button>
            <button onClick={printPdf} style={{
              padding: '8px 12px', background: '#0ea5e9', color: '#fff',
              border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer',
            }}>Print to PDF</button>
          </>
        )}
      </div>

      {error && <div style={{ color: '#dc2626', marginBottom: 8 }}>Error: {error}</div>}

      {result && (
        <div>
          <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
            <span><b style={{ color: '#111827' }}>Beneficiary:</b> {result.beneficiary.name} (#{result.beneficiary.id})</span>
            <span><b style={{ color: '#111827' }}>Status:</b> {result.beneficiary.status}</span>
            <span><b style={{ color: '#111827' }}>Risk:</b> {result.beneficiary.risk_level}</span>
            <span><b style={{ color: '#111827' }}>Notes:</b> {result.counts.notes}</span>
            <span><b style={{ color: '#111827' }}>Plans:</b> {result.counts.plans}</span>
            <span><b style={{ color: '#111827' }}>Tasks:</b> {result.counts.tasks}</span>
          </div>
          <pre style={{
            background: '#0f172a', color: '#e2e8f0', padding: 14, borderRadius: 8,
            maxHeight: 360, overflow: 'auto', fontSize: 12, lineHeight: 1.5, margin: 0,
          }}>{result.text}</pre>
        </div>
      )}
    </div>
  );
}
