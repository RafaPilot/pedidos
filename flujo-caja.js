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
    pedidoRelacionadoInput.parentElement.style.display = 'block';
  } else if (tipo === 'salida') {
    medioPagoDiv.style.display = 'block';
    detalleSalidaDiv.style.display = 'block';
    pedidoRelacionadoInput.parentElement.style.display = 'none';
  } else {
    medioPagoDiv.style.display = 'none';
    detalleSalidaDiv.style.display = 'none';
    pedidoRelacionadoInput.parentElement.style.display = 'none';
  }
});

// Cargar pedidos en el input de búsqueda
async function cargarPedidos() {
  const pedidos = await obtenerRegistros('Estado de Pedido');
  const pedidosFiltrados = pedidos.filter(pedido => pedido.fields.Estado === 'Pendiente' || pedido.fields.Estado === 'Completado');

  // Autocompletar con los pedidos disponibles
  pedidoRelacionadoInput.addEventListener('input', () => {
    const query = pedidoRelacionadoInput.value.toLowerCase();
    pedidoLista.innerHTML = '';
    
    const resultados = pedidosFiltrados.filter(pedido =>
      `${pedido.fields.Cliente} - ${pedido.fields.Producto} (${pedido.fields.Estado})`.toLowerCase().includes(query)
    );

    resultados.forEach(pedido => {
      const li = document.createElement('li');
      li.textContent = `${pedido.fields.Cliente} - ${pedido.fields.Producto} (${pedido.fields.Estado})`;
      li.dataset.id = pedido.id;
      li.addEventListener('click', () => {
        pedidoRelacionadoInput.value = li.textContent;
        pedidoRelacionadoInput.dataset.id = li.dataset.id;
        pedidoLista.innerHTML = ''; // Limpiar lista después de seleccionar
      });
      pedidoLista.appendChild(li);
    });
  });
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

// Enviar formulario de flujo de caja
flujoCajaForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const concepto = document.getElementById('concepto').value;
  const monto = parseFloat(document.getElementById('monto').value);
  const tipo = tipoSelect.value;
  const medioPago = document.getElementById('medio-pago').value;
  const detalleSalida = document.getElementById('detalle-salida').value;
  const pedidoRelacionadoId = pedidoRelacionadoInput.dataset.id;

  if (monto <= 0) {
    alert('Por favor ingrese un monto válido.');
    return;
  }

  const registro = {
    fields: {
      Concepto: concepto,
      Monto: monto,
      Tipo: tipo,
      'Medio de Pago': medioPago,
      'Detalle Salida': tipo === 'salida' ? detalleSalida : undefined,
      'Pedido Relacionado': pedidoRelacionadoId ? pedidoRelacionadoId : undefined,
      Fecha: new Date().toISOString(),
    }
  };

  await agregarRegistro('Flujo de Caja', registro);
  mensajeExito.textContent = 'Movimiento registrado con éxito';
  mensajeExito.style.display = 'block';

  setTimeout(() => {
    mensajeExito.style.display = 'none';
  }, 3000);

  flujoCajaForm.reset();
  cargarHistorial();
});

cargarPedidos();
cargarHistorial();
