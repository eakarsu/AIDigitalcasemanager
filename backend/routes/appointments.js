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
      FROM appointments a
      LEFT JOIN beneficiaries b ON a.beneficiary_id = b.id
      LEFT JOIN caseworkers cw ON a.caseworker_id = cw.id
      LEFT JOIN users u ON cw.user_id = u.id
    `;
    const params = [];
    if (beneficiary_id) { sql += ' WHERE a.beneficiary_id = $1'; params.push(beneficiary_id); }
    sql += ' ORDER BY a.appointment_date ASC';
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
      FROM appointments a
      LEFT JOIN beneficiaries b ON a.beneficiary_id = b.id
      LEFT JOIN caseworkers cw ON a.caseworker_id = cw.id
      LEFT JOIN users u ON cw.user_id = u.id
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
    const { beneficiary_id, caseworker_id, title, description, appointment_date, duration_minutes, location, appointment_type, status, notes } = req.body;
    const result = await query(`
      INSERT INTO appointments (beneficiary_id, caseworker_id, title, description, appointment_date, duration_minutes, location, appointment_type, status, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `, [beneficiary_id, caseworker_id, title, description, appointment_date, duration_minutes || 60, location, appointment_type, status || 'scheduled', notes]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, appointment_date, duration_minutes, location, appointment_type, status, notes } = req.body;
    const result = await query(`
      UPDATE appointments SET title=$1, description=$2, appointment_date=$3, duration_minutes=$4, location=$5, appointment_type=$6, status=$7, notes=$8
      WHERE id=$9 RETURNING *
    `, [title, description, appointment_date, duration_minutes, location, appointment_type, status, notes, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await query('DELETE FROM appointments WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
