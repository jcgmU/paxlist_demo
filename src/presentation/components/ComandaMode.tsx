import React, { useState } from 'react';
import { X, CheckCircle2, Utensils, ChevronRight, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { AIRCRAFT_CONFIGS } from '../../domain/aircraftConfigs';
import type { AircraftCabin } from '../../domain/aircraftConfigs';
import { getAircraftConfigKey } from '../../domain/aircraftMatch';
import { FLIGHT_CODES } from '../../domain/flightCodes';
import { deriveMealSlots, seatZone, buildCourses } from '../../domain/mealService';
import type { CrewZone } from '../../domain/mealService';

const MEAL_CODES = new Set(Object.keys(FLIGHT_CODES.MEALS));

// ─── Zone Selection Screen ────────────────────────────────────────────────────

const ZoneSelection: React.FC<{
  onSelect: (zone: CrewZone) => void;
  onClose: () => void;
}> = ({ onSelect, onClose }) => (
  <div className="fixed inset-0 z-[90] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label="Cerrar"
      >
        <X size={20} />
      </button>

      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-2">¿Qué pasillo atiendes?</h2>
        <p className="text-sm text-slate-500">Selecciona tu zona de servicio para esta cabina</p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => onSelect('A-D')}
          className="flex items-center justify-between w-full px-6 py-4 bg-[#E20613] text-white rounded-2xl font-semibold text-base hover:bg-[#c50511] transition-colors shadow-sm"
        >
          <span>Pasillo A – D</span>
          <ChevronRight size={20} />
        </button>
        <button
          onClick={() => onSelect('E-K')}
          className="flex items-center justify-between w-full px-6 py-4 border-2 border-[#E20613] text-[#E20613] rounded-2xl font-semibold text-base hover:bg-red-50 transition-colors"
        >
          <span>Pasillo E – K</span>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  </div>
);

// ─── Seat Cell ────────────────────────────────────────────────────────────────

interface SeatCellProps {
  seatId: string;
}

const SeatCell: React.FC<SeatCellProps> = ({ seatId }) => {
  const manifest = useStore((s) => s.manifest);
  const orders = useStore((s) => s.orders);
  const unavailable = useStore((s) => s.unavailable);
  const setSelectedSeat = useStore((s) => s.setSelectedSeat);
  const getActiveServiceType = useStore((s) => s.getActiveServiceType);

  if (!manifest) return null;

  const passenger = manifest.passengers.find((p) => p.seat === seatId);
  const serviceType = getActiveServiceType();
  const orderKey = `${manifest.flightNumber}::${seatId}`;
  const order = orders[orderKey];
  const isUnavailable = unavailable[orderKey] === true;

  const slots = serviceType ? deriveMealSlots(serviceType, manifest.departureTime) : [];
  const courses = serviceType ? buildCourses(serviceType, slots) : [];

  const isComplete = isUnavailable || (
    order !== undefined && slots.length > 0 && slots.every((slot) => order[slot]?.platoFuerteId)
  );
  const isPartial = !isComplete && order !== undefined && slots.some((slot) => order[slot]?.platoFuerteId);

  const mealSSRCodes = passenger?.codes.filter((c) => MEAL_CODES.has(c)) ?? [];

  // Nombre real del primer plato seleccionado
  let selectedMealName: string | null = null;
  if (order && courses.length > 0) {
    for (const course of courses) {
      const platoId = order[course.slot]?.platoFuerteId;
      if (platoId) {
        const plato = course.platosFuertes.find((p) => p.id === platoId);
        if (plato) {
          selectedMealName = plato.name.length > 18 ? `${plato.name.slice(0, 18)}…` : plato.name;
          break;
        }
      }
    }
  }

  const shortName = passenger
    ? `${passenger.lastName.slice(0, 10)}, ${passenger.firstName.charAt(0)}`
    : null;

  if (!passenger) {
    return (
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 opacity-40 min-h-[72px] flex items-center justify-center">
        <span className="text-slate-400 text-sm font-medium">—</span>
      </div>
    );
  }

  const borderClass = isComplete
    ? 'border-green-200 bg-green-50/30'
    : isPartial
    ? 'border-amber-200 bg-amber-50/20'
    : 'border-slate-200';

  return (
    <button
      onClick={() => setSelectedSeat(seatId)}
      className={`bg-white border rounded-2xl p-3 cursor-pointer hover:border-[#E20613]/50 transition-all text-left w-full min-h-[72px] ${borderClass}`}
    >
      <div className="flex items-start justify-between gap-1 mb-1">
        <span className="text-xs font-bold text-slate-500">{seatId}</span>
        <div className="flex items-center gap-1">
          {mealSSRCodes.length > 0 && (
            <Utensils size={12} className="text-amber-500 flex-shrink-0" />
          )}
          {isComplete && (
            <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
          )}
          {isPartial && !isComplete && (
            <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 inline-block" />
          )}
        </div>
      </div>
      <p className="text-xs font-semibold text-slate-800 leading-tight truncate">{shortName}</p>
      {selectedMealName ? (
        <p className="text-[10px] text-[#E20613] font-bold mt-0.5 truncate">{selectedMealName}</p>
      ) : mealSSRCodes.length > 0 ? (
        <div className="flex flex-wrap gap-0.5 mt-0.5">
          {mealSSRCodes.map((code) => (
            <span key={code} className="text-[9px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
              {code}
            </span>
          ))}
        </div>
      ) : null}
    </button>
  );
};

