/**
 * Modelo de datos para un Vuelo comercial.
 * Representa la información completa de un vuelo en el sistema SkyRoute.
 */
export interface Vuelo {
  id: number;
  codigo: string;                // ej: "SR-2045"
  aerolinea: string;             // ej: "SkyRoute Airlines"
  origen: string;                // ciudad de origen
  destino: string;               // ciudad de destino
  paisOrigen: string;            // país de origen
  paisDestino: string;           // país de destino
  fechaSalida: Date;
  fechaLlegada: Date;
  duracionMinutos: number;
  clase: 'economica' | 'ejecutiva' | 'primera';
  precioBase: number;            // precio en USD
  asientosTotales: number;
  asientosOcupados: number;
  escalas: Escala[];
  estado: 'programado' | 'abordando' | 'en_vuelo' | 'aterrizado' | 'cancelado' | 'retrasado';
  equipajeIncluidoKg: number;
  tieneWifi: boolean;
  tieneComida: boolean;
}

export interface Escala {
  ciudad: string;
  pais: string;
  duracionEsperaMinutos: number;
  aeropuerto: string;
}

/**
 * Opciones adicionales al reservar un vuelo.
 */
export interface OpcionesReserva {
  equipajeExtra: boolean;        // +$50 por maleta extra
  seleccionAsiento: boolean;     // +$25 por elegir asiento
  seguroViaje: boolean;          // +$35 por seguro
  comidaEspecial: string | null; // "vegetariana", "vegana", "sin gluten", "kosher", null
  prioridadAbordaje: boolean;    // +$20 por prioridad
}
