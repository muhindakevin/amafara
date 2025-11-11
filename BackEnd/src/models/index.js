const { sequelize, Sequelize } = require('../../config/db');

// Import all models
const User = require('./User')(sequelize, Sequelize);
const Group = require('./Group')(sequelize, Sequelize);
const Loan = require('./Loan')(sequelize, Sequelize);
const Contribution = require('./Contribution')(sequelize, Sequelize);
const Transaction = require('./Transaction')(sequelize, Sequelize);
const Fine = require('./Fine')(sequelize, Sequelize);
const Announcement = require('./Announcement')(sequelize, Sequelize);
const Meeting = require('./Meeting')(sequelize, Sequelize);
const Vote = require('./Vote')(sequelize, Sequelize);
const VoteOption = require('./VoteOption')(sequelize, Sequelize);
const VoteResponse = require('./VoteResponse')(sequelize, Sequelize);
const LearnGrowContent = require('./LearnGrowContent')(sequelize, Sequelize);
const ChatMessage = require('./ChatMessage')(sequelize, Sequelize);
const Notification = require('./Notification')(sequelize, Sequelize);
const Branch = require('./Branch')(sequelize, Sequelize);
const MemberApplication = require('./MemberApplication')(sequelize, Sequelize);
const AuditLog = require('./AuditLog')(sequelize, Sequelize);
const SupportTicket = require('./SupportTicket')(sequelize, Sequelize);
const Setting = require('./Setting')(sequelize, Sequelize);
const LoanProduct = require('./LoanProduct')(sequelize, Sequelize);

// Define relationships
User.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });
Group.hasMany(User, { foreignKey: 'groupId', as: 'members' });

User.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });
Branch.hasMany(User, { foreignKey: 'branchId', as: 'users' });

Group.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });
Branch.hasMany(Group, { foreignKey: 'branchId', as: 'groups' });

Loan.belongsTo(User, { foreignKey: 'memberId', as: 'member' });
User.hasMany(Loan, { foreignKey: 'memberId', as: 'loans' });

Loan.belongsTo(User, { foreignKey: 'guarantorId', as: 'guarantor' });
User.hasMany(Loan, { foreignKey: 'guarantorId', as: 'guaranteedLoans' });

Loan.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });
Group.hasMany(Loan, { foreignKey: 'groupId', as: 'loans' });

Contribution.belongsTo(User, { foreignKey: 'memberId', as: 'member' });
User.hasMany(Contribution, { foreignKey: 'memberId', as: 'contributions' });

Contribution.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });
Group.hasMany(Contribution, { foreignKey: 'groupId', as: 'contributions' });

Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });

Fine.belongsTo(User, { foreignKey: 'memberId', as: 'member' });
User.hasMany(Fine, { foreignKey: 'memberId', as: 'fines' });

Fine.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });
Group.hasMany(Fine, { foreignKey: 'groupId', as: 'fines' });

Announcement.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });
Group.hasMany(Announcement, { foreignKey: 'groupId', as: 'announcements' });

Announcement.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

Meeting.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });
Group.hasMany(Meeting, { foreignKey: 'groupId', as: 'meetings' });

Vote.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });
Group.hasMany(Vote, { foreignKey: 'groupId', as: 'votes' });

Vote.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

VoteOption.belongsTo(Vote, { foreignKey: 'voteId', as: 'vote' });
Vote.hasMany(VoteOption, { foreignKey: 'voteId', as: 'options' });

VoteResponse.belongsTo(Vote, { foreignKey: 'voteId', as: 'vote' });
Vote.hasMany(VoteResponse, { foreignKey: 'voteId', as: 'responses' });

VoteResponse.belongsTo(VoteOption, { foreignKey: 'optionId', as: 'option' });
VoteOption.hasMany(VoteResponse, { foreignKey: 'optionId', as: 'responses' });

VoteResponse.belongsTo(User, { foreignKey: 'memberId', as: 'member' });
User.hasMany(VoteResponse, { foreignKey: 'memberId', as: 'voteResponses' });

LearnGrowContent.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(LearnGrowContent, { foreignKey: 'createdBy', as: 'learnGrowContent' });

ChatMessage.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
ChatMessage.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });
User.hasMany(ChatMessage, { foreignKey: 'senderId', as: 'messages' });
User.hasMany(ChatMessage, { foreignKey: 'receiverId', as: 'receivedMessages' });

ChatMessage.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });
Group.hasMany(ChatMessage, { foreignKey: 'groupId', as: 'messages' });

Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });

MemberApplication.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });
Group.hasMany(MemberApplication, { foreignKey: 'groupId', as: 'applications' });

MemberApplication.belongsTo(User, { foreignKey: 'userId', as: 'user' });

AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });

SupportTicket.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(SupportTicket, { foreignKey: 'userId', as: 'supportTickets' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Group,
  Loan,
  Contribution,
  Transaction,
  Fine,
  Announcement,
  Meeting,
  Vote,
  VoteOption,
  VoteResponse,
  LearnGrowContent,
  ChatMessage,
  Notification,
  Branch,
  MemberApplication,
  AuditLog,
  SupportTicket,
  Setting,
  LoanProduct
};

