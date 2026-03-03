'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('LoanInstallments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      loanId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Loans',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      installmentNumber: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      growthAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0
      },
      totalAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      dueDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'paid', 'overdue'),
        allowNull: false,
        defaultValue: 'pending'
      },
      paidDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      paidAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('LoanInstallments', ['loanId']);
    await queryInterface.addIndex('LoanInstallments', ['dueDate']);
    await queryInterface.addIndex('LoanInstallments', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('LoanInstallments');
  }
};
