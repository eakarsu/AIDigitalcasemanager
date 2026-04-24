const router = require('express').Router();
const { query } = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { beneficiary_id } = req.query;
    let sql = `
      SELECT d.*,
        b.first_name || ' ' || b.last_name as beneficiary_name,
        u.full_name as uploaded_by_name
      FROM documents d
      LEFT JOIN beneficiaries b ON d.beneficiary_id = b.id
      LEFT JOIN users u ON d.uploaded_by = u.id
    `;
    const params = [];
    if (beneficiary_id) { sql += ' WHERE d.beneficiary_id = $1'; params.push(beneficiary_id); }
    sql += ' ORDER BY d.created_at DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await query(`
      SELECT d.*, b.first_name || ' ' || b.last_name as beneficiary_name, u.full_name as uploaded_by_name
      FROM documents d
      LEFT JOIN beneficiaries b ON d.beneficiary_id = b.id
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { beneficiary_id, title, description, document_type, file_name, file_size, file_url } = req.body;
    const result = await query(`
      INSERT INTO documents (beneficiary_id, uploaded_by, title, description, document_type, file_name, file_size, file_url)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [beneficiary_id, req.user.id, title, description, document_type, file_name, file_size, file_url]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, document_type, status } = req.body;
    const result = await query(`
      UPDATE documents SET title=$1, description=$2, document_type=$3, status=$4
      WHERE id=$5 RETURNING *
    `, [title, description, document_type, status, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await query('DELETE FROM documents WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
