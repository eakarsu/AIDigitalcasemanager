import axios from 'axios';
import { beneficiaries, caseworkers, notes, services, tasks } from './api';

jest.mock('axios', () => {
  const get = jest.fn();
  return { create: () => ({ get, post: jest.fn(), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } } }), __get: get };
});

const rows = Array.from({ length: 15 }, (_, index) => ({ id: index + 1 }));

beforeEach(() => axios.__get.mockReset());

test.each([
  ['beneficiaries', () => beneficiaries.list()],
  ['caseworkers', () => caseworkers.list()],
  ['case notes', () => notes.list()],
  ['service directory', () => services.list()],
])('%s accepts the paginated API shape and exposes 15 rows', async (_, list) => {
  axios.__get.mockResolvedValue({ data: { data: rows, pagination: { total: 15 } } });
  const response = await list();
  expect(response.data).toHaveLength(15);
  expect(response.pagination.total).toBe(15);
});

test('unpaginated list responses remain arrays', async () => {
  axios.__get.mockResolvedValue({ data: rows });
  expect((await tasks.list()).data).toHaveLength(15);
});

test('malformed list payload is reported instead of passed to a view', async () => {
  axios.__get.mockResolvedValue({ data: { data: { error: 'bad shape' } } });
  await expect(beneficiaries.list()).rejects.toThrow('List API returned no row array');
});
