const router = require('express').Router();
const { query } = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    const { service_type, is_active } = req.query;

    const where = [];
    const params = [];
    if (service_type) { params.push(service_type); where.push(`service_type = $${params.length}`); }
    if (is_active !== undefined) { params.push(is_active === 'true'); where.push(`is_active = $${params.length}`); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countResult = await query(`SELECT COUNT(*) FROM services_directory ${whereSql}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limit); params.push(offset);
    const result = await query(
      `SELECT * FROM services_directory ${whereSql} ORDER BY name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({
      data: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await query('SELECT * FROM services_directory WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, service_type, description, eligibility, contact_info, location, is_active } = req.body;
    if (!name || !service_type) return res.status(400).json({ error: 'name and service_type are required' });
    const result = await query(
      `INSERT INTO services_directory (name, service_type, description, eligibility, contact_info, location, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, service_type, description, eligibility, contact_info, location, is_active !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, service_type, description, eligibility, contact_info, location, is_active } = req.body;
    const result = await query(
      `UPDATE services_directory SET name=$1, service_type=$2, description=$3, eligibility=$4, contact_info=$5,
        location=$6, is_active=$7, updated_at=NOW() WHERE id=$8 RETURNING *`,
      [name, service_type, description, eligibility, contact_info, location, is_active, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await query('DELETE FROM services_directory WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
