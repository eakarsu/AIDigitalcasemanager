const router = require('express').Router();
const { query } = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { beneficiary_id } = req.query;
    let sql = `
      SELECT r.*,
        b.first_name || ' ' || b.last_name as beneficiary_name,
        u.full_name as caseworker_name
      FROM referrals r
      LEFT JOIN beneficiaries b ON r.beneficiary_id = b.id
      LEFT JOIN caseworkers cw ON r.caseworker_id = cw.id
      LEFT JOIN users u ON cw.user_id = u.id
    `;
    const params = [];
    if (beneficiary_id) { sql += ' WHERE r.beneficiary_id = $1'; params.push(beneficiary_id); }
    sql += ' ORDER BY r.created_at DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await query(`
      SELECT r.*, b.first_name || ' ' || b.last_name as beneficiary_name, u.full_name as caseworker_name
      FROM referrals r
      LEFT JOIN beneficiaries b ON r.beneficiary_id = b.id
      LEFT JOIN caseworkers cw ON r.caseworker_id = cw.id
      LEFT JOIN users u ON cw.user_id = u.id
      WHERE r.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { beneficiary_id, caseworker_id, referred_to, organization, referral_type, reason, status, contact_name, contact_phone, contact_email, follow_up_date } = req.body;
    const result = await query(`
      INSERT INTO referrals (beneficiary_id, caseworker_id, referred_to, organization, referral_type, reason, status, contact_name, contact_phone, contact_email, follow_up_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [beneficiary_id, caseworker_id, referred_to, organization, referral_type, reason, status || 'pending', contact_name, contact_phone, contact_email, follow_up_date]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { referred_to, organization, referral_type, reason, status, contact_name, contact_phone, contact_email, follow_up_date, outcome } = req.body;
    const result = await query(`
      UPDATE referrals SET referred_to=$1, organization=$2, referral_type=$3, reason=$4, status=$5,
        contact_name=$6, contact_phone=$7, contact_email=$8, follow_up_date=$9, outcome=$10
      WHERE id=$11 RETURNING *
    `, [referred_to, organization, referral_type, reason, status, contact_name, contact_phone, contact_email, follow_up_date, outcome, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await query('DELETE FROM referrals WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
