import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { VueloService } from '../../services/vuelo.service';
import { PasajeroService } from '../../services/pasajero.service';
import { PrecioService } from '../../services/precio.service';
import { ReservaService } from '../../services/reserva.service';
import { Vuelo, OpcionesReserva } from '../../models/vuelo.model';
import { Pasajero } from '../../models/pasajero.model';
import { Reserva, DesglosePrecio } from '../../models/reserva.model';
import { claseLabel, categoriaLabel, nivelFrecuenteLabel } from '../../utils/etiquetas';

/** Resultado de intentar crear la reserva (ver ReservaService). */
interface ResultadoReserva {
  exito: boolean;
  error: string | null;
  reserva: Reserva | null;
}

@Component({
  selector: 'app-reserva',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatIconModule, MatCheckboxModule, MatSelectModule, MatSnackBarModule
  ],
  templateUrl: './reserva.component.html',
  styleUrls: ['./reserva.component.scss']
})
export class ReservaComponent implements OnInit {
  vuelo: Vuelo | undefined;
  pasajerosDisponibles: Pasajero[] = [];
  seleccionados: number[] = [];

  opciones: OpcionesReserva = {
    equipajeExtra: false,
    seleccionAsiento: false,
    seguroViaje: false,
    comidaEspecial: null,
    prioridadAbordaje: false
  };

  precio: DesglosePrecio | null = null;
  resultado: ResultadoReserva | null = null;

  // Etiquetas legibles
  claseLabel = claseLabel;
  categoriaLabel = categoriaLabel;
  nivelFrecuenteLabel = nivelFrecuenteLabel;

  readonly comidasEspeciales = [
    { value: null, label: 'None' },
    { value: 'vegetariana', label: 'Vegetarian (+$15)' },
    { value: 'vegana', label: 'Vegan (+$15)' },
    { value: 'sin gluten', label: 'Gluten-free (+$15)' },
    { value: 'kosher', label: 'Kosher (+$15)' }
  ];

  constructor(
    private route: ActivatedRoute,
    private vueloService: VueloService,
    private pasajeroService: PasajeroService,
    private precioService: PrecioService,
    private reservaService: ReservaService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.vuelo = this.vueloService.buscarPorId(id);
    this.pasajerosDisponibles = this.pasajeroService.obtenerTodos();
  }

  /** Descuento grupal informativo según cantidad de pasajeros. */
  get descuentoGrupal(): number {
    const n = this.seleccionados.length;
    if (n >= 7) return 15;
    if (n >= 4) return 10;
    if (n >= 2) return 5;
    return 0;
  }

  estaSeleccionado(id: number): boolean {
    return this.seleccionados.includes(id);
  }

  toggle(id: number): void {
    const i = this.seleccionados.indexOf(id);
    if (i > -1) this.seleccionados.splice(i, 1);
    else this.seleccionados.push(id);
    this.recalcular();
  }

  recalcular(): void {
    if (!this.vuelo || this.seleccionados.length === 0) {
      this.precio = null;
      return;
    }
    this.precio = this.precioService.calcularPrecioGrupal(this.vuelo, this.pasajerosSeleccionados(), this.opciones);
  }

  reservar(): void {
    if (!this.vuelo) return;
    this.resultado = this.reservaService.crearReserva(this.vuelo.id, this.pasajerosSeleccionados(), this.opciones);

    if (this.resultado.exito) {
      this.snackBar.open('Booking created successfully', 'Close', { duration: 5000 });
      this.seleccionados = [];
      this.precio = null;
    } else {
      this.snackBar.open(this.resultado.error ?? "Couldn't create the booking", 'Close', { duration: 6000 });
    }
  }

  categoria(p: Pasajero): string {
    return this.pasajeroService.calcularCategoria(p.fechaNacimiento);
  }

  nombreCompleto(p: Pasajero): string {
    return this.pasajeroService.formatearNombreCompleto(p);
  }

  formatearDuracion(min: number): string {
    return this.vueloService.formatearDuracion(min);
  }

  private pasajerosSeleccionados(): Pasajero[] {
    return this.seleccionados
      .map(id => this.pasajeroService.obtenerPorId(id))
      .filter((p): p is Pasajero => p !== undefined);
  }
}
