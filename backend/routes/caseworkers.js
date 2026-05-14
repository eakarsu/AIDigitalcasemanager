const router = require('express').Router();
const { query } = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await query('SELECT COUNT(*) FROM caseworkers');
    const total = parseInt(countResult.rows[0].count);

    const result = await query(`
      SELECT cw.*, u.full_name, u.email
      FROM caseworkers cw
      JOIN users u ON cw.user_id = u.id
      ORDER BY u.full_name
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await query(`
      SELECT cw.*, u.full_name, u.email
      FROM caseworkers cw
      JOIN users u ON cw.user_id = u.id
      WHERE cw.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { user_id, employee_id, department, specialization, phone, max_caseload, status, hire_date } = req.body;
    const result = await query(`
      INSERT INTO caseworkers (user_id, employee_id, department, specialization, phone, max_caseload, status, hire_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [user_id, employee_id, department, specialization, phone, max_caseload || 25, status || 'active', hire_date]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { department, specialization, phone, max_caseload, active_cases, status } = req.body;
    const result = await query(`
      UPDATE caseworkers SET department=$1, specialization=$2, phone=$3, max_caseload=$4, active_cases=$5, status=$6
      WHERE id=$7 RETURNING *
    `, [department, specialization, phone, max_caseload, active_cases, status, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await query('DELETE FROM caseworkers WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
