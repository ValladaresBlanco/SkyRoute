import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReservaService } from '../../services/reserva.service';
import { Reserva } from '../../models/reserva.model';
import {
  estadoReservaLabel, estadoReservaIcon, estadoReservaColor,
  claseLabel, categoriaLabel
} from '../../utils/etiquetas';

interface ResumenReservas {
  totalReservas: number;
  porEstado: { pendiente: number; confirmada: number; cancelada: number; completada: number; expirada: number };
  ingresosTotales: number;
  pasajerosUnicos: number;
  promedioPasajerosPorReserva: number;
}

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatExpansionModule, MatSnackBarModule],
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.scss']
})
export class HistorialComponent implements OnInit {
  reservas: Reserva[] = [];
  resumen!: ResumenReservas;

  // Etiquetas / helpers visuales
  estadoLabel = estadoReservaLabel;
  estadoIcon = estadoReservaIcon;
  estadoColor = estadoReservaColor;
  claseLabel = claseLabel;
  categoriaLabel = categoriaLabel;

  constructor(
    private reservaService: ReservaService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.reservas = this.reservaService.obtenerTodas();
    this.resumen = this.reservaService.generarResumen();
  }

  private notificar(mensaje: string): void {
    this.snackBar.open(mensaje, 'Close', { duration: 4000 });
  }

  confirmar(id: number): void {
    const ok = this.reservaService.confirmarReserva(id);
    this.notificar(ok ? 'Booking confirmed' : "Couldn't confirm the booking");
    this.cargarDatos();
  }

  cancelar(id: number): void {
    const r = this.reservaService.cancelarReserva(id);
    this.notificar(r.cancelada
      ? `Booking cancelled · refund $${r.montoReembolso}`
      : "Couldn't cancel the booking");
    this.cargarDatos();
  }
}
