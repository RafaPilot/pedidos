import { obtenerRegistros } from './airtable-config.js';

let pedidosOriginales = [];

async function cargarDashboard() {
  pedidosOriginales = await obtenerRegistros('Estado de Pedido');
  actualizarDashboard(pedidosOriginales);
}

function actualizarDashboard(pedidos) {
  // Cálculo de métricas
  const totalIngresos = pedidos.reduce((sum, p) => sum + (p.fields.Monto || 0), 0);
  const numeroPedidos = pedidos.length;
  const ticketPromedio = numeroPedidos ? totalIngresos / numeroPedidos : 0;
  const margenGanancia = totalIngresos * 0.3; // Ejemplo: 30% de ganancia
  const clientesUnicos = [...new Set(pedidos.map(p => p.fields.Cliente))].length;
  const recompra = clientesUnicos ? ((numeroPedidos - clientesUnicos) / clientesUnicos) * 100 : 0;

  // Actualizar métricas en la página
  document.getElementById('ingresos-totales').innerText = `Ingresos Totales: $${totalIngresos.toFixed(2)}`;
  document.getElementById('numero-pedidos').innerText = `Número de Pedidos: ${numeroPedidos}`;
  document.getElementById('ticket-promedio').innerText = `Ticket Promedio: $${ticketPromedio.toFixed(2)}`;
  document.getElementById('margen-ganancia').innerText = `Margen de Ganancia: $${margenGanancia.toFixed(2)}`;
  document.getElementById('tasa-recompra').innerText = `Tasa de Recompra: ${recompra.toFixed(2)}%`;

  // Producto Más Vendido (Basado en la primera palabra)
  const productos = pedidos.reduce((acc, p) => {
    const producto = (p.fields.Producto || '').split(' ')[0]; // Tomar la primera palabra
    acc[producto] = (acc[producto] || 0) + 1; // Contar ocurrencias
    return acc;
  }, {});
  const productoMasVendido = Object.entries(productos).sort((a, b) => b[1] - a[1])[0];
  document.getElementById('producto-mas-vendido').innerText = productoMasVendido ? productoMasVendido[0] : 'N/A';

  // Gráfico: Ingresos por Producto
  generarGrafico('ingresosPorProductoChart', 'bar', Object.keys(productos), Object.values(productos), 'Productos más vendidos', ['#861e91', '#ed1d99', '#4CAF50', '#F44336', '#FF9800']);

  // Gráfico: Estado de Pedidos
  const completados = pedidos.filter(p => p.fields.Estado === 'Completado').length;
  const pendientes = pedidos.filter(p => p.fields.Estado !== 'Completado').length;
  generarGrafico('estadoPedidosChart', 'doughnut', ['Completados', 'Pendientes'], [completados, pendientes], '', ['#4CAF50', '#F44336']);

  // Gráfico: Tendencia de Ingresos
  const ingresosPorMes = pedidos.reduce((acc, p) => {
    const fechaPedido = new Date(p.fields.Fecha);
    const mes = `${fechaPedido.getFullYear()}-${String(fechaPedido.getMonth() + 1).padStart(2, '0')}`;
    acc[mes] = (acc[mes] || 0) + (p.fields.Monto || 0);
    return acc;
  }, {});
  generarGrafico('tendenciaIngresosChart', 'line', Object.keys(ingresosPorMes), Object.values(ingresosPorMes), 'Ingresos por Mes', ['#861e91']);

  // Top 5 Clientes
  const clientes = pedidos.reduce((acc, p) => {
    const cliente = p.fields.Cliente || 'Desconocido';
    acc[cliente] = (acc[cliente] || 0) + (p.fields.Monto || 0);
    return acc;
  }, {});
  const topClientes = Object.entries(clientes).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topClientesList = document.getElementById('top-clientes');
  topClientesList.innerHTML = '';
  topClientes.forEach(([cliente, monto]) => {
    const li = document.createElement('li');
    li.textContent = `${cliente}: $${monto.toFixed(2)}`;
    topClientesList.appendChild(li);
  });

  // Pedidos con Mayor Monto
  const topPedidos = pedidos.sort((a, b) => (b.fields.Monto || 0) - (a.fields.Monto || 0)).slice(0, 5);
  const topPedidosList = document.getElementById('top-pedidos');
  topPedidosList.innerHTML = '';
  topPedidos.forEach(p => {
    const li = document.createElement('li');
    li.textContent = `${p.fields.Producto}: $${p.fields.Monto.toFixed(2)}`;
    topPedidosList.appendChild(li);
  });
}

function generarGrafico(id, type, labels, data, label, colors) {
  new Chart(document.getElementById(id).getContext('2d'), {
    type,
    data: {
      labels,
      datasets: [{
        label,
        data,
        backgroundColor: colors,
        borderColor: '#000',
        borderWidth: 1,
        hoverBackgroundColor: '#FFD700',
      }]
    },
    options: {
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { enabled: true }
      },
      responsive: true,
    }
  });
}

// Filtros
document.getElementById('aplicar-filtros').addEventListener('click', () => {
  const mesSeleccionado = document.getElementById('filtro-mes').value;
  const pedidosFiltrados = pedidosOriginales.filter(p => {
    const fechaPedido = new Date(p.fields.Fecha);
    const mesPedido = `${fechaPedido.getFullYear()}-${String(fechaPedido.getMonth() + 1).padStart(2, '0')}`;
    return mesSeleccionado === mesPedido;
  });
  actualizarDashboard(pedidosFiltrados);
});

document.getElementById('resetear-filtros').addEventListener('click', () => actualizarDashboard(pedidosOriginales));

// Inicializar Dashboard
cargarDashboard();
