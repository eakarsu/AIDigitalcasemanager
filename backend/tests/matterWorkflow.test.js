const test = require('node:test');
const assert = require('node:assert/strict');
const { validateIntake, validateEvidence, assertTransition } = require('../domain/matterWorkflow');

test('sensitive matter intake is consent bound and idempotent', () => {
  assert.throws(() => validateIntake({ externalReference: 'x', matterType: 'benefits', idempotencyKey: 'k', containsSensitiveIdentity: true }), /consent/);
});

test('evidence is versioned and decisions stay with professionals', () => {
  assert.equal(validateEvidence({ sha256: 'b'.repeat(64), source: 'portal', version: 1 }), true);
  assert.throws(() => assertTransition('professional_review', 'decided', {}), /professional/);
});
