import { create } from 'zustand';
import type { FlightManifest, ParsedPassenger } from '../../infrastructure/mockData';
import { AIRCRAFT_CONFIGS } from '../../domain/aircraftConfigs';
import { FLIGHT_CODES } from '../../domain/flightCodes';
import { getAircraftConfigKey } from '../../domain/aircraftMatch';
import { countEmptySeats, countSSR, countMeals } from '../../domain/flightStats';
import type { ServiceType, MealSlot } from '../../domain/mealService';

export interface CourseSelection {
  entradaId?: string;
  platoFuerteId?: string;
  wakeUp?: boolean;
}

export type PassengerOrder = Partial<Record<MealSlot, CourseSelection>>;

const STORAGE_KEY = 'paxlist-comandas';

function loadOrders(): Record<string, PassengerOrder> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveOrders(orders: Record<string, PassengerOrder>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // storage lleno o bloqueado; ignorar
  }
}

interface AppState {
  manifest: FlightManifest | null;
  selectedSeat: string | null;
  searchTerm: string;
  orders: Record<string, PassengerOrder>;
  serviceOverride: ServiceType | null;

  setManifest: (manifest: FlightManifest | null) => void;
  setSelectedSeat: (seat: string | null) => void;
  setSearchTerm: (term: string) => void;
  reset: () => void;
  setServiceOverride: (type: ServiceType | null) => void;
  setCourseSelection: (seat: string, slot: MealSlot, patch: Partial<CourseSelection>) => void;
  clearOrder: (seat: string) => void;

  getPassengerBySeat: (seat: string) => ParsedPassenger | undefined;
  getOrder: (seat: string) => PassengerOrder | undefined;
  getActiveServiceType: () => ServiceType | null;
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
  orders: loadOrders(),
  serviceOverride: null,

  setManifest: (manifest) => set({ manifest, serviceOverride: null }),
  setSelectedSeat: (seat) => set({ selectedSeat: seat }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setServiceOverride: (type) => set({ serviceOverride: type }),
  reset: () => set({ manifest: null, selectedSeat: null, searchTerm: '', serviceOverride: null }),

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
    saveOrders(updated);
    set({ orders: updated });
  },

  clearOrder: (seat) => {
    const { manifest, orders } = get();
    if (!manifest) return;
    const key = `${manifest.flightNumber}::${seat}`;
    const updated = { ...orders };
    delete updated[key];
    saveOrders(updated);
    set({ orders: updated });
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
