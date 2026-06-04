import React from 'react';
import { Bell, BellOff, ChefHat, UtensilsCrossed, CheckCircle2, UserX } from 'lucide-react';
import { useStore } from '../store/useStore';
import { buildCourses, deriveMealSlots, seatZone } from '../../domain/mealService';
import type { MealSlot, MenuItem, CrewZone } from '../../domain/mealService';
import { FLIGHT_CODES } from '../../domain/flightCodes';
import type { ParsedPassenger } from '../../infrastructure/mockData';

interface Props {
  passenger: ParsedPassenger;
}

const SERVICE_LABELS: Record<string, { label: string; color: string }> = {
  INSIGNIA: { label: 'Servicio Insignia', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  AMERICAS: { label: 'Business Class Americas', color: 'text-blue-700 bg-blue-50 border-blue-200' },
};

const SLOT_ICONS: Record<MealSlot, string> = {
  DESAYUNO: '☀️',
  ALMUERZO: '🍽️',
  CENA: '🌙',
};

function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  options: MenuItem[];
  onChange: (id: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:ring-2 focus:ring-[#E20613] focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      {value && (
        <p className="text-[10px] text-slate-400 mt-1 pl-1">
          {options.find((o) => o.id === value)?.description}
        </p>
      )}
    </div>
  );
}

