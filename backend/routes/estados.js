const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../db');

// 1) Resumen de cuenta corriente
// GET /api/estados/resumen?afiliadoId=xx&periodo=YYYY-MM
router.get('/resumen', async (req, res) => {
  const { afiliadoId, periodo } = req.query;
  try {
    const pool = await poolPromise;
    const start = periodo + '-01';
    const end   = periodo + '-31';

    const result = await pool.request()
      .input('afiliadoId', sql.Int, afiliadoId)
      .input('start', sql.Date, start)
      .input('end', sql.Date, end)
      .query(`
        SELECT
          SUM(total) AS totalFacturado,
          SUM(pagado) AS totalPagado,
          SUM(total - pagado) AS totalPendiente,
          SUM(CASE WHEN pagado = total THEN 1 ELSE 0 END) AS pagadas,
          SUM(CASE WHEN pagado < total AND vencimiento >= GETDATE() THEN 1 ELSE 0 END) AS pendientes,
          SUM(CASE WHEN pagado < total AND vencimiento < GETDATE() THEN 1 ELSE 0 END) AS vencidas
        FROM dbo.comprobantes
        WHERE afiliado_id = @afiliadoId
          AND fecha_emision BETWEEN @start AND @end
      `);
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error resumen estados:', err);
    res.status(500).send('Error servidor');
  }
});

// 2) Listado de comprobantes
// GET /api/estados/comprobantes?afiliadoId=xx&periodo=YYYY-MM
router.get('/comprobantes', async (req, res) => {
  const { afiliadoId, periodo } = req.query;
  try {
    const pool = await poolPromise;
    const start = periodo + '-01';
    const end   = periodo + '-31';

    const result = await pool.request()
      .input('afiliadoId', sql.Int, afiliadoId)
      .input('start', sql.Date, start)
      .input('end', sql.Date, end)
      .query(`
        SELECT numero, fecha_emision, vencimiento, total, pagado AS saldo
        FROM dbo.comprobantes
        WHERE afiliado_id = @afiliadoId
          AND fecha_emision BETWEEN @start AND @end
        ORDER BY fecha_emision
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error comprobantes:', err);
    res.status(500).send('Error servidor');
  }
});

module.exports = router;
