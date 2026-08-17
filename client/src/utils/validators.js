export const getMinimumChallengeAmount = (defenderRank) => {
  if (defenderRank === null || defenderRank === undefined) return 500; // unranked default (or default minimum)
  if (defenderRank >= 1 && defenderRank <= 5) return 900;
  return 500;
};

export const validateChallengeAmount = (amount, defenderRank) => {
  const min = getMinimumChallengeAmount(defenderRank);
  return {
    isValid: amount >= min,
    min,
    message: amount >= min ? '' : `Minimum challenge amount for rank ${defenderRank} is Rs. ${min.toLocaleString()}`
  };
};
