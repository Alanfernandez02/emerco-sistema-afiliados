// backend/routes/afiliados.js
const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');
const moment = require('moment');

// 1) LISTAR TODOS (con el nombre y precio del plan)
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        a.id, a.dni, a.cuit, a.nombre, a.apellido, 
        a.parentesco, a.fecha_nacimiento, a.edad, a.nacionalidad, a.email,
        a.grupo_familiar, a.calle, a.numero, a.codigo_postal, a.barrio, a.localidad,
        a.telefono, a.plan_id, a.estado, a.fecha_alta, a.fecha_alta_plan,
        p.nombre AS plan_nombre, p.precio AS plan_precio
      FROM afiliados a
      LEFT JOIN planes p ON a.plan_id = p.id
      ORDER BY a.id
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener afiliados:', err);
    res.status(500).json({ error: 'Error al obtener afiliados' });
  }
});

// 2) OBTENER UNO POR ID
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT a.*, p.nombre AS plan_nombre, p.precio AS plan_precio
        FROM dbo.afiliados a
        LEFT JOIN planes p ON a.plan_id = p.id
        WHERE a.id = @id
      `);
    if (result.recordset.length === 0) return res.status(404).json({ error: 'Afiliado no encontrado' });
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error al obtener afiliado:', err);
    res.status(500).json({ error: 'Error al obtener afiliado' });
  }
});

// 3) CREAR UNO NUEVO
router.post('/', async (req, res) => {
  const f = req.body;
  const pool = await poolPromise;
  const t = await pool.transaction();
  try {
    await t.begin();

    // Insertar afiliado
    const afiliadoRes = await t.request()
      .input('dni', sql.Int, f.dni)
      .input('cuit', sql.VarChar(50), f.cuit)
      .input('nombre', sql.VarChar(100), f.nombre)
      .input('apellido', sql.VarChar(100), f.apellido)
      .input('parentesco', sql.VarChar(50), f.parentesco || '')
      .input('fecha_nacimiento', sql.Date, f.fecha_nacimiento || null)
      .input('edad', sql.Int, f.edad || null)
      .input('nacionalidad', sql.VarChar(50), f.nacionalidad || '')
      .input('email', sql.VarChar(100), f.email || '')
      .input('grupo_familiar', sql.VarChar(50), f.grupo_familiar || '')
      .input('calle', sql.VarChar(100), f.calle || '')
      .input('numero', sql.VarChar(10), f.numero || '')
      .input('codigo_postal', sql.VarChar(10), f.codigo_postal || '')
      .input('barrio', sql.VarChar(50), f.barrio || '')
      .input('localidad', sql.VarChar(50), f.localidad || '')
      .input('telefono', sql.VarChar(20), f.telefono || '')
      .input('plan_id', sql.Int, f.plan_id)
      .input('fecha_alta_plan', sql.Date, f.fecha_alta_plan || null)
      .input('estado', sql.VarChar(50), f.estado || '')
      .input('fecha_alta', sql.Date, f.fecha_alta || null)
      .query(`
        INSERT INTO dbo.afiliados (
          dni, cuit, nombre, apellido, parentesco, fecha_nacimiento, edad,
          nacionalidad, email, grupo_familiar, calle, numero, codigo_postal,
          barrio, localidad, telefono, plan_id, fecha_alta_plan, estado, fecha_alta
        )
        VALUES (
          @dni, @cuit, @nombre, @apellido, @parentesco, @fecha_nacimiento, @edad,
          @nacionalidad, @email, @grupo_familiar, @calle, @numero, @codigo_postal,
          @barrio, @localidad, @telefono, @plan_id, @fecha_alta_plan, @estado, @fecha_alta
        );
        SELECT SCOPE_IDENTITY() AS id;
      `);
    const afiliadoId = afiliadoRes.recordset[0].id;

    // Si tiene plan y fecha, generar movimientos en cuenta_corriente
    if (f.plan_id && f.fecha_alta_plan) {
      // Obtener precio del plan
      const planRes = await t.request()
        .input('planId', sql.Int, f.plan_id)
        .query('SELECT precio FROM dbo.planes WHERE id = @planId');
      const planPrecio = planRes.recordset[0]?.precio || 0;

      // Generar períodos desde fecha de alta hasta mes actual
      let fecha = moment(f.fecha_alta_plan).startOf('month');
      const fin = moment().startOf('month');
      while (fecha.isSameOrBefore(fin)) {
        await t.request()
          .input('afiliado_id', sql.Int, afiliadoId)
          .input('estado_cuenta', sql.VarChar(30), 'pendiente')
          .input('saldo', sql.Decimal(18, 2), planPrecio)
          .input('fecha_actualizacion', sql.Date, fecha.toDate())
          .query(`
            INSERT INTO dbo.cuenta_corriente (afiliado_id, estado_cuenta, saldo, fecha_actualizacion)
            VALUES (@afiliado_id, @estado_cuenta, @saldo, @fecha_actualizacion)
          `);
        fecha.add(1, 'month');
      }
    }

    await t.commit();
    res.status(201).json({ mensaje: 'Afiliado creado y movimientos generados' });
  } catch (err) {
    await t.rollback();
    console.error('Error al crear afiliado:', err);
    if (err.message && err.message.includes('UNIQUE KEY')) {
      return res.status(400).json({ error: 'DNI ya existe en la base de datos' });
    }
    res.status(500).json({ error: 'Error al crear afiliado' });
  }
});

// 4) ACTUALIZAR POR ID
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const f = req.body;
  const pool = await poolPromise;
  const t = await pool.transaction();
  try {
    await t.begin();

    // Actualizar afiliado
    await t.request()
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
      .input('grupo_familiar', sql.VarChar(50), f.grupo_familiar || '')
      .input('calle', sql.VarChar(100), f.calle || '')
      .input('numero', sql.VarChar(10), f.numero || '')
      .input('codigo_postal', sql.VarChar(10), f.codigo_postal || '')
      .input('barrio', sql.VarChar(50), f.barrio || '')
      .input('localidad', sql.VarChar(50), f.localidad || '')
      .input('telefono', sql.VarChar(20), f.telefono || '')
      .input('plan_id', sql.Int, f.plan_id)
      .input('fecha_alta_plan', sql.Date, f.fecha_alta_plan || null)
      .input('estado', sql.VarChar(50), f.estado || '')
      .input('fecha_alta', sql.Date, f.fecha_alta || null)
      .query(`
        UPDATE dbo.afiliados SET
          dni=@dni, cuit=@cuit, nombre=@nombre, apellido=@apellido,
          parentesco=@parentesco, fecha_nacimiento=@fecha_nacimiento,
          edad=@edad, nacionalidad=@nacionalidad, email=@email,
          grupo_familiar=@grupo_familiar, calle=@calle, numero=@numero,
          codigo_postal=@codigo_postal, barrio=@barrio,
          localidad=@localidad, telefono=@telefono,
          plan_id=@plan_id, fecha_alta_plan=@fecha_alta_plan, estado=@estado, fecha_alta=@fecha_alta
        WHERE id=@id
      `);

    // Borrar y volver a crear movimientos si se cambia plan_id o fecha_alta_plan
    if (f.plan_id && f.fecha_alta_plan) {
      await t.request()
        .input('afiliado_id', sql.Int, id)
        .query('DELETE FROM dbo.cuenta_corriente WHERE afiliado_id=@afiliado_id');

      // Buscar precio del plan
      const planRes = await t.request()
        .input('planId', sql.Int, f.plan_id)
        .query('SELECT precio FROM dbo.planes WHERE id = @planId');
      const planPrecio = planRes.recordset[0]?.precio || 0;

      let fecha = moment(f.fecha_alta_plan).startOf('month');
      const fin = moment().startOf('month');
      while (fecha.isSameOrBefore(fin)) {
        await t.request()
          .input('afiliado_id', sql.Int, id)
          .input('estado_cuenta', sql.VarChar(30), 'pendiente')
          .input('saldo', sql.Decimal(18, 2), planPrecio)
          .input('fecha_actualizacion', sql.Date, fecha.toDate())
          .query(`
            INSERT INTO dbo.cuenta_corriente (afiliado_id, estado_cuenta, saldo, fecha_actualizacion)
            VALUES (@afiliado_id, @estado_cuenta, @saldo, @fecha_actualizacion)
          `);
        fecha.add(1, 'month');
      }
    }

    await t.commit();
    res.json({ mensaje: 'Afiliado actualizado y movimientos generados' });
  } catch (err) {
    await t.rollback();
    console.error('Error al actualizar afiliado:', err);
    res.status(500).json({ error: 'Error al actualizar afiliado' });
  }
});

// 5) ELIMINAR POR ID
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
