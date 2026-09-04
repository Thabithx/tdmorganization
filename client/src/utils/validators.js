export const getMinimumChallengeAmount = (defenderRank) => {
  const tiers = {
    1: 3000,
    2: 2500,
    3: 2000,
    4: 1500,
    5: 1000,
    6: 900,
    7: 800,
    8: 700,
    9: 600,
    10: 500
  };
  return tiers[defenderRank] || 500;
};

export const validateChallengeAmount = (amount, defenderRank) => {
  const min = getMinimumChallengeAmount(defenderRank);
  return {
    isValid: amount >= min,
    min,
    message: amount >= min ? '' : `Minimum challenge amount for rank ${defenderRank} is Rs. ${min.toLocaleString()}`
  };
};
