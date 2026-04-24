const router = require('express').Router();
const { query } = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { beneficiary_id } = req.query;
    let sql = `
      SELECT ap.*,
        b.first_name || ' ' || b.last_name as beneficiary_name,
        u.full_name as caseworker_name
      FROM action_plans ap
      LEFT JOIN beneficiaries b ON ap.beneficiary_id = b.id
      LEFT JOIN caseworkers cw ON ap.caseworker_id = cw.id
      LEFT JOIN users u ON cw.user_id = u.id
    `;
    const params = [];
    if (beneficiary_id) {
      sql += ' WHERE ap.beneficiary_id = $1';
      params.push(beneficiary_id);
    }
    sql += ' ORDER BY ap.created_at DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await query(`
      SELECT ap.*,
        b.first_name || ' ' || b.last_name as beneficiary_name,
        u.full_name as caseworker_name
      FROM action_plans ap
      LEFT JOIN beneficiaries b ON ap.beneficiary_id = b.id
      LEFT JOIN caseworkers cw ON ap.caseworker_id = cw.id
      LEFT JOIN users u ON cw.user_id = u.id
      WHERE ap.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { beneficiary_id, caseworker_id, case_note_id, title, plan_content, ai_generated, status, start_date, end_date } = req.body;
    const result = await query(`
      INSERT INTO action_plans (beneficiary_id, caseworker_id, case_note_id, title, plan_content, ai_generated, status, start_date, end_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [beneficiary_id, caseworker_id, case_note_id, title, plan_content, ai_generated || false, status || 'draft', start_date, end_date]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, plan_content, status, start_date, end_date } = req.body;
    const result = await query(`
      UPDATE action_plans SET title=$1, plan_content=$2, status=$3, start_date=$4, end_date=$5, updated_at=NOW()
      WHERE id=$6 RETURNING *
    `, [title, plan_content, status, start_date, end_date, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/approve', auth, async (req, res) => {
  try {
    const result = await query(`
      UPDATE action_plans SET status='approved', approved_at=NOW(), approved_by=$1, updated_at=NOW()
      WHERE id=$2 RETURNING *
    `, [req.user.id, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await query('DELETE FROM action_plans WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
