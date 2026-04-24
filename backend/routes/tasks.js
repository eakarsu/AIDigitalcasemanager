const router = require('express').Router();
const { query } = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { beneficiary_id, status } = req.query;
    let sql = `
      SELECT t.*,
        b.first_name || ' ' || b.last_name as beneficiary_name,
        u.full_name as caseworker_name
      FROM tasks t
      LEFT JOIN beneficiaries b ON t.beneficiary_id = b.id
      LEFT JOIN caseworkers cw ON t.caseworker_id = cw.id
      LEFT JOIN users u ON cw.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (beneficiary_id) { params.push(beneficiary_id); sql += ` AND t.beneficiary_id = $${params.length}`; }
    if (status) { params.push(status); sql += ` AND t.status = $${params.length}`; }
    sql += ' ORDER BY t.due_date ASC NULLS LAST';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await query(`
      SELECT t.*, b.first_name || ' ' || b.last_name as beneficiary_name, u.full_name as caseworker_name
      FROM tasks t
      LEFT JOIN beneficiaries b ON t.beneficiary_id = b.id
      LEFT JOIN caseworkers cw ON t.caseworker_id = cw.id
      LEFT JOIN users u ON cw.user_id = u.id
      WHERE t.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { beneficiary_id, caseworker_id, action_plan_id, title, description, priority, status, due_date } = req.body;
    const result = await query(`
      INSERT INTO tasks (beneficiary_id, caseworker_id, action_plan_id, title, description, priority, status, due_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [beneficiary_id, caseworker_id, action_plan_id, title, description, priority || 'medium', status || 'pending', due_date]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, priority, status, due_date } = req.body;
    const completed_at = status === 'completed' ? 'NOW()' : 'NULL';
    const result = await query(`
      UPDATE tasks SET title=$1, description=$2, priority=$3, status=$4, due_date=$5,
        completed_at=${status === 'completed' ? 'NOW()' : 'NULL'}
      WHERE id=$6 RETURNING *
    `, [title, description, priority, status, due_date, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