export const ComandaForm: React.FC<Props> = ({ passenger }) => {
  const { manifest, getOrder, setCourseSelection, getActiveServiceType, unavailable, setPaxUnavailable, orders } = useStore();
  if (!manifest) return null;

  const serviceType = getActiveServiceType();
  if (!serviceType) return null;

  const slots = deriveMealSlots(serviceType, manifest.departureTime);
  const courses = buildCourses(serviceType, slots);
  const order = getOrder(passenger.seat) ?? {};

  const mealCodes = Object.keys(FLIGHT_CODES.MEALS);
  const ssrMeals = passenger.codes.filter((c) => mealCodes.includes(c));

  const serviceInfo = SERVICE_LABELS[serviceType];

  const unavailableKey = `${manifest.flightNumber}::${passenger.seat}`;
  const isUnavailable = unavailable[unavailableKey] === true;

  // Pax con comida especial SSR ya están atendidos — solo queda el despertar
  const hasSpecialMeal = ssrMeals.length > 0;

  const isOrderComplete = hasSpecialMeal || courses.every((course) => {
    const sel = order[course.slot];
    if (!sel?.platoFuerteId) return false;
    if (course.hasEntrada && !sel?.entradaId) return false;
    return true;
  });

  const zone: CrewZone = seatZone(passenger.seat);

  function getRemainingForItem(
    slot: MealSlot,
    kind: 'plato' | 'entrada',
    itemId: string,
    stock: number
  ): number {
    const consumed = Object.entries(orders)
      .filter(([key]) => key.startsWith(`${manifest!.flightNumber}::`))
      .filter(([key]) => {
        const seat = key.replace(`${manifest!.flightNumber}::`, '');
        return seatZone(seat) === zone;
      })
      .filter(([_, orderEntry]) =>
        kind === 'plato'
          ? orderEntry[slot]?.platoFuerteId === itemId
          : orderEntry[slot]?.entradaId === itemId
      ).length;
    return Math.max(0, stock - consumed);
  }

  function OptionRow({
    item, selected, remaining, onSelect,
  }: {
    item: MenuItem; selected: boolean; remaining: number; onSelect: () => void; kind: 'plato' | 'entrada';
  }) {
    const isAgotado = remaining === 0 && !selected;
    return (
      <button
        onClick={() => !isAgotado && onSelect()}
        disabled={isAgotado}
        className={`w-full text-left p-3 rounded-xl border transition-all ${
          selected
            ? 'border-[#E20613] bg-red-50 ring-1 ring-[#E20613]/30'
            : isAgotado
            ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
            : 'border-slate-200 bg-white hover:border-slate-300 active:scale-[0.99]'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold truncate ${selected ? 'text-[#E20613]' : isAgotado ? 'text-slate-400' : 'text-slate-800'}`}>
              {item.name}
            </p>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.description}</p>
          </div>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
            selected ? 'bg-[#E20613] text-white' :
            isAgotado ? 'bg-slate-200 text-slate-400' :
            remaining <= 1 ? 'bg-red-100 text-red-700' :
            remaining <= 2 ? 'bg-amber-100 text-amber-700' :
            'bg-green-100 text-green-700'
          }`}>
            {isAgotado ? 'Agotado' : `${remaining} rest.`}
          </span>
        </div>
      </button>
    );
  }

  if (isUnavailable) {
    return (
      <section className="space-y-4 pt-2">
        {/* Header del servicio */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat size={16} className="text-[#E20613]" />
            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
              Comanda de Servicio
            </label>
          </div>
          <span className={`text-[9px] font-black px-2 py-1 rounded-full border ${serviceInfo.color}`}>
            {serviceInfo.label}
          </span>
        </div>

        {/* Panel "no disponible" */}
        <div className="flex flex-col items-center gap-4 py-8 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
          <UserX size={32} className="text-slate-400" />
          <div>
            <p className="text-sm font-black text-slate-700">Pasajero no disponible</p>
            <p className="text-xs text-slate-400 mt-1">Marcado como no disponible para la comanda</p>
          </div>
          <button
            onClick={() => setPaxUnavailable(passenger.seat, false)}
            className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:border-slate-400 transition-all active:scale-95"
          >
            Reactivar pasajero
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 pt-2">
      {/* Header del servicio */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChefHat size={16} className="text-[#E20613]" />
          <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
            Comanda de Servicio
          </label>
        </div>
        <span className={`text-[9px] font-black px-2 py-1 rounded-full border ${serviceInfo.color}`}>
          {serviceInfo.label}
        </span>
      </div>

      {/* Tarjetas de servicio */}
      {courses.map((course) => {
        const sel = order[course.slot] ?? {};

        // ── Pax con comida especial SSR: solo despertar ──────────────────────
        if (hasSpecialMeal) {
          return (
            <div key={course.slot} className="border border-amber-200 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 bg-amber-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{SLOT_ICONS[course.slot]}</span>
                  <span className="text-sm font-black text-slate-800">{course.label}</span>
                </div>
                <CheckCircle2 size={16} className="text-amber-500" />
              </div>
              <div className="p-4 space-y-3">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-wide mb-1.5">
                    Comida especial pre-registrada
                  </p>
                  {ssrMeals.map((code) => (
                    <p key={code} className="text-xs text-amber-900 leading-relaxed">
                      <span className="font-black">{code}</span>
                      {' — '}
                      {(FLIGHT_CODES.MEALS as Record<string, string>)[code]}
                    </p>
                  ))}
                </div>
                {course.hasWakeUp && (
                  <button
                    onClick={() => setCourseSelection(passenger.seat, course.slot, { wakeUp: !sel.wakeUp })}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                      sel.wakeUp
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold">¿Despertar para {course.label.toLowerCase()}?</span>
                    {sel.wakeUp ? <Bell size={16} className="text-amber-400" /> : <BellOff size={16} />}
                  </button>
                )}
              </div>
            </div>
          );
        }

        // ── Pax normal ──────────────────────────────────────────────────────
        const isComplete = !!sel.platoFuerteId && (!course.hasEntrada || !!sel.entradaId);

        return (
          <div
            key={course.slot}
            className={`border rounded-2xl overflow-hidden transition-all ${
              isComplete ? 'border-green-200 bg-green-50/30' : 'border-slate-200 bg-white'
            }`}
          >
            <div className={`px-4 py-3 flex items-center justify-between ${isComplete ? 'bg-green-50' : 'bg-slate-50'}`}>
              <div className="flex items-center gap-2">
                <span className="text-base">{SLOT_ICONS[course.slot]}</span>
                <span className="text-sm font-black text-slate-800">{course.label}</span>
              </div>
              {isComplete ? (
                <CheckCircle2 size={16} className="text-green-500" />
              ) : (
                <UtensilsCrossed size={14} className="text-slate-300" />
              )}
            </div>

            <div className="p-4 space-y-4">
              {serviceType === 'INSIGNIA' ? (
                <>
                  {course.hasEntrada && (
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Entrada</label>
                      <div className="space-y-2">
                        {course.entradas.map(item => {
                          const remaining = getRemainingForItem(course.slot, 'entrada', item.id, item.stock ?? 99);
                          return (
                            <OptionRow
                              key={item.id}
                              item={item}
                              selected={sel.entradaId === item.id}
                              remaining={remaining}
                              kind="entrada"
                              onSelect={() => setCourseSelection(passenger.seat, course.slot, { entradaId: item.id })}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Plato fuerte</label>
                    <div className="space-y-2">
                      {course.platosFuertes.map(item => {
                        const remaining = getRemainingForItem(course.slot, 'plato', item.id, item.stock ?? 99);
                        return (
                          <OptionRow
                            key={item.id}
                            item={item}
                            selected={sel.platoFuerteId === item.id}
                            remaining={remaining}
                            kind="plato"
                            onSelect={() => setCourseSelection(passenger.seat, course.slot, { platoFuerteId: item.id })}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {(() => {
                    const agotadosPlatos = course.platosFuertes.filter(
                      item => getRemainingForItem(course.slot, 'plato', item.id, item.stock ?? 99) === 0
                        && sel.platoFuerteId !== item.id
                    );
                    const agotadosEntradas = course.hasEntrada
                      ? course.entradas.filter(
                          item => getRemainingForItem(course.slot, 'entrada', item.id, item.stock ?? 99) === 0
                            && sel.entradaId !== item.id
                        )
                      : [];
                    if (agotadosPlatos.length === 0 && agotadosEntradas.length === 0) return null;
                    const unmetPlato = sel.unmetPlatoId;
                    const unmetEntrada = sel.unmetEntradaId;
                    return (
                      <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">¿Qué pidió pero no había?</p>
                        {agotadosPlatos.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-400">Plato fuerte:</p>
                            {agotadosPlatos.map(item => (
                              <button
                                key={item.id}
                                onClick={() => setCourseSelection(passenger.seat, course.slot, {
                                  unmetPlatoId: unmetPlato === item.id ? undefined : item.id
                                })}
                                className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                                  unmetPlato === item.id
                                    ? 'border-slate-900 bg-slate-900 text-white'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                }`}
                              >
                                {item.name}
                              </button>
                            ))}
                          </div>
                        )}
                        {agotadosEntradas.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-400">Entrada:</p>
                            {agotadosEntradas.map(item => (
                              <button
                                key={item.id}
                                onClick={() => setCourseSelection(passenger.seat, course.slot, {
                                  unmetEntradaId: unmetEntrada === item.id ? undefined : item.id
                                })}
                                className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                                  unmetEntrada === item.id
                                    ? 'border-slate-900 bg-slate-900 text-white'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                }`}
                              >
                                {item.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {course.hasWakeUp && (
                    <button
                      onClick={() => setCourseSelection(passenger.seat, course.slot, { wakeUp: !sel.wakeUp })}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                        sel.wakeUp
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-bold">¿Despertar para {course.label.toLowerCase()}?</span>
                      {sel.wakeUp ? <Bell size={16} className="text-amber-400" /> : <BellOff size={16} />}
                    </button>
                  )}
                </>
              ) : (
                <SelectField
                  label="Plato fuerte"
                  value={sel.platoFuerteId ?? ''}
                  options={course.platosFuertes.map(item => ({
                    ...item,
                    name: `${item.name} (${getRemainingForItem(course.slot, 'plato', item.id, item.stock ?? 99)} rest.)`,
                  }))}
                  onChange={(id) => setCourseSelection(passenger.seat, course.slot, { platoFuerteId: id || undefined })}
                  placeholder="— Seleccionar plato —"
                />
              )}
            </div>
          </div>
        );
      })}

      {/* Estado de la comanda — solo pax normal */}
      {!hasSpecialMeal && isOrderComplete && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle2 size={14} className="text-green-600" />
          <p className="text-xs font-bold text-green-700">Comanda registrada</p>
        </div>
      )}

      {/* Pax no disponible — solo pax sin comida especial */}
      {!hasSpecialMeal && !isUnavailable && (
        <button
          onClick={() => setPaxUnavailable(passenger.seat, true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-all active:scale-95"
        >
          <UserX size={14} />
          Pax no disponible
        </button>
      )}
    </section>
  );
};
