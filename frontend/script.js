document.addEventListener('DOMContentLoaded', async () => {
    try {
      const response = await fetch('http://localhost:3000/api/afiliados');
      const afiliados = await response.json();
  
      document.getElementById('totalAfiliados').textContent = afiliados.length;
  
      const conCobertura = afiliados.filter(a => a.estado === 'Con Cobertura').length;
      const sinCobertura = afiliados.filter(a => a.estado === 'Sin Cobertura').length;
  
      document.getElementById('conCobertura').textContent = conCobertura;
      document.getElementById('sinCobertura').textContent = sinCobertura;
  
      const ultimos = afiliados.slice(-1);
      document.getElementById('ultimosAfiliados').textContent = ultimos.length
        ? `${ultimos[0].nombre} ${ultimos[0].apellido}`
        : 'No hay afiliados registrados';
  
    } catch (error) {
      console.error('Error cargando afiliados:', error);
    }
  });
  