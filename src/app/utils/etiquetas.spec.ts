import {
  categoriaLabel, claseLabel, nivelFrecuenteLabel,
  estadoVueloLabel, estadoVueloColor,
  estadoReservaLabel, estadoReservaIcon, estadoReservaColor,
  ofertaLabel
} from './etiquetas';

describe('etiquetas (human-readable labels)', () => {

  describe('categoriaLabel', () => {
    it('maps every known category to English', () => {
      expect(categoriaLabel('infante')).toBe('Infant');
      expect(categoriaLabel('nino')).toBe('Child');
      expect(categoriaLabel('adulto')).toBe('Adult');
      expect(categoriaLabel('adulto_mayor')).toBe('Senior');
    });
    it('returns the raw value for unknown categories', () => {
      expect(categoriaLabel('otro')).toBe('otro');
    });
  });

  describe('claseLabel', () => {
    it('maps cabin classes', () => {
      expect(claseLabel('economica')).toBe('Economy');
      expect(claseLabel('ejecutiva')).toBe('Business');
      expect(claseLabel('primera')).toBe('First');
    });
  });

  describe('nivelFrecuenteLabel', () => {
    it('maps loyalty tiers', () => {
      expect(nivelFrecuenteLabel('ninguno')).toBe('No membership');
      expect(nivelFrecuenteLabel('bronce')).toBe('Bronze');
      expect(nivelFrecuenteLabel('plata')).toBe('Silver');
      expect(nivelFrecuenteLabel('oro')).toBe('Gold');
      expect(nivelFrecuenteLabel('platino')).toBe('Platinum');
    });
  });

  describe('estadoVueloLabel / estadoVueloColor', () => {
    it('labels flight statuses', () => {
      expect(estadoVueloLabel('programado')).toBe('Scheduled');
      expect(estadoVueloLabel('retrasado')).toBe('Delayed');
      expect(estadoVueloLabel('cancelado')).toBe('Cancelled');
    });
    it('picks a Material color per status', () => {
      expect(estadoVueloColor('programado')).toBe('primary');
      expect(estadoVueloColor('retrasado')).toBe('warn');
      expect(estadoVueloColor('cancelado')).toBe('accent');
      expect(estadoVueloColor('en_vuelo')).toBe('');
    });
  });

  describe('estadoReserva helpers', () => {
    it('labels booking statuses', () => {
      expect(estadoReservaLabel('pendiente')).toBe('Pending');
      expect(estadoReservaLabel('confirmada')).toBe('Confirmed');
      expect(estadoReservaLabel('cancelada')).toBe('Cancelled');
    });
    it('gives an icon per status', () => {
      expect(estadoReservaIcon('pendiente')).toBe('schedule');
      expect(estadoReservaIcon('confirmada')).toBe('check_circle');
      expect(estadoReservaIcon('desconocido')).toBe('help');
    });
    it('gives a hex color per status', () => {
      expect(estadoReservaColor('confirmada')).toMatch(/^#[0-9a-f]{6}$/i);
      expect(estadoReservaColor('cualquiera')).toBe('#6b7280');
    });
  });

  describe('ofertaLabel', () => {
    it('translates deal quality', () => {
      expect(ofertaLabel('excelente')).toBe('Great deal');
      expect(ofertaLabel('buena')).toBe('Good price');
      expect(ofertaLabel('normal')).toBe('Average');
      expect(ofertaLabel('cara')).toBe('Pricey');
      expect(ofertaLabel('sin referencia')).toBe('—');
    });
  });
});
