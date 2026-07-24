# SkyRoute

SkyRoute is a web application for managing and booking commercial flights, built with Angular 17 and Angular Material. It covers the full workflow of a travel agency: searching for flights, creating multi-passenger bookings with business-rule validation, calculating prices and taxes, managing passengers, and reviewing statistics from a dashboard.
<img width="1918" height="881" alt="Screenshot 2026-07-24 140617" src="https://github.com/user-attachments/assets/e510e4b4-f114-41e7-b8c9-44ba9c5a7585" />

The main focus of the project is a service layer that models real airline domain logic (pricing, taxes, travel documentation, refunds, and frequent-flyer miles), designed against interfaces to keep the code testable and maintainable.

## Overview

The application is organized around four core services, each responsible for one part of the domain:

- **Flight service** — flight catalog, availability, seat management, occupancy statistics, and connection validation.
- **Passenger service** — passenger data, age-based categorization, data validation, visa and document checks, frequent-flyer benefits, and miles.
- **Pricing service** — per-class charges, discounts, group discounts, taxes, and currency conversion.
- **Booking service** — the booking lifecycle: creation with validation, confirmation, and cancellation with refund calculation.

## Features

### Flight search
Search flights by origin, destination, and date. Results support layovers, travel classes (economy, business, first), and flight states (scheduled, boarding, in-flight, landed, cancelled, delayed).
<img width="1917" height="877" alt="Screenshot 2026-07-24 140813" src="https://github.com/user-attachments/assets/b120d47f-32f9-4544-b98d-fd634c89aeaa" />
<img width="1919" height="881" alt="Screenshot 2026-07-24 140650" src="https://github.com/user-attachments/assets/086747c8-c336-4519-9e64-fc5f8a5defa8" />
### Booking
Bookings run through a sequence of nine validation checks before they are accepted, including:

- At least one passenger and no more than nine per booking.
- The flight exists and is in a bookable state.
- Enough available seats for every passenger.
- Every passenger passes data validation.
- Every passenger holds valid documents for the destination country.
- At least one adult for each infant.
- The departure date is not in the past.

Confirmed bookings can be cancelled, and the refund is calculated based on how far in advance the cancellation happens (100%, 80%, 50%, or 0%).
<img width="1675" height="816" alt="Screenshot 2026-07-24 141834" src="https://github.com/user-attachments/assets/e6f237da-56c6-48ed-a034-f1b2cab4f4cc" />


### Passenger management
- Automatic categorization by age: infant, child, adult, and senior.
- Data validation for passport format, email, phone, and emergency contact, with stricter rules for infants.
- Document and visa verification based on free-transit agreements between countries.
- Frequent-flyer tiers (bronze through platinum) with tier benefits and earned-miles calculation.
<img width="1918" height="875" alt="Screenshot 2026-07-24 140832" src="https://github.com/user-attachments/assets/24a1eea2-b1ef-4b7c-bd71-7a0b80c6cdba" />
<img width="1916" height="884" alt="Screenshot 2026-07-24 140847" src="https://github.com/user-attachments/assets/707250f1-6c53-4ca2-ad75-fc70c8166b6c" />

### Pricing engine
- Class-based charges, discounts by passenger category, and discounts by frequent-flyer tier.
- Group discounts based on the number of passengers.
- Tax calculation that averages the tax rates of the origin and destination countries.
- Multi-currency conversion (USD, EUR, CRC, MXN, COP, PEN, ARS) and a price-competitiveness evaluation.
<img width="1675" height="816" alt="Screenshot 2026-07-24 141834" src="https://github.com/user-attachments/assets/900bb46e-8c67-47c0-aeeb-e6467c1e23ad" />


## Tech stack

| Category    | Technology                              |
|-------------|-----------------------------------------|
| Framework   | Angular 17 (standalone components)      |
| Language    | TypeScript 5.4                          |
| UI          | Angular Material 17 and Angular CDK     |
| Styling     | SCSS                                     |
| Reactivity  | RxJS 7                                   |
| Routing     | Angular Router                          |
| Testing     | Jasmine, Karma, ts-mockito              |
| Tooling     | Angular CLI                             |

## Architecture

The project keeps a clear separation between domain models, service contracts, service implementations, and UI components:

```
src/app/
├── models/           Domain interfaces (Vuelo, Pasajero, Reserva, DesglosePrecio)
├── interfaces/       Service contracts (IVueloService, IPasajeroService, IPrecioService)
├── services/         Business logic and tests (unit, integration, and mockito)
│   ├── vuelo.service.ts
│   ├── pasajero.service.ts
│   ├── precio.service.ts
│   └── reserva.service.ts
└── components/       UI (standalone components using Angular Material)
    ├── dashboard/
    ├── busqueda-vuelos/
    ├── reserva/
    ├── historial/
    └── pasajeros/
```

Each service implements its own interface. This keeps dependency injection clean and makes it straightforward to substitute mocks in tests, as shown in `reserva.service.mockito.spec.ts`.

## Getting started

Requirements: Node.js 18 or later, and Angular CLI.

```bash
# 1. Clone the repository
git clone https://github.com/ValladaresBlanco/SkyRoute.git
cd skyroute

# 2. Install dependencies
npm install

# 3. Start the development server
npm start
```

The application will be available at http://localhost:4200/ and reloads automatically when you change any source file.

## Testing

```bash
npm test
```

This runs the test suite with Karma and Jasmine, which includes:

- Unit tests for the pricing logic.
- Integration tests across services (`*.integracion.spec.ts`).
- Tests using mocks with ts-mockito (`*.mockito.spec.ts`).

## Production build

```bash
npm run build
```

Build artifacts are generated in the `dist/` directory.

## License

Portfolio project created for educational and demonstration purposes.
