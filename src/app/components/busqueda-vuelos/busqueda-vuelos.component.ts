import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { VueloService } from '../../services/vuelo.service';
import { PrecioService } from '../../services/precio.service';
import { Vuelo } from '../../models/vuelo.model';
import { claseLabel, estadoVueloLabel, ofertaLabel } from '../../utils/etiquetas';

@Component({
  selector: 'app-busqueda-vuelos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule],
  templateUrl: './busqueda-vuelos.component.html',
  styleUrls: ['./busqueda-vuelos.component.scss']
})
export class BusquedaVuelosComponent implements OnInit {
  origen = '';
  destino = '';
  fecha = '';
  resultados: Vuelo[] = [];

  // Human-readable labels exposed to the template
  claseLabel = claseLabel;
  estadoVueloLabel = estadoVueloLabel;
  ofertaLabel = ofertaLabel;

  private preciosReferencia: number[] = [];

  constructor(
    private vueloService: VueloService,
    private precioService: PrecioService
  ) {}

  ngOnInit(): void {
    // Al entrar mostramos todo el itinerario disponible (no una pantalla vacía)
    this.preciosReferencia = this.vueloService.obtenerTodos().map(v => v.precioBase);
    this.buscar();
  }

  /** Búsqueda reactiva: se llama en cada cambio de los campos y con los botones. */
  buscar(): void {
    const fecha = this.fecha ? new Date(this.fecha) : null;
    this.resultados = this.vueloService.buscarFlexible(this.origen, this.destino, fecha);
  }

  limpiar(): void {
    this.origen = '';
    this.destino = '';
    this.fecha = '';
    this.buscar();
  }

  formatearDuracion(min: number): string {
    return this.vueloService.formatearDuracion(min);
  }

  asientosDisponibles(vuelo: Vuelo): number {
    return vuelo.asientosTotales - vuelo.asientosOcupados;
  }

  /** Evalúa si el precio del vuelo es una buena oferta frente al resto del catálogo. */
  oferta(vuelo: Vuelo): string {
    return this.precioService.evaluarOferta(this.preciosReferencia, vuelo.precioBase);
  }
}
