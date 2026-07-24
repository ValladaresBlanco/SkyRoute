import { VueloService } from './vuelo.service';
import { Vuelo } from '../models/vuelo.model';

// Datos de prueba con fechas bien futuras para que el auto-desplazamiento
// de fechas (cargar) no altere lo que verificamos.
function vuelo(parcial: Partial<Vuelo>): Vuelo {
  return {
    id: 1, codigo: 'SR-001', aerolinea: 'SkyRoute Airlines',
    origen: 'San José', destino: 'Miami', paisOrigen: 'CR', paisDestino: 'US',
    fechaSalida: new Date('2030-06-01T08:00:00'), fechaLlegada: new Date('2030-06-01T13:00:00'),
    duracionMinutos: 300, clase: 'economica', precioBase: 400,
    asientosTotales: 100, asientosOcupados: 50,
    escalas: [], estado: 'programado', equipajeIncluidoKg: 23,
    tieneWifi: true, tieneComida: true,
    ...parcial
  };
}

describe('VueloService', () => {
  let service: VueloService;

  beforeEach(() => {
    service = new VueloService();
    service.cargar([
      vuelo({ id: 1, codigo: 'SR-001', origen: 'San José', destino: 'Miami', precioBase: 400, estado: 'programado', asientosTotales: 100, asientosOcupados: 50 }),
      vuelo({ id: 2, codigo: 'SR-002', origen: 'San José', destino: 'Madrid', paisDestino: 'ES', precioBase: 1200, estado: 'programado', asientosTotales: 40, asientosOcupados: 40 }),
      vuelo({ id: 3, codigo: 'SR-003', origen: 'Miami', destino: 'New York', paisOrigen: 'US', paisDestino: 'US', precioBase: 300, estado: 'cancelado', asientosTotales: 20, asientosOcupados: 0 }),
      vuelo({ id: 4, codigo: 'SR-004', origen: 'San José', destino: 'Miami', precioBase: 250, estado: 'retrasado', asientosTotales: 180, asientosOcupados: 10 })
    ]);
  });

  describe('buscarFlexible', () => {
    it('with empty criteria returns all non-cancelled flights, cheapest first', () => {
      const r = service.buscarFlexible('', '', null);
      expect(r.map(v => v.codigo)).toEqual(['SR-004', 'SR-001', 'SR-002']);
      expect(r.some(v => v.estado === 'cancelado')).toBeFalse();
    });

    it('matches origin/destination partially and case/accent-insensitively', () => {
      const r = service.buscarFlexible('san jose', 'mia', null);
      expect(r.map(v => v.codigo)).toEqual(['SR-004', 'SR-001']);
    });

    it('returns empty when nothing matches', () => {
      expect(service.buscarFlexible('Tokyo', '', null)).toEqual([]);
    });
  });

  describe('obtenerAsientosDisponibles', () => {
    it('returns remaining seats', () => {
      expect(service.obtenerAsientosDisponibles(1)).toBe(50);
    });
    it('returns -1 for unknown flight', () => {
      expect(service.obtenerAsientosDisponibles(999)).toBe(-1);
    });
    it('returns 0 for a cancelled flight', () => {
      expect(service.obtenerAsientosDisponibles(3)).toBe(0);
    });
  });

  describe('calcularOcupacion', () => {
    it('computes occupancy percentage rounded to one decimal', () => {
      expect(service.calcularOcupacion(vuelo({ asientosTotales: 180, asientosOcupados: 120 }))).toBe(66.7);
    });
    it('returns 0 when there are no seats', () => {
      expect(service.calcularOcupacion(vuelo({ asientosTotales: 0, asientosOcupados: 0 }))).toBe(0);
    });
  });

  describe('clasificarDuracion', () => {
    it('classifies by duration thresholds', () => {
      expect(service.clasificarDuracion(vuelo({ duracionMinutos: 120 }))).toBe('corto');
      expect(service.clasificarDuracion(vuelo({ duracionMinutos: 300 }))).toBe('medio');
      expect(service.clasificarDuracion(vuelo({ duracionMinutos: 500 }))).toBe('largo');
      expect(service.clasificarDuracion(vuelo({ duracionMinutos: 700 }))).toBe('ultra_largo');
    });
  });

  describe('esInternacional', () => {
    it('is true when origin and destination countries differ', () => {
      expect(service.esInternacional(vuelo({ paisOrigen: 'CR', paisDestino: 'US' }))).toBeTrue();
      expect(service.esInternacional(vuelo({ paisOrigen: 'US', paisDestino: 'US' }))).toBeFalse();
    });
  });

  describe('formatearDuracion', () => {
    it('formats hours and minutes', () => {
      expect(service.formatearDuracion(330)).toBe('5h 30m');
      expect(service.formatearDuracion(180)).toBe('3h');
      expect(service.formatearDuracion(45)).toBe('45m');
    });
  });

  describe('obtenerEstadisticasOcupacion', () => {
    it('ignores cancelled flights and reports busiest/emptiest', () => {
      const e = service.obtenerEstadisticasOcupacion();
      expect(e.totalVuelos).toBe(3);            // SR-003 cancelled excluded
      expect(e.vueloMasOcupado).toBe('SR-002'); // 100% full
      expect(e.vuelosLlenos).toBe(1);
    });
  });
});
