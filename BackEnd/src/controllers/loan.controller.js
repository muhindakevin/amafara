const { Loan, User, Group, Transaction, Notification } = require('../models');
const { getAIRecommendation, calculateCreditScore } = require('../utils/creditScoreCalculator');
const { sendLoanApproval, sendLoanRejection, sendSMS } = require('../notifications/smsService');
const { sendLoanApprovalEmail, sendLoanRejectionEmail, sendLoanRequestEmail } = require('../notifications/emailService');
const { logAction } = require('../utils/auditLogger');
const { Op } = require('sequelize');

/**
 * Request a loan
 * POST /api/loans/request
 */
const requestLoan = async (req, res) => {
  try {
    const { amount, purpose, duration, guarantorId, guarantorName, guarantorPhone, guarantorNationalId, guarantorRelationship } = req.body;
    const memberId = req.user.id;

    if (!amount || !purpose || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Amount, purpose, and duration are required'
      });
    }

    // Validate guarantor information
    if (!guarantorId || !guarantorName || !guarantorPhone || !guarantorNationalId) {
      return res.status(400).json({
        success: false,
        message: 'Guarantor information is required. Please provide guarantor ID, name, phone, and national ID.'
      });
    }

    const member = await User.findByPk(memberId, { include: ['group'] });
    if (!member || !member.groupId) {
      return res.status(400).json({
        success: false,
        message: 'Member must belong to a group'
      });
    }

    // Validate that guarantor is a member of the same group
    const guarantor = await User.findByPk(guarantorId);
    if (!guarantor) {
      return res.status(400).json({
        success: false,
        message: 'Guarantor not found'
      });
    }

    if (guarantor.groupId !== member.groupId) {
      return res.status(400).json({
        success: false,
        message: 'Guarantor must be a member of the same group'
      });
    }

    if (guarantor.role !== 'Member') {
      return res.status(400).json({
        success: false,
        message: 'Guarantor must be a member of the group'
      });
    }

    if (guarantorId === memberId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot be your own guarantor'
      });
    }

    // Verify guarantor information matches the user record
    if (guarantor.name !== guarantorName || guarantor.phone !== guarantorPhone || guarantor.nationalId !== guarantorNationalId) {
      return res.status(400).json({
        success: false,
        message: 'Guarantor information does not match our records. Please verify the details.'
      });
    }

    // Check for active loans
    const activeLoan = await Loan.findOne({
      where: {
        memberId,
        status: { [Op.in]: ['approved', 'disbursed', 'active'] }
      }
    });

    if (activeLoan) {
      return res.status(400).json({
        success: false,
        message: 'You have an active loan. Please complete it before requesting a new one.'
      });
    }

    // Get AI recommendation
    const aiRec = await getAIRecommendation(memberId, parseFloat(amount));

    // Calculate loan details
    const principal = parseFloat(amount);
    const interestRate = aiRec.interestRate;
    const months = parseInt(duration);
    const totalAmount = principal * (1 + (interestRate / 100));
    const monthlyPayment = totalAmount / months;

    // Create loan request
    const loan = await Loan.create({
      memberId,
      groupId: member.groupId,
      amount: principal,
      purpose,
      interestRate,
      duration: months,
      monthlyPayment: Math.round(monthlyPayment),
      totalAmount: Math.round(totalAmount),
      remainingAmount: Math.round(totalAmount),
      status: 'pending',
      aiRecommendation: aiRec.recommendation,
      guarantorId,
      guarantorName,
      guarantorPhone,
      guarantorNationalId,
      guarantorRelationship: guarantorRelationship || null
    });

    logAction(memberId, 'LOAN_REQUESTED', 'Loan', loan.id, { amount, purpose, duration, guarantorId }, req);

    // Send notifications to Group Admin, Secretary, and Cashier asynchronously
    setImmediate(async () => {
      try {
        // Fetch Group Admin, Secretary, and Cashier
        const admins = await User.findAll({
          where: {
            groupId: member.groupId,
            role: { [Op.in]: ['Group Admin', 'Secretary', 'Cashier'] },
            status: 'active'
          },
          attributes: ['id', 'name', 'phone', 'email', 'role']
        });

        console.log(`[requestLoan] Found ${admins.length} admins to notify (Group Admin, Secretary, Cashier)`);

        const notificationMessage = `New loan request from ${member.name}: ${principal.toLocaleString()} RWF for ${purpose}. Guarantor: ${guarantorName} (${guarantorPhone}). Loan ID: ${loan.id}. Please review in your dashboard.`;

        // Create in-app notifications for each admin (Group Admin, Secretary, Cashier)
        const notificationPromises = admins.map(admin =>
          Notification.create({
            userId: admin.id,
            type: 'loan_request',
            channel: 'in_app',
            title: 'New Loan Request - Requires Review',
            content: notificationMessage,
            status: 'sent'
          })
        );
        await Promise.all(notificationPromises);
        console.log(`[requestLoan] Created in-app notifications for ${admins.length} admins (Group Admin, Secretary, Cashier)`);

        // Send SMS notifications to admins (fire-and-forget)
        for (const admin of admins) {
          if (admin.phone) {
            const smsMessage = `New loan request: ${member.name} requests ${principal.toLocaleString()} RWF. Guarantor: ${guarantorName}. Loan ID: ${loan.id}. Review in dashboard.`;
            sendSMS(admin.phone, smsMessage, admin.id, 'loan_request').catch(err => {
              console.error(`[requestLoan] Failed to send SMS to ${admin.role} ${admin.name}:`, err);
            });
          }
        }

        // Send Email notifications to admins (fire-and-forget)
        for (const admin of admins) {
          if (admin.email) {
            const emailSubject = 'New Loan Request - Requires Review';
            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #1e40af;">New Loan Request</h1>
                <p>Dear ${admin.name},</p>
                <p>A new loan request has been submitted and requires your review:</p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Member:</strong> ${member.name} (${member.phone})</p>
                  <p><strong>Loan Amount:</strong> RWF ${principal.toLocaleString()}</p>
                  <p><strong>Purpose:</strong> ${purpose}</p>
                  <p><strong>Duration:</strong> ${months} months</p>
                  <p><strong>Monthly Payment:</strong> RWF ${Math.round(monthlyPayment).toLocaleString()}</p>
                  <p><strong>Interest Rate:</strong> ${interestRate}%</p>
                  <p><strong>Guarantor:</strong> ${guarantorName} (${guarantorPhone})</p>
                  ${guarantorRelationship ? `<p><strong>Relationship:</strong> ${guarantorRelationship}</p>` : ''}
                  <p><strong>Loan ID:</strong> ${loan.id}</p>
                  <p><strong>AI Recommendation:</strong> ${aiRec.recommendation} (${aiRec.confidence} confidence)</p>
                  <p><strong>Credit Score:</strong> ${aiRec.creditScore}/1000</p>
                </div>
                <p>Please log in to your dashboard to review and approve or reject this loan request.</p>
                <p>Best regards,<br>UMURENGE WALLET System</p>
              </div>
            `;
            sendLoanRequestEmail(admin.email, emailSubject, emailHtml, admin.id).catch(err => {
              console.error(`[requestLoan] Failed to send email to ${admin.role} ${admin.name}:`, err);
            });
          }
        }

        // Notify all group members about the loan request
        try {
          const allGroupMembers = await User.findAll({
            where: {
              groupId: member.groupId,
              status: 'active',
              id: { [Op.ne]: memberId } // Exclude the requester
            },
            attributes: ['id', 'name', 'phone', 'email']
          });

          console.log(`[requestLoan] Notifying ${allGroupMembers.length} group members about the loan request`);

          const memberNotificationMessage = `${member.name} has requested a loan of ${principal.toLocaleString()} RWF for ${purpose}. The request is pending approval from Group Admin, Secretary, and Cashier.`;

          // Create in-app notifications for all group members
          const memberNotificationPromises = allGroupMembers.map(groupMember =>
            Notification.create({
              userId: groupMember.id,
              type: 'announcement',
              channel: 'in_app',
              title: 'New Loan Request in Your Group',
              content: memberNotificationMessage,
              status: 'sent'
            })
          );
          await Promise.all(memberNotificationPromises);
          console.log(`[requestLoan] Created in-app notifications for ${allGroupMembers.length} group members`);

          // Send SMS to group members (fire-and-forget, optional)
          for (const groupMember of allGroupMembers) {
            if (groupMember.phone) {
              const smsMessage = `Group Update: ${member.name} requested ${principal.toLocaleString()} RWF loan. Awaiting approval.`;
              sendSMS(groupMember.phone, smsMessage, groupMember.id, 'announcement').catch(err => {
                console.warn(`[requestLoan] Failed to send SMS to group member ${groupMember.name}:`, err.message);
              });
            }
          }
        } catch (memberNotifError) {
          console.error('[requestLoan] Error notifying group members:', memberNotifError);
          // Don't fail the loan request if member notifications fail
        }

      } catch (notifError) {
        console.error('[requestLoan] Error sending notifications:', notifError);
        // Don't fail the loan request if notifications fail
      }
    });

    res.status(201).json({
      success: true,
      message: 'Loan request submitted successfully. Group Admin, Secretary, and Cashier have been notified. All group members have been informed.',
      data: {
        loan,
        aiRecommendation: aiRec
      }
    });
  } catch (error) {
    console.error('Request loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit loan request',
      error: error.message
    });
  }
};

/**
 * Get all loans for a member
 * GET /api/loans/member
 */
const getMemberLoans = async (req, res) => {
  try {
    const memberId = req.user.id;

    const loans = await Loan.findAll({
      where: { memberId },
      order: [['createdAt', 'DESC']],
      include: [
        { association: 'group', attributes: ['id', 'name', 'code'] },
        { association: 'guarantor', attributes: ['id', 'name', 'phone', 'nationalId'] }
      ]
    });

    res.json({
      success: true,
      data: loans
    });
  } catch (error) {
    console.error('Get member loans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loans',
      error: error.message
    });
  }
};

/**
 * Get all loan requests (Group Admin)
 * GET /api/loans/requests
 */
const getLoanRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const user = req.user;

    let whereClause = {};
    
    if (user.role === 'Group Admin' && user.groupId) {
      whereClause.groupId = user.groupId;
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const loans = await Loan.findAll({
      where: whereClause,
      include: [
        { association: 'member', attributes: ['id', 'name', 'phone', 'totalSavings', 'creditScore'] },
        { association: 'group', attributes: ['id', 'name', 'code'] },
        { association: 'guarantor', attributes: ['id', 'name', 'phone', 'nationalId'] }
      ],
      order: [['requestDate', 'DESC']]
    });

    res.json({
      success: true,
      data: loans
    });
  } catch (error) {
    console.error('Get loan requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loan requests',
      error: error.message
    });
  }
};

/**
 * Approve loan request
 * PUT /api/loans/:id/approve
 */
const approveLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { disbursementDate } = req.body;
    const approverId = req.user.id;

    const loan = await Loan.findByPk(id, {
      include: [{ association: 'member' }, { association: 'group' }]
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    if (loan.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Loan is not pending approval'
      });
    }

    // Update loan status
    loan.status = 'approved';
    loan.approvedBy = approverId;
    loan.approvalDate = new Date();
    if (disbursementDate) {
      loan.disbursementDate = new Date(disbursementDate);
      loan.status = 'disbursed';
    } else {
      loan.nextPaymentDate = new Date();
      loan.nextPaymentDate.setMonth(loan.nextPaymentDate.getMonth() + 1);
    }
    await loan.save();

    // Create transaction record
    await Transaction.create({
      userId: loan.memberId,
      type: 'loan_disbursement',
      amount: loan.amount,
      balance: loan.member.totalSavings,
      status: 'completed',
      referenceId: loan.id.toString(),
      referenceType: 'Loan',
      description: `Loan disbursement: ${loan.purpose}`
    });

    // Send notifications to loan requester
    try {
      // Create in-app notification for the requester
      await Notification.create({
        userId: loan.memberId,
        type: 'loan_approval',
        channel: 'in_app',
        title: 'Loan Approved!',
        content: `Congratulations! Your loan request of ${loan.amount.toLocaleString()} RWF has been approved. Monthly payment: ${loan.monthlyPayment.toLocaleString()} RWF. Loan ID: ${loan.id}.`,
        status: 'sent'
      });
      console.log(`[approveLoan] Created in-app notification for loan requester (member ${loan.memberId})`);

      // Send SMS notification
      if (loan.member.phone) {
        await sendLoanApproval(loan.member.phone, loan.member.name, loan.amount);
      }

      // Send Email notification
      if (loan.member.email) {
        await sendLoanApprovalEmail(
          loan.member.email,
          loan.member.name,
          loan.amount,
          loan.monthlyPayment,
          loan.duration
        );
      }
    } catch (notifError) {
      console.error('[approveLoan] Notification error:', notifError);
    }

    logAction(approverId, 'LOAN_APPROVED', 'Loan', loan.id, { memberId: loan.memberId, amount: loan.amount }, req);

    res.json({
      success: true,
      message: 'Loan approved successfully',
      data: loan
    });
  } catch (error) {
    console.error('Approve loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve loan',
      error: error.message
    });
  }
};

/**
 * Reject loan request
 * PUT /api/loans/:id/reject
 */
const rejectLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const approverId = req.user.id;

    const loan = await Loan.findByPk(id, {
      include: [{ association: 'member' }]
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    if (loan.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Loan is not pending approval'
      });
    }

    loan.status = 'rejected';
    loan.approvedBy = approverId;
    loan.approvalDate = new Date();
    loan.rejectionReason = reason || 'Not specified';
    await loan.save();

    // Send notifications to loan requester
    try {
      // Create in-app notification for the requester
      await Notification.create({
        userId: loan.memberId,
        type: 'loan_rejection',
        channel: 'in_app',
        title: 'Loan Request Rejected',
        content: `Your loan request of ${loan.amount.toLocaleString()} RWF has been rejected. Reason: ${loan.rejectionReason || 'Not specified'}. Loan ID: ${loan.id}.`,
        status: 'sent'
      });
      console.log(`[rejectLoan] Created in-app notification for loan requester (member ${loan.memberId})`);

      // Send SMS notification
      if (loan.member.phone) {
        await sendLoanRejection(loan.member.phone, loan.member.name, loan.rejectionReason);
      }

      // Send Email notification
      if (loan.member.email) {
        await sendLoanRejectionEmail(loan.member.email, loan.member.name, loan.rejectionReason);
      }
    } catch (notifError) {
      console.error('[rejectLoan] Notification error:', notifError);
    }

    logAction(approverId, 'LOAN_REJECTED', 'Loan', loan.id, { memberId: loan.memberId, reason }, req);

    res.json({
      success: true,
      message: 'Loan rejected',
      data: loan
    });
  } catch (error) {
    console.error('Reject loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject loan',
      error: error.message
    });
  }
};

/**
 * Get single loan details
 * GET /api/loans/:id
 */
const getLoanById = async (req, res) => {
  try {
    const { id } = req.params;

    const loan = await Loan.findByPk(id, {
      include: [
        { association: 'member', attributes: ['id', 'name', 'phone', 'totalSavings', 'creditScore'] },
        { association: 'group', attributes: ['id', 'name', 'code'] },
        { association: 'guarantor', attributes: ['id', 'name', 'phone', 'nationalId'] }
      ]
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    res.json({
      success: true,
      data: loan
    });
  } catch (error) {
    console.error('Get loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loan',
      error: error.message
    });
  }
};

/**
 * Make loan payment
 * POST /api/loans/:id/pay
 */
const makeLoanPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod } = req.body;
    const memberId = req.user.id;

    const loan = await Loan.findByPk(id, {
      include: [{ association: 'member' }]
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    if (loan.memberId !== memberId) {
      return res.status(403).json({
        success: false,
        message: 'You can only pay your own loans'
      });
    }

    if (loan.status !== 'active' && loan.status !== 'disbursed') {
      return res.status(400).json({
        success: false,
        message: 'Loan is not active'
      });
    }

    const paymentAmount = parseFloat(amount);
    if (paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    // Update loan
    loan.paidAmount = parseFloat(loan.paidAmount) + paymentAmount;
    loan.remainingAmount = Math.max(0, parseFloat(loan.remainingAmount) - paymentAmount);

    if (loan.remainingAmount <= 0) {
      loan.status = 'completed';
    } else {
      // Update next payment date
      loan.nextPaymentDate = new Date();
      loan.nextPaymentDate.setMonth(loan.nextPaymentDate.getMonth() + 1);
    }

    await loan.save();

    // Create transaction
    await Transaction.create({
      userId: memberId,
      type: 'loan_payment',
      amount: paymentAmount,
      balance: loan.member.totalSavings,
      status: 'completed',
      referenceId: loan.id.toString(),
      referenceType: 'Loan',
      paymentMethod: paymentMethod || 'cash',
      description: `Loan payment: ${loan.purpose}`
    });

    logAction(memberId, 'LOAN_PAYMENT', 'Loan', loan.id, { amount: paymentAmount }, req);

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: loan
    });
  } catch (error) {
    console.error('Loan payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message
    });
  }
};

module.exports = {
  requestLoan,
  getMemberLoans,
  getLoanRequests,
  approveLoan,
  rejectLoan,
  getLoanById,
  makeLoanPayment
};

