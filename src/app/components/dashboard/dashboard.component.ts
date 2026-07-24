import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { VueloService } from '../../services/vuelo.service';
import { ReservaService } from '../../services/reserva.service';
import { Reserva } from '../../models/reserva.model';

/** Un destino agregado para la vitrina del inicio. */
interface Destino {
  ciudad: string;
  desde: number;      // precio más bajo disponible
  vuelos: number;     // cantidad de vuelos disponibles
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  destinos: Destino[] = [];
  misReservas: Reserva[] = [];
  proximaReserva: Reserva | null = null;

  constructor(
    private vueloService: VueloService,
    private reservaService: ReservaService
  ) {}

  ngOnInit(): void {
    this.destinos = this.calcularDestinos();
    this.misReservas = this.reservaService.obtenerTodas();
    this.proximaReserva = this.proximaPorFecha(this.misReservas);
  }

  /** Agrupa los vuelos disponibles por ciudad destino con su precio "desde". */
  private calcularDestinos(): Destino[] {
    const mapa = new Map<string, Destino>();
    for (const v of this.vueloService.obtenerVuelosDisponibles()) {
      const actual = mapa.get(v.destino);
      if (!actual) {
        mapa.set(v.destino, { ciudad: v.destino, desde: v.precioBase, vuelos: 1 });
      } else {
        actual.vuelos++;
        actual.desde = Math.min(actual.desde, v.precioBase);
      }
    }
    return [...mapa.values()].sort((a, b) => a.desde - b.desde);
  }

  /** La reserva activa con la fecha de salida más próxima. */
  private proximaPorFecha(reservas: Reserva[]): Reserva | null {
    const activas = reservas
      .filter(r => r.estado === 'pendiente' || r.estado === 'confirmada')
      .sort((a, b) => a.vuelo.fechaSalida.getTime() - b.vuelo.fechaSalida.getTime());
    return activas[0] ?? null;
  }
}
