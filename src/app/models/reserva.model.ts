/**
 * Modelo de datos para una Reserva de vuelo en SkyRoute.
 */
export interface Reserva {
  id: number;
  codigoReserva: string;           // formato: "SKY-XXXXXX" (6 caracteres alfanuméricos)
  vuelo: {
    id: number;
    codigo: string;
    origen: string;
    destino: string;
    fechaSalida: Date;
    clase: string;
  };
  pasajeros: {
    id: number;
    nombreCompleto: string;
    pasaporte: string;
    categoria: string;
  }[];
  fechaCreacion: Date;
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada' | 'expirada';
  precioTotal: number;
  moneda: string;
  opciones: {
    equipajeExtra: boolean;
    seleccionAsiento: boolean;
    seguroViaje: boolean;
    comidaEspecial: string | null;
    prioridadAbordaje: boolean;
  };
  historialCambios: CambioReserva[];
}

export interface CambioReserva {
  fecha: Date;
  tipo: 'creacion' | 'modificacion' | 'cancelacion' | 'confirmacion';
  descripcion: string;
  usuario: string;
}

/**
 * Resultado del cálculo de precio.
 */
export interface DesglosePrecio {
  precioBase: number;
  descuentoCategoria: number;      // descuento por niño/infante/adulto mayor
  descuentoFrecuente: number;      // descuento por membresía frecuente
  cargoClase: number;              // cargo adicional por ejecutiva/primera
  cargoOpciones: number;           // extras (equipaje, asiento, seguro, comida, prioridad)
  impuestos: number;               // impuestos según países
  subtotal: number;
  total: number;
  moneda: string;
  tasaCambio: number;
}
