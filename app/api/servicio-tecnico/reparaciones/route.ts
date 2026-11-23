import { servicioTecnicoAPI } from '@/lib/servicio-tecnico-api'

export async function GET(req: Request) { return servicioTecnicoAPI(req, 'reparaciones') }
export async function POST(req: Request) { return servicioTecnicoAPI(req, 'reparaciones') }
export async function DELETE(req: Request) { return servicioTecnicoAPI(req, 'reparaciones') }
