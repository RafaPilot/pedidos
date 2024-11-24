const airtableApiKey = 'patro3YuvesSmzYN5.a79b01e01bae89bf4b2985d1a9422c4e2664544053106cccfcddc701f3767bbc';
const airtableBaseId = 'appR2YxcBf4yz2g9t';
const tableName = 'Flujo de Caja';

const airtableFetch = async (method, endpoint, body = null) => {
    const url = `https://api.airtable.com/v0/${airtableBaseId}/${endpoint}`;
    const headers = {
        Authorization: `Bearer ${airtableApiKey}`,
        'Content-Type': 'application/json',
    };

    const options = {
        method,
        headers,
        body: body ? JSON.stringify(body) : null,
    };

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorResponse = await response.json();
            throw new Error(`Error en Airtable: ${JSON.stringify(errorResponse)}`);
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error; // Propaga el error para que pueda manejarse en otras partes del código.
    }
};

// Agregar registro
const agregarRegistro = async (registro) => {
    try {
        // Convertir la fecha al formato ISO 8601 (Airtable lo requiere)
        if (registro.fields.Fecha) {
            registro.fields.Fecha = new Date(registro.fields.Fecha).toISOString().split('T')[0];
        }

        const response = await airtableFetch('POST', tableName, { records: [registro] });
        console.log('Registro agregado:', response);
        return response;
    } catch (error) {
        console.error('Error al agregar el registro:', error);
        throw error;
    }
};

export { agregarRegistro };

