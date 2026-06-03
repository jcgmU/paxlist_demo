import { create } from 'zustand';
import type { FlightManifest, ParsedPassenger } from '../../infrastructure/mockData';
import { AIRCRAFT_CONFIGS } from '../../domain/aircraftConfigs';
import { FLIGHT_CODES } from '../../domain/flightCodes';
import { getAircraftConfigKey } from '../../domain/aircraftMatch';
import { countEmptySeats, countSSR, countMeals } from '../../domain/flightStats';

interface AppState {
  manifest: FlightManifest | null;
  selectedSeat: string | null;
  searchTerm: string;

  setManifest: (manifest: FlightManifest | null) => void;
  setSelectedSeat: (seat: string | null) => void;
  setSearchTerm: (term: string) => void;
  reset: () => void;

  getPassengerBySeat: (seat: string) => ParsedPassenger | undefined;
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

  setManifest: (manifest) => set({ manifest }),
  setSelectedSeat: (seat) => set({ selectedSeat: seat }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  reset: () => set({ manifest: null, selectedSeat: null, searchTerm: '' }),

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
