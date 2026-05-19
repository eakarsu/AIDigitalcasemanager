import React, { useEffect, useState } from 'react';

/**
 * VIZ 2: Case x Stage Heatmap.
 * Rows = case manager. Columns = case stage. Cell intensity = case count.
 */
export default function CaseStageHeatmap() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/custom-views/case-stage-heatmap', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async r => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
        return j;
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 16, color: '#6b7280' }}>Loading heatmap...</div>;
  if (error)   return <div style={{ padding: 16, color: '#dc2626' }}>Error: {error}</div>;
  if (!data || !data.managers || !data.managers.length)
    return <div style={{ padding: 16, color: '#6b7280' }}>No heatmap data available.</div>;

  const max = data.max_cell || 1;
  const cellColor = (n) => {
    if (!n) return '#f3f4f6';
    const t = Math.min(1, n / max);
    const r = Math.round(238 - 158 * t);
    const g = Math.round(242 - 162 * t);
    const b = Math.round(255 - 110 * t);
    return `rgb(${r},${g},${b})`;
  };

  return (
    <div data-testid="case-stage-heatmap" style={{ background: '#fff', padding: 20, borderRadius: 10, border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0, color: '#111827' }}>Case x Stage Heatmap</h3>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            {data.managers.length} managers x {data.stages.length} stages - max cell = {max}
          </div>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 4, minWidth: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: 12, color: '#6b7280' }}>Manager</th>
              {data.stages.map(s => (
                <th key={s} style={{ padding: '6px 10px', fontSize: 12, color: '#6b7280', textTransform: 'capitalize' }}>{s}</th>
              ))}
              <th style={{ padding: '6px 10px', fontSize: 12, color: '#6b7280' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {data.managers.map((m) => (
              <tr key={`${m.caseworker_id}-${m.manager_name}`}>
                <td style={{ padding: '6px 10px', fontSize: 13, color: '#111827', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {m.manager_name}
                </td>
                {data.stages.map(s => {
                  const v = m.cells[s] || 0;
                  return (
                    <td
                      key={s}
                      style={{
                        background: cellColor(v),
                        color: v > max * 0.55 ? '#fff' : '#111827',
                        textAlign: 'center',
                        padding: '10px 14px',
                        borderRadius: 6,
                        fontWeight: 600,
                        minWidth: 56,
                        fontSize: 13,
                      }}
                    >
                      {v}
                    </td>
                  );
                })}
                <td style={{ padding: '6px 10px', fontSize: 13, color: '#374151', fontWeight: 700 }}>{m.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
