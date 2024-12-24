import { obtenerRegistros, agregarRegistro, actualizarRegistro } from './airtable-config.js';

const flujoCajaForm = document.getElementById('flujo-caja-form');
const tipoSelect = document.getElementById('tipo');
const medioPagoDiv = document.getElementById('medio-pago-div');
const detalleSalidaDiv = document.getElementById('detalle-salida-div');
const pedidoRelacionadoInput = document.getElementById('pedido-relacionado');
const pedidoLista = document.getElementById('pedido-lista');
const tablaFlujoCaja = document.getElementById('tabla-flujo-caja');
const saldoEfectivo = document.getElementById('saldo-efectivo');
const saldoBanco = document.getElementById('saldo-banco');
const saldoZelle = document.getElementById('saldo-zelle');

// Mostrar/Ocultar campos según el tipo seleccionado
tipoSelect.addEventListener('change', () => {
  const tipo = tipoSelect.value;
  medioPagoDiv.style.display = tipo ? 'block' : 'none';
  detalleSalidaDiv.style.display = tipo === 'salida' ? 'block' : 'none';
  pedidoRelacionadoInput.parentElement.style.display = ['entrada', 'abono'].includes(tipo) ? 'block' : 'none';
});

// Cargar pedidos en el input de búsqueda
async function cargarPedidos() {
  // Obtener todos los pedidos de Airtable
  const pedidos = await obtenerRegistros('Estado de Pedido');

  // Filtrar los pedidos con estado 'Pendiente', 'Completado', o 'Abono'
  const pedidosFiltrados = pedidos.filter(pedido => ['Pendiente', 'Completado', 'Abono'].includes(pedido.fields.Estado));

  pedidoRelacionadoInput.addEventListener('input', () => {
    const query = pedidoRelacionadoInput.value.toLowerCase();
    pedidoLista.innerHTML = '';

    // Filtrar los pedidos según la búsqueda
    pedidosFiltrados.forEach(pedido => {
      if (`${pedido.fields.Cliente} - ${pedido.fields.Producto}`.toLowerCase().includes(query)) {
        const li = document.createElement('li');
        li.textContent = `${pedido.fields.Cliente} - ${pedido.fields.Producto}`;
        li.dataset.id = pedido.id;
        li.addEventListener('click', () => {
          pedidoRelacionadoInput.value = li.textContent;
          pedidoRelacionadoInput.dataset.id = li.dataset.id;
          pedidoLista.innerHTML = '';
        });
        pedidoLista.appendChild(li);
      }
    });
  });
}

// Cargar movimientos recientes en la tabla (limitar a los últimos 5)
async function cargarHistorial() {
  const movimientos = await obtenerRegistros('Flujo de Caja');
  const ultimosMovimientos = movimientos.reverse().slice(0, 5); // Las últimas 5 transacciones

  tablaFlujoCaja.innerHTML = '';
  ultimosMovimientos.forEach(mov => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${mov.fields.Concepto || ''}</td>
      <td>${mov.fields.Monto || 0}</td>
      <td>${mov.fields.Tipo || ''}</td>
      <td>${mov.fields['Medio de Pago'] || ''}</td>
      <td>${mov.fields['Pedido Relacionado'] || ''}</td>
      <td>${mov.fields.Fecha || ''}</td>
    `;
    tablaFlujoCaja.appendChild(row);
  });

  actualizarResumen(movimientos);
}

// Actualizar resumen de saldos
function actualizarResumen(movimientos) {
  let efectivo = 0, banco = 0, zelle = 0;

  movimientos.forEach(mov => {
    const monto = mov.fields.Monto || 0;
    const medio = mov.fields['Medio de Pago'];
    const tipo = mov.fields.Tipo;

    if (tipo === 'entrada' || tipo === 'abono') {
      if (medio === 'efectivo') efectivo += monto;
      if (medio === 'banco') banco += monto;
      if (medio === 'zelle') zelle += monto;
    } else if (tipo === 'salida') {
      if (medio === 'efectivo') efectivo -= monto;
      if (medio === 'banco') banco -= monto;
      if (medio === 'zelle') zelle -= monto;
    }
  });

  saldoEfectivo.textContent = efectivo.toFixed(2);
  saldoBanco.textContent = banco.toFixed(2);
  saldoZelle.textContent = zelle.toFixed(2);
}

// Enviar formulario de flujo de caja
flujoCajaForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const concepto = document.getElementById('concepto').value;
  const monto = parseFloat(document.getElementById('monto').value);
  const tipo = tipoSelect.value;
  const medioPago = document.getElementById('medio-pago').value;
  const detalleSalida = document.getElementById('detalle-salida').value || null;
  const pedidoRelacionadoId = pedidoRelacionadoInput.dataset.id || null;

  const registro = {
    fields: {
      Concepto: concepto,
      Monto: monto,
      Tipo: tipo,
      'Medio de Pago': medioPago,
      'Detalle Salida': detalleSalida,
      'Pedido Relacionado': pedidoRelacionadoId,
      Fecha: new Date().toISOString().split('T')[0], // Solo la fecha
    },
  };

  try {
    await agregarRegistro('Flujo de Caja', registro);

    if (pedidoRelacionadoId) {
      const pedidos = await obtenerRegistros('Estado de Pedido');
      const pedidoEncontrado = pedidos.find(p => p.id === pedidoRelacionadoId);

      if (pedidoEncontrado && tipo === 'abono') {
        const montoTotal = pedidoEncontrado.fields.Monto || 0; // Tomar el monto del pedido
        const montoRestante = (pedidoEncontrado.fields['Monto Restante'] || montoTotal) - monto;

        // Actualizar el pedido con el monto restante
        await actualizarRegistro('Estado de Pedido', pedidoRelacionadoId, {
          Estado: montoRestante > 0 ? 'Abono' : 'Pagado', // Si el monto restante es mayor que 0, queda como 'Abono', sino 'Pagado'
          'Monto Restante': montoRestante > 0 ? montoRestante : 0,
        });
      } else if (tipo === 'entrada' && pedidoRelacionadoId) {
        // Si es una entrada y hay un pedido relacionado, cambiar estado a 'Pagado'
        await actualizarRegistro('Estado de Pedido', pedidoRelacionadoId, {
          Estado: 'Pagado',
        });
      }
    }

    alert(tipo === 'entrada' ? 'Entrada registrada con éxito' : tipo === 'abono' ? 'Abono registrado con éxito' : 'Gasto registrado con éxito');
    cargarHistorial();
  } catch (error) {
    console.error('Error al agregar registro:', error);
    alert('Hubo un problema al registrar el movimiento. Revisa los datos e inténtalo nuevamente.');
  }

  // Limpiar formulario después del registro
  flujoCajaForm.reset();
  tipoSelect.dispatchEvent(new Event('change')); // Para ocultar los campos dinámicos
});

// Inicialización
cargarPedidos();
cargarHistorial();
