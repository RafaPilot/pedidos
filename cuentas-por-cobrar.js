import { obtenerRegistros, actualizarRegistro } from './airtable-config.js';

const tablaCuentas = document.getElementById('tabla-cuentas-cobrar').querySelector('tbody');
const totalMontoElement = document.getElementById('total-monto');

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

    let totalMonto = 0; // Variable para sumar los montos

    // Mostrar los registros en la tabla
    cuentasPorCobrar.forEach((registro) => {
      const { Cliente, Monto, Fecha, Estado } = registro.fields;
      const montoValue = parseFloat(Monto) || 0; // Convertir el monto a número o usar 0 si está vacío
      totalMonto += montoValue; // Sumar el monto actual al total

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${Cliente || ''}</td>
        <td>${montoValue.toFixed(2)}</td>
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

    // Mostrar el total en el pie de la tabla con negritas
    totalMontoElement.innerHTML = `<strong>${totalMonto.toFixed(2)}</strong>`; // Resaltar el monto total en negritas
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
