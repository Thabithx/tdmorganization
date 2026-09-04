import api from './api';

export const getDashboard = async () => {
  const res = await api.get('/admin/dashboard');
  return res.data;
};

export const getAdminPlayers = async (params) => {
  const res = await api.get('/admin/players', { params });
  return res.data;
};

export const updateAdminPlayer = async (id, data) => {
  const res = await api.put(`/admin/players/${id}`, data);
  return res.data;
};

export const suspendPlayer = async (id, reason) => {
  const res = await api.post(`/admin/players/${id}/suspend`, { reason });
  return res.data;
};

export const restorePlayer = async (id) => {
  const res = await api.post(`/admin/players/${id}/restore`);
  return res.data;
};

export const getAdminRankings = async (params) => {
  const res = await api.get('/admin/rankings', { params });
  return res.data;
};

export const manualRankingUpdate = async (data) => {
  const res = await api.post('/admin/rankings/manual-update', data);
  return res.data;
};

export const getAdminChallenges = async (params) => {
  const res = await api.get('/admin/challenges', { params });
  return res.data;
};

export const updateChallengeStatus = async (id, status, reason) => {
  const res = await api.put(`/admin/challenges/${id}/status`, { status, reason });
  return res.data;
};

export const resolveAdminReview = async (id, resolution) => {
  const res = await api.post(`/admin/challenges/${id}/resolve-review`, { resolution });
  return res.data;
};

export const forfeitChallenge = async (id) => {
  const res = await api.post(`/admin/challenges/${id}/forfeit`);
  return res.data;
};

export const getAdminPayments = async (params) => {
  const res = await api.get('/admin/payments', { params });
  return res.data;
};

export const confirmPaymentManual = async (id) => {
  const res = await api.post(`/admin/payments/${id}/confirm`);
  return res.data;
};

export const getAdminMatches = async (params) => {
  const res = await api.get('/admin/matches', { params });
  return res.data;
};

export const getAdminMatchById = async (id) => {
  const res = await api.get(`/admin/matches/${id}`);
  return res.data;
};

export const addMatchEvidence = async (id, evidence) => {
  const res = await api.post(`/admin/matches/${id}/evidence`, evidence);
  return res.data;
};

export const updateMatchStatus = async (id, status) => {
  const res = await api.put(`/admin/matches/${id}/status`, { status });
  return res.data;
};

export const confirmMatchResult = async (id, result) => {
  const res = await api.post(`/admin/matches/${id}/result`, { result });
  return res.data;
};

export const getAuditLogs = async (params) => {
  const res = await api.get('/admin/audit-logs', { params });
  return res.data;
};

export const getRankingHistory = async (params) => {
  const res = await api.get('/admin/ranking-history', { params });
  return res.data;
};

export const globalSearch = async (q) => {
  const res = await api.get('/admin/search', { params: { q } });
  return res.data;
};

export const getAdminPlayerById = async (id) => {
  const res = await api.get(`/admin/players/${id}`);
  return res.data;
};

export const addPlayerNote = async (id, content) => {
  const res = await api.post(`/admin/players/${id}/notes`, { content });
  return res.data;
};

export const deletePlayerNote = async (id, noteId) => {
  const res = await api.delete(`/admin/players/${id}/notes/${noteId}`);
  return res.data;
};

export const getAdminChallengeById = async (id) => {
  const res = await api.get(`/admin/challenges/${id}`);
  return res.data;
};

export const correctMatchResult = async (id, result, reason) => {
  const res = await api.post(`/admin/matches/${id}/correct`, { result, reason });
  return res.data;
};
