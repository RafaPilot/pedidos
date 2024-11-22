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
}

// Inicializar el dashboard
cargarDashboard();
