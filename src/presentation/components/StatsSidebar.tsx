import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { SearchBar } from './SearchBar';
import { Users, Utensils, Accessibility, Baby, BarChart2, ChevronDown, Star, Diamond, ChefHat, Bell, CheckCircle2 } from 'lucide-react';
import type { ParsedPassenger } from '../../infrastructure/mockData';
import { getCabinClass } from '../../domain/cabinLookup';
import { deriveMealSlots, buildCourses } from '../../domain/mealService';

// ─── Sub-components defined OUTSIDE StatsSidebar to keep stable references ───

interface SSRSectionProps {
  ssrCounts: Record<string, number>;
  expandedCode: string | null;
  onCodeClick: (code: string) => void;
  passengers: ParsedPassenger[];
  cols: 2 | 3;
}

const SSRSection: React.FC<SSRSectionProps> = ({ ssrCounts, expandedCode, onCodeClick, passengers, cols }) => {
  if (Object.keys(ssrCounts).length === 0) return null;

  const getPassengersForCode = (code: string) =>
    passengers
      .filter(p => p.codes.includes(code))
      .sort((a, b) => a.seat.localeCompare(b.seat, undefined, { numeric: true }));

  return (
    <div className="mt-6 pt-4 border-t border-slate-100">
      <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">Servicios por Código</h3>
      <div className={cols === 2 ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-3 gap-2'}>
        {Object.entries(ssrCounts).map(([code, count]) => (
          <button
            key={code}
            onClick={() => onCodeClick(code)}
            className={`bg-slate-50 hover:bg-slate-100 cursor-pointer p-2 rounded-xl flex justify-between items-center transition-colors ${expandedCode === code ? 'ring-2 ring-[#E20613]/30 bg-slate-100' : ''}`}
          >
            <span className="text-[10px] font-bold text-slate-500">{code}</span>
            <span className="text-xs font-black text-slate-700">{count}</span>
          </button>
        ))}
      </div>

      {/* Panel expandido — full-width, animado */}
      <div className={`overflow-hidden transition-all duration-200 ease-in-out ${expandedCode && ssrCounts[expandedCode] !== undefined ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
        {expandedCode && ssrCounts[expandedCode] !== undefined && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-200">
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-wide">{expandedCode}</span>
              <span className="text-[10px] font-bold text-slate-400">{ssrCounts[expandedCode]} pasajeros</span>
            </div>
            <div className="space-y-1">
              {getPassengersForCode(expandedCode).map(p => (
                <p key={p.seat} className="text-[11px] text-slate-700 break-words leading-relaxed">
                  <span className="font-black text-slate-900">{p.seat}</span>
                  {' — '}
                  {p.lastName}, {p.firstName}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface EliteSectionProps {
  diamondPax: ParsedPassenger[];
  goldPax: ParsedPassenger[];
}

const EliteSection: React.FC<EliteSectionProps> = ({ diamondPax, goldPax }) => {
  if (diamondPax.length === 0 && goldPax.length === 0) return null;

  return (
    <div className="mt-6 pt-4 border-t border-slate-100">
      <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">Pasajeros Elite</h3>

      {diamondPax.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-900 rounded-lg mb-1.5">
            <Diamond size={10} className="text-white shrink-0" />
            <span className="text-[9px] font-black text-white uppercase tracking-widest">Diamond</span>
            <span className="ml-auto text-[9px] font-black text-slate-400">{diamondPax.length}</span>
          </div>
          <div className="space-y-0.5 pl-1">
            {diamondPax.map(p => (
              <p key={p.seat} className="text-[11px] text-slate-700 break-words leading-relaxed">
                <span className="font-black text-slate-900">{p.seat}</span>
                {' — '}
                {p.lastName}, {p.firstName}
              </p>
            ))}
          </div>
        </div>
      )}

      {goldPax.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-amber-400 rounded-lg mb-1.5">
            <Star size={10} className="text-slate-900 shrink-0 fill-slate-900" />
            <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Gold</span>
            <span className="ml-auto text-[9px] font-black text-slate-700">{goldPax.length}</span>
          </div>
          <div className="space-y-0.5 pl-1">
            {goldPax.map(p => (
              <p key={p.seat} className="text-[11px] text-slate-700 break-words leading-relaxed">
                <span className="font-black text-slate-900">{p.seat}</span>
                {' — '}
                {p.lastName}, {p.firstName}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => (
  <div className={`p-4 rounded-2xl flex items-center justify-between ${color}`}>
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-xs font-bold uppercase tracking-tight">{label}</span>
    </div>
    <span className="text-lg font-black">{value}</span>
  </div>
);

// ─── Comanda summary section ──────────────────────────────────────────────────

import type { ServiceType } from '../../domain/mealService';
import type { FlightManifest } from '../../infrastructure/mockData';
import type { PassengerOrder } from '../store/useStore';

// ─── Inventory helpers ────────────────────────────────────────────────────────

function getZoneFromKey(key: string, flightNumber: string): 'A-D' | 'E-K' | null {
  const seat = key.replace(`${flightNumber}::`, '');
  const letter = seat.replace(/[0-9]/g, '').toUpperCase();
  return letter <= 'D' ? 'A-D' : 'E-K';
}

function countConsumed(
  orders: Record<string, PassengerOrder>,
  flightNumber: string,
  slot: string,
  kind: 'plato' | 'entrada',
  itemId: string,
  zone: 'A-D' | 'E-K' | 'all'
): number {
  return Object.entries(orders)
    .filter(([key]) => key.startsWith(`${flightNumber}::`))
    .filter(([key]) => {
      if (zone === 'all') return true;
      return getZoneFromKey(key, flightNumber) === zone;
    })
    .filter(([_, order]) =>
      kind === 'plato'
        ? (order as any)[slot]?.platoFuerteId === itemId
        : (order as any)[slot]?.entradaId === itemId
    ).length;
}

// ─── InventoryBar ─────────────────────────────────────────────────────────────

interface InventoryBarProps {
  label: string;
  consumed: number;
  stock: number;
  kind: 'plato' | 'entrada';
}

const InventoryBar: React.FC<InventoryBarProps> = ({ label, consumed, stock }) => {
  const remaining = Math.max(0, stock - consumed);
  const pct = stock > 0 ? (consumed / stock) * 100 : 0;
  const isLow = remaining <= 2 && remaining > 0;
  const isOut = remaining === 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-slate-600 truncate flex-1 pr-2">{label}</span>
        <span className={`text-[10px] font-black shrink-0 ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-green-600'}`}>
          {remaining}/{stock}
        </span>
      </div>
      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${isOut ? 'bg-red-400' : isLow ? 'bg-amber-400' : 'bg-green-400'}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
};

interface ComandaSectionProps {
  manifest: FlightManifest;
  orders: Record<string, PassengerOrder>;
  serviceType: ServiceType;
  unavailable: Record<string, boolean>;
}

const ComandaSection: React.FC<ComandaSectionProps> = ({ manifest, orders, serviceType, unavailable: _unavailable }) => {
  const slots = deriveMealSlots(serviceType, manifest.departureTime);
  const courses = buildCourses(serviceType, slots);

  const businessPax = manifest.passengers.filter(
    (p) => getCabinClass(manifest.aircraftType, p.seat) === 'business'
  );

  const getOrderForSeat = (seat: string) => orders[`${manifest.flightNumber}::${seat}`];

  const comandasTomadas = businessPax.filter((p) => {
    const order = getOrderForSeat(p.seat);
    return order && slots.every((slot) => order[slot]?.platoFuerteId);
  }).length;

  // Por cada servicio con wakeUp, lista los asientos que quieren ser despertados
  const wakeUpByCourse = courses
    .filter((c) => c.hasWakeUp)
    .map((c) => ({
      label: c.label,
      slot: c.slot,
      seats: businessPax
        .filter((p) => getOrderForSeat(p.seat)?.[c.slot]?.wakeUp)
        .sort((a, b) => a.seat.localeCompare(b.seat, undefined, { numeric: true })),
    }))
    .filter((c) => c.seats.length > 0);

  const serviceLabel = serviceType === 'INSIGNIA' ? 'Servicio Insignia' : 'Business Americas';

  return (
    <div className="mt-6 pt-4 border-t border-slate-100">
      <div className="flex items-center gap-2 mb-3">
        <ChefHat size={14} className="text-[#E20613]" />
        <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
          Comanda Business
        </h3>
      </div>

      {/* Badge servicio */}
      <div className={`text-[9px] font-black px-2 py-1 rounded-full inline-block mb-3 ${
        serviceType === 'INSIGNIA'
          ? 'bg-amber-50 text-amber-700 border border-amber-200'
          : 'bg-blue-50 text-blue-700 border border-blue-200'
      }`}>
        {serviceLabel}
      </div>

      {/* Progreso */}
      <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3 mb-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className={comandasTomadas === businessPax.length ? 'text-green-500' : 'text-slate-300'} />
          <span className="text-xs font-bold text-slate-600">Comandas</span>
        </div>
        <span className="text-sm font-black text-slate-800">
          {comandasTomadas} / {businessPax.length}
        </span>
      </div>

      {/* Barra de progreso */}
      {businessPax.length > 0 && (
        <div className="w-full h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${(comandasTomadas / businessPax.length) * 100}%` }}
          />
        </div>
      )}

      {/* Lista de despertar */}
      {wakeUpByCourse.map(({ label, slot, seats }) => (
        <div key={slot} className="mb-3">
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-900 rounded-lg mb-1.5">
            <Bell size={10} className="text-amber-400 shrink-0" />
            <span className="text-[9px] font-black text-white uppercase tracking-widest">
              Despertar · {label}
            </span>
            <span className="ml-auto text-[9px] font-black text-slate-400">{seats.length}</span>
          </div>
          <div className="space-y-0.5 pl-1">
            {seats.map((p) => (
              <p key={p.seat} className="text-[11px] text-slate-700 leading-relaxed">
                <span className="font-black text-slate-900">{p.seat}</span>
                {' — '}
                {p.lastName}, {p.firstName}
              </p>
            ))}
          </div>
        </div>
      ))}

      {wakeUpByCourse.length === 0 && comandasTomadas > 0 && (
        <p className="text-[10px] text-slate-400 italic text-center">
          Sin solicitudes de despertar
        </p>
      )}
      {comandasTomadas === 0 && (
        <p className="text-[10px] text-slate-400 italic text-center">
          Ninguna comanda registrada aún
        </p>
      )}

      {/* Subsección Inventario */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">Inventario</h3>
        {courses.map(course => (
          <div key={course.slot} className="mb-4">
            <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wide">
              {course.label}
            </p>
            <div className="space-y-2">
              {/* Entradas (solo Insignia) */}
              {course.hasEntrada && course.entradas.map(item => {
                const stock = item.stock ?? 0;
                if (serviceType === 'INSIGNIA') {
                  const adConsumed = countConsumed(orders, manifest.flightNumber, course.slot, 'entrada', item.id, 'A-D');
                  const ekConsumed = countConsumed(orders, manifest.flightNumber, course.slot, 'entrada', item.id, 'E-K');
                  const totalConsumed = adConsumed + ekConsumed;
                  const totalStock = stock * 2;
                  return (
                    <InventoryBar
                      key={item.id}
                      label={item.name}
                      consumed={totalConsumed}
                      stock={totalStock}
                      kind="entrada"
                    />
                  );
                }
                return null;
              })}
              {/* Platos */}
              {course.platosFuertes.map(item => {
                const stock = item.stock ?? 0;
                if (serviceType === 'INSIGNIA') {
                  const adConsumed = countConsumed(orders, manifest.flightNumber, course.slot, 'plato', item.id, 'A-D');
                  const ekConsumed = countConsumed(orders, manifest.flightNumber, course.slot, 'plato', item.id, 'E-K');
                  const totalConsumed = adConsumed + ekConsumed;
                  return (
                    <InventoryBar
                      key={item.id}
                      label={item.name}
                      consumed={totalConsumed}
                      stock={stock * 2}
                      kind="plato"
                    />
                  );
                } else {
                  const consumed = countConsumed(orders, manifest.flightNumber, course.slot, 'plato', item.id, 'all');
                  return (
                    <InventoryBar
                      key={item.id}
                      label={item.name}
                      consumed={consumed}
                      stock={stock}
                      kind="plato"
                    />
                  );
                }
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Subsección Demanda insatisfecha */}
      {(() => {
        const unmetCounts: Record<string, { name: string; count: number; kind: 'plato' | 'entrada' }> = {};

        Object.entries(orders)
          .filter(([key]) => key.startsWith(`${manifest.flightNumber}::`))
          .forEach(([_, order]) => {
            slots.forEach(slot => {
              const sel = (order as any)[slot];
              if (sel?.unmetPlatoId) {
                const item = courses.flatMap(c => c.platosFuertes).find(i => i.id === sel.unmetPlatoId);
                if (item) {
                  unmetCounts[sel.unmetPlatoId] ??= { name: item.name, count: 0, kind: 'plato' };
                  unmetCounts[sel.unmetPlatoId].count++;
                }
              }
              if (sel?.unmetEntradaId) {
                const item = courses.flatMap(c => c.entradas).find(i => i.id === sel.unmetEntradaId);
                if (item) {
                  unmetCounts[sel.unmetEntradaId] ??= { name: item.name, count: 0, kind: 'entrada' };
                  unmetCounts[sel.unmetEntradaId].count++;
                }
              }
            });
          });

        const sorted = Object.values(unmetCounts).sort((a, b) => b.count - a.count).filter(x => x.count > 0);
        if (sorted.length === 0) return null;

        return (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">Más pedidos (sin stock)</h3>
            <div className="space-y-1.5">
              {sorted.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  <span className="text-[10px] font-bold text-slate-700 truncate flex-1 pr-2">{item.name}</span>
                  <span className="text-[10px] font-black text-red-700 shrink-0">{item.count}×</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const StatsSidebar: React.FC = () => {
  const { manifest, getFlightStats, orders, getActiveServiceType, unavailable } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  if (!manifest) return null;

  const { emptySeats, ssrCounts, totalMeals, totalPassengers, infantCount } = getFlightStats();
  const totalSSR = Object.values(ssrCounts).reduce((a, b) => a + b, 0);
  const activeServiceType = getActiveServiceType();

  const diamondPax = manifest.passengers
    .filter(p => ['DIAM', 'D'].includes(p.status ?? ''))
    .sort((a, b) => a.seat.localeCompare(b.seat, undefined, { numeric: true }));

  const goldPax = manifest.passengers
    .filter(p => ['GOLD', 'G'].includes(p.status ?? ''))
    .sort((a, b) => a.seat.localeCompare(b.seat, undefined, { numeric: true }));

  const paxTopCount = diamondPax.length + goldPax.length;

  const handleCodeClick = (code: string) => {
    setExpandedCode(prev => (prev === code ? null : code));
  };

  return (
    <>
      {/* Desktop (lg+): sidebar lateral */}
      <aside className="hidden lg:flex flex-col w-80 h-full bg-white rounded-3xl shadow-xl border border-slate-200 m-4 p-6 overflow-hidden">
        <h2 className="text-[#E20613] font-black text-xl mb-6 uppercase italic tracking-tighter shrink-0">Estadísticas</h2>

        <SearchBar />

        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-4 pr-1">
          <StatCard icon={<Users size={20}/>} label="Pasajeros a bordo" value={totalPassengers} color="bg-slate-100 text-slate-600" />
          <StatCard icon={<Users size={20}/>} label="Sillas Vacías" value={emptySeats} color="bg-indigo-100 text-indigo-700" />
          <StatCard icon={<Baby size={20}/>} label="Infantes (INF)" value={infantCount} color="bg-sky-100 text-sky-700" />
          <StatCard icon={<Accessibility size={20}/>} label="Servicios Especiales" value={totalSSR} color="bg-blue-100 text-blue-600" />
          <StatCard icon={<Utensils size={20}/>} label="Comidas Solicitadas" value={totalMeals} color="bg-green-100 text-green-600" />
          {paxTopCount > 0 && (
            <StatCard icon={<Star size={20}/>} label="Pax Top (Elite)" value={paxTopCount} color="bg-slate-800 text-white" />
          )}

          <SSRSection
            ssrCounts={ssrCounts}
            expandedCode={expandedCode}
            onCodeClick={handleCodeClick}
            passengers={manifest.passengers}
            cols={2}
          />
          <EliteSection diamondPax={diamondPax} goldPax={goldPax} />

          {activeServiceType && (
            <ComandaSection
              manifest={manifest}
              orders={orders}
              serviceType={activeServiceType}
              unavailable={unavailable}
            />
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 shrink-0">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter text-center">
            Avianca SeatMap Pro v1.2
          </p>
        </div>
      </aside>

      {/* Mobile/Tablet (< lg): barra sticky fixed que expande hacia arriba */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[70vh] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="overflow-y-auto max-h-[70vh] px-4 pb-4 pt-4 space-y-3 bg-white border-t border-slate-100">
            <SearchBar />

            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={<Users size={16}/>} label="Pax a bordo" value={totalPassengers} color="bg-slate-100 text-slate-600" />
              <StatCard icon={<Users size={16}/>} label="Vacías" value={emptySeats} color="bg-indigo-100 text-indigo-700" />
              <StatCard icon={<Baby size={16}/>} label="Infantes" value={infantCount} color="bg-sky-100 text-sky-700" />
              <StatCard icon={<Accessibility size={16}/>} label="Especiales" value={totalSSR} color="bg-blue-100 text-blue-600" />
              <StatCard icon={<Utensils size={16}/>} label="Comidas" value={totalMeals} color="bg-green-100 text-green-600" />
              {paxTopCount > 0 && (
                <StatCard icon={<Star size={16}/>} label="Pax Top" value={paxTopCount} color="bg-slate-800 text-white" />
              )}
            </div>

            <SSRSection
              ssrCounts={ssrCounts}
              expandedCode={expandedCode}
              onCodeClick={handleCodeClick}
              passengers={manifest.passengers}
              cols={3}
            />
            <EliteSection diamondPax={diamondPax} goldPax={goldPax} />

            {activeServiceType && (
              <ComandaSection
                manifest={manifest}
                orders={orders}
                serviceType={activeServiceType}
                unavailable={unavailable}
              />
            )}
          </div>
        </div>

        {/* Barra trigger siempre visible */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 h-14"
        >
          <span className="flex items-center gap-2">
            <BarChart2 size={18} className="text-[#E20613]" />
            <span className="font-black uppercase italic tracking-tighter text-[#E20613]">ESTADÍSTICAS</span>
          </span>
          <ChevronDown
            size={18}
            className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
    </>
  );
};
