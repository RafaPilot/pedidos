import { obtenerRegistros, actualizarRegistro } from './airtable-config.js';

const tablaCuentas = document.getElementById('tabla-cuentas-cobrar').querySelector('tbody');

// Función para cargar las cuentas por cobrar desde "Estado de Pedido"
async function cargarCuentasPorCobrar() {
  try {
    const registros = await obtenerRegistros('Estado de Pedido');
    tablaCuentas.innerHTML = ''; // Limpia la tabla antes de cargar los datos

    // Filtrar registros con estado "Pendiente" o "Completado"
    const cuentasPorCobrar = registros.filter((registro) => {
      const estado = registro.fields.Estado;
      return estado === 'Pendiente' || estado === 'Completado';
    });

    // Mostrar los registros en la tabla
    cuentasPorCobrar.forEach((registro) => {
      const { Cliente, Monto, Fecha, Estado } = registro.fields;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${Cliente || ''}</td>
        <td>${Monto || 0}</td>
        <td>${Fecha || ''}</td>
        <td>${Estado || ''}</td>
        <td>
          ${
            Estado === 'Pendiente'
              ? `<button onclick="marcarCompletado('${registro.id}')">Marcar como Pagado</button>`
              : ''
          }
        </td>
      `;
      tablaCuentas.appendChild(tr);
    });
  } catch (error) {
    console.error('Error al cargar cuentas:', error);
  }
}

// Función para marcar una cuenta como "Completado"
async function marcarCompletado(id) {
  try {
    await actualizarRegistro('Estado de Pedido', id, { Estado: 'Completado' });
    alert('Cuenta marcada como completada');
    cargarCuentasPorCobrar(); // Recargar la tabla después de la actualización
  } catch (error) {
    console.error('Error al actualizar estado:', error);
  }
}

// Cargar las cuentas al iniciar la página
window.onload = cargarCuentasPorCobrar;
