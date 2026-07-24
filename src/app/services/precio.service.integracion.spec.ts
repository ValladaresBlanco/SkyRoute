// ============================================================================
// LABORATORIO 2 - Pruebas de Integración - Parte 3
// Integración de PrecioService con PasajeroService (mockeado con ts-mockito).
// Se ejercita la lógica REAL de PrecioService aislando su colaborador.
// Total: 6 pruebas.
// ============================================================================

import { mock, instance, when, verify, anything } from 'ts-mockito';

import { PrecioService } from './precio.service';
import { PasajeroService } from './pasajero.service';
import { Vuelo, OpcionesReserva } from '../models/vuelo.model';
import { Pasajero } from '../models/pasajero.model';

// ---------------------------------------------------------------------------
// Builders
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

// ===========================================================================
describe('PrecioService - Integración con PasajeroService (ts-mockito)', () => {

  let mockPasajero: PasajeroService;
  let precioService: PrecioService;
  let opciones: OpcionesReserva;

  beforeEach(() => {
    mockPasajero = mock(PasajeroService);
    precioService = new PrecioService(instance(mockPasajero));
    opciones = opcionesVacias();
  });

  // -------------------------------------------------------------------------
  it('infante en clase económica (500 USD): descuentoCategoria 450, cargoClase 0', () => {
    // Arrange
    when(mockPasajero.calcularCategoria(anything())).thenReturn('infante');
    const vuelo = crearVuelo({ precioBase: 500, clase: 'economica' });

    // Act
    const d = precioService.calcularPrecioIndividual(vuelo, crearPasajero(), opciones);

    // Assert
    expect(d.descuentoCategoria).toBe(450);
    expect(d.cargoClase).toBe(0);
  });

  it('niño en clase ejecutiva (400 USD): cargoClase 320, descuentoCategoria 237.60', () => {
    // Arrange
    when(mockPasajero.calcularCategoria(anything())).thenReturn('nino');
    const vuelo = crearVuelo({ precioBase: 400, clase: 'ejecutiva' });

    // Act
    const d = precioService.calcularPrecioIndividual(vuelo, crearPasajero(), opciones);

    // Assert
    expect(d.cargoClase).toBe(320);
    expect(d.descuentoCategoria).toBeCloseTo(237.60, 2);
  });

  it('adulto mayor en primera clase (600 USD): cargoClase 900, descuentoCategoria 225', () => {
    // Arrange
    when(mockPasajero.calcularCategoria(anything())).thenReturn('adulto_mayor');
    const vuelo = crearVuelo({ precioBase: 600, clase: 'primera' });

    // Act
    const d = precioService.calcularPrecioIndividual(vuelo, crearPasajero(), opciones);

    // Assert
    expect(d.cargoClase).toBe(900);
    expect(d.descuentoCategoria).toBe(225);
  });

  it('calcularPrecioGrupal con tres pasajeros invoca calcularCategoria tres veces', () => {
    // Arrange
    when(mockPasajero.calcularCategoria(anything())).thenReturn('adulto');
    const vuelo = crearVuelo({ precioBase: 500, clase: 'economica' });
    const tres = [1, 2, 3].map(i => crearPasajero({ id: i }));

    // Act
    precioService.calcularPrecioGrupal(vuelo, tres, opciones);

    // Assert
    expect(() => verify(mockPasajero.calcularCategoria(anything())).times(3)).not.toThrow();
  });

  it('cinco adultos en económica: descuento grupal 10% (total ≈ 90% de la suma individual)', () => {
    // Arrange
    when(mockPasajero.calcularCategoria(anything())).thenReturn('adulto');
    const vuelo = crearVuelo({ precioBase: 500, clase: 'economica' });
    const cinco = [1, 2, 3, 4, 5].map(i => crearPasajero({ id: i }));

    // Act
    const individual = precioService.calcularPrecioIndividual(vuelo, cinco[0], opciones);
    const sumaIndividual = individual.total * 5;
    const grupal = precioService.calcularPrecioGrupal(vuelo, cinco, opciones);

    // Assert  (tolerancia 0.1 USD por redondeos)
    expect(Math.abs(grupal.total - sumaIndividual * 0.90)).toBeLessThanOrEqual(0.1);
  });

  it('siete adultos en económica: descuento grupal 15% (total ≈ 85% de la suma individual)', () => {
    // Arrange
    when(mockPasajero.calcularCategoria(anything())).thenReturn('adulto');
    const vuelo = crearVuelo({ precioBase: 500, clase: 'economica' });
    const siete = [1, 2, 3, 4, 5, 6, 7].map(i => crearPasajero({ id: i }));

    // Act
    const individual = precioService.calcularPrecioIndividual(vuelo, siete[0], opciones);
    const sumaIndividual = individual.total * 7;
    const grupal = precioService.calcularPrecioGrupal(vuelo, siete, opciones);

    // Assert  (tolerancia 0.1 USD por redondeos)
    expect(Math.abs(grupal.total - sumaIndividual * 0.85)).toBeLessThanOrEqual(0.1);
  });
});
