import { Vuelo } from '../models/vuelo.model';

/**
 * Interface IVueloService
 * Contrato para el servicio de gestión de vuelos.
 * Utilizada para inyección de dependencias y test doubles.
 */
export interface IVueloService {
  obtenerTodos(): Vuelo[];
  buscarPorId(id: number): Vuelo | undefined;
  buscarVuelos(origen: string, destino: string, fecha: Date): Vuelo[];
  obtenerAsientosDisponibles(vueloId: number): number;
  actualizarAsientosOcupados(vueloId: number, cantidad: number): boolean;
  obtenerVuelosDisponibles(): Vuelo[];
  obtenerEstadoVuelo(vueloId: number): string;
}
