import { create } from 'zustand';
import type { FlightManifest, ParsedPassenger } from '../../infrastructure/mockData';
import { AIRCRAFT_CONFIGS } from '../../domain/aircraftConfigs';
import { FLIGHT_CODES } from '../../domain/flightCodes';
import { getAircraftConfigKey } from '../../domain/aircraftMatch';
import { countEmptySeats, countSSR, countMeals } from '../../domain/flightStats';
import type { ServiceType, MealSlot, CrewZone } from '../../domain/mealService';
import { deriveMealSlots, seatZone } from '../../domain/mealService';
import { getCabinClass } from '../../domain/cabinLookup';

export interface CourseSelection {
  entradaId?: string;
  platoFuerteId?: string;
  wakeUp?: boolean;
  unmetPlatoId?: string;
  unmetEntradaId?: string;
}

export type PassengerOrder = Partial<Record<MealSlot, CourseSelection>>;


interface AppState {
  manifest: FlightManifest | null;
  selectedSeat: string | null;
  searchTerm: string;
  orders: Record<string, PassengerOrder>;
  serviceOverride: ServiceType | null;

  unavailable: Record<string, boolean>;
  crewZone: CrewZone | null;
  comandaOpen: boolean;

  setManifest: (manifest: FlightManifest | null) => void;
  setSelectedSeat: (seat: string | null) => void;
  setSearchTerm: (term: string) => void;
  reset: () => void;
  setServiceOverride: (type: ServiceType | null) => void;
  setCourseSelection: (seat: string, slot: MealSlot, patch: Partial<CourseSelection>) => void;
  clearOrder: (seat: string) => void;
  setPaxUnavailable: (seat: string, value: boolean) => void;
  setCrewZone: (zone: CrewZone | null) => void;
  openComanda: () => void;
  closeComanda: () => void;
  clearZoneOrders: (zone: CrewZone) => void;

  getPassengerBySeat: (seat: string) => ParsedPassenger | undefined;
  getOrder: (seat: string) => PassengerOrder | undefined;
  getActiveServiceType: () => ServiceType | null;
  getComandaStatus: () => 'empty' | 'in-progress' | 'complete';
  getFlightStats: () => {
    emptySeats: number;
    ssrCounts: Record<string, number>;
    totalMeals: number;
    totalPassengers: number;
    infantCount: number;
  };
}

export const useStore = create<AppState>((set, get) => ({
  manifest: null,
  selectedSeat: null,
  searchTerm: '',
  orders: {},
  serviceOverride: null,
  unavailable: {},
  crewZone: null,
  comandaOpen: false,

  setManifest: (manifest) => set({ manifest, serviceOverride: null, orders: {}, unavailable: {}, crewZone: null, comandaOpen: false }),
  setSelectedSeat: (seat) => set({ selectedSeat: seat }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setServiceOverride: (type) => set({ serviceOverride: type }),
  reset: () => set({ manifest: null, selectedSeat: null, searchTerm: '', serviceOverride: null, orders: {}, unavailable: {}, crewZone: null, comandaOpen: false }),

  setCourseSelection: (seat, slot, patch) => {
    const { manifest, orders } = get();
    if (!manifest) return;
    const key = `${manifest.flightNumber}::${seat}`;
    const existing = orders[key] ?? {};
    const updatedOrder: PassengerOrder = {
      ...existing,
      [slot]: { ...(existing[slot] ?? {}), ...patch },
    };
    const updated = { ...orders, [key]: updatedOrder };
    set({ orders: updated });
  },

  clearOrder: (seat) => {
    const { manifest, orders } = get();
    if (!manifest) return;
    const key = `${manifest.flightNumber}::${seat}`;
    const updated = { ...orders };
    delete updated[key];
    set({ orders: updated });
  },

  setPaxUnavailable: (seat, value) => {
    const { manifest, unavailable } = get();
    if (!manifest) return;
    const key = `${manifest.flightNumber}::${seat}`;
    const updated = { ...unavailable, [key]: value };
    set({ unavailable: updated });
  },

  setCrewZone: (zone) => set({ crewZone: zone }),

  openComanda: () => set({ comandaOpen: true }),

  closeComanda: () => set({ comandaOpen: false, crewZone: null }),

  clearZoneOrders: (zone) => {
    const { manifest, orders, unavailable } = get();
    if (!manifest) return;
    const prefix = `${manifest.flightNumber}::`;
    const updatedOrders = { ...orders };
    const updatedUnavailable = { ...unavailable };
    Object.keys(updatedOrders)
      .filter(key => key.startsWith(prefix) && seatZone(key.slice(prefix.length)) === zone)
      .forEach(key => { delete updatedOrders[key]; });
    Object.keys(updatedUnavailable)
      .filter(key => key.startsWith(prefix) && seatZone(key.slice(prefix.length)) === zone)
      .forEach(key => { delete updatedUnavailable[key]; });
    set({ orders: updatedOrders, unavailable: updatedUnavailable });
  },

  getComandaStatus: () => {
    const { manifest, orders, unavailable, serviceOverride, crewZone } = get();
    if (!manifest) return 'empty';
    const serviceType = serviceOverride ?? manifest.serviceType;
    if (!serviceType) return 'empty';

    const slots = deriveMealSlots(serviceType, manifest.departureTime);
    let businessPax = manifest.passengers.filter(
      (p) => getCabinClass(manifest.aircraftType, p.seat) === 'business'
    );

    // Si hay zona activa, el estado solo refleja ese pasillo
    if (crewZone !== null) {
      businessPax = businessPax.filter((p) => seatZone(p.seat) === crewZone);
    }

    if (businessPax.length === 0) return 'empty';

    const atendidos = businessPax.filter((p) => {
      const key = `${manifest.flightNumber}::${p.seat}`;
      if (unavailable[key]) return true;
      const order = orders[key];
      return order !== undefined && slots.every((slot) => order[slot]?.platoFuerteId);
    }).length;

    if (atendidos === 0) return 'empty';
    if (atendidos === businessPax.length) return 'complete';
    return 'in-progress';
  },

  getOrder: (seat) => {
    const { manifest, orders } = get();
    if (!manifest) return undefined;
    return orders[`${manifest.flightNumber}::${seat}`];
  },

  getActiveServiceType: () => {
    const { manifest, serviceOverride } = get();
    return serviceOverride ?? manifest?.serviceType ?? null;
  },

  getPassengerBySeat: (seat) =>
    get().manifest?.passengers.find((p) => p.seat === seat),

  getFlightStats: () => {
    const { manifest } = get();
    if (!manifest) return { emptySeats: 0, ssrCounts: {}, totalMeals: 0, totalPassengers: 0, infantCount: 0 };

    const configKey = getAircraftConfigKey(manifest.aircraftType);
    const config = AIRCRAFT_CONFIGS[configKey];
    const emptySeats = countEmptySeats(manifest, config);
    const ssrCounts = countSSR(manifest.passengers);
    const mealCodes = Object.keys(FLIGHT_CODES.MEALS);
    const totalMeals = countMeals(manifest.passengers, mealCodes);

    return {
      emptySeats,
      ssrCounts,
      totalMeals,
      totalPassengers: manifest.passengers.length,
      infantCount: manifest.infantCount ?? 0,
    };
  },
}));
