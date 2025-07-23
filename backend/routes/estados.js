// backend/routes/estados.js
const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { poolPromise } = require('../db');

// ——————————————————————————————
// 1) PERÍODOS DISPONIBLES PARA UN AFILIADO
router.get('/periodos/:afiliadoId', async (req, res) => {
  try {
    const { afiliadoId } = req.params;
    const pool = await poolPromise;
    const result = await pool.request()
      .input('afiliadoId', sql.Int, afiliadoId)
      .query(`
        SELECT DISTINCT FORMAT(fecha_actualizacion, 'yyyy-MM') as periodo
        FROM cuenta_corriente
        WHERE afiliado_id = @afiliadoId
        ORDER BY periodo DESC
      `);

    // Agrega el período actual si no está
    const actual = new Date();
    const periodoActual = `${actual.getFullYear()}-${(actual.getMonth()+1).toString().padStart(2,'0')}`;
    let periodos = result.recordset.map(r => r.periodo);
    if (!periodos.includes(periodoActual)) periodos.unshift(periodoActual);
    res.json(periodos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener períodos' });
  }
});

// ——————————————————————————————
// 2) DETALLE DE UN PERÍODO (INCLUYE CUOTA VIRTUAL SI NO EXISTE EN DB)
router.get('/detalle', async (req, res) => {
  try {
    const { afiliado, periodo } = req.query;
    const pool = await poolPromise;

    // Trae datos del afiliado
    const afResult = await pool.request()
      .input('afiliadoId', sql.Int, afiliado)
      .query('SELECT * FROM afiliados WHERE id = @afiliadoId');
    const af = afResult.recordset[0];
    if (!af) return res.json([]);

    // Trae datos del plan
    const planResult = await pool.request()
      .input('planId', sql.Int, af.plan)
      .query('SELECT * FROM planes WHERE id = @planId');
    const plan = planResult.recordset[0];

    // Arma la cuota virtual si corresponde
    let cuotas = [];
    if (plan && (af.fecha_alta_plan || af.fecha_alta)) {
      const fechaAltaPlan = af.fecha_alta_plan || af.fecha_alta;
      const [anio, mes] = periodo.split('-').map(Number);
      const fechaAlta = new Date(fechaAltaPlan);
      const fechaPeriodo = new Date(anio, mes - 1, 1);

      // Si la fecha del periodo es mayor o igual a la alta, corresponde cuota
      if (fechaPeriodo >= new Date(fechaAlta.getFullYear(), fechaAlta.getMonth(), 1)) {
        cuotas.push({
          fecha_emision: `${periodo}-01`,
          comprobante: `Cuota ${plan.nombre}`,
          vencimiento: `${periodo}-10`,
          total: plan.precio,
          saldo: plan.precio,
          estado: 'Pendiente'
        });
      }
    }

    // Movimientos reales de ese período (pueden ser más de uno)
    const movimientos = await pool.request()
      .input('afiliadoId', sql.Int, afiliado)
      .input('periodo', sql.VarChar, periodo)
      .query(`
        SELECT
          fecha_actualizacion as fecha_emision,
          '' as comprobante,
          fecha_actualizacion as vencimiento,
          saldo as total,
          saldo,
          estado_cuenta as estado
        FROM cuenta_corriente
        WHERE afiliado_id = @afiliadoId
          AND FORMAT(fecha_actualizacion, 'yyyy-MM') = @periodo
      `);

    // Devuelve movimientos reales y cuota virtual (si hay)
    res.json([...cuotas, ...movimientos.recordset]);
  } catch (err) {
    console.error('Error en detalle estado de cuenta:', err);
    res.status(500).json({ error: 'Error al obtener el detalle' });
  }
});

// ——————————————————————————————
// 3) TODOS LOS MOVIMIENTOS DE UN AFILIADO (TABLA GRANDE)
router.get('/detalle-todos', async (req, res) => {
  try {
    const { afiliado } = req.query;
    const pool = await poolPromise;
    const result = await pool.request()
      .input('afiliadoId', sql.Int, afiliado)
      .query(`
        SELECT
          FORMAT(fecha_actualizacion, 'yyyy-MM') as periodo,
          fecha_actualizacion as fecha_emision,
          '' as comprobante,
          fecha_actualizacion as vencimiento,
          saldo as total,
          saldo,
          estado_cuenta as estado
        FROM cuenta_corriente
        WHERE afiliado_id = @afiliadoId
        ORDER BY fecha_actualizacion DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener movimientos' });
  }
});

module.exports = router;
