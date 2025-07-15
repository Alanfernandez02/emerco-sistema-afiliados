// frontend/gestionar.js
document.addEventListener('DOMContentLoaded', () => {
  const API = `${window.location.origin}/api/afiliados`;
  const tablaBody  = document.querySelector('#tablaAfiliados tbody');
  const filterInput= document.getElementById('filterInput');
  const spinner    = document.getElementById('spinner');
  const toastCont  = document.getElementById('toast-container');

  const modal      = document.getElementById('modal');
  const form       = document.getElementById('modal-form');
  const btnNew     = document.getElementById('btnNew');
  const btnClose   = document.getElementById('modal-close');
  const btnCancel  = document.getElementById('cancel-btn');
  const hiddenId   = document.getElementById('afiliado-id');

  const campos = [
    'dni','cuit','nombre','apellido','parentesco',
    'fecha_nacimiento','edad','nacionalidad','email',
    'grupo_familiar','calle','numero','codigo_postal',
    'barrio','localidad','telefono','plann','estado','fecha_alta'
  ];

  // Spinner
  function showSpinner() { spinner.classList.remove('hidden'); spinner.setAttribute('aria-hidden','false'); }
  function hideSpinner() { spinner.classList.add('hidden'); spinner.setAttribute('aria-hidden','true'); }

  // Toasts
  function showToast(msg, type='info') {
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    toastCont.appendChild(t);
    setTimeout(() => {
      t.classList.add('hide');
      t.addEventListener('transitionend', () => t.remove());
    }, 2500);
  }

  // Modal
  function openModal(isNew=true, data={}) {
    if (isNew) {
      document.getElementById('modal-title').textContent = 'Nuevo Afiliado';
      form.reset();
      hiddenId.value = '';
    } else {
      document.getElementById('modal-title').textContent = `Editar Afiliado #${data.id}`;
      campos.forEach(f => form[f].value = data[f] ?? '');
      hiddenId.value = data.id;
    }
    modal.classList.remove('hidden');
    form.querySelector('input, select, textarea').focus();
  }
  function closeModal() {
    modal.classList.add('hidden');
    btnNew.focus();
  }

  // Carga y renderiza la tabla
  async function loadTable() {
    showSpinner();
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error('No se pudo cargar');
      const list = await res.json();
      tablaBody.innerHTML = list.map(a => `
        <tr>
          <td>${a.id}</td>
          <td>${a.dni}</td>
          <td>${a.nombre}</td>
          <td>${a.apellido}</td>
          <td>${a.plann}</td>
          <td>${a.estado}</td>
          <td class="actions">
            <button class="btn-icon edit"   data-id="${a.id}"><i class="fa-solid fa-pen-to-square"></i></button>
            <button class="btn-icon delete" data-id="${a.id}"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>
      `).join('');
      hideSpinner();
      attachRowEvents();
    } catch(err) {
      hideSpinner();
      tablaBody.innerHTML = `<tr><td colspan="7" class="error">Error: ${err.message}</td></tr>`;
      showToast(err.message, 'danger');
    }
  }

  // Filtrado en vivo
  filterInput.addEventListener('input', () => {
    const term = filterInput.value.toLowerCase();
    document.querySelectorAll('#tablaAfiliados tbody tr').forEach(tr => {
      tr.style.display = tr.textContent.toLowerCase().includes(term) ? '' : 'none';
    });
  });

  // Asocia eventos Edit/Delete
  function attachRowEvents() {
    document.querySelectorAll('.edit').forEach(btn => btn.onclick = async () => {
      const id = btn.dataset.id;
      showSpinner();
      const r = await fetch(`${API}/${id}`);
      const data = await r.json();
      hideSpinner();
      openModal(false, data);
    });
    document.querySelectorAll('.delete').forEach(btn => btn.onclick = async () => {
      if (!confirm('Eliminar este afiliado?')) return;
      showSpinner();
      const r = await fetch(`${API}/${btn.dataset.id}`, { method:'DELETE' });
      hideSpinner();
      if (r.ok) {
        showToast('Eliminado', 'success');
        loadTable();
      } else showToast('Error al eliminar', 'danger');
    });
  }

  // Submit del formulario
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const id = hiddenId.value;
    const payload = {};
    campos.forEach(f => payload[f] = form[f].value);

    showSpinner();
    const r = await fetch(id ? `${API}/${id}` : API, {
      method: id ? 'PUT' : 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    hideSpinner();
    if (r.ok) {
      showToast(id ? 'Actualizado' : 'Creado', 'success');
      closeModal();
      loadTable();
    } else {
      const msg = await r.text();
      showToast(msg, 'danger');
    }
  });

  // Eventos de abrir/cerrar modal
  btnNew.addEventListener('click', () => openModal());
  btnClose.addEventListener('click', closeModal);
  btnCancel.addEventListener('click', closeModal);

  // Inicial
  loadTable();
});
