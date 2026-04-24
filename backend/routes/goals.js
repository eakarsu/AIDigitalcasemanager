const router = require('express').Router();
const { query } = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { beneficiary_id } = req.query;
    let sql = `
      SELECT g.*,
        b.first_name || ' ' || b.last_name as beneficiary_name,
        u.full_name as caseworker_name
      FROM goals g
      LEFT JOIN beneficiaries b ON g.beneficiary_id = b.id
      LEFT JOIN caseworkers cw ON g.caseworker_id = cw.id
      LEFT JOIN users u ON cw.user_id = u.id
    `;
    const params = [];
    if (beneficiary_id) { sql += ' WHERE g.beneficiary_id = $1'; params.push(beneficiary_id); }
    sql += ' ORDER BY g.created_at DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await query(`
      SELECT g.*, b.first_name || ' ' || b.last_name as beneficiary_name, u.full_name as caseworker_name
      FROM goals g
      LEFT JOIN beneficiaries b ON g.beneficiary_id = b.id
      LEFT JOIN caseworkers cw ON g.caseworker_id = cw.id
      LEFT JOIN users u ON cw.user_id = u.id
      WHERE g.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { beneficiary_id, caseworker_id, title, description, category, target_date, progress, status, milestones } = req.body;
    const result = await query(`
      INSERT INTO goals (beneficiary_id, caseworker_id, title, description, category, target_date, progress, status, milestones)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [beneficiary_id, caseworker_id, title, description, category, target_date, progress || 0, status || 'in_progress', JSON.stringify(milestones || [])]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, category, target_date, progress, status, milestones } = req.body;
    const result = await query(`
      UPDATE goals SET title=$1, description=$2, category=$3, target_date=$4, progress=$5, status=$6, milestones=$7, updated_at=NOW()
      WHERE id=$8 RETURNING *
    `, [title, description, category, target_date, progress, status, JSON.stringify(milestones || []), req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await query('DELETE FROM goals WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
