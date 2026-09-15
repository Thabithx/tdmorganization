import api from './api';

export const getLeaderboard = async (platform, region = 'SRI_LANKA') => {
  const res = await api.get(`/rankings/${platform}?region=${region}`);
  return res.data;
};
