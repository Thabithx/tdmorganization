export const formatAmount = (num) => {
  if (num === null || num === undefined) return '';
  return `Rs. ${parseFloat(num).toLocaleString('en-US')}`;
};

export const getNetPrize = (amount) => {
  if (!amount) return 0;
  return Math.floor(parseFloat(amount) * 0.80);
};

export const getPlatformFee = (amount) => {
  if (!amount) return 0;
  return Math.floor(parseFloat(amount) * 0.20);
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatWinRate = (wins, losses) => {
  const total = wins + losses;
  if (total === 0) return '0.0%';
  return `${((wins / total) * 100).toFixed(1)}%`;
};

export const formatRank = (rank) => {
  if (rank === null || rank === undefined) return 'UNRANKED';
  return `#${rank.toString().padStart(2, '0')}`;
};
