import React, { useState } from 'react';
import CaseloadPerManagerChart from '../components/customViews/CaseloadPerManagerChart';
import CaseStageHeatmap        from '../components/customViews/CaseStageHeatmap';
import CaseFilePdfPanel        from '../components/customViews/CaseFilePdfPanel';
import WorkflowRulesEditor     from '../components/customViews/WorkflowRulesEditor';

/**
 * Case Views page: 4 custom views.
 *   VIZ:     caseload, heatmap
 *   NON-VIZ: pdf, rules
 */
const TABS = [
  { key: 'caseload', label: 'Caseload by Manager', icon: '📊' },
  { key: 'heatmap',  label: 'Case x Stage Heatmap', icon: '🗺️' },
  { key: 'pdf',      label: 'Case File PDF',        icon: '📄' },
  { key: 'rules',    label: 'Workflow Rules',       icon: '⚙️' },
];

export default function CustomViewsPage() {
  const [tab, setTab] = useState('caseload');

  return (
    <div data-testid="custom-views-page" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: '#111827' }}>Case Views</h2>
        <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: 14 }}>
          Custom operational views for case managers: caseload analytics, stage heatmap,
          case-file PDFs, and workflow rule configuration.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid #e5e7eb' }}>
        {TABS.map(t => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              data-testid={`tab-${t.key}`}
              onClick={() => setTab(t.key)}
              style={{
                padding: '10px 16px',
                background: 'none',
                border: 'none',
                borderBottom: active ? '3px solid #4f46e5' : '3px solid transparent',
                color: active ? '#4f46e5' : '#6b7280',
                fontWeight: active ? 600 : 500,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              <span style={{ marginRight: 6 }}>{t.icon}</span>{t.label}
            </button>
          );
        })}
      </div>

      <div>
        {tab === 'caseload' && <CaseloadPerManagerChart />}
        {tab === 'heatmap'  && <CaseStageHeatmap />}
        {tab === 'pdf'      && <CaseFilePdfPanel />}
        {tab === 'rules'    && <WorkflowRulesEditor />}
      </div>
    </div>
  );
}
