import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { BusquedaVuelosComponent } from './components/busqueda-vuelos/busqueda-vuelos.component';
import { ReservaComponent } from './components/reserva/reserva.component';
import { HistorialComponent } from './components/historial/historial.component';
import { PasajerosComponent } from './components/pasajeros/pasajeros.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'buscar', component: BusquedaVuelosComponent },
  { path: 'reservar/:id', component: ReservaComponent },
  { path: 'reservas', component: HistorialComponent },
  { path: 'pasajeros', component: PasajerosComponent },
  { path: '**', redirectTo: '/dashboard' }
];
