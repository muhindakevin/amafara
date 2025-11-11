const { Loan, Contribution, Transaction, User } = require('../models');
const mlScorer = require('./mlCreditScorer');

/**
 * Calculate credit score based on member's financial history
 * Uses ML model if available, otherwise falls back to rule-based
 * Max score: 1000
 */
const calculateCreditScore = async (memberId, requestedAmount = null) => {
  try {
    // Get member data
    const member = await User.findByPk(memberId);
    if (!member) {
      return 500; // Default middle score
    }

    // Get loan history
    const loans = await Loan.findAll({
      where: { memberId },
      order: [['createdAt', 'DESC']]
    });

    // Get contributions
    const contributions = await Contribution.findAll({
      where: { memberId, status: 'approved' },
      order: [['createdAt', 'DESC']],
      limit: 12
    });

    // Try ML-based scoring first
    try {
      const mlScore = mlScorer.getMLCreditScore(member, loans, contributions, requestedAmount);
      if (mlScore !== null) {
        return mlScore;
      }
    } catch (error) {
      console.log('ML scoring not available, using rule-based:', error.message);
    }

    // Fall back to rule-based scoring
    let score = 0;
    const maxScore = 1000;

    // 1. Contribution Consistency (40% = 400 points)
    if (contributions.length > 0) {
      const contributionScore = Math.min(400, contributions.length * 33.33);
      score += contributionScore;
    }

    // 2. Loan Payment History (30% = 300 points)
    let onTimePayments = 0;
    let totalPayments = 0;

    for (const loan of loans) {
      if (loan.status === 'completed') {
        totalPayments++;
        // Check if loan was completed without default
        if (loan.paidAmount >= loan.totalAmount) {
          onTimePayments++;
        }
      }
    }

    if (totalPayments > 0) {
      const paymentRatio = onTimePayments / totalPayments;
      score += Math.round(paymentRatio * 300);
    }

    // 3. Savings Amount (20% = 200 points)
    if (member.totalSavings) {
      const savingsScore = Math.min(200, (member.totalSavings / 500000) * 200);
      score += savingsScore;
    }

    // 4. Account Age (10% = 100 points)
    if (member.createdAt) {
      const accountAgeMonths = Math.floor((new Date() - new Date(member.createdAt)) / (1000 * 60 * 60 * 24 * 30));
      const ageScore = Math.min(100, accountAgeMonths * 5);
      score += ageScore;
    }

    // Ensure score is between 0 and 1000
    return Math.max(0, Math.min(maxScore, Math.round(score)));
  } catch (error) {
    console.error('Credit score calculation error:', error);
    return 500; // Default middle score
  }
};

/**
 * Get AI recommendation for loan with realistic calculations
 */
const getAIRecommendation = async (memberId, requestedAmount = null) => {
  const creditScore = await calculateCreditScore(memberId, requestedAmount);
  const member = await User.findByPk(memberId);

  if (!member) {
    return {
      recommendation: 'reject',
      confidence: 'Low',
      maxRecommendedAmount: 0,
      creditScore: 0,
      interestRate: 15.0,
      message: 'Member not found'
    };
  }

  const savings = parseFloat(member.totalSavings) || 0;
  let recommendation = 'review';
  let maxRecommendedAmount = 0;
  let confidence = 'Low';
  let message = '';

  // Realistic loan recommendation based on credit score and savings
  // Credit score determines the multiplier, but we also cap it reasonably
  if (creditScore >= 800) {
    recommendation = 'approve';
    confidence = 'High';
    maxRecommendedAmount = Math.min(savings * 3, savings + 500000); // Max 3x or savings + 500k
    message = 'Excellent credit score! You qualify for a higher loan amount.';
  } else if (creditScore >= 650) {
    recommendation = 'approve';
    confidence = 'Medium';
    maxRecommendedAmount = Math.min(savings * 2, savings + 300000); // Max 2x or savings + 300k
    message = 'Good credit score. You qualify for a loan.';
  } else if (creditScore >= 500) {
    recommendation = 'review';
    confidence = 'Medium';
    maxRecommendedAmount = Math.min(savings * 1.5, savings + 150000); // Max 1.5x or savings + 150k
    message = 'Moderate credit score. Loan requires review.';
  } else if (creditScore >= 300) {
    recommendation = 'review';
    confidence = 'Low';
    maxRecommendedAmount = Math.min(savings * 1.0, savings + 50000); // Max 1x or savings + 50k
    message = 'Low credit score. Limited loan eligibility. Consider improving your credit first.';
  } else {
    recommendation = 'reject';
    confidence = 'High';
    maxRecommendedAmount = 0;
    message = 'Very low credit score. Loan not recommended. Please build your credit history first.';
  }

  // Ensure minimum savings requirement
  if (savings < 10000 && creditScore < 500) {
    maxRecommendedAmount = 0;
    recommendation = 'reject';
    message = 'Insufficient savings and low credit score. Minimum 10,000 RWF savings required.';
  }

  // If requested amount is provided, validate it
  if (requestedAmount && requestedAmount > maxRecommendedAmount) {
    message = `Requested amount (${requestedAmount.toLocaleString()} RWF) exceeds recommended maximum (${maxRecommendedAmount.toLocaleString()} RWF).`;
  }

  // Calculate interest rate based on credit score (more realistic)
  let interestRate = 15.0; // Base rate for low scores
  if (creditScore >= 800) {
    interestRate = 3.5;
  } else if (creditScore >= 650) {
    interestRate = 5.0;
  } else if (creditScore >= 500) {
    interestRate = 7.5;
  } else if (creditScore >= 300) {
    interestRate = 10.0;
  } else {
    interestRate = 15.0;
  }

  // Calculate monthly payment if amount is provided
  let monthlyPayment = 0;
  if (requestedAmount) {
    const principal = parseFloat(requestedAmount);
    const months = 12; // Default 12 months
    const totalAmount = principal * (1 + (interestRate / 100));
    monthlyPayment = totalAmount / months;
  }

  return {
    recommendation,
    confidence,
    maxRecommendedAmount: Math.round(maxRecommendedAmount),
    creditScore,
    interestRate,
    message,
    monthlyPayment: Math.round(monthlyPayment),
    savings: savings
  };
};

module.exports = {
  calculateCreditScore,
  getAIRecommendation
};

