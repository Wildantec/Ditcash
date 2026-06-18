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
      cache: 'no-store'
    });
    
    if (!response.ok) return null;
    const resData = await response.json();
    return resData.data?.access_token || resData.access_token || null;
  } catch (error) {
    return null;
  }
}

export async function consultarClienteExterno(cedula: string) {
  try {
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
      return null;
    }

    const clienteEncontrado = listaClientes.find((c: any) => c.identification === cedula) || listaClientes[0];
    return {
      idInterno: clienteEncontrado.id,
      nombre: (clienteEncontrado.full_name || clienteEncontrado.business_name || "CLIENTE REGISTRADO").toUpperCase().trim(),
      existe: true
    };

  } catch (error) {
    return null;
  }
}
export async function obtenerInventarioConReintento(intentosMaximos = 3, tiempoEsperaMS = 25000) {
  const token = await obtenerTokenContable();
  if (!token) {
    return { error: "Error de autenticación con el proveedor." };
  }

  for (let intento = 1; intento <= intentosMaximos; intento++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), tiempoEsperaMS);

    try {
      const res = await fetch(`${API_BASE}/products?size=100`, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "x-company-id": "1",
          "User-Agent": "Mozilla/5.0"
        },
        signal: controller.signal,
        cache: 'no-store'
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP Error Status: ${res.status}`);
      }

      const dataJSON = await res.json();
      return dataJSON.data || dataJSON.items || dataJSON;

    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
      } else {
      }
      if (intento < intentosMaximos) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      } else {
        return { error: "TIMEOUT_ERROR", message: "La API externa de inventario tardó demasiado en responder." };
      }
    }
  }
}