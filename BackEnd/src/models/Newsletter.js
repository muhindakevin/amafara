const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Newsletter extends Model {
    static associate(models) {
      // define association here if needed
    }
  }

  Newsletter.init({
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    subscribed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Newsletter',
    tableName: 'Newsletters'
  });

  return Newsletter;
};
