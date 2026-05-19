// Custom Views: 2 VIZ (caseload-per-manager, case-stage heatmap) + 2 NON-VIZ
// (case file summary PDF, workflow rules editor for stage transitions).
// Mounted at /api/custom-views BEFORE 404 handler.

const router = require('express').Router();
const { query } = require('../db');
const auth = require('../middleware/auth');

// In-memory workflow rules store (case stage transitions).
// Stages map to beneficiary.status values used elsewhere in the app.
const DEFAULT_STAGES = ['intake', 'active', 'in_progress', 'review', 'closed'];
let _ruleId = 1;
const defaultRules = () => ([
  { id: _ruleId++, from_stage: 'intake', to_stage: 'active', condition: 'Documents verified', auto_assign: true },
  { id: _ruleId++, from_stage: 'active', to_stage: 'in_progress', condition: 'Action plan approved', auto_assign: false },
  { id: _ruleId++, from_stage: 'in_progress', to_stage: 'review', condition: 'Goals 75% met', auto_assign: false },
  { id: _ruleId++, from_stage: 'review', to_stage: 'closed', condition: 'Supervisor sign-off', auto_assign: false },
]);
let workflowRules = defaultRules();

// =====================================================================
// VIZ 1: GET /api/custom-views/caseload-per-manager
// Returns caseload counts per caseworker (active beneficiaries assigned).
// =====================================================================
router.get('/caseload-per-manager', auth, async (req, res) => {
  try {
    const sql = `
      SELECT
        c.id                                                    AS caseworker_id,
        u.full_name                                             AS manager_name,
        c.department                                            AS department,
        c.max_caseload                                          AS max_caseload,
        COUNT(b.id) FILTER (WHERE b.status = 'active')          AS active_cases,
        COUNT(b.id)                                             AS total_cases,
        COUNT(b.id) FILTER (WHERE b.risk_level = 'high')        AS high_risk_cases
      FROM caseworkers c
      LEFT JOIN users u           ON u.id = c.user_id
      LEFT JOIN beneficiaries b   ON b.assigned_caseworker_id = c.id
      GROUP BY c.id, u.full_name, c.department, c.max_caseload
      ORDER BY active_cases DESC, manager_name ASC
    `;
    const { rows } = await query(sql);
    const data = rows.map(r => ({
      caseworker_id: r.caseworker_id,
      manager_name: r.manager_name || `Caseworker #${r.caseworker_id}`,
      department: r.department || 'General',
      max_caseload: parseInt(r.max_caseload || 25, 10),
      active_cases: parseInt(r.active_cases || 0, 10),
      total_cases: parseInt(r.total_cases || 0, 10),
      high_risk_cases: parseInt(r.high_risk_cases || 0, 10),
      utilization_pct: r.max_caseload
        ? Math.round((parseInt(r.active_cases || 0, 10) / parseInt(r.max_caseload, 10)) * 100)
        : 0,
    }));
    res.json({
      ok: true,
      generated_at: new Date().toISOString(),
      total_managers: data.length,
      total_active_cases: data.reduce((s, r) => s + r.active_cases, 0),
      data,
    });
  } catch (err) {
    console.error('caseload-per-manager error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// VIZ 2: GET /api/custom-views/case-stage-heatmap
// Returns case-x-stage heatmap. Rows = caseworker (manager),
// Columns = stage. Each cell = count of cases in that stage.
// =====================================================================
router.get('/case-stage-heatmap', auth, async (req, res) => {
  try {
    const sql = `
      SELECT
        c.id                                                            AS caseworker_id,
        COALESCE(u.full_name, 'Unassigned')                             AS manager_name,
        b.status                                                        AS stage,
        COUNT(b.id)                                                     AS count
      FROM beneficiaries b
      LEFT JOIN caseworkers c ON c.id = b.assigned_caseworker_id
      LEFT JOIN users u       ON u.id = c.user_id
      GROUP BY c.id, u.full_name, b.status
    `;
    const { rows } = await query(sql);

    // Discover stages present (fallback to defaults if empty).
    const stageSet = new Set();
    for (const r of rows) if (r.stage) stageSet.add(r.stage);
    const stages = stageSet.size ? Array.from(stageSet).sort() : [...DEFAULT_STAGES];

    // Build manager rows.
    const byManager = new Map();
    for (const r of rows) {
      const key = r.caseworker_id || 0;
      if (!byManager.has(key)) {
        byManager.set(key, {
          caseworker_id: r.caseworker_id,
          manager_name: r.manager_name,
          cells: Object.fromEntries(stages.map(s => [s, 0])),
          total: 0,
        });
      }
      const row = byManager.get(key);
      const c = parseInt(r.count || 0, 10);
      if (r.stage && row.cells[r.stage] !== undefined) row.cells[r.stage] = c;
      row.total += c;
    }
    const matrix = Array.from(byManager.values()).sort(
      (a, b) => b.total - a.total || a.manager_name.localeCompare(b.manager_name)
    );

    let max = 0;
    for (const row of matrix) for (const s of stages) if (row.cells[s] > max) max = row.cells[s];

    res.json({
      ok: true,
      generated_at: new Date().toISOString(),
      stages,
      max_cell: max,
      managers: matrix,
    });
  } catch (err) {
    console.error('case-stage-heatmap error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// NON-VIZ 1: POST /api/custom-views/case-file-pdf
// Generates a (printable) Case File Summary "PDF" payload + plain-text
// version suitable for client download / print. We avoid binary PDF
// libs to keep deps minimal; the frontend handles print-to-PDF.
// Body: { beneficiary_id }  (optional - omitted = first active)
// =====================================================================
router.post('/case-file-pdf', auth, async (req, res) => {
  try {
    const { beneficiary_id } = req.body || {};
    let benRow;
    if (beneficiary_id) {
      const r = await query(
        `SELECT b.*, u.full_name AS caseworker_name
           FROM beneficiaries b
           LEFT JOIN caseworkers c ON c.id = b.assigned_caseworker_id
           LEFT JOIN users u       ON u.id = c.user_id
          WHERE b.id = $1`,
        [beneficiary_id]
      );
      benRow = r.rows[0];
    } else {
      const r = await query(
        `SELECT b.*, u.full_name AS caseworker_name
           FROM beneficiaries b
           LEFT JOIN caseworkers c ON c.id = b.assigned_caseworker_id
           LEFT JOIN users u       ON u.id = c.user_id
          WHERE b.status = 'active'
          ORDER BY b.id ASC LIMIT 1`
      );
      benRow = r.rows[0];
    }
    if (!benRow) return res.status(404).json({ error: 'beneficiary not found' });

    const [notes, plans, tasks] = await Promise.all([
      query(`SELECT id, meeting_date, meeting_type, summary FROM case_notes
              WHERE beneficiary_id = $1 ORDER BY meeting_date DESC LIMIT 5`, [benRow.id]),
      query(`SELECT id, title, status, start_date, end_date FROM action_plans
              WHERE beneficiary_id = $1 ORDER BY created_at DESC LIMIT 5`, [benRow.id]),
      query(`SELECT id, title, priority, status, due_date FROM tasks
              WHERE beneficiary_id = $1 ORDER BY created_at DESC LIMIT 10`, [benRow.id]),
    ]);

    const lines = [];
    lines.push('========================================');
    lines.push('       DIGITAL CASE FILE SUMMARY        ');
    lines.push('========================================');
    lines.push(`Generated:    ${new Date().toISOString()}`);
    lines.push(`Beneficiary:  ${benRow.first_name} ${benRow.last_name}  (#${benRow.id})`);
    lines.push(`Status:       ${benRow.status}    Risk: ${benRow.risk_level}`);
    lines.push(`Program:      ${benRow.program || '-'}`);
    lines.push(`Caseworker:   ${benRow.caseworker_name || 'Unassigned'}`);
    lines.push(`Intake Date:  ${benRow.intake_date || '-'}`);
    lines.push('');
    lines.push('--- Recent Case Notes ---');
    if (!notes.rows.length) lines.push('  (none on file)');
    notes.rows.forEach((n, i) =>
      lines.push(`  ${i + 1}. [${(n.meeting_date || '').toString().slice(0, 10)}] ${n.meeting_type || ''} - ${n.summary || ''}`));
    lines.push('');
    lines.push('--- Action Plans ---');
    if (!plans.rows.length) lines.push('  (none on file)');
    plans.rows.forEach((p, i) =>
      lines.push(`  ${i + 1}. ${p.title} [${p.status}]  ${p.start_date || ''} -> ${p.end_date || ''}`));
    lines.push('');
    lines.push('--- Open Tasks ---');
    if (!tasks.rows.length) lines.push('  (none on file)');
    tasks.rows.forEach((t, i) =>
      lines.push(`  ${i + 1}. (${t.priority}) ${t.title} [${t.status}]  due ${t.due_date || '-'}`));
    lines.push('');
    lines.push('====== END OF CASE FILE SUMMARY ========');

    const text = lines.join('\n');
    res.json({
      ok: true,
      generated_at: new Date().toISOString(),
      beneficiary: {
        id: benRow.id,
        name: `${benRow.first_name} ${benRow.last_name}`,
        status: benRow.status,
        risk_level: benRow.risk_level,
        program: benRow.program,
        caseworker: benRow.caseworker_name,
        intake_date: benRow.intake_date,
      },
      counts: { notes: notes.rows.length, plans: plans.rows.length, tasks: tasks.rows.length },
      text,
      filename: `case_file_${benRow.id}_${(benRow.last_name || 'beneficiary').toLowerCase()}.txt`,
    });
  } catch (err) {
    console.error('case-file-pdf error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================================
// NON-VIZ 2: Workflow Rules Editor (CRUD over stage transitions).
//   GET  /api/custom-views/workflow-rules
//   POST /api/custom-views/workflow-rules                    (op: create|update|delete|reset)
// =====================================================================
router.get('/workflow-rules', auth, (req, res) => {
  res.json({
    ok: true,
    stages: DEFAULT_STAGES,
    rules: workflowRules,
    count: workflowRules.length,
  });
});

router.post('/workflow-rules', auth, (req, res) => {
  try {
    const { op = 'create', rule } = req.body || {};
    if (op === 'reset') {
      _ruleId = 1;
      workflowRules = defaultRules();
      return res.json({ ok: true, op, rules: workflowRules });
    }
    if (op === 'delete') {
      if (!rule || !rule.id) return res.status(400).json({ error: 'rule.id required' });
      const before = workflowRules.length;
      workflowRules = workflowRules.filter(r => r.id !== rule.id);
      return res.json({ ok: true, op, removed: before - workflowRules.length, rules: workflowRules });
    }
    if (op === 'update') {
      if (!rule || !rule.id) return res.status(400).json({ error: 'rule.id required' });
      const idx = workflowRules.findIndex(r => r.id === rule.id);
      if (idx === -1) return res.status(404).json({ error: 'rule not found' });
      workflowRules[idx] = { ...workflowRules[idx], ...rule, id: workflowRules[idx].id };
      return res.json({ ok: true, op, rule: workflowRules[idx], rules: workflowRules });
    }
    // default: create
    const fromStage = (rule && rule.from_stage) || 'active';
    const toStage   = (rule && rule.to_stage)   || 'closed';
    if (!DEFAULT_STAGES.includes(fromStage) || !DEFAULT_STAGES.includes(toStage)) {
      return res.status(400).json({ error: `from_stage/to_stage must be one of ${DEFAULT_STAGES.join(', ')}` });
    }
    const created = {
      id: _ruleId++,
      from_stage: fromStage,
      to_stage: toStage,
      condition: (rule && rule.condition) || 'Manual override',
      auto_assign: !!(rule && rule.auto_assign),
    };
    workflowRules.push(created);
    res.json({ ok: true, op: 'create', rule: created, rules: workflowRules });
  } catch (err) {
    console.error('workflow-rules error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
