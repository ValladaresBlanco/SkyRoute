import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { PasajeroService } from '../../services/pasajero.service';
import { ReservaService } from '../../services/reserva.service';
import { Pasajero } from '../../models/pasajero.model';
import { Reserva } from '../../models/reserva.model';
import { categoriaLabel, nivelFrecuenteLabel, estadoReservaLabel, estadoReservaColor } from '../../utils/etiquetas';

@Component({
  selector: 'app-pasajeros',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './pasajeros.component.html',
  styleUrls: ['./pasajeros.component.scss']
})
export class PasajerosComponent implements OnInit {
  pasajeros: Pasajero[] = [];

  // Etiquetas legibles expuestas al template
  categoriaLabel = categoriaLabel;
  nivelFrecuenteLabel = nivelFrecuenteLabel;
  estadoLabel = estadoReservaLabel;
  estadoColor = estadoReservaColor;

  // Ciclo de acentos para variar el color de cada tarjeta
  readonly acentos = ['c-sky', 'c-amber', 'c-rose', 'c-sage', 'c-violet'];

  constructor(
    private pasajeroService: PasajeroService,
    private reservaService: ReservaService
  ) {}

  ngOnInit(): void {
    this.pasajeros = this.pasajeroService.obtenerTodos();
  }

  /** Reservas (y por tanto vuelos) en las que está inscrito el pasajero. */
  reservasDe(p: Pasajero): Reserva[] {
    return this.reservaService.obtenerReservasPorPasajero(p.id);
  }

  nombreCompleto(p: Pasajero): string {
    return this.pasajeroService.formatearNombreCompleto(p);
  }

  categoria(p: Pasajero): string {
    return this.pasajeroService.calcularCategoria(p.fechaNacimiento);
  }

  edad(p: Pasajero): number {
    return this.pasajeroService.calcularEdad(p.fechaNacimiento);
  }
}
