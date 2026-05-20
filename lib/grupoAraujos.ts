// lib/grupoAraujos.ts
const API_BASE = "https://grupoaraujos.cloud/api/v1";

async function obtenerTokenContable() {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: process.env.API_CONTABLE_EMAIL || "soporte@disar-ec.com",
        password: process.env.API_CONTABLE_PASSWORD || "admin123",
      }),
    });
    const resData = await response.json();
    return resData.data?.access_token || null;
  } catch (error) {
    console.error(">>> [LOG SERVIDOR] Error obteniendo Token:", error);
    return null;
  }
}

// En tu archivo src/lib/grupoAraujos.ts (o donde tengas la función)

export async function consultarClienteExterno(cedula: string) {
  try {
    const API_BASE = "https://grupoaraujos.cloud/api/v1";
    
    // 1. Login para obtener el token activo
    const tokenResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: process.env.API_CONTABLE_EMAIL || "soporte@disar-ec.com",
        password: process.env.API_CONTABLE_PASSWORD || "admin123",
      }),
    });
    
    if (!tokenResponse.ok) return null;
    const tokenData = await tokenResponse.json();
    const token = tokenData.data?.access_token || tokenData.access_token;

    // 🎯 LA SOLUCIÓN: Pasarle el query de búsqueda de identificación en la URL
    // Dependiendo de tu Swagger, suele ser ?search=${cedula} o ?identification=${cedula}
    const url = `${API_BASE}/clients?search=${cedula}&size=1`;
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "x-company-id": "1",
        "User-Agent": "Mozilla/5.0"
      },
      cache: 'no-store'
    });

    if (!res.ok) return null;
    const dataJSON = await res.json();

    // Como la API devuelve un array filtrado en .data o .items, extraemos el primero
    const listaClientes = dataJSON.data || dataJSON.items || (Array.isArray(dataJSON) ? dataJSON : []);
    
    if (listaClientes.length === 0) {
      console.log(`>>> [LOG SERVIDOR] Cédula ${cedula} no arrojó resultados filtrados en Araujos.`);
      return null;
    }

    // Buscamos coincidencia exacta por si acaso
    const clienteEncontrado = listaClientes.find((c: any) => c.identification === cedula) || listaClientes[0];

    return {
      idInterno: clienteEncontrado.id,
      nombre: clienteEncontrado.full_name || clienteEncontrado.business_name || "CLIENTE REGISTRADO",
      existe: true
    };

  } catch (error) {
    console.error("Error en consultarClienteExterno:", error);
    return null;
  }
}