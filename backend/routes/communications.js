const router = require('express').Router();
const { query } = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { beneficiary_id } = req.query;
    let sql = `
      SELECT c.*,
        b.first_name || ' ' || b.last_name as beneficiary_name,
        u.full_name as caseworker_name
      FROM communications c
      LEFT JOIN beneficiaries b ON c.beneficiary_id = b.id
      LEFT JOIN caseworkers cw ON c.caseworker_id = cw.id
      LEFT JOIN users u ON cw.user_id = u.id
    `;
    const params = [];
    if (beneficiary_id) { sql += ' WHERE c.beneficiary_id = $1'; params.push(beneficiary_id); }
    sql += ' ORDER BY c.created_at DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await query(`
      SELECT c.*, b.first_name || ' ' || b.last_name as beneficiary_name, u.full_name as caseworker_name
      FROM communications c LEFT JOIN beneficiaries b ON c.beneficiary_id = b.id
      LEFT JOIN caseworkers cw ON c.caseworker_id = cw.id LEFT JOIN users u ON cw.user_id = u.id
      WHERE c.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { beneficiary_id, caseworker_id, comm_type, direction, subject, content, contact_method } = req.body;
    const result = await query(`
      INSERT INTO communications (beneficiary_id, caseworker_id, comm_type, direction, subject, content, contact_method)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [beneficiary_id, caseworker_id, comm_type, direction, subject, content, contact_method]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { comm_type, direction, subject, content, contact_method, status } = req.body;
    const result = await query(`
      UPDATE communications SET comm_type=$1, direction=$2, subject=$3, content=$4, contact_method=$5, status=$6
      WHERE id=$7 RETURNING *
    `, [comm_type, direction, subject, content, contact_method, status, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await query('DELETE FROM communications WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
