const router = require('express').Router();
const { query } = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { beneficiary_id } = req.query;
    let sql = `
      SELECT a.*,
        b.first_name || ' ' || b.last_name as beneficiary_name,
        u.full_name as caseworker_name
      FROM assessments a
      LEFT JOIN beneficiaries b ON a.beneficiary_id = b.id
      LEFT JOIN caseworkers cw ON a.caseworker_id = cw.id
      LEFT JOIN users u ON cw.user_id = u.id
    `;
    const params = [];
    if (beneficiary_id) { sql += ' WHERE a.beneficiary_id = $1'; params.push(beneficiary_id); }
    sql += ' ORDER BY a.created_at DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await query(`
      SELECT a.*, b.first_name || ' ' || b.last_name as beneficiary_name, u.full_name as caseworker_name
      FROM assessments a LEFT JOIN beneficiaries b ON a.beneficiary_id = b.id
      LEFT JOIN caseworkers cw ON a.caseworker_id = cw.id LEFT JOIN users u ON cw.user_id = u.id
      WHERE a.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { beneficiary_id, caseworker_id, assessment_type, title, score, max_score, risk_level, findings, recommendations, next_assessment_date } = req.body;
    const result = await query(`
      INSERT INTO assessments (beneficiary_id, caseworker_id, assessment_type, title, score, max_score, risk_level, findings, recommendations, next_assessment_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `, [beneficiary_id, caseworker_id, assessment_type, title, score, max_score || 100, risk_level, findings, recommendations, next_assessment_date]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { assessment_type, title, score, max_score, risk_level, findings, recommendations, next_assessment_date, status } = req.body;
    const result = await query(`
      UPDATE assessments SET assessment_type=$1, title=$2, score=$3, max_score=$4, risk_level=$5, findings=$6, recommendations=$7, next_assessment_date=$8, status=$9
      WHERE id=$10 RETURNING *
    `, [assessment_type, title, score, max_score, risk_level, findings, recommendations, next_assessment_date, status, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await query('DELETE FROM assessments WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
