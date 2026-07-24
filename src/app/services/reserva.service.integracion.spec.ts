// ============================================================================
// LABORATORIO 2 - Pruebas de Integración - Parte 1
// Dobles manuales sobre ReservaService (Dummy, Stub, Spy, Fake)
// Total: 14 pruebas
// ============================================================================
//
// Clasificación de dobles (Parte 4)
// Fragmento A: Dummy. Proxy cuyos métodos lanzan Error; sustituye a VueloService
//   sólo para satisfacer el constructor y certificar que la validación 1 nunca lo
//   toca. No existe tipo más apropiado: si nunca debe invocarse, Dummy es lo correcto.
// Fragmento B: Spy. Registra el número de invocaciones (llamadas++) además de
//   responder un valor fijo. Si no se verificara el contador bastaría un Stub.
// Fragmento C: Fake. Mantiene estado interno real en un Map y refleja los efectos
//   acumulados de actualizarAsientosOcupados. Adecuado; un Stub no observaría efectos.
// Fragmento D: Mock. Doble dinámico de ts-mockito configurado con when(...) y
//   verificado por interacciones con verify(...).times(3). Si sólo se configurara
//   sin verificar, un Stub sería suficiente.
// Fragmento E: Stub. Respuestas fijas sin estado ni verificación de interacciones;
//   la prueba sólo valida el valor retornado por crearReserva. Adecuado tal cual.
// ============================================================================

import { ReservaService } from './reserva.service';
import { Vuelo, OpcionesReserva } from '../models/vuelo.model';
import { Pasajero } from '../models/pasajero.model';
import { DesglosePrecio } from '../models/reserva.model';

// ---------------------------------------------------------------------------
// Builders de datos de prueba
// ---------------------------------------------------------------------------

function opcionesVacias(): OpcionesReserva {
  return {
    equipajeExtra: false,
    seleccionAsiento: false,
    seguroViaje: false,
    comidaEspecial: null,
    prioridadAbordaje: false
  };
}

// Los vuelos en memoria viven en abril/2026; aquí usamos una fecha bien futura
// para que la validación 9 (fecha de salida no pasada) nunca corte el flujo.
function crearVuelo(parcial: Partial<Vuelo> = {}): Vuelo {
  return {
    id: 1,
    codigo: 'SR-TEST',
    aerolinea: 'SkyRoute Airlines',
    origen: 'San José',
    destino: 'Miami',
    paisOrigen: 'CR',
    paisDestino: 'US',
    fechaSalida: new Date('2030-01-15T10:00:00'),
    fechaLlegada: new Date('2030-01-15T16:00:00'),
    duracionMinutos: 360,
    clase: 'economica',
    precioBase: 500,
    asientosTotales: 180,
    asientosOcupados: 0,
    escalas: [],
    estado: 'programado',
    equipajeIncluidoKg: 23,
    tieneWifi: true,
    tieneComida: true,
    ...parcial
  };
}

function crearPasajero(parcial: Partial<Pasajero> = {}): Pasajero {
  return {
    id: 1,
    nombre: 'Test',
    apellido: 'Pasajero',
    pasaporte: 'CR1234567',
    nacionalidad: 'CR',
    fechaNacimiento: new Date('1990-01-01'),
    email: 'test@email.com',
    telefono: '+506 8888-0000',
    genero: 'M',
    miembroFrecuente: false,
    nivelFrecuente: 'ninguno',
    millasAcumuladas: 0,
    necesidadesEspeciales: [],
    visasVigentes: [],
    contactoEmergencia: { nombre: 'Contacto', telefono: '+506 8888-0001', relacion: 'padre' },
    ...parcial
  };
}

function desglose(total = 500): DesglosePrecio {
  return {
    precioBase: total,
    descuentoCategoria: 0,
    descuentoFrecuente: 0,
    cargoClase: 0,
    cargoOpciones: 0,
    impuestos: 0,
    subtotal: total,
    total,
    moneda: 'USD',
    tasaCambio: 1
  };
}

// ---------------------------------------------------------------------------
// Factorías de Stubs (firma completa con valores inocuos por defecto)
// ---------------------------------------------------------------------------

