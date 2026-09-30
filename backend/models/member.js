'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Member extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Member.belongsTo(models.Team, { foreignKey: 'teamId' });
    }
  }
  Member.init({
    teamId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    vorname: {
      type: DataTypes.STRING,
      allowNull: false
    },
    nachname: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Member',
  });
  return Member;
};