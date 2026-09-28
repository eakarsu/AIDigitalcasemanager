import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const beneficiaries = {
  list: () => api.get('/beneficiaries'),
  get: (id) => api.get(`/beneficiaries/${id}`),
  create: (data) => api.post('/beneficiaries', data),
  update: (id, data) => api.put(`/beneficiaries/${id}`, data),
  delete: (id) => api.delete(`/beneficiaries/${id}`),
};

export const caseworkers = {
  list: () => api.get('/caseworkers'),
  get: (id) => api.get(`/caseworkers/${id}`),
  create: (data) => api.post('/caseworkers', data),
  update: (id, data) => api.put(`/caseworkers/${id}`, data),
  delete: (id) => api.delete(`/caseworkers/${id}`),
};

export const notes = {
  list: (beneficiaryId) => api.get('/notes', { params: { beneficiary_id: beneficiaryId } }),
  get: (id) => api.get(`/notes/${id}`),
  create: (data) => api.post('/notes', data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
};

export const actionPlans = {
  list: (beneficiaryId) => api.get('/action-plans', { params: { beneficiary_id: beneficiaryId } }),
  get: (id) => api.get(`/action-plans/${id}`),
  create: (data) => api.post('/action-plans', data),
  update: (id, data) => api.put(`/action-plans/${id}`, data),
  approve: (id) => api.put(`/action-plans/${id}/approve`),
  delete: (id) => api.delete(`/action-plans/${id}`),
};

export const tasks = {
  list: (params) => api.get('/tasks', { params }),
  get: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};

export const appointments = {
  list: (beneficiaryId) => api.get('/appointments', { params: { beneficiary_id: beneficiaryId } }),
  get: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  delete: (id) => api.delete(`/appointments/${id}`),
};

export const documents = {
  list: (beneficiaryId) => api.get('/documents', { params: { beneficiary_id: beneficiaryId } }),
  get: (id) => api.get(`/documents/${id}`),
  create: (data) => api.post('/documents', data),
  update: (id, data) => api.put(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
};

export const referrals = {
  list: (beneficiaryId) => api.get('/referrals', { params: { beneficiary_id: beneficiaryId } }),
  get: (id) => api.get(`/referrals/${id}`),
  create: (data) => api.post('/referrals', data),
  update: (id, data) => api.put(`/referrals/${id}`, data),
  delete: (id) => api.delete(`/referrals/${id}`),
};

export const goals = {
  list: (beneficiaryId) => api.get('/goals', { params: { beneficiary_id: beneficiaryId } }),
  get: (id) => api.get(`/goals/${id}`),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
};

export const assessments = {
  list: (beneficiaryId) => api.get('/assessments', { params: { beneficiary_id: beneficiaryId } }),
  get: (id) => api.get(`/assessments/${id}`),
  create: (data) => api.post('/assessments', data),
  update: (id, data) => api.put(`/assessments/${id}`, data),
  delete: (id) => api.delete(`/assessments/${id}`),
};

export const communications = {
  list: (beneficiaryId) => api.get('/communications', { params: { beneficiary_id: beneficiaryId } }),
  get: (id) => api.get(`/communications/${id}`),
  create: (data) => api.post('/communications', data),
  update: (id, data) => api.put(`/communications/${id}`, data),
  delete: (id) => api.delete(`/communications/${id}`),
};

export const notifications = {
  list: () => api.get('/notifications'),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export const ai = {
  generateActionPlan: (data) => api.post('/ai/generate-action-plan', data),
  generateSummary: (data) => api.post('/ai/generate-summary', data),
  generateRiskAssessment: (data) => api.post('/ai/generate-risk-assessment', data),
  summarizeNotes: (data) => api.post('/ai/summarize-notes', data),
  getSummaries: (beneficiaryId) => api.get(`/ai/summaries/${beneficiaryId}`),
  // New AI endpoints
  referralMatcher: (data) => api.post('/ai/referral-matcher', data),
  caseloadAnalyzer: () => api.post('/ai/caseload-analyzer', {}),
  progressReport: (data) => api.post('/ai/progress-report', data),
};

export const services = {
  list: () => api.get('/services-directory'),
  get: (id) => api.get(`/services-directory/${id}`),
  create: (data) => api.post('/services-directory', data),
  update: (id, data) => api.put(`/services-directory/${id}`, data),
  delete: (id) => api.delete(`/services-directory/${id}`),
};

export const dashboard = {
  stats: () => api.get('/dashboard/stats'),
  recentActivity: () => api.get('/dashboard/recent-activity'),
  riskDistribution: () => api.get('/dashboard/risk-distribution'),
  programDistribution: () => api.get('/dashboard/program-distribution'),
  taskSummary: () => api.get('/dashboard/task-summary'),
};

export default api;
