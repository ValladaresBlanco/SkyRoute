import { Pasajero, CategoriaPasajero } from '../models/pasajero.model';

/**
 * Interface IPasajeroService
 * Contrato para el servicio de gestión de pasajeros.
 * Utilizada para inyección de dependencias y test doubles.
 */
export interface IPasajeroService {
  obtenerPorId(id: number): Pasajero | undefined;
  validarPasajero(pasajero: Pasajero): { valido: boolean; errores: string[] };
  calcularCategoria(fechaNacimiento: Date): CategoriaPasajero;
  verificarDocumentos(pasajero: Pasajero, paisDestino: string): { aprobado: boolean; razon: string };
  obtenerBeneficiosFrecuente(pasajero: Pasajero): { descuento: number; equipajeExtra: number; salaVip: boolean; prioridadAbordaje: boolean };
}
