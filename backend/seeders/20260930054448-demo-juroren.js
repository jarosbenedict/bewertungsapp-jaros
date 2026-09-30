'use strict';

/**
 * Juroren der Bewertungsapp.
 * Die E-Mail dient ab Einheit 7 als Login-Kennung und muss eindeutig sein.
 */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    await queryInterface.bulkInsert('Jurors', [
      { id: 1, name: 'M. Huber', email: 'm.huber@schule.at', createdAt: now, updatedAt: now },
      { id: 2, name: 'S. Novak', email: 's.novak@schule.at', createdAt: now, updatedAt: now }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Jurors', null, {});
  }
};
