// Cargar dropdown de afiliados al inicio
window.addEventListener('DOMContentLoaded', async () => {
    const sel = document.getElementById('afiliadoSelect');
    const res = await fetch('http://localhost:3000/api/afiliados');
    const afiliados = await res.json();
    afiliados.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = `${a.nombre} ${a.apellido} (DNI: ${a.dni})`;
      sel.appendChild(opt);
    });
  });
  
  // Al hacer click en Consultar
  document.getElementById('btnConsultar').addEventListener('click', async () => {
    const id = document.getElementById('afiliadoSelect').value;
    const periodo = document.getElementById('periodoInput').value;
    if (!id || !periodo) return alert('Completa ambos campos');
  
    // 1) Resumen
    const r = await fetch(`http://localhost:3000/api/estados/resumen?afiliadoId=${id}&periodo=${periodo}`);
    const resumen = await r.json();
    document.getElementById('totalFacturado').textContent = `$${resumen.totalFacturado ?? 0}`;
    document.getElementById('totalPagado').textContent    = `$${resumen.totalPagado    ?? 0}`;
    document.getElementById('totalPendiente').textContent = `$${resumen.totalPendiente ?? 0}`;
    document.getElementById('pagadas').textContent        = resumen.pagadas    ?? 0;
    document.getElementById('pendientes').textContent     = resumen.pendientes ?? 0;
    document.getElementById('vencidas').textContent       = resumen.vencidas   ?? 0;
  
    // 2) Comprobantes
    const c = await fetch(`http://localhost:3000/api/estados/comprobantes?afiliadoId=${id}&periodo=${periodo}`);
    const comprobantes = await c.json();
    const tbody = document.getElementById('comprobantesBody');
    tbody.innerHTML = comprobantes.length
      ? comprobantes.map(cb => `
        <tr>
          <td>${cb.numero}</td>
          <td>${new Date(cb.fecha_emision).toLocaleDateString()}</td>
          <td>${new Date(cb.vencimiento).toLocaleDateString()}</td>
          <td>$${cb.total}</td>
          <td>$${cb.saldo}</td>
        </tr>
      `).join('')
      : `<tr><td colspan="5" style="text-align:center;">No hay comprobantes para este período</td></tr>`;
  });
  