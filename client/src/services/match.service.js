import api from './api';

export const getMatches = async (params) => {
  const res = await api.get('/matches', { params });
  return res.data;
};

export const getMatchById = async (id) => {
  const res = await api.get(`/matches/${id}`);
  return res.data;
};

export const getMyMatchHistory = async (filter) => {
  const res = await api.get('/matches/my', { params: { filter } });
  return res.data;
};
