import { obtenerRegistros, actualizarRegistro } from './airtable-config.js';

const tablaCuentas = document.getElementById('tabla-cuentas-cobrar').querySelector('tbody');
const totalMontoElement = document.getElementById('total-monto');
const buscadorCliente = document.getElementById('buscador-cliente'); // Nuevo elemento del buscador

let cuentasPorCobrar = []; // Almacena todas las cuentas por cobrar para el filtrado

// Función para cargar las cuentas por cobrar desde "Estado de Pedido"
async function cargarCuentasPorCobrar() {
  try {
    const registros = await obtenerRegistros('Estado de Pedido');
    cuentasPorCobrar = registros.filter((registro) => {
      const estado = registro.fields.Estado;
      return estado === 'Pendiente' || estado === 'Completado';
    });

    mostrarCuentas(cuentasPorCobrar); // Muestra todas las cuentas al cargar
  } catch (error) {
    console.error('Error al cargar cuentas:', error);
  }
}

// Función para mostrar las cuentas en la tabla
function mostrarCuentas(cuentas) {
  tablaCuentas.innerHTML = ''; // Limpia la tabla antes de cargar los datos
  let totalMonto = 0; // Variable para sumar los montos

  // Mostrar los registros en la tabla
  cuentas.forEach((registro) => {
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
  totalMontoElement.innerHTML = `<strong>${totalMonto.toFixed(2)}</strong>`;
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

// Función para filtrar cuentas por el nombre del cliente
function filtrarCuentas() {
  const terminoBusqueda = buscadorCliente.value.toLowerCase();
  const cuentasFiltradas = cuentasPorCobrar.filter((registro) => {
    const cliente = registro.fields.Cliente || '';
    return cliente.toLowerCase().includes(terminoBusqueda);
  });
  mostrarCuentas(cuentasFiltradas); // Muestra las cuentas filtradas
}

// Escuchar el evento input en el buscador
buscadorCliente.addEventListener('input', filtrarCuentas);

// Cargar las cuentas al iniciar la página
window.onload = cargarCuentasPorCobrar;
