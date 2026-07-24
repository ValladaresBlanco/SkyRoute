import { Injectable } from '@angular/core';
import { Vuelo, Escala } from '../models/vuelo.model';
import { IVueloService } from '../interfaces/ivuelo.service';

@Injectable({
  providedIn: 'root'
})
export class VueloService implements IVueloService {

  private vuelos: Vuelo[] = [];

  /**
   * Carga los vuelos desde una fuente externa (ej. assets/data/vuelos.json).
   * Convierte las fechas (texto) a objetos Date y, si el itinerario quedó en el
   * pasado, lo desplaza al futuro preservando el espaciado entre vuelos. Así la
   * demo siempre tiene vuelos reservables sin importar cuándo se ejecute.
   */
  cargar(vuelos: Vuelo[]): void {
    this.vuelos = vuelos.map(v => ({
      ...v,
      fechaSalida: new Date(v.fechaSalida),
      fechaLlegada: new Date(v.fechaLlegada)
    }));
    this.desplazarItinerarioSiEsPasado();
  }

  /**
   * Si el vuelo más próximo ya pasó (o está muy cerca), suma a TODAS las fechas
   * el mismo desfase para que el primer vuelo salga ~7 días desde hoy.
   */
  private desplazarItinerarioSiEsPasado(): void {
    if (this.vuelos.length === 0) return;

    const ahora = Date.now();
    const minSalida = Math.min(...this.vuelos.map(v => v.fechaSalida.getTime()));
    const margen = 7 * 24 * 60 * 60 * 1000; // 7 días

    if (minSalida >= ahora + margen) return; // ya está en el futuro, no tocar

    const desfase = (ahora + margen) - minSalida;
    for (const v of this.vuelos) {
      v.fechaSalida = new Date(v.fechaSalida.getTime() + desfase);
      v.fechaLlegada = new Date(v.fechaLlegada.getTime() + desfase);
    }
  }

  obtenerTodos(): Vuelo[] {
    return [...this.vuelos];
  }

  buscarPorId(id: number): Vuelo | undefined {
    return this.vuelos.find(v => v.id === id);
  }

  /**
   * Busca vuelos por origen, destino y fecha.
   * La búsqueda de fecha compara solo el día (ignora hora).
   * La búsqueda de ciudades es case-insensitive y con trim.
   * Solo retorna vuelos con estado "programado" o "retrasado".
   * Ordena los resultados por precio base de menor a mayor.
   */
  buscarVuelos(origen: string, destino: string, fecha: Date): Vuelo[] {
    const origenNorm = origen.trim().toLowerCase();
    const destinoNorm = destino.trim().toLowerCase();

    return this.vuelos
      .filter(v => {
        const mismoOrigen = v.origen.toLowerCase() === origenNorm;
        const mismoDestino = v.destino.toLowerCase() === destinoNorm;
        const mismaFecha = v.fechaSalida.getFullYear() === fecha.getFullYear() &&
                           v.fechaSalida.getMonth() === fecha.getMonth() &&
                           v.fechaSalida.getDate() === fecha.getDate();
        const estadoValido = v.estado === 'programado' || v.estado === 'retrasado';
        return mismoOrigen && mismoDestino && mismaFecha && estadoValido;
      })
      .sort((a, b) => a.precioBase - b.precioBase);
  }

  /**
   * Búsqueda flexible pensada para la interfaz.
   * A diferencia de buscarVuelos(), aquí TODOS los criterios son opcionales:
   *   - Si origen/destino están vacíos, no se filtra por ese campo.
   *   - La coincidencia de ciudad es parcial (incluye) e insensible a mayúsculas/tildes.
   *   - Si no se pasa fecha, se ignora la fecha.
   * Solo retorna vuelos disponibles (no cancelados). Ordena por precio ascendente.
   */
  buscarFlexible(origen: string, destino: string, fecha: Date | null): Vuelo[] {
    const origenNorm = this.normalizar(origen);
    const destinoNorm = this.normalizar(destino);

    return this.vuelos
      .filter(v => {
        const coincideOrigen = !origenNorm || this.normalizar(v.origen).includes(origenNorm);
        const coincideDestino = !destinoNorm || this.normalizar(v.destino).includes(destinoNorm);
        const coincideFecha = !fecha ||
          (v.fechaSalida.getFullYear() === fecha.getFullYear() &&
           v.fechaSalida.getMonth() === fecha.getMonth() &&
           v.fechaSalida.getDate() === fecha.getDate());
        return coincideOrigen && coincideDestino && coincideFecha && v.estado !== 'cancelado';
      })
      .sort((a, b) => a.precioBase - b.precioBase);
  }

