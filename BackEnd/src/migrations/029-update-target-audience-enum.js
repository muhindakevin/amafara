'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Detect database type
    const dialect = queryInterface.sequelize.getDialect();
    const isMySQL = dialect === 'mysql' || dialect === 'mariadb';
    
    if (isMySQL) {
      // MySQL: Alter the ENUM column
      await queryInterface.sequelize.query(`
        ALTER TABLE LearnGrowContents 
        MODIFY COLUMN targetAudience ENUM('members', 'secretary', 'agent', 'both') 
        DEFAULT 'members' NOT NULL
      `);
    } else {
      // For PostgreSQL, add the new enum value to the existing type
      try {
        await queryInterface.sequelize.query(`
          ALTER TYPE "enum_LearnGrowContents_targetAudience" ADD VALUE IF NOT EXISTS 'agent'
        `);
      } catch (error) {
        // If ADD VALUE fails (e.g., value already exists), continue
        console.log('Note: Could not add enum value, may already exist:', error.message);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Revert to original enum (without 'agent')
    const [results] = await queryInterface.sequelize.query("SELECT VERSION() as version");
    const isMySQL = results && results[0] && results[0].version;
    
    if (isMySQL) {
      await queryInterface.sequelize.query(`
        ALTER TABLE LearnGrowContents 
        MODIFY COLUMN targetAudience ENUM('members', 'secretary', 'both') 
        DEFAULT 'members' NOT NULL
      `);
    } else {
      try {
        await queryInterface.sequelize.query(`
          ALTER TABLE "LearnGrowContents" 
          DROP CONSTRAINT IF EXISTS "LearnGrowContents_targetAudience_check"
        `);
        
        await queryInterface.sequelize.query(`
          ALTER TABLE "LearnGrowContents" 
          ADD CONSTRAINT "LearnGrowContents_targetAudience_check" 
          CHECK (targetAudience IN ('members', 'secretary', 'both'))
        `);
      } catch (error) {
        console.log('Note: Could not revert enum constraint');
      }
    }
  }
};

