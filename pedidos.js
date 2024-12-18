import { agregarRegistro, obtenerRegistros } from './airtable-config.js';

const form = document.getElementById('pedido-form');
const tablaPedidos = document.getElementById('tabla-pedidos');
const clientesList = document.getElementById('clientes-list');
const mensajeExito = document.getElementById('mensaje-exito'); // Asegúrate de tener este elemento en tu HTML

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

// Cargar pedidos en la tabla (solo los últimos 4)
async function cargarPedidos() {
  try {
    const pedidos = await obtenerRegistros('Pedidos');
    const pedidosOrdenados = pedidos.reverse(); // Invertir el orden para mostrar los más recientes primero
    const ultimosPedidos = pedidosOrdenados.slice(0, 4); // Tomar solo los últimos 4 registros

    tablaPedidos.innerHTML = ''; // Limpiar tabla antes de llenarla
    ultimosPedidos.forEach(pedido => {
      const { Cliente, Producto, Cantidad, Fecha, Monto } = pedido.fields;
      const row = `
        <tr>
          <td>${Cliente || ''}</td>
          <td>${Producto || ''}</td>
          <td>${Cantidad || ''}</td>
          <td>${Fecha || ''}</td>
          <td>${Monto ? `$${Monto.toFixed(2)}` : ''}</td>
          <td>
            <button 
              class="pagar-btn" 
              data-id="${pedido.id}" 
              data-cliente="${Cliente || ''}" 
              data-producto="${Producto || ''}" 
              data-monto="${Monto || ''}"
            >
              ¿Pagar?
            </button>
          </td>
        </tr>
      `;
      tablaPedidos.insertAdjacentHTML('beforeend', row);
    });

    // Agregar evento a los botones ¿Pagar?
    document.querySelectorAll('.pagar-btn').forEach(boton => {
      boton.addEventListener('click', (e) => {
        const { id, cliente, producto, monto } = e.target.dataset;

        if (id && cliente && producto && monto) {
          // Guardar datos en localStorage para flujo de caja
          localStorage.setItem('pedidoParaPago', JSON.stringify({ id, cliente, producto, monto }));
          // Redirigir a la pantalla de flujo de caja
          window.location.href = './flujo-caja.html';
        } else {
          console.error('Datos incompletos para redirigir al flujo de caja.');
        }
      });
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
    fields: {
      Cliente: cliente,
      Producto: producto,
      Cantidad: cantidad,
      Fecha: fecha,
      Monto: monto,
    },
  };

  try {
    // Agregar a la tabla "Pedidos"
    const pedidoCreado = await agregarRegistro('Pedidos', nuevoPedido);

    // Sincronizar con la tabla "Estado de Pedido"
    const estadoInicial = {
      fields: {
        PedidoID: pedidoCreado.id,
        Cliente: cliente,
        Producto: producto,
        Cantidad: cantidad,
        Fecha: fecha,
        Monto: monto,
        Estado: 'Pendiente',
      },
    };
    await agregarRegistro('Estado de Pedido', estadoInicial);

    form.reset();
    cargarPedidos();

    // Mostrar mensaje de éxito
    mostrarMensajeExito('Pedido registrado con éxito');
  } catch (error) {
    console.error('Error registrando pedido:', error);
  }
});

// Mostrar mensaje de éxito
function mostrarMensajeExito(mensaje) {
  mensajeExito.textContent = mensaje;
  mensajeExito.style.display = 'block';
  setTimeout(() => {
    mensajeExito.style.display = 'none';
  }, 3000); // El mensaje desaparece después de 3 segundos
}

// Inicializar
cargarClientes();
cargarPedidos();
