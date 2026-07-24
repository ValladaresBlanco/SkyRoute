import { Injectable, Inject } from '@angular/core';
import { Reserva, CambioReserva, DesglosePrecio } from '../models/reserva.model';
import { Pasajero } from '../models/pasajero.model';
import { OpcionesReserva } from '../models/vuelo.model';
import { VueloService } from './vuelo.service';
import { PasajeroService } from './pasajero.service';
import { PrecioService } from './precio.service';

@Injectable({
  providedIn: 'root'
})
export class ReservaService {

  private reservas: Reserva[] = [];
  private contadorId: number = 0;

  private readonly STORAGE_KEY = 'skyroute-reservas';

  constructor(
    private vueloService: VueloService,
    private pasajeroService: PasajeroService,
    private precioService: PrecioService
  ) {
    this.cargarDesdeStorage();
  }

  /** Restaura las reservas guardadas en el navegador (persisten al recargar). */
  private cargarDesdeStorage(): void {
    try {
      const crudo = localStorage.getItem(this.STORAGE_KEY);
      if (!crudo) return;
      const datos: Reserva[] = JSON.parse(crudo);
      // Revivir las fechas (JSON las guarda como texto).
      this.reservas = datos.map(r => ({
        ...r,
        fechaCreacion: new Date(r.fechaCreacion),
        vuelo: { ...r.vuelo, fechaSalida: new Date(r.vuelo.fechaSalida) },
        historialCambios: r.historialCambios.map(c => ({ ...c, fecha: new Date(c.fecha) }))
      }));
      this.contadorId = this.reservas.reduce((max, r) => Math.max(max, r.id), 0);
    } catch {
      this.reservas = [];
    }
  }

