// Configuración para interactuar con Airtable
const airtableConfig = {
  baseUrl: 'https://api.airtable.com/v0/appR2YxcBf4yz2g9t', // Reemplaza con el ID de tu base
  apiKey: 'patro3YuvesSmzYN5.a79b01e01bae89bf4b2985d1a9422c4e2664544053106cccfcddc701f3767bbc', // Reemplaza con tu API Key de Airtable
};

// Función genérica para realizar solicitudes a Airtable
async function airtableFetch(endpoint, options = {}) {
  const url = `${airtableConfig.baseUrl}/${endpoint}`;
  const config = {
    ...options,
    headers: {
      Authorization: `Bearer ${airtableConfig.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Error en Airtable: ${JSON.stringify(errorData)}`);
  }
  return response.json();
}

// Función para obtener registros de una tabla
async function obtenerRegistros(tabla) {
  try {
    const data = await airtableFetch(`${tabla}?view=Grid%20view`);
    return data.records;
  } catch (error) {
    console.error('Error al obtener registros:', error);
    throw error;
  }
}

// Función para agregar un registro
async function agregarRegistro(tabla, registro) {
  try {
    const data = {
      records: [registro],
    };
    const resultado = await airtableFetch(tabla, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return resultado;
  } catch (error) {
    console.error('Error al agregar registro:', error);
    throw error;
  }
}

export { obtenerRegistros, agregarRegistro };
