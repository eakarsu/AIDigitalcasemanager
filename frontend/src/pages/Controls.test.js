import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import Beneficiaries from './Beneficiaries';
import Caseworkers from './Caseworkers';
import CaseNotes from './CaseNotes';
import Login from './Login';
import AIReport from '../components/AIReport';
import { beneficiaries, caseworkers, notes, auth } from '../services/api';

jest.mock('../services/api', () => ({
  beneficiaries: { list: jest.fn() }, caseworkers: { list: jest.fn() },
  notes: { list: jest.fn() }, auth: { login: jest.fn(), demoLogin: jest.fn() },
}));

const makeRows = (kind) => Array.from({ length: 15 }, (_, index) => ({
  id: index + 1, first_name: `${kind} ${index + 1}`, last_name: 'Example',
  email: `record${index + 1}@example.org`, employee_id: `CW-${index + 1}`,
  summary: `Case note ${index + 1}`, meeting_date: '2026-01-01',
  caseworker_id: index + 1, beneficiary_id: index + 1,
}));
let container;
let root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  beneficiaries.list.mockResolvedValue({ data: makeRows('Beneficiary') });
  caseworkers.list.mockResolvedValue({ data: makeRows('Caseworker') });
  notes.list.mockResolvedValue({ data: makeRows('Note') });
});
afterEach(() => { act(() => root.unmount()); container.remove(); jest.clearAllMocks(); });

for (const [name, Component] of [['beneficiaries', Beneficiaries], ['caseworkers', Caseworkers], ['case notes', CaseNotes]]) {
  test(`${name} view renders 15 records without a runtime console error`, async () => {
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await act(async () => { root.render(<MemoryRouter><Component /></MemoryRouter>); });
      expect(container.querySelectorAll('tbody tr')).toHaveLength(15);
      expect(errors).not.toHaveBeenCalled();
    } finally { errors.mockRestore(); }
  });
}

test('demo button authenticates through configured server route', async () => {
  const onLogin = jest.fn();
  auth.demoLogin.mockResolvedValue({ data: { user: { id: 1 }, token: 'fixture-token' } });
  await act(async () => { root.render(<Login onLogin={onLogin} />); });
  await act(async () => { container.querySelector('button[aria-label="Log in with demo account"]').click(); });
  expect(auth.demoLogin).toHaveBeenCalledTimes(1);
  expect(auth.login).not.toHaveBeenCalled();
  expect(onLogin).toHaveBeenCalledTimes(1);
});

test('AI report renders nested JSON and preserves false, zero, and empty string', async () => {
  await act(async () => { root.render(<AIReport response={{ eligibility: { approved: false, score: 0, note: '' }, steps: [{ name: 'Review' }] }} />); });
  expect(container.textContent).toContain('Eligibility');
  expect(container.textContent).toContain('No');
  expect(container.textContent).toContain('0');
  expect(container.textContent).toContain('Note');
  expect(container.querySelector('table')).not.toBeNull();
});