// ─── Seat Map ─────────────────────────────────────────────────────────────────

const SeatMap: React.FC = () => {
  const [showWarning, setShowWarning] = useState(false);
  const manifest = useStore((s) => s.manifest);
  const orders = useStore((s) => s.orders);
  const unavailable = useStore((s) => s.unavailable);
  const crewZone = useStore((s) => s.crewZone);
  const closeComanda = useStore((s) => s.closeComanda);
  const setCrewZone = useStore((s) => s.setCrewZone);
  const clearZoneOrders = useStore((s) => s.clearZoneOrders);
  const getActiveServiceType = useStore((s) => s.getActiveServiceType);

  if (!manifest) return null;

  const serviceType = getActiveServiceType();
  const configKey = getAircraftConfigKey(manifest.aircraftType);
  const config = AIRCRAFT_CONFIGS[configKey];

  const businessCabin = config?.elements.find(
    (el): el is AircraftCabin => el.type === 'cabin' && el.class === 'business'
  );

  if (!businessCabin) return null;

  const allLetters = businessCabin.layout.filter((l) => l !== 'aisle');
  const filteredLetters =
    serviceType === 'INSIGNIA' && crewZone
      ? allLetters.filter((l) => seatZone(l) === crewZone)
      : allLetters;

  const slots = serviceType ? deriveMealSlots(serviceType, manifest.departureTime) : [];

  // Count attended seats
  const allSeats = businessCabin.rows.flatMap((row) =>
    filteredLetters.map((letter) => `${row}${letter}`)
  );
  const businessPassengers = allSeats.filter((seatId) =>
    manifest.passengers.some((p) => p.seat === seatId)
  );
  const attended = businessPassengers.filter((seatId) => {
    const key = `${manifest.flightNumber}::${seatId}`;
    if (unavailable[key]) return true;
    const order = orders[key];
    return order !== undefined && slots.length > 0 && slots.every((slot) => order[slot]?.platoFuerteId);
  }).length;

  const zoneLabel =
    serviceType === 'INSIGNIA' && crewZone
      ? `Pasillo ${crewZone}`
      : 'Cabina Business';

  return (
    <>
    <div className="fixed inset-0 z-[90] bg-slate-900/80 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">{zoneLabel}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {attended} / {businessPassengers.length} atendidos
            </p>
          </div>
          <div className="flex items-center gap-2">
            {serviceType === 'INSIGNIA' && (
              <button
                onClick={() => setShowWarning(true)}
                className="text-xs font-medium text-[#E20613] hover:underline px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors"
              >
                Cambiar pasillo
              </button>
            )}
            <button
              onClick={closeComanda}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="px-4 py-4 space-y-2">
          {/* Column headers */}
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 flex-shrink-0" />
            {filteredLetters.map((letter) => (
              <div key={letter} className="flex-1 text-center text-xs font-bold text-slate-400 uppercase">
                {letter}
              </div>
            ))}
          </div>

          {/* Rows */}
          {businessCabin.rows.map((row) => (
            <div key={row} className="flex items-center gap-2">
              <div className="w-8 flex-shrink-0 text-xs font-bold text-slate-400 text-right">
                {row}
              </div>
              {filteredLetters.map((letter) => (
                <div key={letter} className="flex-1 min-w-0">
                  <SeatCell seatId={`${row}${letter}`} />
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="pb-4" />
      </div>
    </div>

    {/* Diálogo de advertencia al cambiar de pasillo */}
    {showWarning && (
      <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-xl shrink-0">
              <AlertTriangle size={18} className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">¿Cambiar de pasillo?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Las comandas registradas para el pasillo <span className="font-black text-slate-800">{crewZone}</span> se eliminarán de este dispositivo.
                {' '}Asegúrate de que el otro tripulante tenga esta información antes de continuar.
              </p>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setShowWarning(false)}
              className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (crewZone) clearZoneOrders(crewZone);
                setCrewZone(null);
                setShowWarning(false);
              }}
              className="flex-1 px-4 py-2.5 bg-[#E20613] text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all active:scale-95"
            >
              Confirmar cambio
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const ComandaMode: React.FC = () => {
  const comandaOpen = useStore((s) => s.comandaOpen);
  const crewZone = useStore((s) => s.crewZone);
  const getActiveServiceType = useStore((s) => s.getActiveServiceType);
  const setCrewZone = useStore((s) => s.setCrewZone);
  const closeComanda = useStore((s) => s.closeComanda);

  if (!comandaOpen) return null;

  const serviceType = getActiveServiceType();
  const needsZoneSelection = serviceType === 'INSIGNIA' && crewZone === null;

  if (needsZoneSelection) {
    return (
      <ZoneSelection
        onSelect={(zone) => setCrewZone(zone)}
        onClose={closeComanda}
      />
    );
  }

  return <SeatMap />;
};