function stubVuelo(overrides: Record<string, any> = {}): any {
  return {
    buscarPorId: () => crearVuelo(),
    obtenerAsientosDisponibles: () => 10,
    actualizarAsientosOcupados: () => true,
    ...overrides
  };
}

function stubPasajero(overrides: Record<string, any> = {}): any {
  return {
    validarPasajero: () => ({ valido: true, errores: [] }),
    verificarDocumentos: () => ({ aprobado: true, razon: '' }),
    calcularCategoria: () => 'adulto',
    ...overrides
  };
}

function stubPrecio(overrides: Record<string, any> = {}): any {
  return {
    calcularPrecioIndividual: () => desglose(),
    calcularPrecioGrupal: () => desglose(),
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// Dummy estricto: cualquier método invocado lanza Error.
// ---------------------------------------------------------------------------

function dummyEstricto<T>(nombre: string): T {
  return new Proxy({}, {
    get: () => () => { throw new Error(`Dummy ${nombre} fue invocado`); }
  }) as T;
}

// ---------------------------------------------------------------------------
// Fakes con estado interno real
// ---------------------------------------------------------------------------

class FakeVueloService {
  private vuelos = new Map<number, Vuelo>();

  agregar(v: Vuelo) { this.vuelos.set(v.id, { ...v }); }

  buscarPorId(id: number) { return this.vuelos.get(id); }

  obtenerAsientosDisponibles(id: number) {
    const v = this.vuelos.get(id);
    if (!v) return -1;
    if (v.estado === 'cancelado') return 0;
    return v.asientosTotales - v.asientosOcupados;
  }

  actualizarAsientosOcupados(id: number, delta: number) {
    const v = this.vuelos.get(id);
    if (!v) return false;
    const nuevos = v.asientosOcupados + delta;
    if (nuevos < 0 || nuevos > v.asientosTotales) return false;
    v.asientosOcupados = nuevos;
    return true;
  }
}

class FakePasajeroService {
  validarPasajero(p: Pasajero) {
    const ok = /^[A-Z]{2}\d{7}$/.test(p.pasaporte);
    return ok
      ? { valido: true, errores: [] }
      : { valido: false, errores: ['Passport format is invalid'] };
  }
  verificarDocumentos() { return { aprobado: true, razon: '' }; }
  calcularCategoria() { return 'adulto'; }
}

// ===========================================================================
describe('ReservaService - Pruebas de integración con dobles manuales', () => {

  let opciones: OpcionesReserva;

  beforeEach(() => {
    // Estado limpio: las reservas ahora persisten en localStorage.
    localStorage.removeItem('skyroute-reservas');
    opciones = opcionesVacias();
  });

  // -------------------------------------------------------------------------
  describe('5.1 Bloque Dummy', () => {

    it('corta en validación 1 (sin pasajeros) sin invocar colaboradores', () => {
      // Arrange
      const servicio = new ReservaService(
        dummyEstricto('VueloService') as any,
        dummyEstricto('PasajeroService') as any,
        dummyEstricto('PrecioService') as any
      );

      // Act
      const res = servicio.crearReserva(1, [], opciones);

      // Assert
      expect(res.exito).toBeFalse();
      expect(res.error).toContain('At least 1 passenger');
      expect(res.reserva).toBeNull();
    });

    it('corta en validación 2 (más de 9 pasajeros) sin invocar colaboradores', () => {
      // Arrange
      const servicio = new ReservaService(
        dummyEstricto('VueloService') as any,
        dummyEstricto('PasajeroService') as any,
        dummyEstricto('PrecioService') as any
      );
      const diez = Array.from({ length: 10 }, (_, i) => crearPasajero({ id: i + 1 }));

      // Act
      const res = servicio.crearReserva(1, diez, opciones);

      // Assert
      expect(res.exito).toBeFalse();
      expect(res.error).toContain('more than 9 passengers');
      expect(res.reserva).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  describe('5.2 Bloque Stub', () => {

    it('camino feliz: reserva pendiente con código SKY válido', () => {
      // Arrange
      const servicio = new ReservaService(stubVuelo(), stubPasajero(), stubPrecio());

      // Act
      const res = servicio.crearReserva(1, [crearPasajero()], opciones);

      // Assert
      expect(res.exito).toBeTrue();
      expect(res.reserva).not.toBeNull();
      expect(res.reserva!.estado).toBe('pendiente');
      expect(res.reserva!.codigoReserva).toMatch(/^SKY-[A-Z0-9]{6}$/);
    });

    it('buscarPorId retorna undefined => "no encontrado" y reserva null', () => {
      // Arrange
      const servicio = new ReservaService(
        stubVuelo({ buscarPorId: () => undefined }),
        stubPasajero(),
        stubPrecio()
      );

      // Act
      const res = servicio.crearReserva(1, [crearPasajero()], opciones);

      // Assert
      expect(res.exito).toBeFalse();
      expect(res.error).toContain('not found');
      expect(res.reserva).toBeNull();
    });

    it('vuelo en estado "cancelado" => "no está disponible"', () => {
      // Arrange
      const servicio = new ReservaService(
        stubVuelo({ buscarPorId: () => crearVuelo({ estado: 'cancelado' }) }),
        stubPasajero(),
        stubPrecio()
      );

      // Act
      const res = servicio.crearReserva(1, [crearPasajero()], opciones);

      // Assert
      expect(res.exito).toBeFalse();
      expect(res.error).toContain('is not available');
    });

    it('un asiento disponible para dos pasajeros => "No hay suficientes asientos"', () => {
      // Arrange
      const servicio = new ReservaService(
        stubVuelo({ obtenerAsientosDisponibles: () => 1 }),
        stubPasajero(),
        stubPrecio()
      );

      // Act
      const res = servicio.crearReserva(
        1,
        [crearPasajero({ id: 1 }), crearPasajero({ id: 2 })],
        opciones
      );

      // Assert
      expect(res.exito).toBeFalse();
      expect(res.error).toContain('Not enough seats');
    });
  });

  // -------------------------------------------------------------------------
  describe('5.3 Bloque Spy', () => {

    it('buscarPorId recibe exactamente una llamada con el argumento 42', () => {
      // Arrange
      const registro = { llamadas: 0, argumentos: [] as any[] };
      const spyVuelo = stubVuelo({
        buscarPorId: (id: number) => {
          registro.llamadas++;
          registro.argumentos.push(id);
          return crearVuelo({ id: 42 });
        }
      });
      const servicio = new ReservaService(spyVuelo, stubPasajero(), stubPrecio());

      // Act
      servicio.crearReserva(42, [crearPasajero()], opciones);

      // Assert
      expect(registro.llamadas).toBe(1);
      expect(registro.argumentos).toEqual([42]);
    });

    it('validarPasajero se invoca exactamente tres veces con tres pasajeros', () => {
      // Arrange
      const registro = { llamadas: 0 };
      const spyPasajero = stubPasajero({
        validarPasajero: () => {
          registro.llamadas++;
          return { valido: true, errores: [] };
        }
      });
      const servicio = new ReservaService(stubVuelo(), spyPasajero, stubPrecio());
      const tres = [crearPasajero({ id: 1 }), crearPasajero({ id: 2 }), crearPasajero({ id: 3 })];

      // Act
      servicio.crearReserva(1, tres, opciones);

      // Assert
      expect(registro.llamadas).toBe(3);
    });

    it('actualizarAsientosOcupados se invoca una vez con vueloId correcto y delta +2', () => {
      // Arrange
      const registro = { llamadas: 0, argumentos: [] as Array<{ id: number; delta: number }> };
      const spyVuelo = stubVuelo({
        actualizarAsientosOcupados: (id: number, delta: number) => {
          registro.llamadas++;
          registro.argumentos.push({ id, delta });
          return true;
        }
      });
      const servicio = new ReservaService(spyVuelo, stubPasajero(), stubPrecio());

      // Act
      servicio.crearReserva(1, [crearPasajero({ id: 1 }), crearPasajero({ id: 2 })], opciones);

      // Assert  (el contrato indica delta positivo = cantidad de pasajeros; comportamiento confirmado)
      expect(registro.llamadas).toBe(1);
      expect(registro.argumentos[0].id).toBe(1);
      expect(registro.argumentos[0].delta).toBe(2);
    });

    it('validarPasajero precede a verificarDocumentos y ambos a calcularPrecioGrupal', () => {
      // Arrange
      const orden: string[] = [];
      const spyPasajero = {
        validarPasajero: () => { orden.push('validarPasajero'); return { valido: true, errores: [] }; },
        verificarDocumentos: () => { orden.push('verificarDocumentos'); return { aprobado: true, razon: '' }; },
        calcularCategoria: () => { orden.push('calcularCategoria'); return 'adulto'; }
      } as any;
      const spyPrecio = {
        calcularPrecioIndividual: () => desglose(),
        calcularPrecioGrupal: () => { orden.push('calcularPrecioGrupal'); return desglose(); }
      } as any;
      const servicio = new ReservaService(stubVuelo(), spyPasajero, spyPrecio);

      // Act
      servicio.crearReserva(1, [crearPasajero()], opciones);

      // Assert
      expect(orden.indexOf('validarPasajero')).toBeLessThan(orden.indexOf('verificarDocumentos'));
      expect(orden.indexOf('verificarDocumentos')).toBeLessThan(orden.indexOf('calcularPrecioGrupal'));
    });
  });

  // -------------------------------------------------------------------------
  describe('5.4 Bloque Fake', () => {

    it('reservar dos pasajeros reduce los asientos disponibles de 5 a 3', () => {
      // Arrange
      const fakeVuelo = new FakeVueloService();
      fakeVuelo.agregar(crearVuelo({ id: 1, asientosTotales: 10, asientosOcupados: 5 }));
      const servicio = new ReservaService(fakeVuelo as any, stubPasajero(), stubPrecio());

      // Act
      const res = servicio.crearReserva(
        1,
        [crearPasajero({ id: 1 }), crearPasajero({ id: 2 })],
        opciones
      );

      // Assert
      expect(res.exito).toBeTrue();
      expect(fakeVuelo.obtenerAsientosDisponibles(1)).toBe(3);
    });

    it('cancelar la reserva revierte el delta y vuelve a 5 asientos disponibles', () => {
      // Arrange
      const fakeVuelo = new FakeVueloService();
      fakeVuelo.agregar(crearVuelo({ id: 1, asientosTotales: 10, asientosOcupados: 5 }));
      const servicio = new ReservaService(fakeVuelo as any, stubPasajero(), stubPrecio());

      // Act
      const res = servicio.crearReserva(
        1,
        [crearPasajero({ id: 1 }), crearPasajero({ id: 2 })],
        opciones
      );
      servicio.cancelarReserva(res.reserva!.id);

      // Assert
      expect(fakeVuelo.obtenerAsientosDisponibles(1)).toBe(5);
    });

    it('segunda reserva falla cuando el fake ya no tiene asientos suficientes', () => {
      // Arrange
      const fakeVuelo = new FakeVueloService();
      fakeVuelo.agregar(crearVuelo({ id: 1, asientosTotales: 4, asientosOcupados: 2 }));
      const servicio = new ReservaService(fakeVuelo as any, stubPasajero(), stubPrecio());

      // Act
      const res1 = servicio.crearReserva(
        1,
        [crearPasajero({ id: 1 }), crearPasajero({ id: 2 })],
        opciones
      );
      const res2 = servicio.crearReserva(
        1,
        [crearPasajero({ id: 3 }), crearPasajero({ id: 4 })],
        opciones
      );

      // Assert
      expect(res1.exito).toBeTrue();
      expect(res2.exito).toBeFalse();
      expect(res2.error).toContain('Not enough seats');
    });

    it('FakePasajeroService rechaza pasaporte "ABC123" => error contiene "pasaporte"', () => {
      // Arrange
      const fakeVuelo = new FakeVueloService();
      fakeVuelo.agregar(crearVuelo({ id: 1, asientosTotales: 100, asientosOcupados: 0 }));
      const servicio = new ReservaService(
        fakeVuelo as any,
        new FakePasajeroService() as any,
        stubPrecio()
      );

      // Act
      const res = servicio.crearReserva(1, [crearPasajero({ pasaporte: 'ABC123' })], opciones);

      // Assert
      expect(res.exito).toBeFalse();
      expect(res.error).toContain('Passport');
    });
  });
});
