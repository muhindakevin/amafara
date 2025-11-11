module.exports = (sequelize, DataTypes) => {
  const Meeting = sequelize.define('Meeting', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Groups',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    agenda: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    scheduledDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    scheduledTime: {
      type: DataTypes.TIME,
      allowNull: false
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'ongoing', 'completed', 'cancelled'),
      defaultValue: 'scheduled'
    },
    minutes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    attendance: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of member IDs who attended'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'Meetings',
    timestamps: true
  });

  return Meeting;
};

