const router = require('express').Router();
const { query } = require('../db');
const auth = require('../middleware/auth');
const { hipaaAuditLog } = require('../middleware/hipaaAudit');

router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await query('SELECT COUNT(*) FROM beneficiaries');
    const total = parseInt(countResult.rows[0].count);

    const result = await query(`
      SELECT b.*,
        u.full_name as caseworker_name,
        cw.department
      FROM beneficiaries b
      LEFT JOIN caseworkers cw ON b.assigned_caseworker_id = cw.id
      LEFT JOIN users u ON cw.user_id = u.id
      ORDER BY b.created_at DESC
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

router.get('/:id', auth, hipaaAuditLog, async (req, res) => {
  try {
    const result = await query(`
      SELECT b.*,
        u.full_name as caseworker_name,
        cw.department, cw.phone as caseworker_phone
      FROM beneficiaries b
      LEFT JOIN caseworkers cw ON b.assigned_caseworker_id = cw.id
      LEFT JOIN users u ON cw.user_id = u.id
      WHERE b.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { first_name, last_name, email, phone, date_of_birth, address, city, state, zip_code,
            emergency_contact, emergency_phone, status, risk_level, assigned_caseworker_id, program, notes } = req.body;

    // Input validation
    const errors = [];
    if (!first_name || !first_name.trim()) errors.push('first_name is required');
    if (!last_name || !last_name.trim()) errors.push('last_name is required');
    if (!status && status !== undefined) errors.push('status must be a non-empty string if provided');
    const validStatuses = ['active', 'inactive', 'closed', 'pending'];
    if (status && !validStatuses.includes(status)) errors.push(`status must be one of: ${validStatuses.join(', ')}`);
    if (errors.length > 0) return res.status(400).json({ error: 'Validation failed', details: errors });
    const result = await query(`
      INSERT INTO beneficiaries (first_name, last_name, email, phone, date_of_birth, address, city, state, zip_code,
        emergency_contact, emergency_phone, status, risk_level, assigned_caseworker_id, program, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *
    `, [first_name, last_name, email, phone, date_of_birth, address, city, state, zip_code,
        emergency_contact, emergency_phone, status || 'active', risk_level || 'low', assigned_caseworker_id, program, notes]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { first_name, last_name, email, phone, date_of_birth, address, city, state, zip_code,
            emergency_contact, emergency_phone, status, risk_level, assigned_caseworker_id, program, notes } = req.body;
    const result = await query(`
      UPDATE beneficiaries SET first_name=$1, last_name=$2, email=$3, phone=$4, date_of_birth=$5,
        address=$6, city=$7, state=$8, zip_code=$9, emergency_contact=$10, emergency_phone=$11,
        status=$12, risk_level=$13, assigned_caseworker_id=$14, program=$15, notes=$16, updated_at=NOW()
      WHERE id=$17 RETURNING *
    `, [first_name, last_name, email, phone, date_of_birth, address, city, state, zip_code,
        emergency_contact, emergency_phone, status, risk_level, assigned_caseworker_id, program, notes, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await query('DELETE FROM beneficiaries WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
