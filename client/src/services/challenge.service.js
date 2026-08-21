import api from './api';

export const createChallenge = async (defenderId, amount) => {
  const res = await api.post('/challenges', { defenderId, amount });
  return res.data;
};

export const getChallenges = async (params) => {
  const res = await api.get('/challenges', { params });
  return res.data;
};

export const getChallengeById = async (id) => {
  const res = await api.get(`/challenges/${id}`);
  return res.data;
};

export const acceptChallenge = async (id) => {
  const res = await api.post(`/challenges/${id}/accept`);
  return res.data;
};

export const rejectChallenge = async (id) => {
  const res = await api.post(`/challenges/${id}/reject`);
  return res.data;
};

export const cancelChallenge = async (id) => {
  const res = await api.post(`/challenges/${id}/cancel`);
  return res.data;
};
