import { Injectable } from '@angular/core';
import { Pasajero, CategoriaPasajero } from '../models/pasajero.model';
import { IPasajeroService } from '../interfaces/ipasajero.service';

@Injectable({
  providedIn: 'root'
})
export class PasajeroService implements IPasajeroService {

  private pasajeros: Pasajero[] = [];

  /**
   * Carga los pasajeros desde una fuente externa (ej. assets/data/pasajeros.json).
   * Convierte la fecha de nacimiento (que llega como texto) a objeto Date.
   */
  cargar(pasajeros: Pasajero[]): void {
    this.pasajeros = pasajeros.map(p => ({
      ...p,
      fechaNacimiento: new Date(p.fechaNacimiento)
    }));
  }

  obtenerTodos(): Pasajero[] {
    return [...this.pasajeros];
  }

  obtenerPorId(id: number): Pasajero | undefined {
    return this.pasajeros.find(p => p.id === id);
  }

  /**
   * Calcula la categoría del pasajero según su fecha de nacimiento:
   * - "infante": 0-1 años (menos de 2 años)
   * - "nino": 2-11 años
   * - "adulto": 12-64 años
   * - "adulto_mayor": 65 años o más
   * La edad se calcula con respecto a la fecha actual.
   */
  calcularCategoria(fechaNacimiento: Date): CategoriaPasajero {
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mesDiff = hoy.getMonth() - fechaNacimiento.getMonth();
    if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }

