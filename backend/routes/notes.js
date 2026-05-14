const router = require('express').Router();
const { query } = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { beneficiary_id } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    let countSql = 'SELECT COUNT(*) FROM case_notes cn';
    let sql = `
      SELECT cn.*,
        b.first_name || ' ' || b.last_name as beneficiary_name,
        u.full_name as caseworker_name
      FROM case_notes cn
      LEFT JOIN beneficiaries b ON cn.beneficiary_id = b.id
      LEFT JOIN caseworkers cw ON cn.caseworker_id = cw.id
      LEFT JOIN users u ON cw.user_id = u.id
    `;
    const params = [];
    const countParams = [];

    if (beneficiary_id) {
      sql += ' WHERE cn.beneficiary_id = $1';
      countSql += ' WHERE cn.beneficiary_id = $1';
      params.push(beneficiary_id);
      countParams.push(beneficiary_id);
    }

    sql += ` ORDER BY cn.meeting_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const [countResult, result] = await Promise.all([
      query(countSql, countParams),
      query(sql, params)
    ]);

    const total = parseInt(countResult.rows[0].count);
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
      SELECT cn.*,
        b.first_name || ' ' || b.last_name as beneficiary_name,
        u.full_name as caseworker_name
      FROM case_notes cn
      LEFT JOIN beneficiaries b ON cn.beneficiary_id = b.id
      LEFT JOIN caseworkers cw ON cn.caseworker_id = cw.id
      LEFT JOIN users u ON cw.user_id = u.id
      WHERE cn.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { beneficiary_id, caseworker_id, meeting_date, meeting_type, location, summary, detailed_notes, mood, follow_up_needed, follow_up_date } = req.body;
    const result = await query(`
      INSERT INTO case_notes (beneficiary_id, caseworker_id, meeting_date, meeting_type, location, summary, detailed_notes, mood, follow_up_needed, follow_up_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `, [beneficiary_id, caseworker_id, meeting_date, meeting_type, location, summary, detailed_notes, mood, follow_up_needed, follow_up_date]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { meeting_date, meeting_type, location, summary, detailed_notes, mood, follow_up_needed, follow_up_date } = req.body;
    const result = await query(`
      UPDATE case_notes SET meeting_date=$1, meeting_type=$2, location=$3, summary=$4, detailed_notes=$5, mood=$6, follow_up_needed=$7, follow_up_date=$8
      WHERE id=$9 RETURNING *
    `, [meeting_date, meeting_type, location, summary, detailed_notes, mood, follow_up_needed, follow_up_date, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await query('DELETE FROM case_notes WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
