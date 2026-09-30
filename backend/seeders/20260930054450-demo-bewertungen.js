'use strict';

/**
 * Beispielbewertungen. Jede Kombination aus projectId, criterionId und jurorId
 * kommt nur einmal vor, sonst greift der Unique-Constraint auf Evaluations.
 */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    await queryInterface.bulkInsert('Evaluations', [
      { id: 1, projectId: 1, criterionId: 1, jurorId: 1, score: 8, comment: 'Konzept klar erklärt', createdAt: now, updatedAt: now },
      { id: 2, projectId: 1, criterionId: 2, jurorId: 1, score: 7, comment: 'Etwas zu textlastige Folien', createdAt: now, updatedAt: now },
      { id: 3, projectId: 1, criterionId: 3, jurorId: 1, score: 9, comment: 'Saubere Smart-Contract-Struktur', createdAt: now, updatedAt: now },
      { id: 4, projectId: 1, criterionId: 1, jurorId: 2, score: 9, comment: 'Gut strukturierter Vortrag', createdAt: now, updatedAt: now },
      { id: 5, projectId: 1, criterionId: 2, jurorId: 2, score: 8, comment: 'Ruhiges Tempo', createdAt: now, updatedAt: now },
      { id: 6, projectId: 1, criterionId: 3, jurorId: 2, score: 10, comment: 'Fehlerbehandlung vollständig', createdAt: now, updatedAt: now },
      { id: 7, projectId: 2, criterionId: 1, jurorId: 1, score: 7, comment: 'Zielgruppe nicht klar abgegrenzt', createdAt: now, updatedAt: now },
      { id: 8, projectId: 2, criterionId: 2, jurorId: 1, score: 8, comment: 'Gute Live-Demo', createdAt: now, updatedAt: now },
      { id: 9, projectId: 2, criterionId: 3, jurorId: 2, score: 9, comment: 'Saubere Hardware-Dokumentation', createdAt: now, updatedAt: now },
      { id: 10, projectId: 2, criterionId: 1, jurorId: 2, score: 8, comment: 'Anwendungsfall nachvollziehbar', createdAt: now, updatedAt: now }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Evaluations', null, {});
  }
};
