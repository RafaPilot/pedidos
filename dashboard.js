import { obtenerRegistros } from './airtable-config.js';

async function cargarDashboard() {
  const pedidos = await obtenerRegistros('Estado de Pedido');

  // Resumen
  const totalPedidos = pedidos.length;
  const pedidosCompletados = pedidos.filter(p => p.fields.Estado === 'Completado').length;
  const pedidosPendientes = totalPedidos - pedidosCompletados;
  const totalIngresos = pedidos
    .filter(p => p.fields.Estado === 'Completado')
    .reduce((sum, p) => sum + (p.fields.Monto || 0), 0);

  // Actualizar resumen en la página
  document.getElementById('total-pedidos').innerText = `Total Pedidos: ${totalPedidos}`;
  document.getElementById('pedidos-completados').innerText = `Pedidos Completados: ${pedidosCompletados}`;
  document.getElementById('pedidos-pendientes').innerText = `Pedidos Pendientes: ${pedidosPendientes}`;
  document.getElementById('total-ingresos').innerText = `Total Ingresos: $${totalIngresos.toFixed(2)}`;

  // Gráficos
  const ctxEstadoPedidos = document.getElementById('estadoPedidosChart').getContext('2d');
  new Chart(ctxEstadoPedidos, {
    type: 'pie',
    data: {
      labels: ['Completados', 'Pendientes'],
      datasets: [{
        data: [pedidosCompletados, pedidosPendientes],
        backgroundColor: ['#4CAF50', '#F44336']
      }]
    },
    options: {
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });

  // Tendencia de pedidos por fecha
  const pedidosPorFecha = pedidos.reduce((acc, p) => {
    const fecha = p.fields.Fecha || 'Sin Fecha';
    acc[fecha] = (acc[fecha] || 0) + 1;
    return acc;
  }, {});
  const ctxTendenciaPedidos = document.getElementById('tendenciaPedidosChart').getContext('2d');
  new Chart(ctxTendenciaPedidos, {
    type: 'line',
    data: {
      labels: Object.keys(pedidosPorFecha),
      datasets: [{
        label: 'Pedidos por Fecha',
        data: Object.values(pedidosPorFecha),
        borderColor: '#861e91',
        fill: false
      }]
    },
    options: {
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });

  // Productos vendidos
  const productosVendidos = pedidos.reduce((acc, p) => {
    const producto = p.fields.Producto || 'Sin Producto';
    acc[producto] = (acc[producto] || 0) + (p.fields.Cantidad || 0);
    return acc;
  }, {});
  const ctxProductosVendidos = document.getElementById('productosVendidosChart').getContext('2d');
  new Chart(ctxProductosVendidos, {
    type: 'bar',
    data: {
      labels: Object.keys(productosVendidos),
      datasets: [{
        label: 'Cantidad Vendida',
        data: Object.values(productosVendidos),
        backgroundColor: '#ed1d99'
      }]
    },
    options: {
      plugins: {
        legend: { position: 'bottom' }
      },
      scales: {
        x: { beginAtZero: true },
        y: { beginAtZero: true }
      }
    }
  });

  // Top 5 Clientes
  const clientes = pedidos.reduce((acc, p) => {
    const cliente = p.fields.Cliente || 'Desconocido';
    acc[cliente] = (acc[cliente] || 0) + (p.fields.Monto || 0);
    return acc;
  }, {});
  const topClientes = Object.entries(clientes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topClientesList = document.getElementById('top-clientes');
  topClientes.forEach(([cliente, monto]) => {
    const li = document.createElement('li');
    li.textContent = `${cliente}: $${monto.toFixed(2)}`;
    topClientesList.appendChild(li);
  });

  // Producto más vendido este mes
  const fechaActual = new Date();
  const mesActual = fechaActual.getMonth() + 1;
  const productosEsteMes = pedidos.filter(p => {
    const fechaPedido = new Date(p.fields.Fecha);
    return fechaPedido.getMonth() + 1 === mesActual;
  });

  const productoMasVendido = productosEsteMes.reduce((acc, p) => {
    const producto = p.fields.Producto || 'Sin Producto';
    acc[producto] = (acc[producto] || 0) + (p.fields.Cantidad || 0);
    return acc;
  }, {});

  const productoMasVendidoNombre = Object.entries(productoMasVendido)
    .sort((a, b) => b[1] - a[1])[0][0];

  document.getElementById('producto-mas-vendido').textContent = productoMasVendidoNombre;
}

// Inicializar el dashboard
cargarDashboard();
