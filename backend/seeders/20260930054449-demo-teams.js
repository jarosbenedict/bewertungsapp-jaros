'use strict';

/**
 * Teams mit Mitgliedern und Projekten als Testdaten.
 * Die Fremdschlüssel (teamId) verweisen auf die hier angelegten Team-Ids.
 */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkInsert('Teams', [
      { id: 1, name: 'Team Blockchain', klasse: '4AHITL', createdAt: now, updatedAt: now },
      { id: 2, name: 'Team RoboArm', klasse: '4AHITL', createdAt: now, updatedAt: now }
    ]);

    await queryInterface.bulkInsert('Members', [
      { id: 1, teamId: 1, vorname: 'Lena', nachname: 'Huber', createdAt: now, updatedAt: now },
      { id: 2, teamId: 1, vorname: 'Tom', nachname: 'Novak', createdAt: now, updatedAt: now },
      { id: 3, teamId: 2, vorname: 'Mia', nachname: 'Berger', createdAt: now, updatedAt: now }
    ]);

    await queryInterface.bulkInsert('Projects', [
      {
        id: 1,
        teamId: 1,
        titel: 'Dezentrale Wahl-App',
        beschreibung: 'Abstimmungssystem auf Basis einer Blockchain',
        praesentiertAm: '2026-06-12',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 2,
        teamId: 2,
        titel: 'Autonomer Greifarm',
        beschreibung: 'Robotikarm mit Bilderkennung',
        praesentiertAm: '2026-06-12',
        createdAt: now,
        updatedAt: now
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Projects', null, {});
    await queryInterface.bulkDelete('Members', null, {});
    await queryInterface.bulkDelete('Teams', null, {});
  }
};
