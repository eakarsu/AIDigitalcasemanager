const router = require('express').Router();
const fetch = require('node-fetch');
const { query } = require('../db');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
require('dotenv').config({ path: '../../.env' });

const OPENROUTER_URL = `${(process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '')}/chat/completions`;

const callAI = async (messages) => {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'AI Case Manager'
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages,
      max_tokens: 2000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${err}`);
  }

  return response.json();
};

/**
 * POST /api/ai/referral-matcher
 * Accepts { beneficiary_id }
 * Fetches beneficiary profile + needs, queries services_directory,
 * uses AI to rank top 3 matching services with justification.
 */
router.post('/referral-matcher', auth, aiRateLimiter, async (req, res) => {
  try {
    const { beneficiary_id } = req.body;
    if (!beneficiary_id) return res.status(400).json({ error: 'beneficiary_id is required' });

    const benResult = await query('SELECT * FROM beneficiaries WHERE id = $1', [beneficiary_id]);
    if (benResult.rows.length === 0) return res.status(404).json({ error: 'Beneficiary not found' });
    const beneficiary = benResult.rows[0];

    // Get beneficiary needs from recent notes and assessments
    const notesResult = await query(
      'SELECT summary, detailed_notes FROM case_notes WHERE beneficiary_id = $1 ORDER BY meeting_date DESC LIMIT 5',
      [beneficiary_id]
    );
    const assessResult = await query(
      'SELECT title, findings, recommendations FROM assessments WHERE beneficiary_id = $1 ORDER BY created_at DESC LIMIT 5',
      [beneficiary_id]
    );

    // Get all active services from directory
    const servicesResult = await query(
      'SELECT * FROM services_directory WHERE is_active = true ORDER BY name',
      []
    );
    const services = servicesResult.rows;

    if (services.length === 0) {
      return res.status(404).json({ error: 'No services found in directory. Please populate the services_directory table.' });
    }

    const prompt = `You are a social work AI assistant specializing in service referrals. Match the following beneficiary to the top 3 most appropriate services from the directory.

BENEFICIARY PROFILE:
- Name: ${beneficiary.first_name} ${beneficiary.last_name}
- Program: ${beneficiary.program || 'Unknown'}
- Risk Level: ${beneficiary.risk_level}
- Status: ${beneficiary.status}
- Notes: ${beneficiary.notes || 'None'}

RECENT CASE NOTES:
${notesResult.rows.map(n => `- ${n.summary}: ${n.detailed_notes || ''}`).join('\n') || 'None'}

RECENT ASSESSMENTS:
${assessResult.rows.map(a => `- ${a.title}: ${a.findings || ''} | Recommendations: ${a.recommendations || ''}`).join('\n') || 'None'}

AVAILABLE SERVICES:
${services.map(s => `ID: ${s.id} | Name: ${s.name} | Type: ${s.service_type} | Description: ${s.description || 'N/A'} | Eligibility: ${s.eligibility || 'N/A'}`).join('\n')}

Please provide:
1. Top 3 Recommended Services (ranked by fit), for each:
   - Service Name and ID
   - Match Score (0-100)
   - Justification (why this service fits this beneficiary)
   - Suggested Action Steps
2. Overall Referral Strategy
3. Priority Order and Timeline`;

    const aiResponse = await callAI([
      { role: 'system', content: 'You are a professional social work AI assistant specializing in resource referrals and service matching.' },
      { role: 'user', content: prompt }
    ]);

    const content = aiResponse.choices[0].message.content;

    // Persist the AI summary
    await query(`
      INSERT INTO ai_summaries (beneficiary_id, caseworker_id, summary_type, content, ai_model, prompt_used)
      VALUES ($1, (SELECT id FROM caseworkers WHERE user_id = $2 LIMIT 1), 'referral_matcher', $3, $4, $5)
    `, [beneficiary_id, req.user.id, content, aiResponse.model, 'Referral matcher']);

    res.json({
      beneficiary_id,
      services_evaluated: services.length,
      recommendations: content,
      ai_response: {
        model: aiResponse.model,
        usage: aiResponse.usage
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/caseload-analyzer
 * Accepts {}
 * Fetches all caseworkers with active_cases/max_caseload, returns overloaded caseworkers (>80%),
 * suggested reassignments, workload distribution recommendations.
 */
router.post('/caseload-analyzer', auth, aiRateLimiter, async (req, res) => {
  try {
    const caseworkersResult = await query(`
      SELECT cw.id, cw.department, cw.specialization, cw.max_caseload, cw.active_cases, cw.status,
             u.full_name, u.email
      FROM caseworkers cw
      JOIN users u ON cw.user_id = u.id
      WHERE cw.status = 'active'
      ORDER BY u.full_name
    `);
    const caseworkers = caseworkersResult.rows;

    // Identify overloaded caseworkers (>80% capacity)
    const overloaded = caseworkers.filter(cw =>
      cw.max_caseload > 0 && (cw.active_cases / cw.max_caseload) > 0.8
    );

    // Get unassigned or high-risk beneficiaries for potential reassignment
    const unassignedResult = await query(`
      SELECT id, first_name, last_name, risk_level, program, assigned_caseworker_id
      FROM beneficiaries
      WHERE status = 'active'
      ORDER BY risk_level DESC, created_at ASC
    `);

    const prompt = `You are a social work management AI. Analyze caseworker caseload distribution and provide optimization recommendations.

CASEWORKER CASELOAD STATUS:
${caseworkers.map(cw => {
  const utilization = cw.max_caseload > 0 ? Math.round((cw.active_cases / cw.max_caseload) * 100) : 0;
  return `- ${cw.full_name} | Dept: ${cw.department || 'N/A'} | Specialization: ${cw.specialization || 'General'} | Cases: ${cw.active_cases}/${cw.max_caseload} (${utilization}% utilized)`;
}).join('\n') || 'No active caseworkers found'}

OVERLOADED CASEWORKERS (>80% capacity):
${overloaded.map(cw => {
  const utilization = Math.round((cw.active_cases / cw.max_caseload) * 100);
  return `- ${cw.full_name}: ${cw.active_cases}/${cw.max_caseload} (${utilization}%)`;
}).join('\n') || 'None - all caseworkers within capacity'}

ACTIVE BENEFICIARY DISTRIBUTION:
Total Active Beneficiaries: ${unassignedResult.rows.length}
High Risk: ${unassignedResult.rows.filter(b => b.risk_level === 'high' || b.risk_level === 'critical').length}
Medium Risk: ${unassignedResult.rows.filter(b => b.risk_level === 'medium').length}
Low Risk: ${unassignedResult.rows.filter(b => b.risk_level === 'low').length}

Please provide:
1. Overall Caseload Health Assessment
2. Overloaded Caseworkers Analysis
3. Suggested Reassignments (specific recommendations)
4. Workload Distribution Recommendations
5. Capacity Planning Suggestions
6. Risk Management Priorities`;

    const aiResponse = await callAI([
      { role: 'system', content: 'You are a social work management AI assistant specializing in caseload optimization and workforce planning.' },
      { role: 'user', content: prompt }
    ]);

    const content = aiResponse.choices[0].message.content;

    res.json({
      summary: {
        total_caseworkers: caseworkers.length,
        overloaded_count: overloaded.length,
        total_active_beneficiaries: unassignedResult.rows.length
      },
      overloaded_caseworkers: overloaded.map(cw => ({
        id: cw.id,
        name: cw.full_name,
        utilization_percent: Math.round((cw.active_cases / cw.max_caseload) * 100),
        active_cases: cw.active_cases,
        max_caseload: cw.max_caseload
      })),
      recommendations: content,
      ai_response: {
        model: aiResponse.model,
        usage: aiResponse.usage
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/progress-report
 * Accepts { beneficiary_id, date_range: { start, end } }
 * Fetches goals + tasks + assessments for period, generates structured progress report.
 */
router.post('/progress-report', auth, aiRateLimiter, async (req, res) => {
  try {
    const { beneficiary_id, date_range } = req.body;
    if (!beneficiary_id) return res.status(400).json({ error: 'beneficiary_id is required' });

    const startDate = date_range?.start || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = date_range?.end || new Date().toISOString().split('T')[0];

    const benResult = await query('SELECT * FROM beneficiaries WHERE id = $1', [beneficiary_id]);
    if (benResult.rows.length === 0) return res.status(404).json({ error: 'Beneficiary not found' });
    const beneficiary = benResult.rows[0];

    // Fetch goals with progress
    const goalsResult = await query(`
      SELECT * FROM goals
      WHERE beneficiary_id = $1
        AND (created_at BETWEEN $2 AND $3 OR status != 'completed')
      ORDER BY created_at DESC
    `, [beneficiary_id, startDate, endDate]);

    // Fetch tasks in period
    const tasksResult = await query(`
      SELECT * FROM tasks
      WHERE beneficiary_id = $1
        AND created_at BETWEEN $2 AND $3
      ORDER BY created_at DESC
    `, [beneficiary_id, startDate, endDate]);

    // Fetch assessments in period
    const assessmentsResult = await query(`
      SELECT * FROM assessments
      WHERE beneficiary_id = $1
        AND created_at BETWEEN $2 AND $3
      ORDER BY created_at DESC
    `, [beneficiary_id, startDate, endDate]);

    // Fetch notes in period
    const notesResult = await query(`
      SELECT * FROM case_notes
      WHERE beneficiary_id = $1
        AND meeting_date BETWEEN $2 AND $3
      ORDER BY meeting_date DESC
    `, [beneficiary_id, startDate, endDate]);

    const prompt = `Generate a structured progress report for the following beneficiary covering the period ${startDate} to ${endDate}.

BENEFICIARY: ${beneficiary.first_name} ${beneficiary.last_name}
Program: ${beneficiary.program || 'Unknown'} | Risk Level: ${beneficiary.risk_level} | Status: ${beneficiary.status}

GOALS (${goalsResult.rows.length} total):
${goalsResult.rows.map(g => `- [${g.status}] ${g.title}: ${g.progress}% complete (Target: ${g.target_date || 'N/A'})`).join('\n') || 'No goals recorded'}

TASKS IN PERIOD (${tasksResult.rows.length} total):
Completed: ${tasksResult.rows.filter(t => t.status === 'completed').length}
Pending: ${tasksResult.rows.filter(t => t.status === 'pending').length}
Overdue: ${tasksResult.rows.filter(t => t.status === 'overdue').length}
${tasksResult.rows.slice(0, 10).map(t => `- [${t.status}] ${t.title} (Priority: ${t.priority})`).join('\n')}

ASSESSMENTS IN PERIOD (${assessmentsResult.rows.length} total):
${assessmentsResult.rows.map(a => `- ${a.title}: ${a.score}/${a.max_score} | Risk: ${a.risk_level} | Findings: ${a.findings || 'N/A'}`).join('\n') || 'No assessments in period'}

MEETINGS IN PERIOD (${notesResult.rows.length} total):
${notesResult.rows.slice(0, 5).map(n => `- [${n.meeting_date}] ${n.meeting_type}: ${n.summary} (Mood: ${n.mood || 'N/A'})`).join('\n') || 'No meetings in period'}

Please generate a structured progress report with:
1. Executive Summary
2. Key Achievements During Period
3. Setbacks and Challenges
4. Goal Progress Analysis
5. Risk Level Changes
6. Next Steps and Recommendations
7. Timeline for Next Review`;

    const aiResponse = await callAI([
      { role: 'system', content: 'You are a professional social work AI assistant. Generate structured, evidence-based progress reports.' },
      { role: 'user', content: prompt }
    ]);

    const content = aiResponse.choices[0].message.content;

    // Save the report
    await query(`
      INSERT INTO ai_summaries (beneficiary_id, caseworker_id, summary_type, content, ai_model, prompt_used)
      VALUES ($1, (SELECT id FROM caseworkers WHERE user_id = $2 LIMIT 1), 'progress_report', $3, $4, $5)
    `, [beneficiary_id, req.user.id, content, aiResponse.model, `Progress report ${startDate} to ${endDate}`]);

    res.json({
      beneficiary_id,
      date_range: { start: startDate, end: endDate },
      period_summary: {
        goals: goalsResult.rows.length,
        tasks: tasksResult.rows.length,
        assessments: assessmentsResult.rows.length,
        meetings: notesResult.rows.length
      },
      report: content,
      ai_response: {
        model: aiResponse.model,
        usage: aiResponse.usage
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/predict-risk-escalation
 * Audit recommendation: stateless predictor of risk-escalation events given
 * a beneficiary profile + recent notes/assessments payload.
 * Body: { beneficiary_profile, recent_notes?, horizon_days? }
 */
router.post('/predict-risk-escalation', auth, aiRateLimiter, async (req, res) => {
  try {
    const { beneficiary_profile, recent_notes, horizon_days } = req.body;
    if (!beneficiary_profile) {
      return res.status(400).json({ error: 'beneficiary_profile is required' });
    }
    const horizon = horizon_days && Number.isFinite(parseInt(horizon_days, 10)) ? parseInt(horizon_days, 10) : 30;

    const messages = [
      {
        role: 'system',
        content: 'You are an experienced social worker / case manager. Predict the probability of risk escalation (hospitalization, incarceration, abuse, severe deterioration) within the given horizon. Respond ONLY in JSON: {"probability":0..1,"risk_level":"low|medium|high|critical","top_drivers":[{"driver":"...","weight":"high|medium|low"}],"recommended_interventions":["..."],"confidence":"low|medium|high"}',
      },
      {
        role: 'user',
        content: `Predict risk escalation for the next ${horizon} days.

BENEFICIARY PROFILE:
${typeof beneficiary_profile === 'string' ? beneficiary_profile : JSON.stringify(beneficiary_profile, null, 2)}

RECENT NOTES:
${recent_notes ? (typeof recent_notes === 'string' ? recent_notes : JSON.stringify(recent_notes, null, 2)) : 'Not provided'}`,
      },
    ];

    const aiResponse = await callAI(messages);
    const content = aiResponse.choices?.[0]?.message?.content || '';

    res.json({
      horizon_days: horizon,
      prediction: content,
      ai_response: { model: aiResponse.model, usage: aiResponse.usage },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/recommend-services
 * Audit recommendation: stateless service-recommendation given a needs list
 * and an optional services catalog.
 * Body: { needs: [], services_catalog?: [], beneficiary_context? }
 */
router.post('/recommend-services', auth, aiRateLimiter, async (req, res) => {
  try {
    const { needs, services_catalog, beneficiary_context } = req.body;
    if (!needs || !Array.isArray(needs) || needs.length === 0) {
      return res.status(400).json({ error: 'needs (non-empty array) is required' });
    }

    const messages = [
      {
        role: 'system',
        content: 'You are a community-services connector. Match beneficiary needs to relevant services. When a catalog is provided, use it; otherwise suggest service categories. Respond ONLY in JSON: {"matches":[{"need":"...","service":"...","why":"...","priority":"high|medium|low"}],"unmet_needs":["..."],"suggested_categories":["..."]}',
      },
      {
        role: 'user',
        content: `Recommend services.

NEEDS:
${JSON.stringify(needs, null, 2)}

SERVICES CATALOG (optional):
${services_catalog ? JSON.stringify(services_catalog, null, 2) : 'Not provided'}

BENEFICIARY CONTEXT (optional):
${beneficiary_context ? (typeof beneficiary_context === 'string' ? beneficiary_context : JSON.stringify(beneficiary_context, null, 2)) : 'Not provided'}`,
      },
    ];

    const aiResponse = await callAI(messages);
    const content = aiResponse.choices?.[0]?.message?.content || '';

    res.json({
      recommendations: content,
      ai_response: { model: aiResponse.model, usage: aiResponse.usage },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/generate-communication-plan
 * Audit gap (communications.js): generate a structured outreach plan.
 * Body: { goal, audience, channels?, tone?, constraints? }
 */
router.post('/generate-communication-plan', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    }
    const { goal, audience, channels, tone, constraints } = req.body;
    if (!goal || !audience) {
      return res.status(400).json({ error: 'goal and audience are required' });
    }
    const messages = [
      {
        role: 'system',
        content: 'You are a social-services communications specialist. Produce JSON only: {"plan":[{"channel":"...","message":"...","cadence":"...","owner":"...","success_metric":"..."}],"risks":["..."],"escalation_path":"..."}',
      },
      {
        role: 'user',
        content: `Generate an outreach plan.\n\nGOAL: ${goal}\nAUDIENCE: ${audience}\nCHANNELS: ${channels ? JSON.stringify(channels) : 'unspecified'}\nTONE: ${tone || 'empathetic, professional'}\nCONSTRAINTS: ${constraints || 'none'}`,
      },
    ];
    const aiResponse = await callAI(messages);
    const content = aiResponse.choices?.[0]?.message?.content || '';
    res.json({ plan: content, ai_response: { model: aiResponse.model, usage: aiResponse.usage } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/predict-goal-achievement
 * Audit recommendation: likelihood scoring per goal.
 * Body: { goal, beneficiary_context?, history? }
 */
router.post('/predict-goal-achievement', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    }
    const { goal, beneficiary_context, history } = req.body;
    if (!goal) {
      return res.status(400).json({ error: 'goal is required' });
    }
    const messages = [
      {
        role: 'system',
        content: 'You are a case-management analyst. Estimate goal achievement likelihood. Respond ONLY in JSON: {"probability":0..1,"confidence":"low|medium|high","supporting_factors":["..."],"risk_factors":["..."],"recommended_supports":["..."]}',
      },
      {
        role: 'user',
        content: `GOAL:\n${typeof goal === 'string' ? goal : JSON.stringify(goal, null, 2)}\n\nBENEFICIARY CONTEXT:\n${beneficiary_context ? (typeof beneficiary_context === 'string' ? beneficiary_context : JSON.stringify(beneficiary_context, null, 2)) : 'Not provided'}\n\nHISTORY:\n${history ? (typeof history === 'string' ? history : JSON.stringify(history, null, 2)) : 'Not provided'}`,
      },
    ];
    const aiResponse = await callAI(messages);
    const content = aiResponse.choices?.[0]?.message?.content || '';
    res.json({ prediction: content, ai_response: { model: aiResponse.model, usage: aiResponse.usage } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/balance-caseworker-workload
 * Audit recommendation: stateless reassignment suggestions.
 * Body: { caseworkers: [...], beneficiaries?: [...] }
 */
router.post('/balance-caseworker-workload', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    }
    const { caseworkers, beneficiaries } = req.body;
    if (!caseworkers || !Array.isArray(caseworkers) || caseworkers.length === 0) {
      return res.status(400).json({ error: 'caseworkers (non-empty array) is required' });
    }
    const messages = [
      {
        role: 'system',
        content: 'You are a workforce-planning AI. Recommend reassignments to balance caseload. Respond ONLY in JSON: {"reassignments":[{"beneficiary":"...","from":"...","to":"...","reason":"..."}],"capacity_summary":[{"caseworker":"...","utilization_after":"X%"}],"warnings":["..."]}',
      },
      {
        role: 'user',
        content: `CASEWORKERS:\n${JSON.stringify(caseworkers, null, 2)}\n\nBENEFICIARIES:\n${beneficiaries ? JSON.stringify(beneficiaries, null, 2) : 'Not provided'}`,
      },
    ];
    const aiResponse = await callAI(messages);
    const content = aiResponse.choices?.[0]?.message?.content || '';
    res.json({ recommendations: content, ai_response: { model: aiResponse.model, usage: aiResponse.usage } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Apply pass 5 — remaining backlog (additive)
 * - eligibility-determination (PRODUCT-DECISION)
 * - hipaa-ferpa-compliance-check (PRODUCT-DECISION)
 * - notify-sms (NEEDS-CREDS, Twilio)
 * - notify-email (NEEDS-CREDS, SendGrid)
 * - service-directory-211 (NEEDS-CREDS)
 *
 * Documented env vars:
 *   OPENROUTER_API_KEY — for AI endpoints
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER — SMS
 *   SENDGRID_API_KEY, SENDGRID_FROM_EMAIL — email
 *   OPEN211_API_KEY — 211 directory
 */

// PRODUCT-DECISION: We treat eligibility as advisory only (the LLM proposes likely
// programs and rationale; final eligibility must be confirmed by a caseworker).
// Programs supported by default: SNAP, Medicaid, TANF, Section 8, LIHEAP, WIC.
router.post('/eligibility-determination', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    }
    const { beneficiary_profile, programs, jurisdiction } = req.body;
    if (!beneficiary_profile) {
      return res.status(400).json({ error: 'beneficiary_profile is required' });
    }
    const programList = (Array.isArray(programs) && programs.length > 0)
      ? programs
      : ['SNAP', 'Medicaid', 'TANF', 'Section 8', 'LIHEAP', 'WIC'];
    const messages = [
      {
        role: 'system',
        content: 'You are a benefits-eligibility advisor. Output ADVISORY ONLY (final eligibility requires caseworker confirmation). Respond ONLY in JSON: {"likely_eligible":[{"program":"...","confidence":"low|medium|high","reasoning":"...","required_documents":["..."]}],"likely_ineligible":[{"program":"...","reason":"..."}],"needs_more_info":[{"program":"...","missing":["..."]}],"next_steps":["..."],"disclaimer":"Advisory only - confirm with caseworker"}',
      },
      {
        role: 'user',
        content: `Determine likely eligibility.\n\nJURISDICTION: ${jurisdiction || 'US (general)'}\nPROGRAMS: ${JSON.stringify(programList)}\n\nBENEFICIARY PROFILE:\n${typeof beneficiary_profile === 'string' ? beneficiary_profile : JSON.stringify(beneficiary_profile, null, 2)}`,
      },
    ];
    const aiResponse = await callAI(messages);
    const content = aiResponse.choices?.[0]?.message?.content || '';
    res.json({
      determination: content,
      programs_evaluated: programList,
      ai_response: { model: aiResponse.model, usage: aiResponse.usage },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PRODUCT-DECISION: HIPAA/FERPA compliance posture check. Reviews a snippet of
// case-management workflow text and flags potential PHI/student-record handling
// issues. Default frameworks: HIPAA + FERPA (selectable via `frameworks`).
router.post('/compliance-check', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    }
    const { workflow_description, frameworks } = req.body;
    if (!workflow_description) {
      return res.status(400).json({ error: 'workflow_description is required' });
    }
    const fw = (Array.isArray(frameworks) && frameworks.length > 0) ? frameworks : ['HIPAA', 'FERPA'];
    const messages = [
      {
        role: 'system',
        content: 'You are a compliance officer for social-services and education programs. Identify potential HIPAA / FERPA risks in the described workflow. Respond ONLY in JSON: {"frameworks_evaluated":["..."],"violations":[{"framework":"HIPAA|FERPA","severity":"low|medium|high","description":"...","citation":"..."}],"recommendations":["..."],"required_safeguards":["..."],"summary":"..."}',
      },
      {
        role: 'user',
        content: `FRAMEWORKS: ${JSON.stringify(fw)}\n\nWORKFLOW:\n${workflow_description}`,
      },
    ];
    const aiResponse = await callAI(messages);
    const content = aiResponse.choices?.[0]?.message?.content || '';
    res.json({
      analysis: content,
      frameworks: fw,
      ai_response: { model: aiResponse.model, usage: aiResponse.usage },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// NEEDS-CREDS: Twilio SMS dispatch for schedule changes / urgent notices.
router.post('/notify-sms', auth, async (req, res) => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const tok = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !tok || !from) {
    return res.status(503).json({
      error: 'SMS service unavailable',
      missing: !sid ? 'TWILIO_ACCOUNT_SID' : !tok ? 'TWILIO_AUTH_TOKEN' : 'TWILIO_FROM_NUMBER',
    });
  }
  const { to, body } = req.body || {};
  if (!to || !body) return res.status(400).json({ error: 'to and body are required' });
  // When configured, would call Twilio REST API. Avoid adding `twilio` SDK as a
  // new dep in this pass; record the intended dispatch.
  return res.json({
    status: 'configured',
    to,
    from,
    body,
    note: 'Twilio credentials accepted; live dispatch wiring deferred.',
  });
});

// NEEDS-CREDS: SendGrid email dispatch.
router.post('/notify-email', auth, async (req, res) => {
  const key = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM_EMAIL;
  if (!key || !from) {
    return res.status(503).json({
      error: 'Email service unavailable',
      missing: !key ? 'SENDGRID_API_KEY' : 'SENDGRID_FROM_EMAIL',
    });
  }
  const { to, subject, body } = req.body || {};
  if (!to || !subject || !body) return res.status(400).json({ error: 'to, subject, body are required' });
  return res.json({
    status: 'configured',
    to,
    from,
    subject,
    note: 'SendGrid credentials accepted; live dispatch wiring deferred.',
  });
});

// NEEDS-CREDS: 211 community-services directory lookup.
router.post('/service-directory-211', auth, async (req, res) => {
  const key = process.env.OPEN211_API_KEY;
  if (!key) {
    return res.status(503).json({ error: '211 directory unavailable', missing: 'OPEN211_API_KEY' });
  }
  const { zip, category } = req.body || {};
  if (!zip) return res.status(400).json({ error: 'zip is required' });
  return res.json({
    status: 'configured',
    zip,
    category: category || 'all',
    note: '211 API credentials accepted; live lookup wiring deferred.',
  });
});

module.exports = router;
