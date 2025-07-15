// backend/routes/afiliados.js
const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');

// ——————————————————————————————
// 1) LISTAR TODOS
// GET  /api/afiliados
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM dbo.afiliados');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener afiliados:', err);
    res.status(500).json({ error: 'Error al obtener afiliados' });
  }
});

// ——————————————————————————————
// 2) OBTENER UNO POR ID
// GET  /api/afiliados/:id
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM dbo.afiliados WHERE id = @id');
    if (result.recordset.length === 0) return res.status(404).json({ error: 'Afiliado no encontrado' });
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error al obtener afiliado:', err);
    res.status(500).json({ error: 'Error al obtener afiliado' });
  }
});

// ——————————————————————————————
// 3) CREAR UNO NUEVO
// POST /api/afiliados
router.post('/', async (req, res) => {
  const f = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('dni', sql.Int, f.dni)
      .input('cuit', sql.VarChar(50), f.cuit)
      .input('nombre', sql.VarChar(100), f.nombre)
      .input('apellido', sql.VarChar(100), f.apellido)
      .input('parentesco', sql.VarChar(50), f.parentesco || '')
      .input('fecha_nacimiento', sql.Date, f.fecha_nacimiento || null)
      .input('edad', sql.Int, f.edad || null)
      .input('nacionalidad', sql.VarChar(50), f.nacionalidad || '')
      .input('email', sql.VarChar(100), f.email || '')
      .input('grupo_familiar', sql.Int, f.grupo_familiar || null)
      .input('calle', sql.VarChar(100), f.calle || '')
      .input('numero', sql.VarChar(10), f.numero || '')
      .input('codigo_postal', sql.VarChar(10), f.codigo_postal || '')
      .input('barrio', sql.VarChar(50), f.barrio || '')
      .input('localidad', sql.VarChar(50), f.localidad || '')
      .input('telefono', sql.VarChar(20), f.telefono || '')
      .input('plann', sql.VarChar(50), f.plann)
      .input('estado', sql.VarChar(50), f.estado)
      .input('fecha_alta', sql.Date, f.fecha_alta)
      .query(`
        INSERT INTO dbo.afiliados (
          dni, cuit, nombre, apellido, parentesco, fecha_nacimiento, edad,
          nacionalidad, email, grupo_familiar, calle, numero, codigo_postal,
          barrio, localidad, telefono, plann, estado, fecha_alta
        )
        VALUES (
          @dni, @cuit, @nombre, @apellido, @parentesco, @fecha_nacimiento, @edad,
          @nacionalidad, @email, @grupo_familiar, @calle, @numero, @codigo_postal,
          @barrio, @localidad, @telefono, @plann, @estado, @fecha_alta
        )
      `);
    res.status(201).json({ mensaje: 'Afiliado creado' });
  } catch (err) {
    console.error('Error al crear afiliado:', err);
    res.status(500).json({ error: 'Error al crear afiliado' });
  }
});

// ——————————————————————————————
// 4) ACTUALIZAR POR ID
// PUT  /api/afiliados/:id
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const f = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, id)
      .input('dni', sql.Int, f.dni)
      .input('cuit', sql.VarChar(50), f.cuit)
      .input('nombre', sql.VarChar(100), f.nombre)
      .input('apellido', sql.VarChar(100), f.apellido)
      .input('parentesco', sql.VarChar(50), f.parentesco || '')
      .input('fecha_nacimiento', sql.Date, f.fecha_nacimiento || null)
      .input('edad', sql.Int, f.edad || null)
      .input('nacionalidad', sql.VarChar(50), f.nacionalidad || '')
      .input('email', sql.VarChar(100), f.email || '')
      .input('grupo_familiar', sql.Int, f.grupo_familiar || null)
      .input('calle', sql.VarChar(100), f.calle || '')
      .input('numero', sql.VarChar(10), f.numero || '')
      .input('codigo_postal', sql.VarChar(10), f.codigo_postal || '')
      .input('barrio', sql.VarChar(50), f.barrio || '')
      .input('localidad', sql.VarChar(50), f.localidad || '')
      .input('telefono', sql.VarChar(20), f.telefono || '')
      .input('plann', sql.VarChar(50), f.plann)
      .input('estado', sql.VarChar(50), f.estado)
      .input('fecha_alta', sql.Date, f.fecha_alta)
      .query(`
        UPDATE dbo.afiliados SET
          dni=@dni, cuit=@cuit, nombre=@nombre, apellido=@apellido,
          parentesco=@parentesco, fecha_nacimiento=@fecha_nacimiento,
          edad=@edad, nacionalidad=@nacionalidad, email=@email,
          grupo_familiar=@grupo_familiar, calle=@calle, numero=@numero,
          codigo_postal=@codigo_postal, barrio=@barrio,
          localidad=@localidad, telefono=@telefono,
          plann=@plann, estado=@estado, fecha_alta=@fecha_alta
        WHERE id=@id
      `);
    res.json({ mensaje: 'Afiliado actualizado' });
  } catch (err) {
    console.error('Error al actualizar afiliado:', err);
    res.status(500).json({ error: 'Error al actualizar afiliado' });
  }
});

// ——————————————————————————————
// 5) ELIMINAR POR ID
// DELETE /api/afiliados/:id
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM dbo.afiliados WHERE id = @id');
    res.json({ mensaje: 'Afiliado eliminado' });
  } catch (err) {
    console.error('Error al eliminar afiliado:', err);
    res.status(500).json({ error: 'Error al eliminar afiliado' });
  }
});

module.exports = router;
