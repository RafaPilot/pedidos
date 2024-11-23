import { obtenerRegistros, agregarRegistro, actualizarRegistro } from './airtable-config.js';

const flujoCajaForm = document.getElementById('flujo-caja-form');
const tipoSelect = document.getElementById('tipo');
const medioPagoDiv = document.getElementById('medio-pago-div');
const detalleSalidaDiv = document.getElementById('detalle-salida-div');
const pedidoRelacionadoSelect = document.getElementById('pedido-relacionado');
const tablaFlujoCaja = document.getElementById('tabla-flujo-caja');
const saldoEfectivo = document.getElementById('saldo-efectivo');
const saldoBanco = document.getElementById('saldo-banco');
const saldoZelle = document.getElementById('saldo-zelle');
const mensajeExito = document.createElement('div');
mensajeExito.id = 'mensaje-exito';
document.body.appendChild(mensajeExito);

// Estilo para el mensaje de éxito
mensajeExito.style.position = 'fixed';
mensajeExito.style.top = '10px';
mensajeExito.style.right = '10px';
mensajeExito.style.padding = '10px 20px';
mensajeExito.style.backgroundColor = '#4CAF50';
mensajeExito.style.color = '#fff';
mensajeExito.style.borderRadius = '5px';
mensajeExito.style.display = 'none';

// Mostrar/Ocultar campos según el tipo seleccionado
tipoSelect.addEventListener('change', () => {
  const tipo = tipoSelect.value;

  if (tipo === 'entrada') {
    medioPagoDiv.style.display = 'block';
    detalleSalidaDiv.style.display = 'none';
    pedidoRelacionadoSelect.parentElement.style.display = 'block';
  } else if (tipo === 'salida') {
    medioPagoDiv.style.display = 'block';
    detalleSalidaDiv.style.display = 'block';
    pedidoRelacionadoSelect.parentElement.style.display = 'none';
  } else {
    medioPagoDiv.style.display = 'none';
    detalleSalidaDiv.style.display = 'none';
    pedidoRelacionadoSelect.parentElement.style.display = 'none';
  }
});

// Cargar pedidos en el dropdown
async function cargarPedidos() {
  const pedidos = await obtenerRegistros('Estado de Pedido');
  pedidoRelacionadoSelect.innerHTML = '<option value="">Sin Pedido</option>';
  pedidos.forEach(pedido => {
    const cliente = pedido.fields.Cliente || 'Cliente desconocido';
    const producto = pedido.fields.Producto || 'Producto desconocido';
    const estado = pedido.fields.Estado || 'Desconocido';
    const id = pedido.id;

    if (estado === 'Pendiente' || estado === 'Completado') {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = `${cliente} - ${producto} (${estado})`;
      pedidoRelacionadoSelect.appendChild(option);
    }
  });

  // Verificar si se redirigió con datos
  const tipoMovimiento = localStorage.getItem('tipoMovimiento');
  const pedidoRelacionadoId = localStorage.getItem('pedidoRelacionado');

  if (tipoMovimiento && pedidoRelacionadoId) {
    tipoSelect.value = tipoMovimiento;
    pedidoRelacionadoSelect.value = pedidoRelacionadoId;
    medioPagoDiv.style.display = 'block';
    detalleSalidaDiv.style.display = 'none';
    pedidoRelacionadoSelect.parentElement.style.display = 'block';

    // Limpiar `localStorage` para evitar conflictos futuros
    localStorage.removeItem('tipoMovimiento');
    localStorage.removeItem('pedidoRelacionado');
  }
}

// Actualizar resumen de saldos
function actualizarResumen(movimientos) {
  let efectivo = 0, banco = 0, zelle = 0;

  movimientos.forEach(mov => {
    const monto = mov.fields.Monto || 0;
    const medio = mov.fields['Medio de Pago'];
    const tipo = mov.fields.Tipo;

    if (tipo === 'entrada') {
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

// Cargar movimientos en el historial (solo últimos 3)
async function cargarHistorial() {
  const movimientos = await obtenerRegistros('Flujo de Caja');
  const ultimosMovimientos = movimientos.slice(-3).reverse(); // Últimos 3 movimientos
  tablaFlujoCaja.innerHTML = ''; // Limpiar tabla

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

// Mostrar mensaje de éxito
function mostrarMensajeExito() {
  mensajeExito.textContent = 'Movimiento registrado con éxito';
  mensajeExito.style.display = 'block';

  setTimeout(() => {
    mensajeExito.style.display = 'none';
  }, 3000);
}

// Manejar el envío del formulario
flujoCajaForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const concepto = document.getElementById('concepto').value;
  const monto = parseFloat(document.getElementById('monto').value);
  const tipo = tipoSelect.value;
  const medioPago = document.getElementById('medio-pago').value;
  const detalleSalida = document.getElementById('detalle-salida').value;
  const pedidoRelacionado = pedidoRelacionadoSelect.value;
  const fecha = new Date().toISOString().split('T')[0]; // Fecha en formato YYYY-MM-DD

  const nuevoRegistro = {
    Concepto: concepto,
    Monto: monto,
    Tipo: tipo,
    Fecha: fecha,
  };

  if (tipo === 'entrada') {
    nuevoRegistro['Medio de Pago'] = medioPago;
    nuevoRegistro['Pedido Relacionado'] = pedidoRelacionado || 'Sin Pedido';
  } else if (tipo === 'salida') {
    nuevoRegistro['Medio de Pago'] = medioPago;
    nuevoRegistro['Detalle de Salida'] = detalleSalida;
  }

  try {
    await agregarRegistro('Flujo de Caja', nuevoRegistro);

    if (tipo === 'entrada' && pedidoRelacionado) {
      await actualizarRegistro('Estado de Pedido', pedidoRelacionado, { Estado: 'Pagado' });
    }

    cargarHistorial();
    flujoCajaForm.reset();
    medioPagoDiv.style.display = 'none';
    detalleSalidaDiv.style.display = 'none';
    mostrarMensajeExito();
  } catch (error) {
    console.error('Error al agregar registro: ', error);
  }
});

// Inicialización
cargarPedidos();
cargarHistorial();
