const BASE_ID = 'appR2YxcBf4yz2g9t'; // Cambia por el ID de tu base
const API_KEY = 'patro3YuvesSmzYN5.a79b01e01bae89bf4b2985d1a9422c4e2664544053106cccfcddc701f3767bbc'; // Asegúrate de tener configurada tu API key correctamente

async function airtableFetch(url, method = 'GET', body = null) {
  const headers = {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  };

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Error en Airtable: ${JSON.stringify(errorData)}`);
  }

  return await response.json();
}

export async function obtenerRegistros(tabla) {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(tabla)}`;
  return (await airtableFetch(url)).records;
}

export async function agregarRegistro(tabla, registro) {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(tabla)}`;
  return await airtableFetch(url, 'POST', registro);
}

export async function actualizarRegistro(tabla, id, campos) {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(tabla)}/${id}`;
  const body = { fields: campos }; // Importante: los campos deben ir dentro de 'fields'
  return await airtableFetch(url, 'PATCH', body);
}
