const { User, Group, Branch } = require('../models');

/**
 * Standalone script to seed demo users
 * Run with: node src/utils/seedDemoUsers.js
 */
async function seedDemoUsers() {
  try {
    console.log('🌱 Seeding demo users...');

    // Create demo branch
    const [branch] = await Branch.findOrCreate({
      where: { code: 'DEMO001' },
      defaults: {
        name: 'Demo Branch',
        code: 'DEMO001',
        district: 'Kigali',
        sector: 'Nyarugenge',
        status: 'active'
      }
    });

    // Create demo group
    const [group] = await Group.findOrCreate({
      where: { code: 'GRP001' },
      defaults: {
        name: 'Abahizi Cooperative',
        code: 'GRP001',
        description: 'Demo saving group',
        branchId: branch.id,
        contributionAmount: 5000,
        contributionFrequency: 'monthly',
        status: 'active'
      }
    });

    // Demo users
    const demoUsers = [
      {
        phone: '+250788123456',
        name: 'Jean Marie',
        email: 'jean.marie@demo.com',
        role: 'Member',
        groupId: group.id,
        branchId: branch.id,
        status: 'active',
        totalSavings: 150000,
        creditScore: 820
      },
      {
        phone: '+250788234567',
        name: 'Kamikazi Marie',
        email: 'kamikazi.marie@demo.com',
        role: 'Group Admin',
        groupId: group.id,
        branchId: branch.id,
        status: 'active',
        totalSavings: 200000,
        creditScore: 900
      },
      {
        phone: '+250788345678',
        name: 'Mukamana Alice',
        email: 'mukamana.alice@demo.com',
        role: 'Cashier',
        groupId: group.id,
        branchId: branch.id,
        status: 'active'
      },
      {
        phone: '+250788456789',
        name: 'Ikirezi Jane',
        email: 'ikirezi.jane@demo.com',
        role: 'Secretary',
        groupId: group.id,
        branchId: branch.id,
        status: 'active'
      },
      {
        phone: '+250788567890',
        name: 'Mutabazi Paul',
        email: 'mutabazi.paul@demo.com',
        role: 'Agent',
        branchId: branch.id,
        status: 'active'
      },
      {
        phone: '+250786482268',
        name: 'System Administrator',
        email: 'admin@umurengewallet.com',
        role: 'System Admin',
        branchId: branch.id,
        status: 'active'
      }
    ];

    for (const userData of demoUsers) {
      const [user, created] = await User.findOrCreate({
        where: { phone: userData.phone },
        defaults: userData
      });

      if (created) {
        console.log(`✅ Created user: ${userData.name} (${userData.role})`);
      } else {
        console.log(`ℹ️  User already exists: ${userData.name}`);
      }
    }

    // Update admin phone number specifically
    const adminUser = await User.findOne({ where: { email: 'admin@umurengewallet.com' } });
    if (adminUser) {
      // Update any existing user with the target phone number to a different phone
      const conflictingUser = await User.findOne({ where: { phone: '+250786482268', id: { [require('sequelize').Op.ne]: adminUser.id } } });
      if (conflictingUser) {
        await conflictingUser.update({ phone: '+250786482269' });
        console.log('✅ Updated conflicting user phone number');
      }
      if (adminUser.phone !== '+250786482268') {
        await adminUser.update({ phone: '+250786482268' });
        console.log('✅ Updated System Administrator phone number');
      }
    }

    console.log('✅ Demo users seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding demo users:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  const db = require('../../config/db');
  db.sequelize.authenticate()
    .then(() => seedDemoUsers())
    .catch(err => {
      console.error('Database connection error:', err);
      process.exit(1);
    });
}

module.exports = seedDemoUsers;

