'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ScheduledAudits', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      groupId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Groups',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      scheduledBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      auditType: {
        type: Sequelize.ENUM('compliance_check', 'financial_audit', 'group_verification', 'investigation'),
        allowNull: false,
        defaultValue: 'compliance_check'
      },
      scheduledDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
        defaultValue: 'scheduled',
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      checklist: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'JSON array of checklist items with status'
      },
      findings: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      recommendations: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "scheduled_audits_group_id" ON "ScheduledAudits" ("groupId")');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "scheduled_audits_scheduled_by" ON "ScheduledAudits" ("scheduledBy")');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "scheduled_audits_status" ON "ScheduledAudits" ("status")');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "scheduled_audits_scheduled_date" ON "ScheduledAudits" ("scheduledDate")');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ScheduledAudits');
  }
};

