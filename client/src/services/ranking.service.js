import api from './api';

export const getLeaderboard = async (platform) => {
  const res = await api.get(`/rankings/${platform}`);
  return res.data;
};
