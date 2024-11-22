import { airtableFetch } from './airtable-config.js';
import { auth } from './firebase-config.js';

const clienteInput = document.getElementById("cliente");
const listaClientes = document.getElementById("clientes-list");
const nuevoClienteMsg = document.getElementById("nuevo-cliente-msg");

// ----------------- CARGAR CLIENTES -----------------
const cargarClientes = async () => {
  try {
    const clientes = await airtableFetch("Clientes", "GET");
    listaClientes.innerHTML = ""; // Limpiar datalist
    clientes.records.forEach(record => {
      const option = document.createElement("option");
      option.value = record.fields.Nombre; // Usar el nombre del cliente
      listaClientes.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar los clientes:", error);
  }
};

if (clienteInput) {
  clienteInput.addEventListener("input", () => {
    const clienteIngresado = clienteInput.value.trim();
    const clienteExistente = Array.from(listaClientes.options).some(
      option => option.value === clienteIngresado
    );

    if (!clienteExistente && clienteIngresado.length > 0) {
      nuevoClienteMsg.innerHTML = `
        ¿Cliente no encontrado? 
        <button onclick="location.href='../clientes.html'">Crear Cliente</button>`;
    } else {
      nuevoClienteMsg.innerHTML = "";
    }
  });
}

// ----------------- PEDIDOS -----------------
const pedidoForm = document.getElementById("pedido-form");
const tablaPedidos = document.getElementById("tabla-pedidos");

if (pedidoForm) {
  pedidoForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const cliente = clienteInput.value.trim();
    const producto = document.getElementById("producto").value.trim();
    const cantidad = parseInt(document.getElementById("cantidad").value, 10);
    const fecha = document.getElementById("fecha").value;

    if (!cliente || !producto || isNaN(cantidad) || cantidad <= 0 || !fecha) {
      alert("Por favor, completa todos los campos correctamente.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("Por favor, inicia sesión para registrar pedidos.");
      window.location.href = "index.html";
      return;
    }

    const data = {
      Cliente: cliente,
      Producto: producto,
      Cantidad: cantidad,
      Fecha: fecha,
      Estado: "pendiente",
      userID: user.uid,
      email: user.email
    };

    try {
      // Registrar pedido
      const pedidoResponse = await airtableFetch("Pedidos", "POST", { fields: data });

      if (!pedidoResponse || !pedidoResponse.id) {
        throw new Error("Error al registrar el pedido.");
      }

      // Registrar estado
      const estadoData = {
        PedidoID: [pedidoResponse.id], // ID del pedido registrado
        Cliente: cliente,
        Estado: "pendiente"
      };

      await airtableFetch("Estado de Pedido", "POST", { fields: estadoData });

      agregarFilaATabla(pedidoResponse.fields);
      pedidoForm.reset();
    } catch (error) {
      console.error("Error al registrar el pedido:", error);
      alert("Hubo un problema al registrar el pedido. Intenta de nuevo.");
    }
  });
}

const agregarFilaATabla = (pedido) => {
  const fila = document.createElement("tr");
  fila.innerHTML = `
    <td>${pedido.Cliente || "N/A"}</td>
    <td>${pedido.Producto || "N/A"}</td>
    <td>${pedido.Cantidad || "N/A"}</td>
    <td>${pedido.Fecha || "N/A"}</td>
  `;
  tablaPedidos.appendChild(fila);
};

if (tablaPedidos) {
  cargarClientes(); // Cargar clientes para autocompletado
}
