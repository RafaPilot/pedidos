import { agregarRegistro, obtenerRegistros } from './airtable-config.js';

const form = document.getElementById('pedido-form');
const tablaPedidos = document.getElementById('tabla-pedidos');
const clientesList = document.getElementById('clientes-list');

// Cargar clientes en el datalist
async function cargarClientes() {
  try {
    const clientes = await obtenerRegistros('Clientes');
    clientesList.innerHTML = '';
    clientes.forEach(cliente => {
      const option = document.createElement('option');
      option.value = cliente.fields.Nombre;
      clientesList.appendChild(option);
    });
  } catch (error) {
    console.error('Error cargando clientes:', error);
  }
}

// Cargar pedidos en la tabla
async function cargarPedidos() {
  try {
    const pedidos = await obtenerRegistros('Pedidos');
    tablaPedidos.innerHTML = '';
    pedidos.forEach(pedido => {
      const { Cliente, Producto, Cantidad, Fecha, Monto } = pedido.fields;
      const row = `
        <tr>
          <td>${Cliente || ''}</td>
          <td>${Producto || ''}</td>
          <td>${Cantidad || ''}</td>
          <td>${Fecha || ''}</td>
          <td>${Monto ? `$${Monto.toFixed(2)}` : ''}</td>
        </tr>
      `;
      tablaPedidos.insertAdjacentHTML('beforeend', row);
    });
  } catch (error) {
    console.error('Error cargando pedidos:', error);
  }
}

// Registrar un nuevo pedido
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const cliente = document.getElementById('cliente').value;
  const producto = document.getElementById('producto').value;
  const cantidad = parseInt(document.getElementById('cantidad').value, 10);
  const fecha = document.getElementById('fecha').value;
  const monto = parseFloat(document.getElementById('monto').value);

  if (isNaN(cantidad) || isNaN(monto)) {
    alert('La cantidad y el monto deben ser valores numéricos válidos.');
    return;
  }

  const nuevoPedido = {
    Cliente: cliente,
    Producto: producto,
    Cantidad: cantidad,
    Fecha: fecha,
    Monto: monto,
  };

  try {
    // Agregar a la tabla "Pedidos"
    const pedidoCreado = await agregarRegistro('Pedidos', nuevoPedido);

    // Sincronizar con la tabla "Estado de Pedido"
    const estadoInicial = {
      PedidoID: pedidoCreado.id,
      Cliente: cliente,
      Producto: producto,
      Cantidad: cantidad,
      Fecha: fecha,
      Monto: monto,
      Estado: 'Pendiente',
    };
    await agregarRegistro('Estado de Pedido', estadoInicial);

    form.reset();
    cargarPedidos();
  } catch (error) {
    console.error('Error registrando pedido:', error);
  }
});

// Inicializar
cargarClientes();
cargarPedidos();
