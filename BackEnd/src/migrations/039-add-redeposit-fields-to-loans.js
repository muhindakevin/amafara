'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check existing columns
    const tableDescription = await queryInterface.describeTable('Loans');

    if (!tableDescription.reDepositPeriod) {
      await queryInterface.addColumn('Loans', 'reDepositPeriod', {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Period in months for re-depositing the withdrawn amount'
      });
    }

    if (!tableDescription.growthRate) {
      await queryInterface.addColumn('Loans', 'growthRate', {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Growth rate applied to the re-deposit amount'
      });
    }

    return Promise.resolve();
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Loans', 'reDepositPeriod');
    await queryInterface.removeColumn('Loans', 'growthRate');
  }
};
