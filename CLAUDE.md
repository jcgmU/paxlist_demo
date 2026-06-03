# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # dev server at http://localhost:5173
npm run build     # tsc -b && vite build (always run before deploying)
npm run lint      # eslint
npm run preview   # preview production build locally
vercel deploy --prod --yes   # deploy to production
```

No test suite — verify changes manually via `npm run dev`.

## Architecture

Demo-mode SPA (no backend). All data is hardcoded; no PDF upload or API calls.

### Layer structure

```
src/
  domain/           # Pure logic, no React
  infrastructure/   # Data sources (mockData only)
  presentation/
    components/     # React components
    store/          # Zustand global state
```

### Domain

- **`aircraftConfigs.ts`** — seat layout definitions per aircraft variant (B787-8 STD/EXNAS, A320, A319). Each config is a list of `AircraftElement` items (cabin rows or facility/galley rows).
- **`aircraftMatch.ts`** — maps a raw `aircraftType` string → config key for `AIRCRAFT_CONFIGS`.
- **`cabinLookup.ts`** — `getCabinClass(aircraftType, seat)` → `'business' | 'plus' | 'economy' | null`. Used to gate the meal-order form to business seats only.
- **`flightCodes.ts`** — SSR/status code catalog (MEDICAL, LEGAL, MEALS, STATUS, etc.). Source of truth for badge colors and descriptions.
- **`flightStats.ts`** — `countEmptySeats`, `countSSR`, `countMeals` used by the store's `getFlightStats()`.
- **`mealService.ts`** — meal-order domain:
  - `deriveMealSlots(serviceType, departureTime)` → `MealSlot[]`. Adds 1h to departure, maps hour → DESAYUNO/ALMUERZO/CENA. INSIGNIA always produces 2 slots; AMERICAS produces 1.
  - `buildCourses(serviceType, slots)` → `ServiceCourse[]` with menu items and flags (`hasEntrada`, `hasWakeUp`).
  - Menu catalogs `INSIGNIA_ENTRADAS`, `INSIGNIA_PLATOS`, `AMERICAS_PLATOS` keyed by `MealSlot`.

### Data (infrastructure)

**`mockData.ts`** — three hardcoded `FlightManifest` objects exported as `DEMO_FLIGHTS`:

| Export | Route | Departure | Service | Derived slots |
|--------|-------|-----------|---------|---------------|
| `FLIGHT_AV210` | BOG→JFK | 07:20 | AMERICAS | [DESAYUNO] |
| `FLIGHT_AV026` | BOG→MAD | 13:48 | INSIGNIA | [ALMUERZO, DESAYUNO] |
| `FLIGHT_AV120` | BOG→LHR | 23:25 | INSIGNIA | [CENA, DESAYUNO] |

`FlightManifest` has `serviceType: ServiceType` and `departureTime: string (HH:MM)`. Meal slots are **not stored** — always derived at runtime.

### State (`useStore.ts`)

Zustand store. Key state:

- `manifest` — active flight, set by `DemoSelector`.
- `orders` — `Record<"${flightNumber}::${seat}", PassengerOrder>`. Persisted to `localStorage['paxlist-comandas']` on every write. Loaded on store init.
- `serviceOverride: ServiceType | null` — in-memory override (resets on page reload). Takes precedence over `manifest.serviceType` in `getActiveServiceType()`.

### Components

- **`DemoSelector`** — landing screen, shows the 3 demo flight cards with derived meal slots. Calls `setManifest`.
- **`SeatMap`** — renders `AircraftConfig.elements` (cabins + facilities). Business seats with complete orders show a green `CheckCircle2` badge at bottom-left. Delegates seat click to `PassengerModal` via `setSelectedSeat`.
- **`PassengerModal`** — shows passenger info. If seat is `business` (`getCabinClass`), renders `<ComandaForm>` below the SSR section.
- **`ComandaForm`** — the meal-order form. Calls `deriveMealSlots` + `buildCourses` to render one card per service. Insignia cards have entrada select + wakeUp toggle; Americas cards have plato fuerte only. Writes via `setCourseSelection` (persists immediately).
- **`StatsSidebar`** — desktop sidebar + mobile bottom sheet. Includes a `ComandaSection` at the bottom showing comanda progress (taken/total business) and a per-meal wake-up passenger list.
- **`App`** — navbar with service-type override `<select>` (amber = Insignia, blue = Americas). An "override" label appears when the active service differs from the manifest's default.

### Styling conventions

- Tailwind v4 via `@tailwindcss/vite` plugin. No `tailwind.config`.
- Avianca brand red: `#E20613`. Used for primary actions, badges, and focus rings.
- Rounded corners: `rounded-xl` for inputs/small elements, `rounded-2xl` for cards, `rounded-3xl` for large panels.
- All sub-components of `StatsSidebar` are defined **outside** the main component to maintain stable references and avoid re-render issues.

## Deployment

Deployed to Vercel (`paxlist-theta.vercel.app`) via Vercel CLI. No environment variables needed — the app is fully static.
