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
  // If it's a FormData (file upload), let axios set content-type automatically
  const isFormData = profileData instanceof FormData;
  const res = await api.put('/players', profileData, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
  return res.data;
};

export const getPlayerMatchHistory = async (id, filter) => {
  const res = await api.get(`/players/${id}/history`, { params: { filter } });
  return res.data;
};
