import React, { useEffect, useState } from 'react';

/**
 * VIZ 1: Caseload-per-Manager horizontal bar chart.
 * Pulls /api/custom-views/caseload-per-manager and renders SVG bars.
 */
export default function CaseloadPerManagerChart() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/custom-views/caseload-per-manager', {
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

  if (loading) return <div style={{ padding: 16, color: '#6b7280' }}>Loading caseload data...</div>;
  if (error)   return <div style={{ padding: 16, color: '#dc2626' }}>Error: {error}</div>;
  if (!data || !data.data || !data.data.length)
    return <div style={{ padding: 16, color: '#6b7280' }}>No caseload data available.</div>;

  const rows = data.data;
  const maxBar = Math.max(...rows.map(r => Math.max(r.max_caseload || 0, r.active_cases || 0)), 1);
  const rowH = 38;
  const labelW = 200;
  const barAreaW = 420;
  const totalW = labelW + barAreaW + 80;
  const totalH = rows.length * rowH + 40;

  return (
    <div data-testid="caseload-per-manager-chart" style={{ background: '#fff', padding: 20, borderRadius: 10, border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0, color: '#111827' }}>Caseload per Case Manager</h3>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            {data.total_managers} managers - {data.total_active_cases} active cases total
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#6b7280' }}>
          <span style={{ display: 'inline-block', width: 12, height: 12, background: '#4f46e5', marginRight: 4, borderRadius: 2 }} /> Active
          <span style={{ display: 'inline-block', width: 12, height: 12, background: '#f59e0b', marginLeft: 12, marginRight: 4, borderRadius: 2 }} /> High-Risk
          <span style={{ display: 'inline-block', width: 12, height: 2, background: '#dc2626', marginLeft: 12, marginRight: 4, verticalAlign: 'middle' }} /> Max
        </div>
      </div>
      <svg width={totalW} height={totalH} style={{ maxWidth: '100%' }}>
        {rows.map((r, i) => {
          const y = 20 + i * rowH;
          const wActive = ((r.active_cases || 0) / maxBar) * barAreaW;
          const wHigh   = ((r.high_risk_cases || 0) / maxBar) * barAreaW;
          const xMax    = labelW + ((r.max_caseload || 0) / maxBar) * barAreaW;
          return (
            <g key={r.caseworker_id}>
              <text x={labelW - 10} y={y + 18} textAnchor="end" fontSize="12" fill="#374151">
                {r.manager_name.length > 22 ? r.manager_name.slice(0, 20) + '...' : r.manager_name}
              </text>
              <rect x={labelW} y={y + 6} width={Math.max(2, wActive)} height={18} fill="#4f46e5" rx={3} />
              <rect x={labelW} y={y + 6} width={Math.max(0, wHigh)}   height={18} fill="#f59e0b" rx={3} opacity={0.85} />
              <line x1={xMax} x2={xMax} y1={y + 2} y2={y + 30} stroke="#dc2626" strokeWidth="2" />
              <text x={labelW + barAreaW + 8} y={y + 18} fontSize="12" fill="#111827" fontWeight="600">
                {r.active_cases} / {r.max_caseload} ({r.utilization_pct}%)
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
