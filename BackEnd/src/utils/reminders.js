const { User, Group, Contribution, Loan, Notification } = require('../models');
const { Op } = require('sequelize');

async function sendDepositReminders() {
  try {
    // Get all active groups
    const groups = await Group.findAll({ where: { status: 'active' } });

    for (const group of groups) {
      const members = await User.findAll({ where: { groupId: group.id, role: 'Member' } });

      for (const member of members) {
        // Get last approved contribution
        const lastContribution = await Contribution.findOne({
          where: { memberId: member.id, groupId: group.id, status: 'approved' },
          order: [['createdAt', 'DESC']]
        });

        const now = new Date();
        let needsReminder = false;
        let message = '';

        if (group.contributionFrequency === 'monthly') {
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();

          if (lastContribution) {
            const lastDate = new Date(lastContribution.createdAt);
            const lastMonth = lastDate.getMonth();
            const lastYear = lastDate.getFullYear();

            if (lastMonth !== currentMonth || lastYear !== currentYear) {
              needsReminder = true;
              message = `Time to make your ${group.contributionAmount} RWF monthly contribution for ${group.name}`;
            }
          } else {
            // No contributions yet
            needsReminder = true;
            message = `Make your first ${group.contributionAmount} RWF contribution for ${group.name}`;
          }
        } else if (group.contributionFrequency === 'weekly') {
          // Simple weekly check
          const daysSinceLast = lastContribution ? (now - new Date(lastContribution.createdAt)) / (1000 * 60 * 60 * 24) : 999;
          if (daysSinceLast > 7) {
            needsReminder = true;
            message = `Time to make your ${group.contributionAmount} RWF weekly contribution for ${group.name}`;
          }
        }

        if (needsReminder) {
          await Notification.create({
            userId: member.id,
            type: 'reminder',
            title: 'Deposit Reminder',
            message: message,
            isRead: false
          });
        }
      }
    }
    console.log('Deposit reminders sent');
  } catch (error) {
    console.error('Error sending deposit reminders:', error);
  }
}

async function sendRedeositReminders() {
  try {
    // Get disbursed loans with reDepositPeriod
    const loans = await Loan.findAll({
      where: { status: 'disbursed', reDepositPeriod: { [Op.ne]: null } },
      include: [{ model: User, as: 'member' }]
    });

    for (const loan of loans) {
      const disbursementDate = new Date(loan.disbursementDate);
      const period = loan.reDepositPeriod;
      const monthlyAmount = loan.monthlyPayment; // Assuming this is the re-deposit amount

      for (let i = 1; i <= period; i++) {
        const dueDate = new Date(disbursementDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        const now = new Date();
        const daysDiff = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

        if (daysDiff <= 3 && daysDiff > 0) {
          // Reminder 3 days before
          await Notification.create({
            userId: loan.memberId,
            type: 'reminder',
            title: 'Re-Deposit Reminder',
            message: `Your re-deposit payment of ${monthlyAmount} RWF is due in ${daysDiff} day(s) on ${dueDate.toDateString()}`,
            isRead: false
          });
        } else if (daysDiff === 0) {
          // Due today
          await Notification.create({
            userId: loan.memberId,
            type: 'reminder',
            title: 'Re-Deposit Due Today',
            message: `Your re-deposit payment of ${monthlyAmount} RWF is due today`,
            isRead: false
          });
        } else if (daysDiff < 0 && daysDiff >= -7) {
          // Overdue within a week
          await Notification.create({
            userId: loan.memberId,
            type: 'reminder',
            title: 'Overdue Re-Deposit',
            message: `Your re-deposit payment of ${monthlyAmount} RWF was due ${Math.abs(daysDiff)} day(s) ago. Please pay promptly.`,
            isRead: false
          });
        }
      }
    }
    console.log('Re-deposit reminders sent');
  } catch (error) {
    console.error('Error sending re-deposit reminders:', error);
  }
}

module.exports = { sendDepositReminders, sendRedeositReminders };
