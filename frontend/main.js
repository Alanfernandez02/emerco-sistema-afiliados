window.addEventListener('DOMContentLoaded', async () => {
    const url = 'http://localhost:3000/api/afiliados';
    try {
      const res = await fetch(url);
      const afiliados = await res.json();
  
      // Stats
      const total = afiliados.length;
      const con = afiliados.filter(a => a.estado.toLowerCase() === 'con cobertura').length;
      const sin = afiliados.filter(a => a.estado.toLowerCase() === 'sin cobertura').length;
      const sus = afiliados.filter(a => a.estado.toLowerCase() === 'suspendido').length;
  
      document.getElementById('totalAfiliados').textContent = total;
      document.getElementById('conCobertura').textContent = con;
      document.getElementById('sinCobertura').textContent = sin;
      document.getElementById('suspendidos').textContent = sus;
  
      document.getElementById('pctCobertura').textContent = total ? Math.round(con/total*100) + '%' : '0%';
      document.getElementById('pctSinCobertura').textContent = total ? Math.round(sin/total*100) + '%' : '0%';
      document.getElementById('pctSuspendidos').textContent = total ? Math.round(sus/total*100) + '%' : '0%';
  
      // Recientes (los 5 últimos por fecha_alta)
      const recientes = afiliados
        .sort((a, b) => new Date(b.fecha_alta) - new Date(a.fecha_alta))
        .slice(0, 5);
  
      const list = document.getElementById('recientesList');
      list.innerHTML = '';
      if (recientes.length === 0) {
        list.innerHTML = '<li>No hay afiliados registrados</li>';
      } else {
        recientes.forEach(a => {
          const li = document.createElement('li');
          li.innerHTML = `<strong>${a.nombre} ${a.apellido}</strong><br>
            <small>DNI: ${a.dni} • ${a.plann}</small>`;
          list.appendChild(li);
        });
      }
    } catch (err) {
      console.error('Error cargando dashboard:', err);
    }
  });
  