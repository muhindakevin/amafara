module.exports = (sequelize, DataTypes) => {
  const LoanInstallment = sequelize.define('LoanInstallment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    loanId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Loans',
        key: 'id'
      }
    },
    installmentNumber: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    growthAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'overdue'),
      allowNull: false,
      defaultValue: 'pending'
    },
    paidDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    paidAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    }
  }, {
    timestamps: true
  });

  LoanInstallment.associate = function(models) {
    LoanInstallment.belongsTo(models.Loan, { foreignKey: 'loanId', as: 'loan' });
  };

  return LoanInstallment;
};
