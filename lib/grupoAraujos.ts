// lib/grupoAraujos.ts
const API_BASE = "https://grupoaraujos.cloud/api/v1";

// 🔑 FUNCIÓN ÚNICA PARA OBTENER EL TOKEN
async function obtenerTokenContable() {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: process.env.API_CONTABLE_EMAIL || "soporte@disar-ec.com",
        password: process.env.API_CONTABLE_PASSWORD || "admin123",
      }),
      cache: 'no-store'
    });
    
    if (!response.ok) return null;
    const resData = await response.json();
    return resData.data?.access_token || resData.access_token || null;
  } catch (error) {
    console.error(">>> [LOG SERVIDOR] Error obteniendo Token:", error);
    return null;
  }
}

export async function consultarClienteExterno(cedula: string) {
  try {
    // 1. Login idéntico a tu rama main
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

    // 2. Tu URL exacta de producción que sí barre todas las hojas
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

    const listaClientes = dataJSON.data || dataJSON.items || (Array.isArray(dataJSON) ? dataJSON : []);
    
    if (listaClientes.length === 0) {
      console.log(`>>> [LOG SERVIDOR] Cédula ${cedula} no arrojó resultados filtrados en Araujos.`);
      return null;
    }

    const clienteEncontrado = listaClientes.find((c: any) => c.identification === cedula) || listaClientes[0];

    // 🎯 INTEGRACIÓN PERFECTA: Mapeamos el nombre exacto para que calce con login.ts
    return {
      idInterno: clienteEncontrado.id,
      nombre: (clienteEncontrado.full_name || clienteEncontrado.business_name || "CLIENTE REGISTRADO").toUpperCase().trim(),
      existe: true
    };

  } catch (error) {
    console.error("Error en consultarClienteExterno:", error);
    return null;
  }
}

// 📦 NUEVA FUNCIÓN CON REINTENTOS Y TIMEOUT DE 25 SEGUNDOS PARA EL INVENTARIO
export async function obtenerInventarioConReintento(intentosMaximos = 3, tiempoEsperaMS = 25000) {
  // 1. Obtenemos el token usando la función interna que ya tienes hecha
  const token = await obtenerTokenContable();
  if (!token) {
    console.error("❌ [INVENTARIO] No se pudo obtener el token contable de autenticación.");
    return { error: "Error de autenticación con el proveedor." };
  }

  for (let intento = 1; intento <= intentosMaximos; intento++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), tiempoEsperaMS);

    try {
      console.log(`>>> [INVENTARIO LOCAL] Intento ${intento} de conexión con la API de Araujos...`);

      // 🎯 Modifica esta URL si la ruta del inventario usa parámetros específicos (como size, page, etc)
      const res = await fetch(`${API_BASE}/products?size=100`, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "x-company-id": "1",
          "User-Agent": "Mozilla/5.0"
        },
        signal: controller.signal, // Controla los 25 segundos límites
        cache: 'no-store'
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP Error Status: ${res.status}`);
      }

      const dataJSON = await res.json();
      console.log(`>>> [INVENTARIO LOCAL] ¡Carga exitosa en el intento número ${intento}!`);
      
      // Retornamos la estructura de datos pura para tu frontend
      return dataJSON.data || dataJSON.items || dataJSON;

    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        console.warn(`⚠️ [INVENTARIO LOCAL] El intento ${intento} tardó más de 25s y se canceló.`);
      } else {
        console.error(`❌ [INVENTARIO LOCAL] Falló el intento ${intento}:`, error.message || error);
      }

      // Si quedan intentos, espera 1.5 segundos antes de reintentar la recarga en bucle
      if (intento < intentosMaximos) {
        console.log("🔄 Reintentando consulta en un momento...");
        await new Promise(resolve => setTimeout(resolve, 1500));
      } else {
        // Límite alcanzado, retornamos error controlado para que la interfaz sepa pintarlo
        return { error: "TIMEOUT_ERROR", message: "La API externa de inventario tardó demasiado en responder." };
      }
    }
  }
}