'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function registrarCierreRutaDiario(data: {
  userId: number
  placaCarro: string
  kmRecorridos: number
}) {
  try {
    const placaNormalizada = data.placaCarro.toUpperCase().trim()

    const vehiculo = await prisma.vehiculo.findUnique({
      where: { placa: placaNormalizada }
    })
    
    if (!vehiculo) {
      return { success: false, error: 'El vehículo con esa placa no está registrado en Ditcash.' }
    }

  
    const rutaActiva = await prisma.registroRutaDiaria.findFirst({
      where: {
        userId: data.userId,
        placaCarro: placaNormalizada,
        procesado: false,
        kmRecorridos: 0
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!rutaActiva) {
      return { success: false, error: 'No se encontró una ruta matutina activa para cerrar en este vehículo.' }
    }

    const nuevoKmActual = vehiculo.kmActual + data.kmRecorridos
    const kmDesdeUltimoAceite = nuevoKmActual - (vehiculo.kmUltimoAceite || 0)
    const dispararAlerta = kmDesdeUltimoAceite >= vehiculo.intervaloAlerta

    await prisma.$transaction([

      prisma.registroRutaDiaria.update({
        where: { id: rutaActiva.id },
        data: {
          kmRecorridos: data.kmRecorridos,
          procesado: true
        }
      }),
      prisma.vehiculo.update({
        where: { id: vehiculo.id },
        data: {
          kmActual: nuevoKmActual,
          alertaMantenimiento: dispararAlerta
        }
      })
    ])

    revalidatePath('/dashboard/combustible/mantenimiento')
    return { success: true, mensaje: `Jornada finalizada. Se registraron ${data.kmRecorridos.toFixed(2)} KM de recorrido automático.` }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function registrarFacturaCombustible(data: {
  id?: number              
  userId: number          
  chofer?: string          
  placaCarro: string      
  gasolineraId: number    
  nombreEstacionManual?: string
  numFactura: string     
  precioTotal: number    
  galones: number        
  fechaFactura: Date      
  metodoPago: string
}) {
  try {
    if (data.id) {
      return await editarFacturaCombustibleAction(data.id, data);
    }
    let vehiculo = await prisma.vehiculo.findFirst();
    if (!vehiculo) {
      vehiculo = await prisma.vehiculo.create({
        data: { placa: "DIT-000", marcaModelo: "INTERNO" }
      });
    }

    let finalUserId = data.userId;
    if (data.chofer) {
      const usuarioEncontrado = await prisma.user.findFirst({
        where: { nombre: { contains: data.chofer.trim() } }
      });
      if (usuarioEncontrado) finalUserId = usuarioEncontrado.id;
    }

    let finalGasolineraId = data.gasolineraId;
    let fueraDeConvenio = data.metodoPago === 'NO CONVENIO';

    if (fueraDeConvenio) {
      const nombreEstacion = data.nombreEstacionManual?.trim().toUpperCase() || 'ESTACIÓN EXTERNA';
      let gasolineraExterna = await prisma.gasolinera.findFirst({ where: { nombre: nombreEstacion } });
      
      if (!gasolineraExterna) {
        gasolineraExterna = await prisma.gasolinera.create({
          data: {
            nombre: nombreEstacion,
            numFactura: 'F-EXTERNA',
            tieneConvenio: false,
            montoRecarga: 0,
            montoActual: 0
          }
        });
      }
      finalGasolineraId = gasolineraExterna.id;
    } else {
      const gasolineraReferencia = await prisma.gasolinera.findUnique({ where: { id: data.gasolineraId } });
      if (!gasolineraReferencia) return { success: false, error: 'La estación con convenio seleccionada no existe.' };

      const todasLasAcreditaciones = await prisma.gasolinera.findMany({
        where: { nombre: gasolineraReferencia.nombre, tieneConvenio: true }
      });

      const saldoConsolidado = todasLasAcreditaciones.reduce((sum, item) => sum + Number(item.montoActual || 0), 0);

      if (saldoConsolidado < data.precioTotal) {
        return { success: false, error: `Transacción denegada. El saldo disponible de la estación ${gasolineraReferencia.nombre} ($${saldoConsolidado.toFixed(2)}) es insuficiente.` };
      }
    }
    let numeracionFinal = data.numFactura.trim().toUpperCase();
    if (!numeracionFinal) {
      const prefijo = fueraDeConvenio ? 'EXT' : 'CONV';
      const totalRegistros = await prisma.registroCombustible.count({ where: { metodoPago: data.metodoPago } });
      numeracionFinal = `${prefijo}-SEC-${String(totalRegistros + 1).padStart(6, '0')}`;
    } else {
      const facturaRepetida = await prisma.registroCombustible.findFirst({
        where: { numFactura: numeracionFinal, gasolineraId: finalGasolineraId }
      });
      if (facturaRepetida) return { success: false, error: 'El número de factura ya se encuentra registrado para este convenio o proveedor.' };
    }

    await prisma.registroCombustible.create({
      data: {
        userId: finalUserId,
        vehiculoId: vehiculo.id,
        gasolineraId: finalGasolineraId,
        kmRecorridos: 0,
        precioTotal: data.precioTotal,
        galones: 0,
        numFactura: numeracionFinal,
        fueraDeConvenio: fueraDeConvenio,
        metodoPago: data.metodoPago,
        fechaFactura: data.fechaFactura
      }
    });

    if (!fueraDeConvenio) {
      const estacionBase = await prisma.gasolinera.findUnique({ where: { id: finalGasolineraId } });
      if (estacionBase) {
        const bolsasConSaldo = await prisma.gasolinera.findMany({
          where: { nombre: estacionBase.nombre, tieneConvenio: true, montoActual: { gt: 0 } },
          orderBy: { createdAt: 'asc' } 
        });

        let saldoADescontar = data.precioTotal;

        for (const bolsa of bolsasConSaldo) {
          if (saldoADescontar <= 0) break;

          if (bolsa.montoActual >= saldoADescontar) {
            await prisma.gasolinera.update({
              where: { id: bolsa.id },
              data: { montoActual: { decrement: saldoADescontar } }
            });
            saldoADescontar = 0;
          } else {
            saldoADescontar -= bolsa.montoActual;
            await prisma.gasolinera.update({
              where: { id: bolsa.id },
              data: { montoActual: 0 }
            });
          }
        }
      }
    }

    revalidatePath('/dashboard/combustible/facturas');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
export async function crearVehiculoAction(data: { 
  placa: string; 
  marcaModelo: string; 
  kmActual: number; 
  userId?: number 
}) {
  try {
    const placaNormalizada = data.placa.toUpperCase().trim()
    const existente = await prisma.vehiculo.findUnique({ where: { placa: placaNormalizada } })
    if (existente) return { success: false, error: 'Esta placa ya está registrada.' }
    
    const nuevoVehiculo = await prisma.vehiculo.create({
      data: {
        placa: placaNormalizada,
        marcaModelo: data.marcaModelo.toUpperCase().trim(),
        kmActual: data.kmActual,
        kmUltimoAceite: data.kmActual, // Inicia el primer tramo con el kilometraje de alta
        tallerMantenimiento: "INGRESO INICIAL",
        numFacturaMantenimiento: "S/N"
      }
    })
    
    let nombreChofer = "SIN ASIGNAR"
    if (data.userId) {
      const usuario = await prisma.user.findUnique({ where: { id: data.userId } })
      if (usuario) nombreChofer = usuario.nombre || usuario.username

      await prisma.asignacionVehiculo.create({
        data: { userId: data.userId, vehiculoId: nuevoVehiculo.id, kmEntrega: data.kmActual }
      })
    }

    await prisma.kardexVehiculo.create({
      data: {
        vehiculoId: nuevoVehiculo.id,
        tipoMovimiento: "INGRESO",
        kmEnEseMomento: data.kmActual,
        kmMantenimiento: data.kmActual,
        costoTransaccion: 0,
        taller: "ALTA SISTEMA",
        factura: "S/N",
        choferEnEseMomento: nombreChofer.toUpperCase(),
        observaciones: "ALTA INICIAL DE LA UNIDAD EN EL PANEL"
      }
    })

    revalidatePath('/dashboard/combustible/mantenimiento')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 🛠️ 2. REGISTRAR MANTENIMIENTO (LÓGICA OPERATIVA LOGÍSTICA DE TALLER)
export async function registrarMantenimientoAction(data: {
  placa: string;
  kmMantenimiento: number; // KM real del tablero al llegar al taller (Ej: 25000 KM)
  taller: string;
  factura: string;
  costo: number;
  fechaFactura: Date;
  descripcion: string;     // Detalle de lo realizado en el taller
}) {
  try {
    const vehiculo = await prisma.vehiculo.findUnique({ 
      where: { placa: data.placa },
      include: { asignaciones: { where: { fechaFin: null }, include: { user: true } } }
    })
    if (!vehiculo) return { success: false, error: 'Vehículo no encontrado.' }

    const nombreChofer = vehiculo.asignaciones?.[0]?.user?.nombre || "SIN ASIGNAR"

    // El KM Inicial del tramo que termina es el 'kmActual' que tenía guardado (Ej: 20000 KM)
    const kmInicialPeriodo = vehiculo.kmActual 
    
    // Validación de seguridad para el odómetro
    if (data.kmMantenimiento < kmInicialPeriodo) {
      return { 
        success: false, 
        error: `Error de Tablero: El kilometraje de llegada ingresado (${data.kmMantenimiento.toLocaleString()} KM) no puede ser menor al kilometraje inicial registrado anteriormente (${kmInicialPeriodo.toLocaleString()} KM).` 
      }
    }

    // Actualizamos el maestro del vehículo estableciendo el nuevo punto de partida
    await prisma.vehiculo.update({
      where: { id: vehiculo.id },
      data: {
        kmUltimoAceite: kmInicialPeriodo,      // Almacena el KM Inicial con el que arrancó este tramo
        kmActual: data.kmMantenimiento,         // El KM de llegada al taller pasa a ser el KM Actual vigente
        tallerMantenimiento: data.taller.toUpperCase().trim(),
        numFacturaMantenimiento: data.factura.toUpperCase().trim(),
        costoUltimoMantenimiento: data.costo,
        fechaMantenimiento: new Date(data.fechaFactura),
        alertaMantenimiento: false 
      }
    })

    // Insertamos la auditoría inmutable en el Kardex Histórico
    await prisma.kardexVehiculo.create({
      data: {
        vehiculoId: vehiculo.id,
        tipoMovimiento: "MANTENIMIENTO",
        kmEnEseMomento: data.kmMantenimiento,   // Columna KM Actual (Tablero de llegada)
        kmMantenimiento: kmInicialPeriodo,     // Columna KM Inicial (Tablero de salida anterior)
        costoTransaccion: data.costo,
        taller: data.taller.toUpperCase().trim(),
        factura: data.factura.toUpperCase().trim(),
        choferEnEseMomento: nombreChofer.toUpperCase(),
        observaciones: data.descripcion.toUpperCase().trim()
      }
    })

    revalidatePath('/dashboard/combustible/mantenimiento')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 📝 3. EDITAR REGISTRO DE VEHÍCULO (AJUSTES MANUALES)
export async function editarVehiculoAction(
  id: number, 
  data: { 
    placa: string; 
    marcaModelo: string; 
    kmActual: number;
    kmRecorridosInput?: number;
    userId?: number 
  }
) {
  try {
    const placaNormalizada = data.placa.toUpperCase().trim()
    const vehiculoBase = await prisma.vehiculo.findUnique({ 
      where: { id },
      include: { asignaciones: { where: { fechaFin: null }, include: { user: true } } }
    })
    if (!vehiculoBase) return { success: false, error: 'El vehículo no existe.' }

    const kmRecorridos = data.kmRecorridosInput ?? 0
    const nuevoKmActualCalculado = kmRecorridos > 0 ? vehiculoBase.kmActual + kmRecorridos : data.kmActual

    await prisma.vehiculo.update({
      where: { id },
      data: {
        placa: placaNormalizada,
        marcaModelo: data.marcaModelo.toUpperCase().trim(),
        kmActual: nuevoKmActualCalculado
      }
    })

    let tipoMov = "ACTUALIZACION_KM"
    let txtObs = kmRecorridos > 0 
      ? `ACTUALIZACIÓN DE KILÓMETROS. ENTRADA DE RUTAS: ${kmRecorridos} KM`
      : `MODIFICACIÓN MANUAL DE REGISTRO / DATOS DE UNIDAD`
    
    let nombreChofer = vehiculoBase.asignaciones?.[0]?.user?.nombre || "SIN ASIGNAR"

    if (data.userId && (!vehiculoBase.asignaciones?.[0] || vehiculoBase.asignaciones[0].userId !== data.userId)) {
      tipoMov = "CAMBIO_CHOFER"
      if (vehiculoBase.asignaciones?.[0]) {
        await prisma.asignacionVehiculo.update({
          where: { id: vehiculoBase.asignaciones[0].id },
          data: { fechaFin: new Date(), kmRecepcion: nuevoKmActualCalculado }
        })
      }
      const nuevoChoferUser = await prisma.user.findUnique({ where: { id: data.userId } })
      nombreChofer = nuevoChoferUser ? (nuevoChoferUser.nombre || nuevoChoferUser.username) : "SIN ASIGNAR"
      txtObs = `REASIGNACIÓN DE CONDUCTOR: ${nombreChofer.toUpperCase()}`

      await prisma.asignacionVehiculo.create({
        data: { userId: data.userId, vehiculoId: id, kmEntrega: nuevoKmActualCalculado }
      })
    }

    await prisma.kardexVehiculo.create({
      data: {
        vehiculoId: id,
        tipoMovimiento: tipoMov,
        kmEnEseMomento: nuevoKmActualCalculado,
        kmMantenimiento: nuevoKmActualCalculado,
        costoTransaccion: 0,
        choferEnEseMomento: nombreChofer.toUpperCase(),
        observaciones: txtObs
      }
    })

    revalidatePath('/dashboard/combustible/mantenimiento')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function eliminarVehiculoAction(id: number) {
  try {
    await prisma.vehiculo.delete({ where: { id } })
    revalidatePath('/dashboard/combustible/mantenimiento')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'No se puede eliminar el vehículo porque contiene historiales vinculados.' }
  }
}

export async function crearGasolineraAction(data: { nombre: string; numFactura: string; tieneConvenio: boolean; montoRecarga?: number }) {
  try {
    const totalRecarga = data.tieneConvenio ? (data.montoRecarga ?? 0) : 0
    await prisma.gasolinera.create({
      data: {
        nombre: data.nombre.toUpperCase().trim(),
        numFactura: data.numFactura.toUpperCase().trim(),
        tieneConvenio: data.tieneConvenio,
        montoRecarga: totalRecarga,
        montoActual: totalRecarga 
      }
    })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function editarGasolineraAction(id: number, payload: { nombre: string; numFactura: string; tieneConvenio: boolean; montoRecarga?: number }) {
  try {
    const totalRecarga = payload.tieneConvenio ? (payload.montoRecarga ?? 0) : 0
    
    await prisma.gasolinera.update({
      where: { id: Number(id) },
      data: {
        nombre: payload.nombre.toUpperCase().trim(),
        numFactura: payload.numFactura.toUpperCase().trim(), 
        tieneConvenio: payload.tieneConvenio,
        montoRecarga: totalRecarga,
        montoActual: totalRecarga
      }
    })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function eliminarGasolineraAction(id: number) {
  try {
    await prisma.gasolinera.delete({ where: { id } })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: 'No se puede eliminar la estación porque contiene historiales vinculados.' }
  }
}

// 📝 MODIFICACIÓN Y REVERSIÓN DE SALDOS EN FACTURAS
export async function editarFacturaCombustibleAction(id: number, data: any) {
  try {
    const facturaVieja = await prisma.registroCombustible.findUnique({ where: { id: Number(id) } });
    if (!facturaVieja) return { success: false, error: 'El registro no existe.' };
    if (!facturaVieja.fueraDeConvenio) {
      await prisma.gasolinera.update({
        where: { id: facturaVieja.gasolineraId },
        data: { montoActual: { increment: facturaVieja.precioTotal } }
      });
    }

    let finalGasolineraId = data.gasolineraId;
    let fueraDeConvenio = data.metodoPago === 'NO CONVENIO';

    if (fueraDeConvenio) {
      const nombreEstacion = data.nombreEstacionManual?.trim().toUpperCase() || 'ESTACIÓN EXTERNA';
      let gasolineraExterna = await prisma.gasolinera.findFirst({ where: { nombre: nombreEstacion } });
      if (!gasolineraExterna) {
        gasolineraExterna = await prisma.gasolinera.create({
          data: { nombre: nombreEstacion, numFactura: 'F-EXTERNA', tieneConvenio: false }
        });
      }
      finalGasolineraId = gasolineraExterna.id;
    } else {
      const gasolinera = await prisma.gasolinera.findUnique({ where: { id: data.gasolineraId } });
      if (!gasolinera) return { success: false, error: 'Estación no encontrada.' };
      
      if (gasolinera.montoActual < data.precioTotal) {
        await prisma.gasolinera.update({ 
          where: { id: facturaVieja.gasolineraId }, 
          data: { montoActual: { decrement: facturaVieja.precioTotal } } 
        });
        return { success: false, error: 'Fondos insuficientes en el convenio para cubrir la modificación.' };
      }
    }

    let numeracionFinal = data.numFactura.trim().toUpperCase();
    if (!numeracionFinal) {
      numeracionFinal = facturaVieja.numFactura;
    }

    await prisma.registroCombustible.update({
      where: { id: Number(id) },
      data: {
        gasolineraId: finalGasolineraId,
        precioTotal: data.precioTotal,
        numFactura: numeracionFinal,
        fueraDeConvenio: fueraDeConvenio,
        metodoPago: data.metodoPago,
        fechaFactura: data.fechaFactura
      }
    });

    if (!fueraDeConvenio) {
      await prisma.gasolinera.update({
        where: { id: finalGasolineraId },
        data: { montoActual: { decrement: data.precioTotal } }
      });
    }

    revalidatePath('/dashboard/combustible/facturas');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function eliminarFacturaCombustibleAction(id: number) {
  try {
    const facturaAEliminar = await prisma.registroCombustible.findUnique({ where: { id: Number(id) } });
    if (facturaAEliminar && !facturaAEliminar.fueraDeConvenio) {
      await prisma.gasolinera.update({
        where: { id: facturaAEliminar.gasolineraId },
        data: { montoActual: { increment: facturaAEliminar.precioTotal } }
      });
    }

    await prisma.registroCombustible.delete({ where: { id: Number(id) } })
    revalidatePath('/dashboard/combustible/facturas')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 🏁 JORNADAS DIARIAS (REGISTRO MATUTINO)
export async function registrarInicioJornada(data: { userId: number; placaCarro: string; kmInicial: number }) {
  try {
    const placaNormalizada = data.placaCarro.toUpperCase().trim()
    
    // Verificamos si ya existe una ruta abierta sin cerrar de este usuario
    const rutaAbierta = await prisma.registroRutaDiaria.findFirst({
      where: {
        userId: data.userId,
        procesado: false,
        kmRecorridos: 0
      }
    })

    if (rutaAbierta) {
      return { success: false, error: 'Ya tienes una jornada activa iniciada. Debes cerrarla antes de abrir una nueva.' }
    }

    await prisma.registroRutaDiaria.create({
      data: { 
        userId: data.userId, 
        placaCarro: placaNormalizada, 
        kmRecorridos: 0, 
        procesado: false 
      }
    })

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}