  /** Quita tildes, espacios extra y pasa a minúsculas para comparar texto. */
  private normalizar(texto: string): string {
    return (texto || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  }

  /**
   * Retorna la cantidad de asientos disponibles para un vuelo.
   * Si el vuelo no existe, retorna -1.
   * Si el vuelo está cancelado, retorna 0.
   */
  obtenerAsientosDisponibles(vueloId: number): number {
    const vuelo = this.buscarPorId(vueloId);
    if (!vuelo) return -1;
    if (vuelo.estado === 'cancelado') return 0;
    return vuelo.asientosTotales - vuelo.asientosOcupados;
  }

  /**
   * Actualiza los asientos ocupados de un vuelo.
   * Retorna false si:
   *   - El vuelo no existe
   *   - El vuelo está cancelado o aterrizado
   *   - La cantidad haría que los ocupados superen el total o sean negativos
   * Retorna true si se actualizó exitosamente.
   */
  actualizarAsientosOcupados(vueloId: number, cantidad: number): boolean {
    const vuelo = this.buscarPorId(vueloId);
    if (!vuelo) return false;
    if (vuelo.estado === 'cancelado' || vuelo.estado === 'aterrizado') return false;

    const nuevosOcupados = vuelo.asientosOcupados + cantidad;
    if (nuevosOcupados < 0 || nuevosOcupados > vuelo.asientosTotales) return false;

    vuelo.asientosOcupados = nuevosOcupados;
    return true;
  }

  /**
   * Retorna vuelos con al menos 1 asiento disponible y que NO estén cancelados.
   * Ordenados por fecha de salida ascendente.
   */
  obtenerVuelosDisponibles(): Vuelo[] {
    return this.vuelos
      .filter(v => v.estado !== 'cancelado' && (v.asientosTotales - v.asientosOcupados) > 0)
      .sort((a, b) => a.fechaSalida.getTime() - b.fechaSalida.getTime());
  }

  obtenerEstadoVuelo(vueloId: number): string {
    const vuelo = this.buscarPorId(vueloId);
    return vuelo ? vuelo.estado : 'no_encontrado';
  }

  /**
   * Determina la categoría de un vuelo según su duración:
   * - "corto": menos de 180 minutos
   * - "medio": entre 180 y 360 minutos (inclusive ambos extremos)
   * - "largo": entre 361 y 600 minutos
   * - "ultra_largo": más de 600 minutos
   */
  clasificarDuracion(vuelo: Vuelo): string {
    if (vuelo.duracionMinutos < 180) return 'corto';
    if (vuelo.duracionMinutos <= 360) return 'medio';
    if (vuelo.duracionMinutos <= 600) return 'largo';
    return 'ultra_largo';
  }

  /**
   * Calcula el porcentaje de ocupación de un vuelo.
   * Retorna el porcentaje redondeado a 1 decimal.
   * Si el vuelo no tiene asientos totales, retorna 0.
   */
  calcularOcupacion(vuelo: Vuelo): number {
    if (vuelo.asientosTotales === 0) return 0;
    return Math.round((vuelo.asientosOcupados / vuelo.asientosTotales) * 1000) / 10;
  }

  /**
   * Determina si un vuelo es internacional.
   * Un vuelo es internacional si el país de origen es diferente al país de destino.
   */
  esInternacional(vuelo: Vuelo): boolean {
    return vuelo.paisOrigen !== vuelo.paisDestino;
  }

  /**
   * Formatea la duración de un vuelo en formato legible.
   * Ejemplo: 330 minutos -> "5h 30m"
   * Si es menos de 60 minutos: "45m"
   * Si es exacto en horas: "3h"
   */
  formatearDuracion(minutos: number): string {
    if (minutos < 0) return '0m';
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (horas === 0) return `${mins}m`;
    if (mins === 0) return `${horas}h`;
    return `${horas}h ${mins}m`;
  }

  /**
   * Calcula el tiempo total de escalas de un vuelo en minutos.
   * Si no tiene escalas, retorna 0.
   */
  calcularTiempoEscalas(vuelo: Vuelo): number {
    return vuelo.escalas.reduce((total, escala) => total + escala.duracionEsperaMinutos, 0);
  }

  /**
   * Obtiene estadísticas de ocupación:
   * {
   *   totalVuelos: number,
   *   vuelosLlenos: number (100% ocupación),
   *   vuelosVacios: number (0% ocupación),
   *   promedioOcupacion: number (redondeado a 1 decimal),
   *   vueloMasOcupado: string (código del vuelo),
   *   vueloMenosOcupado: string (código del vuelo)
   * }
   * Solo considera vuelos no cancelados.
   */
  obtenerEstadisticasOcupacion(): {
    totalVuelos: number;
    vuelosLlenos: number;
    vuelosVacios: number;
    promedioOcupacion: number;
    vueloMasOcupado: string;
    vueloMenosOcupado: string;
  } {
    const activos = this.vuelos.filter(v => v.estado !== 'cancelado');
    if (activos.length === 0) {
      return {
        totalVuelos: 0, vuelosLlenos: 0, vuelosVacios: 0,
        promedioOcupacion: 0, vueloMasOcupado: 'N/A', vueloMenosOcupado: 'N/A'
      };
    }

    let sumaOcupacion = 0;
    let maxOcupacion = -1;
    let minOcupacion = 101;
    let vueloMax = activos[0];
    let vueloMin = activos[0];
    let llenos = 0;
    let vacios = 0;

    for (const vuelo of activos) {
      const ocupacion = this.calcularOcupacion(vuelo);
      sumaOcupacion += ocupacion;

      if (ocupacion >= 100) llenos++;
      if (ocupacion === 0) vacios++;

      if (ocupacion > maxOcupacion) {
        maxOcupacion = ocupacion;
        vueloMax = vuelo;
      }
      if (ocupacion < minOcupacion) {
        minOcupacion = ocupacion;
        vueloMin = vuelo;
      }
    }

    return {
      totalVuelos: activos.length,
      vuelosLlenos: llenos,
      vuelosVacios: vacios,
      promedioOcupacion: Math.round((sumaOcupacion / activos.length) * 10) / 10,
      vueloMasOcupado: vueloMax.codigo,
      vueloMenosOcupado: vueloMin.codigo
    };
  }

  /**
   * Valida si una conexión entre dos vuelos es posible.
   * Reglas:
   *   1. El destino del primer vuelo debe ser el origen del segundo.
   *   2. La fecha de llegada del primero debe ser anterior a la salida del segundo.
   *   3. Debe haber al menos 90 minutos de diferencia entre llegada y salida (tiempo de conexión mínimo).
   *   4. No debe haber más de 12 horas de diferencia (conexión máxima razonable).
   *   5. Ambos vuelos deben estar en estado "programado" o "retrasado".
   * Retorna { valida: boolean, razon: string }
   */
  validarConexion(vuelo1: Vuelo, vuelo2: Vuelo): { valida: boolean; razon: string } {
    if (vuelo1.estado !== 'programado' && vuelo1.estado !== 'retrasado') {
      return { valida: false, razon: `Vuelo ${vuelo1.codigo} no está disponible (estado: ${vuelo1.estado})` };
    }
    if (vuelo2.estado !== 'programado' && vuelo2.estado !== 'retrasado') {
      return { valida: false, razon: `Vuelo ${vuelo2.codigo} no está disponible (estado: ${vuelo2.estado})` };
    }
    if (vuelo1.destino.toLowerCase() !== vuelo2.origen.toLowerCase()) {
      return { valida: false, razon: `Destino de ${vuelo1.codigo} (${vuelo1.destino}) no coincide con origen de ${vuelo2.codigo} (${vuelo2.origen})` };
    }

    const diferenciaMs = vuelo2.fechaSalida.getTime() - vuelo1.fechaLlegada.getTime();
    const diferenciaMinutos = diferenciaMs / (1000 * 60);

    if (diferenciaMinutos < 0) {
      return { valida: false, razon: 'El segundo vuelo sale antes de que llegue el primero' };
    }
    if (diferenciaMinutos < 90) {
      return { valida: false, razon: `Tiempo de conexión insuficiente: ${Math.round(diferenciaMinutos)} minutos (mínimo 90)` };
    }
    if (diferenciaMinutos > 720) {
      return { valida: false, razon: `Tiempo de conexión excesivo: ${Math.round(diferenciaMinutos / 60)} horas (máximo 12)` };
    }

    return { valida: true, razon: 'Conexión válida' };
  }
}
