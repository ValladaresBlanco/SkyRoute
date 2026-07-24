import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('AppComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), provideAnimationsAsync()]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('starts in dark theme by default', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.ngOnInit();
    expect(app.tema).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('toggles between dark and light and persists the choice', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.ngOnInit();

    app.alternarTema();
    expect(app.tema).toBe('light');
    expect(localStorage.getItem('skyroute-tema')).toBe('light');

    app.alternarTema();
    expect(app.tema).toBe('dark');
  });
});
