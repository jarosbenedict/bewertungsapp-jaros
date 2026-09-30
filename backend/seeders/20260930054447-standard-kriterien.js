'use strict';

/**
 * Standard-Bewertungskriterien der Bewertungsapp.
 * Testdaten, damit ab Einheit 4 Bewertungen und Auswertungen möglich sind.
 */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    await queryInterface.bulkInsert('Criteria', [
      { id: 1, name: 'Inhalt', maxScore: 10, weight: 1.0, createdAt: now, updatedAt: now },
      { id: 2, name: 'Präsentationstechnik', maxScore: 10, weight: 1.0, createdAt: now, updatedAt: now },
      { id: 3, name: 'Technische Umsetzung', maxScore: 10, weight: 1.5, createdAt: now, updatedAt: now }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Criteria', null, {});
  }
};
