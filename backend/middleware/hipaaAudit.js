const { query } = require('../db');

/**
 * HIPAA Access Audit Log Middleware
 * Logs all GET requests to /api/beneficiaries/:id
 */
const hipaaAuditLog = async (req, res, next) => {
  try {
    const beneficiaryId = req.params.id || null;
    const userId = req.user ? req.user.id : null;
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';

    await query(
      `INSERT INTO access_logs (user_id, beneficiary_id, endpoint, action, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, beneficiaryId, req.path, `${req.method} ${req.originalUrl}`, ip]
    );
  } catch (err) {
    // Never block the request due to audit logging failure
    console.error('HIPAA audit log error:', err.message);
  }
  next();
};

module.exports = { hipaaAuditLog };
