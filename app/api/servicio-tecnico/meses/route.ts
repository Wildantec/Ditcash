import { servicioTecnicoAPI } from '@/lib/servicio-tecnico-api'

export async function GET(req: Request) { return servicioTecnicoAPI(req, 'meses') }
export async function POST(req: Request) { return servicioTecnicoAPI(req, 'meses') }
export async function PATCH(req: Request) { return servicioTecnicoAPI(req, 'meses') }
