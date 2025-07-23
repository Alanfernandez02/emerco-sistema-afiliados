const express = require('express');
const router = express.Router();
const { poolPromise } = require('../db');
const sql = require('mssql');

// GET /api/planes
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT id, nombre, precio FROM planes');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener los planes:', err);
    res.status(500).json({ error: 'Error al obtener los planes' });
  }
});

module.exports = router;
