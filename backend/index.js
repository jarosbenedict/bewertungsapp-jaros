const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Alle Ressourcen-Routen liegen direkt auf der Wurzel, z.B. GET /teams
app.use('/', routes);

// 404 für unbekannte Routen und zentrale Fehlerbehandlung, immer zuletzt
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));

module.exports = app;
