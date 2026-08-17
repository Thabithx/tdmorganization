import api from './api';

export const createPayment = async (challengeId) => {
  const res = await api.post(`/payments/checkout/${challengeId}`);
  return res.data;
};

export const getMyPayments = async () => {
  const res = await api.get('/payments/my');
  return res.data;
};
