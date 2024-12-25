import { obtenerRegistros } from './airtable-config.js';

let flujoDeCaja = [];
let pedidos = [];
let modoPagoChart;
let ingresosPorProductoChart;

async function cargarDashboard() {
  flujoDeCaja = await obtenerRegistros('Flujo de Caja');
  pedidos = await obtenerRegistros('Pedidos');
  actualizarDashboard(flujoDeCaja, pedidos);
}

function actualizarDashboard(flujo, pedidos) {
  const filtroMes = document.getElementById('filtro-mes').value;
  let flujoFiltrado = flujo;
  let pedidosFiltrados = pedidos;

  if (filtroMes) {
    const [anio, mes] = filtroMes.split('-');
    flujoFiltrado = flujo.filter(f => {
      const fecha = new Date(f.fields.Fecha);
      return fecha.getFullYear() === parseInt(anio) && fecha.getMonth() + 1 === parseInt(mes);
    });
    pedidosFiltrados = pedidos.filter(p => {
      const fecha = new Date(p.fields.Fecha);
      return fecha.getFullYear() === parseInt(anio) && fecha.getMonth() + 1 === parseInt(mes);
    });
  }

  const totalIngresos = flujoFiltrado
    .filter(f => f.fields.Tipo === 'entrada')
    .reduce((acc, f) => acc + (f.fields.Monto || 0), 0);

  const totalGastos = flujoFiltrado
    .filter(f => f.fields.Tipo === 'salida')
    .reduce((acc, f) => acc + (f.fields.Monto || 0), 0);

  const balanceNeto = totalIngresos - totalGastos;
  const rentabilidad = totalIngresos > 0 ? ((balanceNeto / totalIngresos) * 100).toFixed(2) : 0;

  const margenGanancia = totalIngresos > 0 ? ((totalIngresos - totalGastos) / totalIngresos * 100).toFixed(2) : 0;

  const totalClientes = [...new Set(pedidosFiltrados.map(p => p.fields.Cliente))].length;
  const ventasPromedioCliente = totalClientes > 0 ? (totalIngresos / totalClientes).toFixed(2) : 0;

  const productosVendidos = pedidosFiltrados.reduce((acc, p) => {
    const producto = p.fields.Producto.split(' ')[0];
    acc[producto] = (acc[producto] || 0) + (p.fields.Cantidad || 0);
    return acc;
  }, {});

  const productosMasVendidos = Object.entries(productosVendidos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topClientes = pedidosFiltrados.reduce((acc, p) => {
    const cliente = p.fields.Cliente;
    acc[cliente] = (acc[cliente] || 0) + (p.fields.Monto || 0);
    return acc;
  }, {});

  const topClientesList = Object.entries(topClientes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  actualizarMetrica('ingresos-totales', totalIngresos);
  actualizarMetrica('gastos-totales', totalGastos);
  actualizarMetrica('balance-neto', balanceNeto);
  actualizarMetrica('rentabilidad', rentabilidad + '%');
  actualizarMetrica('margen-ganancia', margenGanancia + '%');
  actualizarMetrica('ventas-promedio-cliente', `$${ventasPromedioCliente}`);
  actualizarTopLista('top-clientes', topClientesList, true);
  actualizarTopLista('productos-mas-vendidos', productosMasVendidos, false);

  actualizarGraficoPie(flujoFiltrado, 'modoPagoChart', 'Medio de Pago');
  actualizarGraficoBarras(productosVendidos, 'ingresosPorProductoChart', 'Productos Más Vendidos');
}

function actualizarMetrica(id, valor) {
  const elemento = document.getElementById(id);
  if (!elemento) return;
  elemento.querySelector('p').textContent = typeof valor === 'number' ? `$${valor.toFixed(2)}` : valor;
}

function actualizarTopLista(id, items, esMoneda = true) {
  const elemento = document.getElementById(id);
  if (!elemento) return;
  const lista = elemento.querySelector('ul');
  lista.innerHTML = '';
  items.forEach(([key, value]) => {
    const li = document.createElement('li');
    li.textContent = esMoneda ? `${key}: $${value.toFixed(2)}` : `${key}: ${value}`;
    lista.appendChild(li);
  });
}

function actualizarGraficoPie(data, id, key) {
  const ctx = document.getElementById(id);
  if (!ctx) return;

  const groupedData = data.reduce((acc, item) => {
    const label = item.fields[key];
    acc[label] = (acc[label] || 0) + (item.fields.Monto || 0);
    return acc;
  }, {});

  const labels = Object.keys(groupedData);
  const valores = Object.values(groupedData);

  if (modoPagoChart) modoPagoChart.destroy();
  modoPagoChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{ data: valores, backgroundColor: ['#4CAF50', '#FFC107', '#E53935', '#2196F3'] }],
    },
  });
}

function actualizarGraficoBarras(data, id, title) {
  const ctx = document.getElementById(id);
  if (!ctx) return;

  const labels = Object.keys(data);
  const valores = Object.values(data);

  if (ingresosPorProductoChart) ingresosPorProductoChart.destroy();
  ingresosPorProductoChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ data: valores, label: title, backgroundColor: '#2196F3' }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
    },
  });
}

document.getElementById('aplicar-filtros').addEventListener('click', () => actualizarDashboard(flujoDeCaja, pedidos));
document.getElementById('resetear-filtros').addEventListener('click', () => {
  document.getElementById('filtro-mes').value = '';
  actualizarDashboard(flujoDeCaja, pedidos);
});

cargarDashboard();
  
