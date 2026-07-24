// ============================================================================
// LABORATORIO 2 - Pruebas de Integración - Parte 2
// Mocks con ts-mockito sobre ReservaService
// Total: 10 pruebas. Se respeta Arrange (configuración) / Act (ejecución) /
// Assert (verificación) y la separación de las tres fases de ts-mockito.
// ============================================================================

import { mock, instance, when, verify, capture, anything, anyNumber } from 'ts-mockito';

import { ReservaService } from './reserva.service';
import { VueloService } from './vuelo.service';
import { PasajeroService } from './pasajero.service';
import { PrecioService } from './precio.service';
import { Vuelo, OpcionesReserva } from '../models/vuelo.model';
import { Pasajero } from '../models/pasajero.model';
import { DesglosePrecio } from '../models/reserva.model';

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

// ===========================================================================
describe('ReservaService - Pruebas de integración con mocks (ts-mockito)', () => {

  let mockVuelo: VueloService;
  let mockPasajero: PasajeroService;
  let mockPrecio: PrecioService;
  let servicio: ReservaService;

  let vueloValido: Vuelo;
  let precioFalso: DesglosePrecio;
  let opciones: OpcionesReserva;

  beforeEach(() => {
    // Estado limpio: las reservas ahora persisten en localStorage.
    localStorage.removeItem('skyroute-reservas');
    // Fase 1: creación de los mocks a partir de clases concretas.
    mockVuelo = mock(VueloService);
    mockPasajero = mock(PasajeroService);
    mockPrecio = mock(PrecioService);

    vueloValido = crearVuelo({ id: 1 });
    precioFalso = desglose(500);
    opciones = opcionesVacias();

    // El SUT recibe SIEMPRE instance(mock), nunca el mock directo.
    servicio = new ReservaService(
      instance(mockVuelo),
      instance(mockPasajero),
      instance(mockPrecio)
    );
  });

  // Arrange reutilizable: deja a todos los colaboradores en estado "válido"
  // EXCEPTO el cálculo de precio, que cada prueba configura según su intención.
  function arrangeColaboradoresValidos(): void {
    when(mockVuelo.buscarPorId(1)).thenReturn(vueloValido);
    when(mockVuelo.obtenerAsientosDisponibles(1)).thenReturn(10);
    when(mockVuelo.actualizarAsientosOcupados(anything(), anything())).thenReturn(true);
    when(mockPasajero.validarPasajero(anything())).thenReturn({ valido: true, errores: [] });
    when(mockPasajero.verificarDocumentos(anything(), anything())).thenReturn({ aprobado: true, razon: '' });
    when(mockPasajero.calcularCategoria(anything())).thenReturn('adulto');
  }

  // -------------------------------------------------------------------------
  describe('6.1 Stubbing', () => {

    it('camino feliz: reserva.vuelo.id = 1 y estado = "pendiente"', () => {
      // Arrange
      arrangeColaboradoresValidos();
      when(mockPrecio.calcularPrecioGrupal(anything(), anything(), anything())).thenReturn(precioFalso);

      // Act
      const res = servicio.crearReserva(1, [crearPasajero()], opciones);

      // Assert
      expect(res.exito).toBeTrue();
      expect(res.reserva!.vuelo.id).toBe(1);
      expect(res.reserva!.estado).toBe('pendiente');
    });

    it('thenThrow en calcularPrecioGrupal se propaga al llamador (ReservaService no lo protege)', () => {
      // Arrange
      arrangeColaboradoresValidos();
      when(mockPrecio.calcularPrecioGrupal(anything(), anything(), anything()))
        .thenThrow(new Error('Tasa no disponible'));

      // Act
      let capturado: Error | null = null;
      try {
        servicio.crearReserva(1, [crearPasajero()], opciones);
      } catch (e) {
        capturado = e as Error;
      }

      // Assert  (hallazgo: pese a "no lanza excepciones", la excepción del
      // colaborador de precio se propaga sin protección)
      expect(capturado).not.toBeNull();
      expect(capturado!.message).toContain('Tasa no disponible');
    });

    it('validarPasajero siempre válido => la reserva contiene los cinco pasajeros', () => {
      // Arrange
      arrangeColaboradoresValidos();
      when(mockPrecio.calcularPrecioGrupal(anything(), anything(), anything())).thenReturn(precioFalso);
      const cinco = [1, 2, 3, 4, 5].map(i => crearPasajero({ id: i }));

      // Act
      const res = servicio.crearReserva(1, cinco, opciones);

      // Assert
      expect(res.exito).toBeTrue();
      expect(res.reserva!.pasajeros.length).toBe(5);
    });
  });

  // -------------------------------------------------------------------------
  describe('6.2 Verify y orden de invocaciones', () => {

    it('buscarPorId(1) se invoca exactamente una vez', () => {
      // Arrange
      arrangeColaboradoresValidos();
      when(mockPrecio.calcularPrecioGrupal(anything(), anything(), anything())).thenReturn(precioFalso);

      // Act
      servicio.crearReserva(1, [crearPasajero()], opciones);

      // Assert
      expect(() => verify(mockVuelo.buscarPorId(1)).once()).not.toThrow();
    });

    it('validarPasajero se invoca cuatro veces con cuatro pasajeros', () => {
      // Arrange
      arrangeColaboradoresValidos();
      when(mockPrecio.calcularPrecioGrupal(anything(), anything(), anything())).thenReturn(precioFalso);
      const cuatro = [1, 2, 3, 4].map(i => crearPasajero({ id: i }));

      // Act
      servicio.crearReserva(1, cuatro, opciones);

      // Assert
      expect(() => verify(mockPasajero.validarPasajero(anything())).times(4)).not.toThrow();
    });

    it('buscarPorId(1) es invocado antes que calcularPrecioGrupal', () => {
      // Arrange
      arrangeColaboradoresValidos();
      when(mockPrecio.calcularPrecioGrupal(anything(), anything(), anything())).thenReturn(precioFalso);

      // Act
      servicio.crearReserva(1, [crearPasajero()], opciones);

      // Assert
      expect(() =>
        verify(mockVuelo.buscarPorId(1))
          .calledBefore(mockPrecio.calcularPrecioGrupal(anything(), anything(), anything()))
      ).not.toThrow();
    });

    it('actualizarAsientosOcupados(1, anyNumber()) se invoca al menos una vez', () => {
      // Arrange
      arrangeColaboradoresValidos();
      when(mockPrecio.calcularPrecioGrupal(anything(), anything(), anything())).thenReturn(precioFalso);

      // Act
      servicio.crearReserva(1, [crearPasajero()], opciones);

      // Assert
      expect(() => verify(mockVuelo.actualizarAsientosOcupados(1, anyNumber())).atLeast(1)).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  describe('6.3 Capture y never', () => {

    it('capture.last() devuelve [1, 3] al reservar tres pasajeros', () => {
      // Arrange
      arrangeColaboradoresValidos();
      when(mockPrecio.calcularPrecioGrupal(anything(), anything(), anything())).thenReturn(precioFalso);
      const tres = [1, 2, 3].map(i => crearPasajero({ id: i }));

      // Act
      servicio.crearReserva(1, tres, opciones);

      // Assert
      const [id, delta] = capture(mockVuelo.actualizarAsientosOcupados).last();
      expect(id).toBe(1);
      expect(delta).toBe(3);
    });

    it('al cancelar, hay dos invocaciones y el último delta es -3', () => {
      // Arrange
      arrangeColaboradoresValidos();
      when(mockPrecio.calcularPrecioGrupal(anything(), anything(), anything())).thenReturn(precioFalso);
      const tres = [1, 2, 3].map(i => crearPasajero({ id: i }));

      // Act
      const res = servicio.crearReserva(1, tres, opciones);
      servicio.cancelarReserva(res.reserva!.id);

      // Assert
      verify(mockVuelo.actualizarAsientosOcupados(anything(), anything())).times(2);
      const [, delta] = capture(mockVuelo.actualizarAsientosOcupados).last();
      expect(delta).toBe(-3);
    });

    it('si buscarPorId retorna undefined, calcularPrecioGrupal nunca se invoca', () => {
      // Arrange
      when(mockVuelo.buscarPorId(1)).thenReturn(undefined);

      // Act
      const res = servicio.crearReserva(1, [crearPasajero()], opciones);

      // Assert
      expect(res.exito).toBeFalse();
      verify(mockPrecio.calcularPrecioGrupal(anything(), anything(), anything())).never();
    });
  });
});
