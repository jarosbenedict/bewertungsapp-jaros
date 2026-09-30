'use strict';
/**
 * Ergänzt die in Einheit 2 angelegten Tabellen um die Constraints aus der
 * ausgefüllten Planungsvorlage (NOT NULL, Fremdschlüssel) und korrigiert den
 * Datentyp von Projects.praesentiertAm auf DATE (in der Vorlage als DATE
 * festgelegt, sequelize-cli erzeugt sonst DATETIME).
 *
 * Bewusst als eigene Migration statt Änderung an den Einheit-2-Migrationen,
 * damit der mit lab2 getaggte Stand reproduzierbar bleibt.
 */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Teams', 'name', {
      allowNull: false,
      type: Sequelize.STRING
    });
    await queryInterface.changeColumn('Teams', 'klasse', {
      allowNull: false,
      type: Sequelize.STRING
    });

    await queryInterface.changeColumn('Members', 'teamId', {
      allowNull: false,
      type: Sequelize.INTEGER
    });
    await queryInterface.changeColumn('Members', 'vorname', {
      allowNull: false,
      type: Sequelize.STRING
    });
    await queryInterface.changeColumn('Members', 'nachname', {
      allowNull: false,
      type: Sequelize.STRING
    });

    await queryInterface.changeColumn('Projects', 'teamId', {
      allowNull: false,
      type: Sequelize.INTEGER
    });
    await queryInterface.changeColumn('Projects', 'titel', {
      allowNull: false,
      type: Sequelize.STRING
    });
    await queryInterface.changeColumn('Projects', 'praesentiertAm', {
      allowNull: true,
      type: Sequelize.DATEONLY
    });

    // Fremdschlüssel bewusst als benannte Constraints, damit sie im down()
    // wieder gezielt entfernt werden können und nicht auf die von MySQL
    // automatisch vergebenen Namen (members_ibfk_1, ...) angewiesen sind.
    await queryInterface.addConstraint('Members', {
      fields: ['teamId'],
      type: 'foreign key',
      name: 'members_teamId_fkey',
      references: { table: 'Teams', field: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
    await queryInterface.addConstraint('Projects', {
      fields: ['teamId'],
      type: 'foreign key',
      name: 'projects_teamId_fkey',
      references: { table: 'Teams', field: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('Projects', 'projects_teamId_fkey');
    await queryInterface.removeConstraint('Members', 'members_teamId_fkey');

    await queryInterface.changeColumn('Projects', 'praesentiertAm', {
      allowNull: true,
      type: Sequelize.DATE
    });
    await queryInterface.changeColumn('Projects', 'titel', {
      allowNull: true,
      type: Sequelize.STRING
    });
    await queryInterface.changeColumn('Projects', 'teamId', {
      allowNull: true,
      type: Sequelize.INTEGER
    });

    await queryInterface.changeColumn('Members', 'nachname', {
      allowNull: true,
      type: Sequelize.STRING
    });
    await queryInterface.changeColumn('Members', 'vorname', {
      allowNull: true,
      type: Sequelize.STRING
    });
    await queryInterface.changeColumn('Members', 'teamId', {
      allowNull: true,
      type: Sequelize.INTEGER
    });

    await queryInterface.changeColumn('Teams', 'klasse', {
      allowNull: true,
      type: Sequelize.STRING
    });
    await queryInterface.changeColumn('Teams', 'name', {
      allowNull: true,
      type: Sequelize.STRING
    });
  }
};
