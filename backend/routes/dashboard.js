const router = require('express').Router();
const { query } = require('../db');
const auth = require('../middleware/auth');

router.get('/stats', auth, async (req, res) => {
  try {
    const [beneficiaries, caseworkers, tasks, appointments, notes, actionPlans, highRisk, referrals] = await Promise.all([
      query('SELECT COUNT(*) as count FROM beneficiaries WHERE status = $1', ['active']),
      query('SELECT COUNT(*) as count FROM caseworkers WHERE status = $1', ['active']),
      query("SELECT COUNT(*) as count FROM tasks WHERE status != 'completed'"),
      query("SELECT COUNT(*) as count FROM appointments WHERE status = 'scheduled' AND appointment_date >= NOW()"),
      query('SELECT COUNT(*) as count FROM case_notes'),
      query('SELECT COUNT(*) as count FROM action_plans'),
      query("SELECT COUNT(*) as count FROM beneficiaries WHERE risk_level = 'high' AND status = 'active'"),
      query("SELECT COUNT(*) as count FROM referrals WHERE status = 'pending' OR status = 'active'"),
    ]);

    res.json({
      active_beneficiaries: parseInt(beneficiaries.rows[0].count),
      active_caseworkers: parseInt(caseworkers.rows[0].count),
      pending_tasks: parseInt(tasks.rows[0].count),
      upcoming_appointments: parseInt(appointments.rows[0].count),
      total_notes: parseInt(notes.rows[0].count),
      total_action_plans: parseInt(actionPlans.rows[0].count),
      high_risk_cases: parseInt(highRisk.rows[0].count),
      active_referrals: parseInt(referrals.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recent-activity', auth, async (req, res) => {
  try {
    const notes = await query(`
      SELECT cn.id, cn.summary as title, cn.meeting_date as date, 'case_note' as type,
        b.first_name || ' ' || b.last_name as beneficiary_name
      FROM case_notes cn
      JOIN beneficiaries b ON cn.beneficiary_id = b.id
      ORDER BY cn.created_at DESC LIMIT 10
    `);
    res.json(notes.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/risk-distribution', auth, async (req, res) => {
  try {
    const result = await query(`
      SELECT risk_level, COUNT(*) as count
      FROM beneficiaries WHERE status = 'active'
      GROUP BY risk_level
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/program-distribution', auth, async (req, res) => {
  try {
    const result = await query(`
      SELECT program, COUNT(*) as count
      FROM beneficiaries WHERE status = 'active'
      GROUP BY program ORDER BY count DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/task-summary', auth, async (req, res) => {
  try {
    const result = await query(`
      SELECT status, COUNT(*) as count FROM tasks GROUP BY status
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
