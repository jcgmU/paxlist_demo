import React from 'react';
import { Plane, ArrowRight, Users, MapPin } from 'lucide-react';
import { useStore } from '../store/useStore';
import { DEMO_FLIGHTS } from '../../infrastructure/mockData';

const AIRCRAFT_LABELS: Record<string, string> = {
  'B787-8': 'Boeing 787-8 Dreamliner',
  'A320': 'Airbus A320',
  'A319': 'Airbus A319',
};

const ROUTE_COLORS = [
  { bg: 'bg-rose-50', border: 'border-rose-200', badge: 'bg-[#E20613] text-white', btn: 'bg-[#E20613] hover:bg-red-700' },
  { bg: 'bg-indigo-50', border: 'border-indigo-200', badge: 'bg-indigo-600 text-white', btn: 'bg-indigo-600 hover:bg-indigo-700' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-600 text-white', btn: 'bg-emerald-600 hover:bg-emerald-700' },
];

export const DemoSelector: React.FC = () => {
  const { setManifest } = useStore();

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 py-8 gap-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="bg-[#E20613] p-3 rounded-2xl text-white shadow-lg">
            <Plane size={28} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 italic tracking-tight">
            Avianca <span className="text-[#E20613] not-italic">SeatMap Pro</span>
          </h1>
        </div>
        <p className="text-slate-500 text-sm font-medium max-w-md mx-auto">
          Selecciona un vuelo de demostración para visualizar el mapa de asientos con datos reales de operación.
        </p>
      </div>

      {/* Flight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
        {DEMO_FLIGHTS.map((flight, i) => {
          const colors = ROUTE_COLORS[i];
          return (
            <div
              key={flight.flightNumber}
              className={`${colors.bg} border ${colors.border} rounded-3xl p-6 flex flex-col gap-5 shadow-sm hover:shadow-md transition-shadow`}
            >
              {/* Flight badge */}
              <div className="flex items-center justify-between">
                <span className={`${colors.badge} text-xs font-black px-3 py-1 rounded-full tracking-wider`}>
                  {flight.flightNumber}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {flight.date}
                </span>
              </div>

              {/* Route */}
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-2xl font-black text-slate-900">{flight.origin}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Origen</p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex-1 h-px bg-slate-300" />
                  <Plane size={14} className="text-slate-400 mx-1 rotate-90 shrink-0" />
                  <div className="flex-1 h-px bg-slate-300" />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-slate-900">{flight.destination}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Destino</p>
                </div>
              </div>

              {/* Aircraft */}
              <div className="flex items-center gap-2 text-slate-500">
                <MapPin size={13} className="shrink-0" />
                <span className="text-xs font-bold">
                  {AIRCRAFT_LABELS[flight.aircraftType] ?? flight.aircraftType}
                </span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 bg-white/70 rounded-2xl p-3 border border-white">
                <div className="flex items-center gap-1.5">
                  <Users size={13} className="text-slate-500" />
                  <span className="text-xs font-black text-slate-700">{flight.passengers.length} pax</span>
                </div>
                {flight.infantCount > 0 && (
                  <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                    +{flight.infantCount} INF
                  </span>
                )}
              </div>

              {/* CTA */}
              <button
                onClick={() => setManifest(flight)}
                className={`${colors.btn} text-white font-black text-sm py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors active:scale-95`}
              >
                Cargar vuelo
                <ArrowRight size={16} />
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
        Modo Demo • Datos ficticios para presentación
      </p>
    </div>
  );
};
