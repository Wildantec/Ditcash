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

export async function consultarClienteExterno(cedula: string) {
  const cedulaLimpia = cedula.trim();
  
  try {
    const token = await obtenerTokenContable();
    if (!token) return null;

    const url = `${API_BASE}/clients?identification=${cedulaLimpia}&size=1`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "x-company-id": "1", 
        "User-Agent": "Mozilla/5.0"
      },
      cache: 'no-store'
    });

    const resData = await response.json();
    const lista = resData.data || [];
    const cliente = Array.isArray(lista) ? lista[0] : lista;

    if (!cliente) {
      console.log(`>>> [LOG SERVIDOR] Cliente ${cedulaLimpia} no encontrado.`);
      return null;
    }

    // --- CORRECCIÓN AQUÍ: Validación "anti-crash" ---
    // Usamos encadenamiento opcional ?. y un fallback "" para que trim() nunca falle
    const nombreCrudo = cliente.full_name || cliente.name || "CLIENTE REGISTRADO";
    const nombreReal = String(nombreCrudo).trim().toUpperCase();

    console.log(">>> [LOG SERVIDOR] ¡CLIENTE ENCONTRADO!:", nombreReal);

    return { 
      nombre: nombreReal, 
      existe: true 
    };
  } catch (error) {
    console.error(">>> [LOG SERVIDOR] Error en la conexión con Araujos:", error);
    return null;
  }
}