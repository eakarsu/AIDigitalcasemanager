import React, { useState } from 'react';
import api from '../services/api';

// Local AI helpers for the new endpoints (kept inline so we don't modify api.js).
const aiNewApi = {
  predictRiskEscalation: (data) => api.post('/ai/predict-risk-escalation', data),
  recommendServices: (data) => api.post('/ai/recommend-services', data),
  generateCommunicationPlan: (data) => api.post('/ai/generate-communication-plan', data),
  predictGoalAchievement: (data) => api.post('/ai/predict-goal-achievement', data),
  balanceCaseworkerWorkload: (data) => api.post('/ai/balance-caseworker-workload', data),
  // Apply pass 5 — backlog endpoints
  eligibilityDetermination: (data) => api.post('/ai/eligibility-determination', data),
  complianceCheck: (data) => api.post('/ai/compliance-check', data),
  notifySms: (data) => api.post('/ai/notify-sms', data),
  notifyEmail: (data) => api.post('/ai/notify-email', data),
  serviceDirectory211: (data) => api.post('/ai/service-directory-211', data),
};

const card = { background: 'white', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
const btn = { padding: '10px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', cursor: 'pointer', fontWeight: 600 };
const input = { padding: 8, borderRadius: 6, border: '1px solid #d1d5db', width: '100%', fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' };
const textarea = { ...input, minHeight: 100, fontFamily: 'monospace', fontSize: 13 };
const errorBox = { background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: 12, borderRadius: 8, fontSize: 13, marginTop: 12 };

const SAMPLE_PROFILE = `{
  "beneficiary_id": 42,
  "age": 52,
  "diagnoses": ["depression", "hypertension"],
  "housing_status": "transitional",
  "support_network": "limited",
  "recent_incidents": 1
}`;

const SAMPLE_NOTES = `[
  { "date": "2026-04-15", "note": "Missed medication for 2 days, reports low mood" },
  { "date": "2026-04-25", "note": "Skipped scheduled therapy appointment" }
]`;

const SAMPLE_NEEDS = `["stable housing", "mental health counseling", "weekly food assistance"]`;

const SAMPLE_CATALOG = `[
  { "name": "Hope House", "service_type": "housing", "eligibility": "homeless adults" },
  { "name": "Community Wellness Center", "service_type": "mental_health", "eligibility": "any adult" }
]`;

function tryParseJson(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  try { return JSON.parse(value); } catch { return value; }
}

export default function AINewTools() {
  const [tab, setTab] = useState('predict-risk-escalation');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState({ title: '', body: '', meta: null });
  const [error, setError] = useState(null);

  // Risk escalation fields
  const [profile, setProfile] = useState('');
  const [notesText, setNotesText] = useState('');
  const [horizon, setHorizon] = useState('30');

  // Service recommendation fields
  const [needs, setNeeds] = useState('');
  const [catalog, setCatalog] = useState('');
  const [context, setContext] = useState('');

  // Communication plan fields
  const [commGoal, setCommGoal] = useState('');
  const [commAudience, setCommAudience] = useState('');
  const [commChannels, setCommChannels] = useState('');
  const [commTone, setCommTone] = useState('');
  const [commConstraints, setCommConstraints] = useState('');

  // Goal achievement fields
  const [goalText, setGoalText] = useState('');
  const [goalContext, setGoalContext] = useState('');
  const [goalHistory, setGoalHistory] = useState('');

  // Workload balance fields
  const [cwList, setCwList] = useState('');
  const [bnList, setBnList] = useState('');

  // Apply pass 5 — Backlog tool fields
  const [eligibilityProfile, setEligibilityProfile] = useState('');
  const [eligibilityPrograms, setEligibilityPrograms] = useState('');
  const [eligibilityJurisdiction, setEligibilityJurisdiction] = useState('');
  const [complianceWorkflow, setComplianceWorkflow] = useState('');
  const [complianceFrameworks, setComplianceFrameworks] = useState('');
  const [smsTo, setSmsTo] = useState('');
  const [smsBody, setSmsBody] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [zip211, setZip211] = useState('');
  const [category211, setCategory211] = useState('');

  const runRisk = async () => {
    if (!profile.trim()) { setError('beneficiary_profile is required'); return; }
    setLoading(true);
    setError(null);
    setOutput({ title: '', body: '', meta: null });
    try {
      const payload = {
        beneficiary_profile: tryParseJson(profile),
      };
      if (notesText.trim()) payload.recent_notes = tryParseJson(notesText);
      const h = parseInt(horizon, 10);
      if (!isNaN(h)) payload.horizon_days = h;
      const res = await aiNewApi.predictRiskEscalation(payload);
      const d = res.data;
      setOutput({
        title: `Risk Escalation Forecast (${d.horizon_days || h || 30}-day horizon)`,
        body: typeof d.prediction === 'string' ? d.prediction : JSON.stringify(d.prediction, null, 2),
        meta: d.ai_response,
      });
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const runServices = async () => {
    let needsArr;
    try {
      needsArr = JSON.parse(needs);
      if (!Array.isArray(needsArr) || needsArr.length === 0) throw new Error();
    } catch {
      setError('needs must be a non-empty JSON array, e.g., ["housing","food"]');
      return;
    }
    setLoading(true);
    setError(null);
    setOutput({ title: '', body: '', meta: null });
    try {
      const payload = { needs: needsArr };
      if (catalog.trim()) payload.services_catalog = tryParseJson(catalog);
      if (context.trim()) payload.beneficiary_context = tryParseJson(context);
      const res = await aiNewApi.recommendServices(payload);
      const d = res.data;
      setOutput({
        title: 'Service Recommendations',
        body: typeof d.recommendations === 'string' ? d.recommendations : JSON.stringify(d.recommendations, null, 2),
        meta: d.ai_response,
      });
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handle503 = (e) => {
    const status = e?.response?.status;
    if (status === 503) return e?.response?.data?.error || 'AI service unavailable (503)';
    return e?.response?.data?.error || e.message || 'Request failed';
  };

  const runComm = async () => {
    if (!commGoal.trim() || !commAudience.trim()) { setError('goal and audience are required'); return; }
    setLoading(true); setError(null); setOutput({ title: '', body: '', meta: null });
    try {
      const payload = { goal: commGoal, audience: commAudience };
      if (commChannels.trim()) payload.channels = tryParseJson(commChannels);
      if (commTone.trim()) payload.tone = commTone;
      if (commConstraints.trim()) payload.constraints = commConstraints;
      const res = await aiNewApi.generateCommunicationPlan(payload);
      const d = res.data;
      setOutput({ title: 'Communication Plan', body: typeof d.plan === 'string' ? d.plan : JSON.stringify(d.plan, null, 2), meta: d.ai_response });
    } catch (e) { setError(handle503(e)); } finally { setLoading(false); }
  };

  const runGoalPred = async () => {
    if (!goalText.trim()) { setError('goal is required'); return; }
    setLoading(true); setError(null); setOutput({ title: '', body: '', meta: null });
    try {
      const payload = { goal: tryParseJson(goalText) };
      if (goalContext.trim()) payload.beneficiary_context = tryParseJson(goalContext);
      if (goalHistory.trim()) payload.history = tryParseJson(goalHistory);
      const res = await aiNewApi.predictGoalAchievement(payload);
      const d = res.data;
      setOutput({ title: 'Goal Achievement Forecast', body: typeof d.prediction === 'string' ? d.prediction : JSON.stringify(d.prediction, null, 2), meta: d.ai_response });
    } catch (e) { setError(handle503(e)); } finally { setLoading(false); }
  };

  const runBalance = async () => {
    let cwArr;
    try {
      cwArr = JSON.parse(cwList);
      if (!Array.isArray(cwArr) || cwArr.length === 0) throw new Error();
    } catch {
      setError('caseworkers must be a non-empty JSON array'); return;
    }
    setLoading(true); setError(null); setOutput({ title: '', body: '', meta: null });
    try {
      const payload = { caseworkers: cwArr };
      if (bnList.trim()) payload.beneficiaries = tryParseJson(bnList);
      const res = await aiNewApi.balanceCaseworkerWorkload(payload);
      const d = res.data;
      setOutput({ title: 'Workload Rebalance Plan', body: typeof d.recommendations === 'string' ? d.recommendations : JSON.stringify(d.recommendations, null, 2), meta: d.ai_response });
    } catch (e) { setError(handle503(e)); } finally { setLoading(false); }
  };

  const runEligibility = async () => {
    if (!eligibilityProfile.trim()) { setError('beneficiary_profile is required'); return; }
    setLoading(true); setError(null); setOutput({ title: '', body: '', meta: null });
    try {
      const payload = { beneficiary_profile: tryParseJson(eligibilityProfile) };
      if (eligibilityPrograms.trim()) payload.programs = tryParseJson(eligibilityPrograms);
      if (eligibilityJurisdiction.trim()) payload.jurisdiction = eligibilityJurisdiction;
      const res = await aiNewApi.eligibilityDetermination(payload);
      const d = res.data;
      setOutput({
        title: 'Eligibility Determination (Advisory)',
        body: typeof d.determination === 'string' ? d.determination : JSON.stringify(d.determination, null, 2),
        meta: d.ai_response,
      });
    } catch (e) { setError(handle503(e)); } finally { setLoading(false); }
  };

  const runCompliance = async () => {
    if (!complianceWorkflow.trim()) { setError('workflow_description is required'); return; }
    setLoading(true); setError(null); setOutput({ title: '', body: '', meta: null });
    try {
      const payload = { workflow_description: complianceWorkflow };
      if (complianceFrameworks.trim()) payload.frameworks = tryParseJson(complianceFrameworks);
      const res = await aiNewApi.complianceCheck(payload);
      const d = res.data;
      setOutput({
        title: `Compliance Check (${(d.frameworks || []).join(', ') || 'HIPAA, FERPA'})`,
        body: typeof d.analysis === 'string' ? d.analysis : JSON.stringify(d.analysis, null, 2),
        meta: d.ai_response,
      });
    } catch (e) { setError(handle503(e)); } finally { setLoading(false); }
  };

  const runSms = async () => {
    if (!smsTo.trim() || !smsBody.trim()) { setError('to and body are required'); return; }
    setLoading(true); setError(null); setOutput({ title: '', body: '', meta: null });
    try {
      const res = await aiNewApi.notifySms({ to: smsTo, body: smsBody });
      setOutput({ title: 'SMS Dispatch', body: JSON.stringify(res.data, null, 2), meta: null });
    } catch (e) { setError(handle503(e)); } finally { setLoading(false); }
  };

  const runEmail = async () => {
    if (!emailTo.trim() || !emailSubject.trim() || !emailBody.trim()) { setError('to, subject, body are required'); return; }
    setLoading(true); setError(null); setOutput({ title: '', body: '', meta: null });
    try {
      const res = await aiNewApi.notifyEmail({ to: emailTo, subject: emailSubject, body: emailBody });
      setOutput({ title: 'Email Dispatch', body: JSON.stringify(res.data, null, 2), meta: null });
    } catch (e) { setError(handle503(e)); } finally { setLoading(false); }
  };

  const run211 = async () => {
    if (!zip211.trim()) { setError('zip is required'); return; }
    setLoading(true); setError(null); setOutput({ title: '', body: '', meta: null });
    try {
      const res = await aiNewApi.serviceDirectory211({ zip: zip211, category: category211 || undefined });
      setOutput({ title: '211 Directory Lookup', body: JSON.stringify(res.data, null, 2), meta: null });
    } catch (e) { setError(handle503(e)); } finally { setLoading(false); }
  };

  const tabs = [
    { id: 'predict-risk-escalation', label: 'Risk Escalation Predictor', icon: '⚠️' },
    { id: 'recommend-services', label: 'Service Recommender', icon: '🤝' },
    { id: 'communication-plan', label: 'Communication Plan', icon: '✉️' },
    { id: 'goal-achievement', label: 'Goal Achievement Predictor', icon: '🎯' },
    { id: 'workload-balance', label: 'Workload Balancer', icon: '⚖️' },
    { id: 'eligibility-determination', label: 'Eligibility Determination', icon: '📋' },
    { id: 'compliance-check', label: 'HIPAA/FERPA Check', icon: '🛡️' },
    { id: 'notify-sms', label: 'SMS Notify', icon: '💬' },
    { id: 'notify-email', label: 'Email Notify', icon: '📧' },
    { id: 'service-directory-211', label: '211 Directory', icon: '🔍' },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>AI New Tools</h2>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>
        Stateless risk-escalation prediction and service-recommendation tools.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setError(null); setOutput({ title: '', body: '', meta: null }); }}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: '1px solid ' + (tab === t.id ? '#4f46e5' : '#e5e7eb'),
              background: tab === t.id ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'white',
              color: tab === t.id ? 'white' : '#374151',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <span style={{ marginRight: 6 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'predict-risk-escalation' && (
        <div style={card}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Predict Risk Escalation</h3>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
            Estimate likelihood of risk-escalation events for a beneficiary over a given horizon.
          </p>

          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Beneficiary Profile (JSON or text) *</label>
          <textarea style={textarea} value={profile} onChange={(e) => setProfile(e.target.value)} placeholder={SAMPLE_PROFILE} />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, marginTop: 12 }}>Recent Notes (optional, JSON or text)</label>
          <textarea style={textarea} value={notesText} onChange={(e) => setNotesText(e.target.value)} placeholder={SAMPLE_NOTES} />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, marginTop: 12 }}>Horizon (days)</label>
          <input style={{ ...input, maxWidth: 160 }} type="number" min="1" value={horizon} onChange={(e) => setHorizon(e.target.value)} />

          <div style={{ marginTop: 16 }}>
            <button style={{ ...btn, opacity: loading ? 0.6 : 1 }} disabled={loading} onClick={runRisk}>
              {loading ? 'Predicting...' : 'Predict Escalation'}
            </button>
          </div>
        </div>
      )}

      {tab === 'recommend-services' && (
        <div style={card}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Recommend Services</h3>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
            Match a list of beneficiary needs to services from your catalog (optional) or general categories.
          </p>

          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Needs (JSON array) *</label>
          <textarea style={textarea} value={needs} onChange={(e) => setNeeds(e.target.value)} placeholder={SAMPLE_NEEDS} />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, marginTop: 12 }}>Services Catalog (optional, JSON array)</label>
          <textarea style={textarea} value={catalog} onChange={(e) => setCatalog(e.target.value)} placeholder={SAMPLE_CATALOG} />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, marginTop: 12 }}>Beneficiary Context (optional, JSON or text)</label>
          <textarea style={textarea} value={context} onChange={(e) => setContext(e.target.value)} placeholder='Single mother, two children, no transportation' />

          <div style={{ marginTop: 16 }}>
            <button style={{ ...btn, opacity: loading ? 0.6 : 1 }} disabled={loading} onClick={runServices}>
              {loading ? 'Matching...' : 'Recommend Services'}
            </button>
          </div>
        </div>
      )}

      {tab === 'communication-plan' && (
        <div style={card}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Generate Communication Plan</h3>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
            Produce a structured outreach plan (channels, cadence, owners) toward a specific goal.
          </p>

          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Goal *</label>
          <input style={input} value={commGoal} onChange={(e) => setCommGoal(e.target.value)} placeholder="Re-engage missed-appointment beneficiaries" />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, marginTop: 12 }}>Audience *</label>
          <input style={input} value={commAudience} onChange={(e) => setCommAudience(e.target.value)} placeholder="Adults aged 50+ with two or more no-shows" />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, marginTop: 12 }}>Channels (optional, JSON array)</label>
          <textarea style={textarea} value={commChannels} onChange={(e) => setCommChannels(e.target.value)} placeholder='["sms","phone_call","postal_mail"]' />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, marginTop: 12 }}>Tone (optional)</label>
          <input style={input} value={commTone} onChange={(e) => setCommTone(e.target.value)} placeholder="empathetic, professional" />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, marginTop: 12 }}>Constraints (optional)</label>
          <textarea style={textarea} value={commConstraints} onChange={(e) => setCommConstraints(e.target.value)} placeholder="No SMS after 8pm; HIPAA-safe wording" />

          <div style={{ marginTop: 16 }}>
            <button style={{ ...btn, opacity: loading ? 0.6 : 1 }} disabled={loading} onClick={runComm}>
              {loading ? 'Drafting...' : 'Generate Plan'}
            </button>
          </div>
        </div>
      )}

      {tab === 'goal-achievement' && (
        <div style={card}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Predict Goal Achievement</h3>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
            Score the probability that a beneficiary will achieve a specific goal.
          </p>

          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Goal (JSON or text) *</label>
          <textarea style={textarea} value={goalText} onChange={(e) => setGoalText(e.target.value)} placeholder='{"title":"Find stable housing","target_date":"2026-09-01","progress":40}' />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, marginTop: 12 }}>Beneficiary Context (optional)</label>
          <textarea style={textarea} value={goalContext} onChange={(e) => setGoalContext(e.target.value)} placeholder={SAMPLE_PROFILE} />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, marginTop: 12 }}>History (optional)</label>
          <textarea style={textarea} value={goalHistory} onChange={(e) => setGoalHistory(e.target.value)} placeholder='[{"date":"2026-03-10","milestone":"applied for shelter slot"}]' />

          <div style={{ marginTop: 16 }}>
            <button style={{ ...btn, opacity: loading ? 0.6 : 1 }} disabled={loading} onClick={runGoalPred}>
              {loading ? 'Scoring...' : 'Predict Achievement'}
            </button>
          </div>
        </div>
      )}

      {tab === 'workload-balance' && (
        <div style={card}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Balance Caseworker Workload</h3>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
            Stateless rebalancing recommendations from a snapshot of caseworkers (and optionally beneficiaries).
          </p>

          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Caseworkers (JSON array) *</label>
          <textarea style={textarea} value={cwList} onChange={(e) => setCwList(e.target.value)} placeholder='[{"name":"A. Smith","active_cases":24,"max_caseload":25,"specialization":"mental_health"},{"name":"B. Jones","active_cases":12,"max_caseload":25,"specialization":"housing"}]' />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, marginTop: 12 }}>Beneficiaries (optional, JSON array)</label>
          <textarea style={textarea} value={bnList} onChange={(e) => setBnList(e.target.value)} placeholder='[{"id":1,"name":"J. Doe","risk_level":"high","assigned_to":"A. Smith"}]' />

          <div style={{ marginTop: 16 }}>
            <button style={{ ...btn, opacity: loading ? 0.6 : 1 }} disabled={loading} onClick={runBalance}>
              {loading ? 'Balancing...' : 'Rebalance Workload'}
            </button>
          </div>
        </div>
      )}

      {tab === 'eligibility-determination' && (
        <div style={card}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Eligibility Determination (Advisory)</h3>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
            Advisory-only screening across SNAP / Medicaid / TANF / Section 8 / LIHEAP / WIC. Caseworker must confirm.
          </p>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Beneficiary Profile (JSON or text) *</label>
          <textarea style={textarea} value={eligibilityProfile} onChange={(e) => setEligibilityProfile(e.target.value)} placeholder={SAMPLE_PROFILE} />
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, marginTop: 12 }}>Programs (optional, JSON array)</label>
          <textarea style={textarea} value={eligibilityPrograms} onChange={(e) => setEligibilityPrograms(e.target.value)} placeholder='["SNAP","Medicaid","TANF"]' />
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, marginTop: 12 }}>Jurisdiction (optional)</label>
          <input style={input} value={eligibilityJurisdiction} onChange={(e) => setEligibilityJurisdiction(e.target.value)} placeholder="e.g. California" />
          <div style={{ marginTop: 16 }}>
            <button style={{ ...btn, opacity: loading ? 0.6 : 1 }} disabled={loading} onClick={runEligibility}>
              {loading ? 'Screening...' : 'Run Eligibility Screen'}
            </button>
          </div>
        </div>
      )}

      {tab === 'compliance-check' && (
        <div style={card}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>HIPAA / FERPA Compliance Check</h3>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
            Describe a workflow and get advisory flags for HIPAA / FERPA risk patterns.
          </p>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Workflow Description *</label>
          <textarea style={textarea} value={complianceWorkflow} onChange={(e) => setComplianceWorkflow(e.target.value)} placeholder="Caseworkers email a spreadsheet of beneficiary names + diagnoses to a partner clinic each Friday." />
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, marginTop: 12 }}>Frameworks (optional, JSON array)</label>
          <textarea style={textarea} value={complianceFrameworks} onChange={(e) => setComplianceFrameworks(e.target.value)} placeholder='["HIPAA","FERPA"]' />
          <div style={{ marginTop: 16 }}>
            <button style={{ ...btn, opacity: loading ? 0.6 : 1 }} disabled={loading} onClick={runCompliance}>
              {loading ? 'Reviewing...' : 'Run Compliance Check'}
            </button>
          </div>
        </div>
      )}

      {tab === 'notify-sms' && (
        <div style={card}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>SMS Notify (Twilio)</h3>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
            Requires <code>TWILIO_ACCOUNT_SID</code>, <code>TWILIO_AUTH_TOKEN</code>, <code>TWILIO_FROM_NUMBER</code>.
            Returns 503 with <code>missing</code> field when unset.
          </p>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>To (E.164) *</label>
          <input style={input} value={smsTo} onChange={(e) => setSmsTo(e.target.value)} placeholder="+15551234567" />
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, marginTop: 12 }}>Body *</label>
          <textarea style={textarea} value={smsBody} onChange={(e) => setSmsBody(e.target.value)} placeholder="Reminder: appointment tomorrow at 10am." />
          <div style={{ marginTop: 16 }}>
            <button style={{ ...btn, opacity: loading ? 0.6 : 1 }} disabled={loading} onClick={runSms}>
              {loading ? 'Dispatching...' : 'Send SMS'}
            </button>
          </div>
        </div>
      )}

      {tab === 'notify-email' && (
        <div style={card}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Email Notify (SendGrid)</h3>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
            Requires <code>SENDGRID_API_KEY</code>, <code>SENDGRID_FROM_EMAIL</code>.
          </p>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>To *</label>
          <input style={input} value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="recipient@example.org" />
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, marginTop: 12 }}>Subject *</label>
          <input style={input} value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, marginTop: 12 }}>Body *</label>
          <textarea style={textarea} value={emailBody} onChange={(e) => setEmailBody(e.target.value)} />
          <div style={{ marginTop: 16 }}>
            <button style={{ ...btn, opacity: loading ? 0.6 : 1 }} disabled={loading} onClick={runEmail}>
              {loading ? 'Dispatching...' : 'Send Email'}
            </button>
          </div>
        </div>
      )}

      {tab === 'service-directory-211' && (
        <div style={card}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>211 Directory Lookup</h3>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
            Requires <code>OPEN211_API_KEY</code>. Returns 503 when unset.
          </p>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>ZIP *</label>
          <input style={input} value={zip211} onChange={(e) => setZip211(e.target.value)} placeholder="94110" />
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, marginTop: 12 }}>Category</label>
          <input style={input} value={category211} onChange={(e) => setCategory211(e.target.value)} placeholder="food, housing, mental_health..." />
          <div style={{ marginTop: 16 }}>
            <button style={{ ...btn, opacity: loading ? 0.6 : 1 }} disabled={loading} onClick={run211}>
              {loading ? 'Looking up...' : 'Lookup 211'}
            </button>
          </div>
        </div>
      )}

      {error && <div style={errorBox}>{error}</div>}

      {loading && (
        <div style={{ ...card, textAlign: 'center', color: '#6b7280' }}>
          AI is processing your request...
        </div>
      )}

      {output.body && !loading && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>{output.title}</h3>
            {output.meta?.model && <span style={{ fontSize: 12, color: '#6b7280' }}>Model: {output.meta.model}</span>}
          </div>
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 14, lineHeight: 1.5, margin: 0 }}>{output.body}</pre>
        </div>
      )}
    </div>
  );
}
