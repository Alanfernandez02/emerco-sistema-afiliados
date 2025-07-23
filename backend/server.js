// backend/server.js

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { poolPromise } = require('./db');
const afiliadosRouter = require('./routes/afiliados');

const estadosRoutes = require('./routes/estados');

const app = express();
const PORT = process.env.PORT || 3000;

const planesRouter = require('./routes/planes');
app.use('/api/planes', planesRouter);


// Middlewares
app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde /frontend
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/estado-cuenta', estadosRoutes);

// Verificar conexión a la base de datos al iniciar
poolPromise
  .then(() => console.log('✅ Conectado a SQL Server'))
  .catch(err => console.error('❌ Error de conexión a SQL Server:', err));

// Rutas de la API
app.use('/api/afiliados', afiliadosRouter);

// Levantar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
