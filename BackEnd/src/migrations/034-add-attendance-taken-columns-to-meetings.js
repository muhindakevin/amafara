'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check existing columns
    const tableDescription = await queryInterface.describeTable('Meetings');

    // Add attendanceTakenBy column if it doesn't exist
    if (!tableDescription.attendanceTakenBy) {
      await queryInterface.addColumn('Meetings', 'attendanceTakenBy', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'User ID who took the attendance'
      });
    }

    // Add attendanceTakenAt column if it doesn't exist
    if (!tableDescription.attendanceTakenAt) {
      await queryInterface.addColumn('Meetings', 'attendanceTakenAt', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Date and time when attendance was taken'
      });
    }

    // Add index for attendanceTakenBy if column exists and index doesn't
    if (tableDescription.attendanceTakenBy) {
      await queryInterface.addIndex('Meetings', ['attendanceTakenBy']);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Meetings', ['attendanceTakenBy']);
    await queryInterface.removeColumn('Meetings', 'attendanceTakenAt');
    await queryInterface.removeColumn('Meetings', 'attendanceTakenBy');
  }
};

