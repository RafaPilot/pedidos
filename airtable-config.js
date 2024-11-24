const airtableUrl = 'https://api.airtable.com/v0/appR2YxcBf4yz2g9t';
const airtableApiKey = 'patro3YuvesSmzYN5.a79b01e01bae89bf4b2985d1a9422c4e2664544053106cccfcddc701f3767bbc';

// Función genérica para interactuar con Airtable
async function airtableFetch(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${airtableApiKey}`,
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error en Airtable: ${error}`);
  }

  return response.json();
}

// Función para agregar un registro
export async function agregarRegistro(tabla, datos) {
  const url = `${airtableUrl}/${tabla}`;
  return airtableFetch(url, {
    method: 'POST',
    body: JSON.stringify(datos), // Quitamos el envoltorio adicional
  });
}

// Función para obtener registros
export async function obtenerRegistros(tabla) {
  const url = `${airtableUrl}/${tabla}`;
  const data = await airtableFetch(url);
  return data.records;
}

// Función para actualizar un registro
export async function actualizarRegistro(tabla, id, datos) {
  const url = `${airtableUrl}/${tabla}/${id}`;
  return airtableFetch(url, {
    method: 'PATCH',
    body: JSON.stringify(datos),
  });
}