  /** Guarda el estado actual de las reservas en el navegador. */
  private guardarEnStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.reservas));
    } catch {
      /* almacenamiento no disponible: la demo sigue funcionando en memoria */
    }
  }

  /**
   * Genera un código de reserva único.
   * Formato: "SKY-" + 6 caracteres alfanuméricos aleatorios en mayúsculas.
   * Ejemplo: "SKY-A3F8K2"
   */
  private generarCodigoReserva(): string {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = 'SKY-';
    for (let i = 0; i < 6; i++) {
      codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return codigo;
  }

  /**
   * Crea una nueva reserva de vuelo.
   *
   * Validaciones (en orden):
   * 1. Debe haber al menos 1 pasajero.
   * 2. No puede haber más de 9 pasajeros por reserva.
   * 3. El vuelo debe existir.
   * 4. El vuelo debe estar en estado "programado" o "retrasado".
   * 5. Debe haber suficientes asientos disponibles para TODOS los pasajeros.
   * 6. TODOS los pasajeros deben pasar la validación (validarPasajero).
   * 7. TODOS los pasajeros deben tener documentos válidos para el país destino.
   * 8. Si hay infantes, debe haber al menos 1 adulto por cada infante.
   * 9. La fecha de salida del vuelo no puede ser pasada.
   *
   * Si alguna validación falla, retorna { exito: false, error: string, reserva: null }.
   * Si todas pasan:
   *   - Calcula el precio grupal.
   *   - Actualiza los asientos ocupados del vuelo.
   *   - Crea la reserva con estado "pendiente".
   *   - Agrega al historial de cambios la creación.
   *   - Retorna { exito: true, error: null, reserva: Reserva }.
   */
  crearReserva(
    vueloId: number,
    pasajeros: Pasajero[],
    opciones: OpcionesReserva
  ): { exito: boolean; error: string | null; reserva: Reserva | null } {

    // Validación 1: al menos 1 pasajero
    if (!pasajeros || pasajeros.length === 0) {
      return { exito: false, error: 'At least 1 passenger is required', reserva: null };
    }

    // Validación 2: máximo 9 pasajeros
    if (pasajeros.length > 9) {
      return { exito: false, error: 'No more than 9 passengers per booking', reserva: null };
    }

    // Validación 3: vuelo existente
    const vuelo = this.vueloService.buscarPorId(vueloId);
    if (!vuelo) {
      return { exito: false, error: `Flight with ID ${vueloId} not found`, reserva: null };
    }

    // Validación 4: estado del vuelo
    if (vuelo.estado !== 'programado' && vuelo.estado !== 'retrasado') {
      return { exito: false, error: `Flight ${vuelo.codigo} is not available (status: ${vuelo.estado})`, reserva: null };
    }

    // Validación 5: asientos disponibles
    const asientosDisponibles = this.vueloService.obtenerAsientosDisponibles(vueloId);
    if (asientosDisponibles < pasajeros.length) {
      return {
        exito: false,
        error: `Not enough seats. Available: ${asientosDisponibles}, requested: ${pasajeros.length}`,
        reserva: null
      };
    }

    // Validación 6: todos los pasajeros válidos
    for (const pasajero of pasajeros) {
      const validacion = this.pasajeroService.validarPasajero(pasajero);
      if (!validacion.valido) {
        return {
          exito: false,
          error: `Passenger ${pasajero.nombre} ${pasajero.apellido} is not valid: ${validacion.errores.join(', ')}`,
          reserva: null
        };
      }
    }

    // Validación 7: documentos válidos para todos
    for (const pasajero of pasajeros) {
      const docs = this.pasajeroService.verificarDocumentos(pasajero, vuelo.paisDestino);
      if (!docs.aprobado) {
        return {
          exito: false,
          error: `Insufficient documents for ${pasajero.nombre} ${pasajero.apellido}: ${docs.razon}`,
          reserva: null
        };
      }
    }

    // Validación 8: ratio infantes/adultos
    let infantes = 0;
    let adultos = 0;
    for (const pasajero of pasajeros) {
      const cat = this.pasajeroService.calcularCategoria(pasajero.fechaNacimiento);
      if (cat === 'infante') infantes++;
      if (cat === 'adulto' || cat === 'adulto_mayor') adultos++;
    }
    if (infantes > 0 && adultos < infantes) {
      return {
        exito: false,
        error: `At least 1 adult is required per infant. Infants: ${infantes}, adults: ${adultos}`,
        reserva: null
      };
    }

    // Validación 9: fecha no pasada
    if (vuelo.fechaSalida < new Date()) {
      return { exito: false, error: 'The flight departure date has already passed', reserva: null };
    }

    // Calcular precio
    const precio = this.precioService.calcularPrecioGrupal(vuelo, pasajeros, opciones);

    // Actualizar asientos
    this.vueloService.actualizarAsientosOcupados(vueloId, pasajeros.length);

    // Crear reserva
    this.contadorId++;
    const reserva: Reserva = {
      id: this.contadorId,
      codigoReserva: this.generarCodigoReserva(),
      vuelo: {
        id: vuelo.id,
        codigo: vuelo.codigo,
        origen: vuelo.origen,
        destino: vuelo.destino,
        fechaSalida: vuelo.fechaSalida,
        clase: vuelo.clase
      },
      pasajeros: pasajeros.map(p => ({
        id: p.id,
        nombreCompleto: `${p.nombre} ${p.apellido}`,
        pasaporte: p.pasaporte,
        categoria: this.pasajeroService.calcularCategoria(p.fechaNacimiento)
      })),
      fechaCreacion: new Date(),
      estado: 'pendiente',
      precioTotal: precio.total,
      moneda: 'USD',
      opciones: { ...opciones },
      historialCambios: [{
        fecha: new Date(),
        tipo: 'creacion',
        descripcion: `Booking created for flight ${vuelo.codigo} with ${pasajeros.length} passenger(s)`,
        usuario: 'sistema'
      }]
    };

    this.reservas.push(reserva);
    this.guardarEnStorage();
    return { exito: true, error: null, reserva };
  }

  /**
   * Confirma una reserva pendiente.
   * Solo se puede confirmar una reserva en estado "pendiente".
   * Cambia el estado a "confirmada" y agrega al historial.
   * Retorna true si se confirmó, false si no.
   */
  confirmarReserva(reservaId: number): boolean {
    const reserva = this.reservas.find(r => r.id === reservaId);
    if (!reserva || reserva.estado !== 'pendiente') return false;

    reserva.estado = 'confirmada';
    reserva.historialCambios.push({
      fecha: new Date(),
      tipo: 'confirmacion',
      descripcion: 'Booking confirmed',
      usuario: 'sistema'
    });
    this.guardarEnStorage();
    return true;
  }

  /**
   * Cancela una reserva.
   * Solo se pueden cancelar reservas en estado "pendiente" o "confirmada".
   * Al cancelar:
   *   1. Cambia el estado a "cancelada".
   *   2. Libera los asientos del vuelo (actualiza asientos ocupados restando la cantidad de pasajeros).
   *   3. Calcula el reembolso:
   *      - Si estaba "pendiente": reembolso del 100%.
   *      - Si estaba "confirmada":
   *        - Si faltan más de 72 horas para el vuelo: 80% reembolso.
   *        - Si faltan entre 24 y 72 horas: 50% reembolso.
   *        - Si faltan menos de 24 horas: 0% reembolso.
   *   4. Agrega al historial.
   * Retorna { cancelada: boolean, montoReembolso: number }.
   */
  cancelarReserva(reservaId: number): { cancelada: boolean; montoReembolso: number } {
    const reserva = this.reservas.find(r => r.id === reservaId);
    if (!reserva) return { cancelada: false, montoReembolso: 0 };
    if (reserva.estado !== 'pendiente' && reserva.estado !== 'confirmada') {
      return { cancelada: false, montoReembolso: 0 };
    }

    let porcentajeReembolso = 1;

    if (reserva.estado === 'confirmada') {
      const ahora = new Date();
      const horasParaVuelo = (reserva.vuelo.fechaSalida.getTime() - ahora.getTime()) / (1000 * 60 * 60);

      if (horasParaVuelo > 72) {
        porcentajeReembolso = 0.80;
      } else if (horasParaVuelo >= 24) {
        porcentajeReembolso = 0.50;
      } else {
        porcentajeReembolso = 0;
      }
    }

    const montoReembolso = Math.round(reserva.precioTotal * porcentajeReembolso * 100) / 100;

    // Liberar asientos
    this.vueloService.actualizarAsientosOcupados(
      reserva.vuelo.id,
      -reserva.pasajeros.length
    );

    reserva.estado = 'cancelada';
    reserva.historialCambios.push({
      fecha: new Date(),
      tipo: 'cancelacion',
      descripcion: `Booking cancelled. Refund: $${montoReembolso} (${porcentajeReembolso * 100}%)`,
      usuario: 'sistema'
    });

    this.guardarEnStorage();
    return { cancelada: true, montoReembolso };
  }

  /**
   * Busca una reserva por su código de reserva (formato "SKY-XXXXXX").
   * La búsqueda es case-insensitive.
   */
  buscarPorCodigo(codigo: string): Reserva | undefined {
    return this.reservas.find(r => r.codigoReserva.toUpperCase() === codigo.toUpperCase());
  }

  /**
   * Obtiene todas las reservas de un pasajero por su ID.
   */
  obtenerReservasPorPasajero(pasajeroId: number): Reserva[] {
    return this.reservas.filter(r =>
      r.pasajeros.some(p => p.id === pasajeroId)
    );
  }

  /**
   * Genera un resumen de todas las reservas:
   * {
   *   totalReservas: number,
   *   porEstado: { pendiente: number, confirmada: number, cancelada: number, completada: number, expirada: number },
   *   ingresosTotales: number (solo reservas confirmadas y completadas),
   *   reembolsosTotales: number (de las cancelaciones en el historial),
   *   pasajerosUnicos: number,
   *   promedioPassajerosPorReserva: number (redondeado a 1 decimal)
   * }
   */
  generarResumen(): {
    totalReservas: number;
    porEstado: { pendiente: number; confirmada: number; cancelada: number; completada: number; expirada: number };
    ingresosTotales: number;
    pasajerosUnicos: number;
    promedioPasajerosPorReserva: number;
  } {
    const porEstado = { pendiente: 0, confirmada: 0, cancelada: 0, completada: 0, expirada: 0 };
    let ingresos = 0;
    const pasajerosSet = new Set<number>();
    let totalPasajeros = 0;

    for (const reserva of this.reservas) {
      porEstado[reserva.estado]++;

      if (reserva.estado === 'confirmada' || reserva.estado === 'completada') {
        ingresos += reserva.precioTotal;
      }

      for (const p of reserva.pasajeros) {
        pasajerosSet.add(p.id);
      }
      totalPasajeros += reserva.pasajeros.length;
    }

    return {
      totalReservas: this.reservas.length,
      porEstado,
      ingresosTotales: Math.round(ingresos * 100) / 100,
      pasajerosUnicos: pasajerosSet.size,
      promedioPasajerosPorReserva: this.reservas.length > 0
        ? Math.round((totalPasajeros / this.reservas.length) * 10) / 10
        : 0
    };
  }

  obtenerTodas(): Reserva[] {
    return [...this.reservas];
  }
}
