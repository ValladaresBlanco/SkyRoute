import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';

type Tema = 'dark' | 'light';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, MatIconModule, MatSidenavModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  sidenavOpened = true;
  esMovil = false;
  tema: Tema = 'dark';

  ahora = new Date();               // reloj en vivo del topbar
  private reloj?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    // Recupera preferencia guardada; si no hay, usa oscuro por defecto.
    const guardado = localStorage.getItem('skyroute-tema') as Tema | null;
    this.aplicarTema(guardado ?? 'dark');
    this.ajustarPorTamano(window.innerWidth);

    // Actualiza la hora cada segundo.
    this.reloj = setInterval(() => (this.ahora = new Date()), 1000);
  }

  ngOnDestroy(): void {
    if (this.reloj) clearInterval(this.reloj);
  }

  @HostListener('window:resize', ['$event'])
  onResize(e: UIEvent): void {
    this.ajustarPorTamano((e.target as Window).innerWidth);
  }

  /** En móvil el menú se muestra como overlay y arranca cerrado. */
  private ajustarPorTamano(ancho: number): void {
    const movil = ancho <= 900;
    if (movil !== this.esMovil) {
      this.esMovil = movil;
      this.sidenavOpened = !movil;
    }
  }

  /** Al navegar en móvil, cierra el menú. */
  cerrarSiMovil(): void {
    if (this.esMovil) this.sidenavOpened = false;
  }

  alternarTema(): void {
    this.aplicarTema(this.tema === 'dark' ? 'light' : 'dark');
  }

  private aplicarTema(tema: Tema): void {
    this.tema = tema;
    document.documentElement.setAttribute('data-theme', tema);
    localStorage.setItem('skyroute-tema', tema);
  }
}
