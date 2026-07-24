import { Vuelo, OpcionesReserva } from '../models/vuelo.model';
import { Pasajero } from '../models/pasajero.model';
import { DesglosePrecio } from '../models/reserva.model';

/**
 * Interface IPrecioService
 * Contrato para el servicio de cálculo de precios.
 * Utilizada para inyección de dependencias y test doubles.
 */
export interface IPrecioService {
  calcularPrecioIndividual(vuelo: Vuelo, pasajero: Pasajero, opciones: OpcionesReserva): DesglosePrecio;
  calcularPrecioGrupal(vuelo: Vuelo, pasajeros: Pasajero[], opciones: OpcionesReserva): DesglosePrecio;
  calcularImpuestos(subtotal: number, paisOrigen: string, paisDestino: string): number;
  aplicarDescuentoFrecuente(precio: number, nivelFrecuente: string): number;
  convertirMoneda(monto: number, monedaDestino: string): number;
}
