'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Evaluation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Evaluation.belongsTo(models.Project, { foreignKey: 'projectId' });
      Evaluation.belongsTo(models.Criterion, { foreignKey: 'criterionId' });
      Evaluation.belongsTo(models.Juror, { foreignKey: 'jurorId' });
    }
  }
  Evaluation.init({
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    criterionId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    jurorId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0 }
    },
    comment: {
      type: DataTypes.TEXT
    }
  }, {
    sequelize,
    modelName: 'Evaluation',
    indexes: [
      {
        unique: true,
        name: 'evaluations_project_criterion_juror_unique',
        fields: ['projectId', 'criterionId', 'jurorId']
      }
    ]
  });
  return Evaluation;
};