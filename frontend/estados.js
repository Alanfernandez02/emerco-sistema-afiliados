// estados.js
document.addEventListener('DOMContentLoaded', () => {
  const afiliadoSelect = document.getElementById('afiliadoSelect');
  const estadoDetalle = document.getElementById('estadoDetalle');
  const API_AFILIADOS = `${window.location.origin}/api/afiliados`;
  const API_ESTADOS = `${window.location.origin}/api/estado-cuenta/detalle-todos`;

  // Cargar afiliados en el selector
  fetch(API_AFILIADOS)
    .then(res => res.json())
    .then(data => {
      data.forEach(af => {
        const opt = document.createElement('option');
        opt.value = af.id;
        opt.textContent = `${af.nombre} ${af.apellido} (${af.dni})`;
        afiliadoSelect.appendChild(opt);
      });
    })
    .catch(() => {
      afiliadoSelect.innerHTML = '<option value="">Error al cargar</option>';
    });

  // Al seleccionar afiliado, cargar todos los movimientos
  afiliadoSelect.addEventListener('change', () => {
    estadoDetalle.innerHTML = '';
    if (!afiliadoSelect.value) return;
    estadoDetalle.innerHTML = '<p>Cargando movimientos...</p>';

    fetch(`${API_ESTADOS}?afiliado=${afiliadoSelect.value}`)
      .then(res => res.json())
      .then(movimientos => {
        if (!movimientos || movimientos.length === 0) {
          estadoDetalle.innerHTML = '<p>No hay movimientos para este afiliado.</p>';
          return;
        }

        // Renderizar filtro + tabla + PDF
        let html = `
          <input type="text" id="filtroMovimientos" placeholder="Filtrar por período o estado..." style="margin-bottom:10px; padding:5px; width:210px;">
          <button id="btnDescargarPDF" class="btn-secondary" style="margin-left:10px; margin-bottom:10px;">Descargar PDF</button>
          <div style="overflow-x:auto;">
            <table id="tablaMovimientos" style="width:100%; margin-bottom:2rem;">
              <thead>
                <tr>
                  <th>Período</th>
                  <th>Fecha</th>
                  <th>Comprobante</th>
                  <th>Vencimiento</th>
                  <th>Total</th>
                  <th>Saldo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>`;
        movimientos.forEach(item => {
          html += `<tr>
            <td>${item.periodo || ''}</td>
            <td>${formatearFecha(item.fecha_emision)}</td>
            <td>${item.comprobante || ''}</td>
            <td>${formatearFecha(item.vencimiento)}</td>
            <td>$${item.total != null ? Number(item.total).toLocaleString('es-AR', {minimumFractionDigits:2}) : '0.00'}</td>
            <td>$${item.saldo != null ? Number(item.saldo).toLocaleString('es-AR', {minimumFractionDigits:2}) : '0.00'}</td>
            <td>${item.estado || ''}</td>
          </tr>`;
        });
        html += `</tbody></table></div>`;
        estadoDetalle.innerHTML = html;

        // Filtro
        document.getElementById('filtroMovimientos').addEventListener('input', function() {
          const term = this.value.toLowerCase();
          document.querySelectorAll('#tablaMovimientos tbody tr').forEach(tr => {
            tr.style.display = tr.textContent.toLowerCase().includes(term) ? '' : 'none';
          });
        });

        // Descargar PDF
        document.getElementById('btnDescargarPDF').onclick = () => descargarPDF(movimientos);
      });
  });

  // Descargar PDF de toda la tabla
  function descargarPDF(movimientos) {
    const doc = new window.jspdf.jsPDF();
    doc.text('Estados de Cuenta - Todos los períodos', 10, 10);
    let rows = movimientos.map(item => [
      item.periodo || '',
      formatearFecha(item.fecha_emision),
      item.comprobante || '',
      formatearFecha(item.vencimiento),
      `$${item.total != null ? Number(item.total).toLocaleString('es-AR', {minimumFractionDigits:2}) : '0.00'}`,
      `$${item.saldo != null ? Number(item.saldo).toLocaleString('es-AR', {minimumFractionDigits:2}) : '0.00'}`,
      item.estado || ''
    ]);
    doc.autoTable({
      head: [['Período', 'Fecha', 'Comprobante', 'Vencimiento', 'Total', 'Saldo', 'Estado']],
      body: rows,
      startY: 20,
      theme: 'striped'
    });
    doc.save('estados_cuenta_todos.pdf');
  }

  // Utilidad para formato fecha
  function formatearFecha(fecha) {
    if (!fecha) return '';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return fecha;
    return d.toLocaleDateString('es-AR');
  }
});
