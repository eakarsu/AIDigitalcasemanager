const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    summary: { renewals_due: 22, consent_expiring: 9, benefits_at_risk: 6, outreach_sent: 13 },
    cases: [
      { beneficiary: 'B-1048', benefit: 'housing voucher', days_left: 6, consent: 'expires soon', action: 'caseworker call' },
      { beneficiary: 'B-1099', benefit: 'food assistance', days_left: 13, consent: 'valid', action: 'send renewal packet' },
      { beneficiary: 'B-1120', benefit: 'transport support', days_left: 3, consent: 'missing signature', action: 'urgent field visit' },
    ],
  });
});

router.post('/outreach', (req, res) => {
  const { beneficiary = 'beneficiary', daysLeft = 0 } = req.body || {};
  res.json({ beneficiary, channel: daysLeft <= 5 ? 'phone plus SMS' : 'mail plus portal', status: 'outreach queued' });
});

module.exports = router;
