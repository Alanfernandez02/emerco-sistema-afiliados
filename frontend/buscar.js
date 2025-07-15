document.getElementById('buscarForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const criterio = document.getElementById('criterio').value;
  
    fetch(`http://localhost:3000/api/afiliados/buscar/${criterio}`)
      .then(res => res.json())
      .then(data => {
        const div = document.getElementById('resultado');
        if (data.length === 0) {
          div.innerHTML = "<p>No se encontró ningún afiliado.</p>";
        } else {
          div.innerHTML = `
            <h3>Resultado</h3>
            <ul>
              ${data.map(a => `
                <li>
                  <strong>${a.nombre} ${a.apellido}</strong><br>
                  DNI: ${a.dni} | CUIT: ${a.cuit} | Grupo: ${a.grupo_familiar}
                </li>`).join('')}
            </ul>
          `;
        }
      })
      .catch(err => {
        console.error(err);
        document.getElementById('resultado').innerHTML = "<p>Error en la búsqueda.</p>";
      });
  });
  