const TRANSITIONS = Object.freeze({
  intake: ['active', 'declined'], active: ['professional_review', 'withdrawn'],
  professional_review: ['decided', 'active'], decided: ['appealed', 'closed'],
  appealed: ['professional_review', 'closed'], declined: [], withdrawn: ['reopened'],
  reopened: ['active'], closed: []
});

function validateIntake(input) {
  if (!input || !input.externalReference || !input.matterType || !input.idempotencyKey) throw new Error('externalReference, matterType, and idempotencyKey are required');
  if (!input.consentReceiptId && input.containsSensitiveIdentity) throw new Error('consent receipt required for sensitive identity data');
  return true;
}

function validateEvidence(document) {
  if (!document || !/^[a-f0-9]{64}$/i.test(document.sha256 || '')) throw new Error('document sha256 required');
  if (!document.source || !document.version) throw new Error('document source and version required');
  return true;
}

function assertTransition(from, to, context = {}) {
  if (!(TRANSITIONS[from] || []).includes(to)) throw new Error(`transition ${from} -> ${to} is not allowed`);
  if (to === 'decided' && (!context.professionalReviewerId || !context.citationCount)) throw new Error('authorized professional review with citations required');
  if (to === 'closed' && context.openDeadlineCount) throw new Error('open deadlines prevent closure');
  return true;
}

module.exports = { TRANSITIONS, validateIntake, validateEvidence, assertTransition };
