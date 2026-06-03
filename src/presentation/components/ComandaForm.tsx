import React from 'react';
import { Bell, BellOff, ChefHat, UtensilsCrossed, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { buildCourses, deriveMealSlots } from '../../domain/mealService';
import type { MealSlot, MenuItem } from '../../domain/mealService';
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
  const { manifest, getOrder, setCourseSelection, getActiveServiceType } = useStore();
  if (!manifest) return null;

  const serviceType = getActiveServiceType();
  if (!serviceType) return null;

  const slots = deriveMealSlots(serviceType, manifest.departureTime);
  const courses = buildCourses(serviceType, slots);
  const order = getOrder(passenger.seat) ?? {};

  const mealCodes = Object.keys(FLIGHT_CODES.MEALS);
  const ssrMeals = passenger.codes.filter((c) => mealCodes.includes(c));

  const serviceInfo = SERVICE_LABELS[serviceType];

  const isOrderComplete = courses.every((course) => {
    const sel = order[course.slot];
    if (!sel?.platoFuerteId) return false;
    if (course.hasEntrada && !sel?.entradaId) return false;
    return true;
  });

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

      {/* Alerta SSR de comidas */}
      {ssrMeals.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-black text-amber-800 uppercase tracking-wide">
              Restricción alimentaria SSR
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              {ssrMeals.map((c) => `${c} — ${(FLIGHT_CODES.MEALS as Record<string, string>)[c]}`).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* Tarjetas de servicio */}
      {courses.map((course) => {
        const sel = order[course.slot] ?? {};
        const isComplete = !!sel.platoFuerteId && (!course.hasEntrada || !!sel.entradaId);

        return (
          <div
            key={course.slot}
            className={`border rounded-2xl overflow-hidden transition-all ${
              isComplete ? 'border-green-200 bg-green-50/30' : 'border-slate-200 bg-white'
            }`}
          >
            {/* Header del servicio */}
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
              {/* Entrada (solo Insignia) */}
              {course.hasEntrada && (
                <SelectField
                  label="Entrada"
                  value={sel.entradaId ?? ''}
                  options={course.entradas}
                  onChange={(id) => setCourseSelection(passenger.seat, course.slot, { entradaId: id || undefined })}
                  placeholder="— Seleccionar entrada —"
                />
              )}

              {/* Plato fuerte */}
              <SelectField
                label="Plato fuerte"
                value={sel.platoFuerteId ?? ''}
                options={course.platosFuertes}
                onChange={(id) => setCourseSelection(passenger.seat, course.slot, { platoFuerteId: id || undefined })}
                placeholder="— Seleccionar plato —"
              />

              {/* Toggle despertar (solo Insignia) */}
              {course.hasWakeUp && (
                <button
                  onClick={() =>
                    setCourseSelection(passenger.seat, course.slot, { wakeUp: !sel.wakeUp })
                  }
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                    sel.wakeUp
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold">
                    ¿Despertar para {course.label.toLowerCase()}?
                  </span>
                  {sel.wakeUp ? (
                    <Bell size={16} className="text-amber-400" />
                  ) : (
                    <BellOff size={16} />
                  )}
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Estado de la comanda */}
      {isOrderComplete && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle2 size={14} className="text-green-600" />
          <p className="text-xs font-bold text-green-700">Comanda registrada</p>
        </div>
      )}
    </section>
  );
};
