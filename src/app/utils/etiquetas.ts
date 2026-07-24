/**
 * Human-readable labels and colors for the UI.
 *
 * Centralizes translating the system's internal values
 * (e.g. "adulto_mayor", "economica") into text shown to the user
 * (e.g. "Senior", "Economy"). Keeps these lookups in one place so we
 * don't repeat `switch`es across components and the app stays consistent.
 */

// ---- Passenger category (by age) ----
export function categoriaLabel(categoria: string): string {
  switch (categoria) {
    case 'infante': return 'Infant';
    case 'nino': return 'Child';
    case 'adulto': return 'Adult';
    case 'adulto_mayor': return 'Senior';
    default: return categoria;
  }
}

// ---- Cabin class ----
export function claseLabel(clase: string): string {
  switch (clase) {
    case 'economica': return 'Economy';
    case 'ejecutiva': return 'Business';
    case 'primera': return 'First';
    default: return clase;
  }
}

// ---- Frequent-flyer tier ----
export function nivelFrecuenteLabel(nivel: string): string {
  switch (nivel) {
    case 'ninguno': return 'No membership';
    case 'bronce': return 'Bronze';
    case 'plata': return 'Silver';
    case 'oro': return 'Gold';
    case 'platino': return 'Platinum';
    default: return nivel;
  }
}

// ---- Flight status ----
export function estadoVueloLabel(estado: string): string {
  switch (estado) {
    case 'programado': return 'Scheduled';
    case 'abordando': return 'Boarding';
    case 'en_vuelo': return 'In flight';
    case 'aterrizado': return 'Landed';
    case 'cancelado': return 'Cancelled';
    case 'retrasado': return 'Delayed';
    default: return estado;
  }
}

/** Angular Material color for the flight-status chip. */
export function estadoVueloColor(estado: string): 'primary' | 'warn' | 'accent' | '' {
  switch (estado) {
    case 'programado': return 'primary';
    case 'retrasado': return 'warn';
    case 'cancelado': return 'accent';
    default: return '';
  }
}

// ---- Booking status ----
export function estadoReservaLabel(estado: string): string {
  switch (estado) {
    case 'pendiente': return 'Pending';
    case 'confirmada': return 'Confirmed';
    case 'cancelada': return 'Cancelled';
    case 'completada': return 'Completed';
    case 'expirada': return 'Expired';
    default: return estado;
  }
}

/** Material icon representing the booking status. */
export function estadoReservaIcon(estado: string): string {
  switch (estado) {
    case 'pendiente': return 'schedule';
    case 'confirmada': return 'check_circle';
    case 'cancelada': return 'cancel';
    case 'completada': return 'done_all';
    case 'expirada': return 'timer_off';
    default: return 'help';
  }
}

/** Color (hex) representing the booking status. */
export function estadoReservaColor(estado: string): string {
  switch (estado) {
    case 'pendiente': return '#f59e0b';
    case 'confirmada': return '#22c55e';
    case 'cancelada': return '#ef4444';
    case 'completada': return '#3b82f6';
    case 'expirada': return '#9ca3af';
    default: return '#6b7280';
  }
}

// ---- "Offer" quality (precioService.evaluarOferta) ----
export function ofertaLabel(oferta: string): string {
  switch (oferta) {
    case 'excelente': return 'Great deal';
    case 'buena': return 'Good price';
    case 'normal': return 'Average';
    case 'cara': return 'Pricey';
    case 'sin referencia': return '—';
    default: return oferta;
  }
}
