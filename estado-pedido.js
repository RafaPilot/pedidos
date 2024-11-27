import { obtenerRegistros, actualizarRegistro } from './airtable-config.js';

const tablaEstadoPedidos = document.getElementById('tabla-estado-pedidos');
const filtroEstado = document.getElementById('filtro-estado');

// Cargar pedidos y aplicar filtro
async function cargarPedidos(filtro = 'Todos') {
  try {
    const pedidos = await obtenerRegistros('Estado de Pedido');
    tablaEstadoPedidos.innerHTML = '';

    pedidos
      .filter(pedido => filtro === 'Todos' || pedido.fields.Estado === filtro)
      .forEach(pedido => {
        const { PedidoID, Cliente, Producto, Cantidad, Fecha, Estado } = pedido.fields;
        const row = `
          <tr>
            <td>${PedidoID || ''}</td>
            <td>${Cliente || ''}</td>
            <td>${Producto || ''}</td>
            <td>${Cantidad || ''}</td>
            <td>${Fecha || ''}</td>
            <td>${Estado || ''}</td>
            <td>
              ${
                Estado === 'Pendiente'
                  ? `<button class="btn-completar" onclick="actualizarEstadoPedido('${pedido.id}', 'Completado')">Marcar como Completado</button>`
                  : ''
              }
            </td>
          </tr>
        `;
        tablaEstadoPedidos.insertAdjacentHTML('beforeend', row);
      });
  } catch (error) {
    console.error('Error cargando pedidos:', error);
  }
}

// Actualizar estado de pedido
window.actualizarEstadoPedido = async (id, nuevoEstado) => {
  try {
    await actualizarRegistro('Estado de Pedido', id, { Estado: nuevoEstado });
    cargarPedidos(filtroEstado.value);
  } catch (error) {
    console.error('Error actualizando estado de pedido:', error);
  }
};

// Filtrar al cambiar el selector
filtroEstado.addEventListener('change', () => {
  cargarPedidos(filtroEstado.value);
});

// Inicializar
cargarPedidos();
