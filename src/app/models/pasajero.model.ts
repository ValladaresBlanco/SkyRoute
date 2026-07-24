/**
 * Modelo de datos para un Pasajero del sistema SkyRoute.
 */
export interface Pasajero {
  id: number;
  nombre: string;
  apellido: string;
  pasaporte: string;             // formato: 2 letras + 7 dígitos (ej: "CR1234567")
  nacionalidad: string;          // código país (ej: "CR", "US", "MX")
  fechaNacimiento: Date;
  email: string;
  telefono: string;
  genero: 'M' | 'F' | 'O';
  miembroFrecuente: boolean;
  nivelFrecuente: 'ninguno' | 'bronce' | 'plata' | 'oro' | 'platino';
  millasAcumuladas: number;
  necesidadesEspeciales: string[];  // ej: ["silla de ruedas", "oxígeno", "comida sin gluten"]
  visasVigentes: string[];         // países con visa vigente (ej: ["US", "CA", "EU"])
  contactoEmergencia: {
    nombre: string;
    telefono: string;
    relacion: string;
  };
}

/**
 * Categoría del pasajero según su edad.
 */
export type CategoriaPasajero = 'infante' | 'nino' | 'adulto' | 'adulto_mayor';
