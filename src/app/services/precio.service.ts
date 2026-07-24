import { Injectable } from '@angular/core';
import { Vuelo, OpcionesReserva } from '../models/vuelo.model';
import { Pasajero } from '../models/pasajero.model';
import { DesglosePrecio } from '../models/reserva.model';
import { IPrecioService } from '../interfaces/iprecio.service';
import { PasajeroService } from './pasajero.service';

@Injectable({
  providedIn: 'root'
})
export class PrecioService implements IPrecioService {

  private tasasCambio: { [moneda: string]: number } = {
    'USD': 1,
    'EUR': 0.92,
    'CRC': 515.50,
    'MXN': 17.15,
    'COP': 3950.00,
    'PEN': 3.72,
    'ARS': 870.00
  };

  private impuestosPorPais: { [pais: string]: number } = {
    'CR': 0.13,
    'US': 0.075,
    'MX': 0.16,
    'CO': 0.19,
    'PA': 0.07,
    'PE': 0.18,
    'ES': 0.21,
    'AR': 0.21
  };

  constructor(private pasajeroService: PasajeroService) {}

  /**
   * Calcula el precio individual de un boleto.
   *
   * Pasos del cálculo:
   * 1. Tomar el precio base del vuelo.
   * 2. Aplicar cargo por clase:
   *    - economica: 0% adicional
   *    - ejecutiva: +80% adicional
   *    - primera: +150% adicional
   * 3. Aplicar descuento por categoría de pasajero:
   *    - infante: 90% descuento (paga solo 10%)
   *    - nino: 33% descuento
   *    - adulto: 0% descuento
   *    - adulto_mayor: 15% descuento
   * 4. Aplicar descuento por membresía frecuente (según nivel).
   * 5. Sumar cargos por opciones adicionales.
   * 6. Calcular impuestos según países de origen y destino (promedio de ambos).
   * 7. Redondear todo a 2 decimales.
   */
  calcularPrecioIndividual(vuelo: Vuelo, pasajero: Pasajero, opciones: OpcionesReserva): DesglosePrecio {
    const precioBase = vuelo.precioBase;

    // Cargo por clase
    let cargoClase = 0;
    switch (vuelo.clase) {
      case 'ejecutiva': cargoClase = precioBase * 0.80; break;
      case 'primera': cargoClase = precioBase * 1.50; break;
    }

    const precioConClase = precioBase + cargoClase;

    // Descuento por categoría
    const categoria = this.pasajeroService.calcularCategoria(pasajero.fechaNacimiento);
    let descuentoCategoria = 0;
    switch (categoria) {
      case 'infante': descuentoCategoria = precioConClase * 0.90; break;
      case 'nino': descuentoCategoria = precioConClase * 0.33; break;
      case 'adulto_mayor': descuentoCategoria = precioConClase * 0.15; break;
    }

    const precioPostCategoria = precioConClase - descuentoCategoria;

    // Descuento por membresía frecuente
    const descuentoFrecuente = this.aplicarDescuentoFrecuente(precioPostCategoria, pasajero.nivelFrecuente);
    const precioPostFrecuente = precioPostCategoria - descuentoFrecuente;

    // Cargos por opciones
    const cargoOpciones = this.calcularCargoOpciones(opciones);

    // Subtotal
    const subtotal = precioPostFrecuente + cargoOpciones;

    // Impuestos
    const impuestos = this.calcularImpuestos(subtotal, vuelo.paisOrigen, vuelo.paisDestino);

    // Total
    const total = Math.round((subtotal + impuestos) * 100) / 100;

    return {
      precioBase,
      descuentoCategoria: Math.round(descuentoCategoria * 100) / 100,
      descuentoFrecuente: Math.round(descuentoFrecuente * 100) / 100,
      cargoClase: Math.round(cargoClase * 100) / 100,
      cargoOpciones: Math.round(cargoOpciones * 100) / 100,
      impuestos: Math.round(impuestos * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      total,
      moneda: 'USD',
      tasaCambio: 1
    };
  }

  /**
   * Calcula el precio grupal para varios pasajeros en el mismo vuelo.
   * Aplica descuento grupal adicional:
   *   - 2-3 pasajeros: 5% descuento adicional
   *   - 4-6 pasajeros: 10% descuento adicional
   *   - 7+ pasajeros: 15% descuento adicional
   *   - 1 pasajero: sin descuento grupal
   * El descuento grupal se aplica DESPUÉS de todos los otros descuentos individuales.
   * Retorna un DesglosePrecio consolidado con los totales del grupo.
   */
  calcularPrecioGrupal(vuelo: Vuelo, pasajeros: Pasajero[], opciones: OpcionesReserva): DesglosePrecio {
    if (pasajeros.length === 0) {
      return {
        precioBase: 0, descuentoCategoria: 0, descuentoFrecuente: 0,
        cargoClase: 0, cargoOpciones: 0, impuestos: 0,
        subtotal: 0, total: 0, moneda: 'USD', tasaCambio: 1
      };
    }

    let sumaPrecioBase = 0;
    let sumaDescuentoCategoria = 0;
    let sumaDescuentoFrecuente = 0;
    let sumaCargoClase = 0;
    let sumaCargoOpciones = 0;
    let sumaImpuestos = 0;
    let sumaSubtotal = 0;
    let sumaTotal = 0;

    for (const pasajero of pasajeros) {
      const individual = this.calcularPrecioIndividual(vuelo, pasajero, opciones);
      sumaPrecioBase += individual.precioBase;
      sumaDescuentoCategoria += individual.descuentoCategoria;
      sumaDescuentoFrecuente += individual.descuentoFrecuente;
      sumaCargoClase += individual.cargoClase;
      sumaCargoOpciones += individual.cargoOpciones;
      sumaImpuestos += individual.impuestos;
      sumaSubtotal += individual.subtotal;
      sumaTotal += individual.total;
    }

    // Descuento grupal
    let descuentoGrupal = 0;
    if (pasajeros.length >= 7) descuentoGrupal = 0.15;
    else if (pasajeros.length >= 4) descuentoGrupal = 0.10;
    else if (pasajeros.length >= 2) descuentoGrupal = 0.05;

    const totalConDescuentoGrupal = sumaTotal * (1 - descuentoGrupal);

    return {
      precioBase: Math.round(sumaPrecioBase * 100) / 100,
      descuentoCategoria: Math.round(sumaDescuentoCategoria * 100) / 100,
      descuentoFrecuente: Math.round((sumaDescuentoFrecuente + sumaTotal * descuentoGrupal) * 100) / 100,
      cargoClase: Math.round(sumaCargoClase * 100) / 100,
      cargoOpciones: Math.round(sumaCargoOpciones * 100) / 100,
      impuestos: Math.round(sumaImpuestos * 100) / 100,
      subtotal: Math.round(sumaSubtotal * 100) / 100,
      total: Math.round(totalConDescuentoGrupal * 100) / 100,
      moneda: 'USD',
      tasaCambio: 1
    };
  }

  /**
   * Calcula los impuestos sobre un monto.
   * Se utiliza el promedio de las tasas de impuesto del país de origen y destino.
   * Si un país no está en la lista, se usa 0% para ese país.
   * Si ambos países son iguales (vuelo doméstico), se usa la tasa de ese país.
   * Retorna el monto de impuesto redondeado a 2 decimales.
   */
  calcularImpuestos(subtotal: number, paisOrigen: string, paisDestino: string): number {
    const tasaOrigen = this.impuestosPorPais[paisOrigen.toUpperCase()] || 0;
    const tasaDestino = this.impuestosPorPais[paisDestino.toUpperCase()] || 0;

    let tasaFinal: number;
    if (paisOrigen.toUpperCase() === paisDestino.toUpperCase()) {
      tasaFinal = tasaOrigen;
    } else {
      tasaFinal = (tasaOrigen + tasaDestino) / 2;
    }

    return Math.round(subtotal * tasaFinal * 100) / 100;
  }

  /**
   * Aplica descuento por membresía frecuente.
   * Retorna el MONTO de descuento (no el precio con descuento).
   * - ninguno: 0%
   * - bronce: 5%
   * - plata: 10%
   * - oro: 15%
   * - platino: 25%
   */
  aplicarDescuentoFrecuente(precio: number, nivelFrecuente: string): number {
    let porcentaje = 0;
    switch (nivelFrecuente) {
      case 'bronce': porcentaje = 0.05; break;
      case 'plata': porcentaje = 0.10; break;
      case 'oro': porcentaje = 0.15; break;
      case 'platino': porcentaje = 0.25; break;
    }
    return Math.round(precio * porcentaje * 100) / 100;
  }

  /**
   * Convierte un monto de USD a otra moneda.
   * Si la moneda no está soportada, retorna el monto original.
   * Redondea a 2 decimales.
   */
  convertirMoneda(monto: number, monedaDestino: string): number {
    const tasa = this.tasasCambio[monedaDestino.toUpperCase()];
    if (!tasa) return monto;
    return Math.round(monto * tasa * 100) / 100;
  }

  /**
   * Calcula el cargo total por opciones adicionales.
   * - equipajeExtra: +$50
   * - seleccionAsiento: +$25
   * - seguroViaje: +$35
   * - comidaEspecial (si no es null): +$15
   * - prioridadAbordaje: +$20
   */
  calcularCargoOpciones(opciones: OpcionesReserva): number {
    let cargo = 0;
    if (opciones.equipajeExtra) cargo += 50;
    if (opciones.seleccionAsiento) cargo += 25;
    if (opciones.seguroViaje) cargo += 35;
    if (opciones.comidaEspecial) cargo += 15;
    if (opciones.prioridadAbordaje) cargo += 20;
    return cargo;
  }

  /**
   * Calcula el precio por kilómetro de un vuelo.
   * Estimación: 1 minuto de vuelo ≈ 14 km.
   * Retorna el precio por km redondeado a 4 decimales.
   * Si la duración es 0, retorna 0.
   */
  precioPorKilometro(precioTotal: number, duracionMinutos: number): number {
    if (duracionMinutos <= 0) return 0;
    const kmEstimados = duracionMinutos * 14;
    return Math.round((precioTotal / kmEstimados) * 10000) / 10000;
  }

  /**
   * Determina si el precio de un vuelo es "buena oferta" comparándolo con el promedio.
   * Recibe un arreglo de precios y un precio objetivo.
   * Si el precio objetivo es menor al 80% del promedio, es "excelente".
   * Si es menor al promedio, es "buena".
   * Si es igual o hasta 20% más caro, es "normal".
   * Si es más de 20% más caro, es "cara".
   * Si el arreglo está vacío, retorna "sin referencia".
   */
  evaluarOferta(precios: number[], precioObjetivo: number): string {
    if (precios.length === 0) return 'sin referencia';

    const promedio = precios.reduce((sum, p) => sum + p, 0) / precios.length;

    if (precioObjetivo < promedio * 0.80) return 'excelente';
    if (precioObjetivo < promedio) return 'buena';
    if (precioObjetivo <= promedio * 1.20) return 'normal';
    return 'cara';
  }
}
