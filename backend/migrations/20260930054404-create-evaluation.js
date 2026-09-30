'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Evaluations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      projectId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'Projects', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      criterionId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'Criteria', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      jurorId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'Jurors', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      score: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      comment: {
        type: Sequelize.TEXT
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Ein Juror darf dasselbe Kriterium für dasselbe Projekt nur einmal bewerten.
    await queryInterface.addConstraint('Evaluations', {
      fields: ['projectId', 'criterionId', 'jurorId'],
      type: 'unique',
      name: 'evaluations_project_criterion_juror_unique'
    });

    // Punktzahl kann nicht negativ sein. Als DB-Constraint, damit die Regel auch
    // bei direktem SQL-Zugriff gilt und nicht nur bei Sequelize.create().
    // Die Obergrenze (Criterion.maxScore) ist NICHT abbildbar, weil sie von einer
    // anderen Tabelle abhängt; sie wird im Backend geprüft (Einheit 4).
    await queryInterface.sequelize.query(
      'ALTER TABLE `Evaluations` ADD CONSTRAINT `evaluations_score_non_negative` CHECK (`score` >= 0)'
    );

    await queryInterface.addIndex('Evaluations', ['projectId']);
    await queryInterface.addIndex('Evaluations', ['criterionId']);
    await queryInterface.addIndex('Evaluations', ['jurorId']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Evaluations');
  }
};