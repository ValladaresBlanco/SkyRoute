import { ApplicationConfig, APP_INITIALIZER, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { VueloService } from './services/vuelo.service';
import { PasajeroService } from './services/pasajero.service';

// Carga los datos desde assets/data/*.json antes de que arranque la app,
// así los servicios siguen siendo síncronos y ningún componente cambia.
function cargarDatos(
  http: HttpClient,
  vueloService: VueloService,
  pasajeroService: PasajeroService
) {
  return async () => {
    const vuelos = await firstValueFrom(http.get<any[]>('assets/data/vuelos.json'));
    const pasajeros = await firstValueFrom(http.get<any[]>('assets/data/pasajeros.json'));
    vueloService.cargar(vuelos);
    pasajeroService.cargar(pasajeros);
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(),
    { provide: LOCALE_ID, useValue: 'en-US' },
    {
      provide: APP_INITIALIZER,
      useFactory: cargarDatos,
      deps: [HttpClient, VueloService, PasajeroService],
      multi: true
    }
  ]
};
