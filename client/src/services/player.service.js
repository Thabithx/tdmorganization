import api from './api';

export const getPlayers = async (params) => {
  const res = await api.get('/players', { params });
  return res.data;
};

export const getPlayerById = async (id) => {
  const res = await api.get(`/players/${id}`);
  return res.data;
};

export const updateProfile = async (profileData) => {
  const res = await api.put('/players', profileData);
  return res.data;
};

export const getPlayerMatchHistory = async (id, filter) => {
  const res = await api.get(`/players/${id}/history`, { params: { filter } });
  return res.data;
};
