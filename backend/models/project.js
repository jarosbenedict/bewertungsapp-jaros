'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Project extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Project.belongsTo(models.Team, { foreignKey: 'teamId' });
      Project.hasMany(models.Evaluation, { foreignKey: 'projectId' });
    }
  }
  Project.init({
    teamId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    titel: {
      type: DataTypes.STRING,
      allowNull: false
    },
    beschreibung: {
      type: DataTypes.TEXT
    },
    // DATE statt DATETIME: ein Präsentationstag hat keine Uhrzeit.
    praesentiertAm: {
      type: DataTypes.DATEONLY
    }
  }, {
    sequelize,
    modelName: 'Project',
  });
  return Project;
};