    if (edad < 2) return 'infante';
    if (edad < 12) return 'nino';
    if (edad < 65) return 'adulto';
    return 'adulto_mayor';
  }

  /**
   * Calcula la edad exacta en años a partir de la fecha de nacimiento.
   */
  calcularEdad(fechaNacimiento: Date): number {
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mesDiff = hoy.getMonth() - fechaNacimiento.getMonth();
    if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }
    return edad;
  }

  /**
   * Valida un pasajero antes de permitir una reserva.
   * Reglas de validación:
   * 1. El nombre no puede estar vacío ni tener solo espacios.
   * 2. El apellido no puede estar vacío ni tener solo espacios.
   * 3. El pasaporte debe tener formato válido: 2 letras seguidas de 7 dígitos.
   * 4. El email debe contener "@" y al menos un "." después del "@".
   * 5. La fecha de nacimiento no puede ser futura.
   * 6. El teléfono debe tener al menos 8 caracteres.
   * 7. Debe tener un contacto de emergencia con nombre y teléfono.
   * 8. Si es infante (< 2 años), debe tener un contacto de emergencia con relación "padre" o "madre".
   * Retorna un objeto con { valido: boolean, errores: string[] }.
   */
  validarPasajero(pasajero: Pasajero): { valido: boolean; errores: string[] } {
    const errores: string[] = [];

    if (!pasajero.nombre || pasajero.nombre.trim().length === 0) {
      errores.push('First name is required');
    }
    if (!pasajero.apellido || pasajero.apellido.trim().length === 0) {
      errores.push('Last name is required');
    }

    const pasaporteRegex = /^[A-Z]{2}\d{7}$/;
    if (!pasaporteRegex.test(pasajero.pasaporte)) {
      errores.push('Passport must have a valid format (2 uppercase letters + 7 digits)');
    }

    if (!pasajero.email || !pasajero.email.includes('@')) {
      errores.push('Email must contain @');
    } else {
      const partes = pasajero.email.split('@');
      if (partes.length !== 2 || !partes[1].includes('.')) {
        errores.push('Email must have a valid domain');
      }
    }

    if (pasajero.fechaNacimiento > new Date()) {
      errores.push('Date of birth cannot be in the future');
    }

    if (!pasajero.telefono || pasajero.telefono.replace(/\s/g, '').length < 8) {
      errores.push('Phone must have at least 8 characters');
    }

    if (!pasajero.contactoEmergencia ||
        !pasajero.contactoEmergencia.nombre || pasajero.contactoEmergencia.nombre.trim().length === 0 ||
        !pasajero.contactoEmergencia.telefono || pasajero.contactoEmergencia.telefono.trim().length === 0) {
      errores.push('An emergency contact with name and phone is required');
    }

    const categoria = this.calcularCategoria(pasajero.fechaNacimiento);
    if (categoria === 'infante') {
      // Acepta parentesco en inglés o español (los datos usan "father"/"mother").
      const relacion = pasajero.contactoEmergencia?.relacion?.toLowerCase();
      const esProgenitor = ['father', 'mother', 'parent', 'padre', 'madre'].includes(relacion ?? '');
      if (!esProgenitor) {
        errores.push('Infants must have an emergency contact who is a parent');
      }
    }

    return { valido: errores.length === 0, errores };
  }

  /**
   * Verifica si un pasajero tiene los documentos necesarios para viajar a un país.
   * Reglas:
   * 1. Pasajeros con nacionalidad del país destino siempre pueden entrar (no necesitan visa).
   * 2. Pasajeros de ciertos países NO necesitan visa para ciertos destinos:
   *    - CR, PA, CO, MX, AR, CL -> pueden entrar a cualquier país centroamericano/sudamericano sin visa
   *    - US, CA -> pueden entrar a CR, MX, CO, PA sin visa
   *    - EU (cualquier país europeo) -> pueden entrar a CR, MX, CO, PA, US, CA sin visa
   * 3. Para cualquier otro caso, el pasajero necesita visa vigente del país destino.
   * 4. El pasaporte siempre es obligatorio (ya se valida en validarPasajero).
   * Retorna { aprobado: boolean, razon: string }.
   */
  verificarDocumentos(pasajero: Pasajero, paisDestino: string): { aprobado: boolean; razon: string } {
    const destino = paisDestino.toUpperCase();
    const nacionalidad = pasajero.nacionalidad.toUpperCase();

    if (nacionalidad === destino) {
      return { aprobado: true, razon: 'National of the destination country' };
    }

    const paisesLatam = ['CR', 'PA', 'CO', 'MX', 'AR', 'CL', 'PE', 'EC', 'GT', 'HN', 'SV', 'NI', 'BO', 'PY', 'UY', 'VE'];
    const destinosLibresLatam = ['CR', 'PA', 'CO', 'MX', 'AR', 'CL', 'PE', 'EC', 'GT', 'HN', 'SV', 'NI', 'BO', 'PY', 'UY'];

    if (paisesLatam.includes(nacionalidad) && destinosLibresLatam.includes(destino)) {
      return { aprobado: true, razon: 'Visa-free travel between Latin American countries' };
    }

    const destinosLibresAnglo = ['CR', 'MX', 'CO', 'PA'];
    if ((nacionalidad === 'US' || nacionalidad === 'CA') && destinosLibresAnglo.includes(destino)) {
      return { aprobado: true, razon: 'US/CA citizen with visa-free entry' };
    }

    const paisesEU = ['ES', 'FR', 'DE', 'IT', 'PT', 'NL', 'BE', 'AT', 'IE', 'GB'];
    const destinosLibresEU = ['CR', 'MX', 'CO', 'PA', 'US', 'CA'];
    if (paisesEU.includes(nacionalidad) && destinosLibresEU.includes(destino)) {
      return { aprobado: true, razon: 'European citizen with visa-free entry' };
    }

    if (pasajero.visasVigentes.map(v => v.toUpperCase()).includes(destino)) {
      return { aprobado: true, razon: 'Valid visa found for the destination country' };
    }

    return { aprobado: false, razon: `A visa is required for ${destino} and the passenger doesn't have a valid one` };
  }

  /**
   * Calcula los beneficios por nivel de membresía frecuente.
   * - ninguno: 0% descuento, 0kg equipaje extra, sin sala VIP, sin prioridad
   * - bronce:  5% descuento, 5kg equipaje extra, sin sala VIP, sin prioridad
   * - plata:   10% descuento, 10kg equipaje extra, sin sala VIP, prioridad de abordaje
   * - oro:     15% descuento, 15kg equipaje extra, sala VIP, prioridad de abordaje
   * - platino: 25% descuento, 23kg equipaje extra, sala VIP, prioridad de abordaje
   */
  obtenerBeneficiosFrecuente(pasajero: Pasajero): {
    descuento: number;
    equipajeExtra: number;
    salaVip: boolean;
    prioridadAbordaje: boolean;
  } {
    if (!pasajero.miembroFrecuente) {
      return { descuento: 0, equipajeExtra: 0, salaVip: false, prioridadAbordaje: false };
    }

    switch (pasajero.nivelFrecuente) {
      case 'bronce':
        return { descuento: 5, equipajeExtra: 5, salaVip: false, prioridadAbordaje: false };
      case 'plata':
        return { descuento: 10, equipajeExtra: 10, salaVip: false, prioridadAbordaje: true };
      case 'oro':
        return { descuento: 15, equipajeExtra: 15, salaVip: true, prioridadAbordaje: true };
      case 'platino':
        return { descuento: 25, equipajeExtra: 23, salaVip: true, prioridadAbordaje: true };
      default:
        return { descuento: 0, equipajeExtra: 0, salaVip: false, prioridadAbordaje: false };
    }
  }

  /**
   * Genera un resumen de las necesidades especiales de un grupo de pasajeros.
   * Agrupa por tipo de necesidad y cuenta cuántos pasajeros la requieren.
   * Retorna un arreglo de { necesidad: string, cantidad: number } ordenado por cantidad desc.
   */
  agruparNecesidadesEspeciales(pasajeros: Pasajero[]): { necesidad: string; cantidad: number }[] {
    const conteo: { [key: string]: number } = {};

    for (const pasajero of pasajeros) {
      for (const necesidad of pasajero.necesidadesEspeciales) {
        const key = necesidad.toLowerCase().trim();
        conteo[key] = (conteo[key] || 0) + 1;
      }
    }

    return Object.entries(conteo)
      .map(([necesidad, cantidad]) => ({ necesidad, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }

  /**
   * Formatea el nombre completo del pasajero.
   * Formato: "APELLIDO, Nombre" en mayúsculas/minúsculas apropiadas.
   * Si el nombre o apellido está vacío, solo muestra el disponible.
   */
  formatearNombreCompleto(pasajero: Pasajero): string {
    const nombre = pasajero.nombre?.trim() || '';
    const apellido = pasajero.apellido?.trim() || '';

    if (!nombre && !apellido) return 'Sin nombre';
    if (!apellido) return nombre;
    if (!nombre) return apellido.toUpperCase();

    return `${apellido.toUpperCase()}, ${nombre.charAt(0).toUpperCase()}${nombre.slice(1).toLowerCase()}`;
  }

  /**
   * Calcula las millas que un pasajero ganaría por un vuelo.
   * Reglas:
   * - Vuelos económicos: 1 milla por cada minuto de duración
   * - Vuelos ejecutivos: 1.5 millas por minuto
   * - Vuelos primera clase: 2 millas por minuto
   * - Bonus por nivel frecuente:
   *   - bronce: +10%
   *   - plata: +25%
   *   - oro: +50%
   *   - platino: +100%
   * Retorna las millas redondeadas al entero más cercano.
   */
  calcularMillasGanadas(duracionMinutos: number, clase: string, nivelFrecuente: string): number {
    let multiplicadorClase = 1;
    switch (clase) {
      case 'ejecutiva': multiplicadorClase = 1.5; break;
      case 'primera': multiplicadorClase = 2; break;
    }

    let bonusFrecuente = 0;
    switch (nivelFrecuente) {
      case 'bronce': bonusFrecuente = 0.10; break;
      case 'plata': bonusFrecuente = 0.25; break;
      case 'oro': bonusFrecuente = 0.50; break;
      case 'platino': bonusFrecuente = 1.00; break;
    }

    const millasBase = duracionMinutos * multiplicadorClase;
    const millasConBonus = millasBase * (1 + bonusFrecuente);
    return Math.round(millasConBonus);
  }
}
