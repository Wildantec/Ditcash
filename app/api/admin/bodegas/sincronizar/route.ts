import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const API_BASE = "https://grupoaraujos.cloud/api/v1";
    
    const tokenResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: process.env.API_CONTABLE_EMAIL || "soporte@disar-ec.com",
        password: process.env.API_CONTABLE_PASSWORD || "admin123",
      }),
    });
    
    if (!tokenResponse.ok) return NextResponse.json({ success: false, data: [] });
    const tokenData = await tokenResponse.json();
    const token = tokenData.data?.access_token || tokenData.access_token;

    const res = await fetch(`${API_BASE}/warehouses/`, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "x-company-id": "1",
        "User-Agent": "Mozilla/5.0"
      },
      cache: 'no-store'
    });
    
    if (!res.ok) return NextResponse.json({ success: false, data: [] });
    const json = await res.json();
    const bodegasAraujos = json.data || [];

    const configsLocales = await prisma.bodegaConfig.findMany();

    const consolidadas = bodegasAraujos.map((bod: any) => {
      const configLocal = configsLocales.find(c => c.id_bodega_araujo === bod.id.toString());
      return {
        id: bod.id.toString(),
        name: bod.name || "BODEGA INDEFINIDA",
        is_main: configLocal ? configLocal.es_principal : false
      };
    });

    return NextResponse.json({ success: true, data: consolidadas });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}