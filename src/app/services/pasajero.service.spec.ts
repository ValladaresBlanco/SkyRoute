import { PasajeroService } from './pasajero.service';
import { Pasajero } from '../models/pasajero.model';

/** Fecha de nacimiento de alguien de aprox. `anios` años (relativa a hoy). */
function haceAnios(anios: number): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - anios);
  d.setMonth(d.getMonth() - 1); // margen para no caer justo en el cumpleaños
  return d;
}

function pasajero(parcial: Partial<Pasajero> = {}): Pasajero {
  return {
    id: 1, nombre: 'Carlos', apellido: 'Ramírez', pasaporte: 'CR1234567',
    nacionalidad: 'CR', fechaNacimiento: haceAnios(30), email: 'carlos@email.com',
    telefono: '+506 8888-0001', genero: 'M', miembroFrecuente: false,
    nivelFrecuente: 'ninguno', millasAcumuladas: 0, necesidadesEspeciales: [],
    visasVigentes: [], contactoEmergencia: { nombre: 'Ana', telefono: '+506 8888-0002', relacion: 'spouse' },
    ...parcial
  };
}

describe('PasajeroService', () => {
  let service: PasajeroService;
  beforeEach(() => { service = new PasajeroService(); });

  describe('calcularCategoria', () => {
    it('classifies by age', () => {
      expect(service.calcularCategoria(haceAnios(1))).toBe('infante');
      expect(service.calcularCategoria(haceAnios(8))).toBe('nino');
      expect(service.calcularCategoria(haceAnios(30))).toBe('adulto');
      expect(service.calcularCategoria(haceAnios(70))).toBe('adulto_mayor');
    });
  });

  describe('calcularEdad', () => {
    it('computes age in whole years', () => {
      expect(service.calcularEdad(haceAnios(25))).toBe(25);
    });
  });

  describe('validarPasajero', () => {
    it('accepts a well-formed adult passenger', () => {
      expect(service.validarPasajero(pasajero()).valido).toBeTrue();
    });

    it('rejects an invalid passport format', () => {
      const r = service.validarPasajero(pasajero({ pasaporte: 'ABC123' }));
      expect(r.valido).toBeFalse();
      expect(r.errores.join(' ')).toContain('Passport');
    });

    it('requires infants to have a parent as emergency contact', () => {
      const bebeSinPadre = pasajero({
        fechaNacimiento: haceAnios(1),
        contactoEmergencia: { nombre: 'Ana', telefono: '+506 8888-0002', relacion: 'aunt' }
      });
      expect(service.validarPasajero(bebeSinPadre).valido).toBeFalse();

      const bebeConPadre = pasajero({
        fechaNacimiento: haceAnios(1),
        contactoEmergencia: { nombre: 'Ana', telefono: '+506 8888-0002', relacion: 'mother' }
      });
      expect(service.validarPasajero(bebeConPadre).valido).toBeTrue();
    });
  });

  describe('verificarDocumentos', () => {
    it('lets nationals into their own country', () => {
      expect(service.verificarDocumentos(pasajero({ nacionalidad: 'US' }), 'US').aprobado).toBeTrue();
    });
    it('allows visa-free travel within Latin America', () => {
      expect(service.verificarDocumentos(pasajero({ nacionalidad: 'CR' }), 'CO').aprobado).toBeTrue();
    });
    it('requires a visa when there is no exemption', () => {
      const sinVisa = service.verificarDocumentos(pasajero({ nacionalidad: 'CR', visasVigentes: [] }), 'US');
      expect(sinVisa.aprobado).toBeFalse();
    });
    it('approves when the passenger holds a valid visa', () => {
      const conVisa = service.verificarDocumentos(pasajero({ nacionalidad: 'CR', visasVigentes: ['US'] }), 'US');
      expect(conVisa.aprobado).toBeTrue();
    });
  });

  describe('calcularMillasGanadas', () => {
    it('scales by class and loyalty bonus', () => {
      expect(service.calcularMillasGanadas(300, 'economica', 'ninguno')).toBe(300);
      expect(service.calcularMillasGanadas(300, 'ejecutiva', 'ninguno')).toBe(450);
      expect(service.calcularMillasGanadas(300, 'primera', 'oro')).toBe(900); // 600 * 1.5
    });
  });

  describe('obtenerBeneficiosFrecuente', () => {
    it('gives no benefits to non-members', () => {
      const b = service.obtenerBeneficiosFrecuente(pasajero({ miembroFrecuente: false }));
      expect(b.descuento).toBe(0);
      expect(b.salaVip).toBeFalse();
    });
    it('gives platinum members the top perks', () => {
      const b = service.obtenerBeneficiosFrecuente(pasajero({ miembroFrecuente: true, nivelFrecuente: 'platino' }));
      expect(b.descuento).toBe(25);
      expect(b.salaVip).toBeTrue();
      expect(b.prioridadAbordaje).toBeTrue();
    });
  });

  describe('formatearNombreCompleto', () => {
    it('formats as "LASTNAME, Firstname"', () => {
      expect(service.formatearNombreCompleto(pasajero({ nombre: 'carlos', apellido: 'ramírez' }))).toBe('RAMÍREZ, Carlos');
    });
  });
});
