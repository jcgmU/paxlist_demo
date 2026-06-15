import React from 'react';
import { X, User, Star, Utensils, Accessibility, AlertCircle, Info, AlertTriangle, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';
import { FLIGHT_CODES } from '../../domain/flightCodes';
import { getCabinClass } from '../../domain/cabinLookup';
import { ComandaForm } from './ComandaForm';

export const PassengerModal: React.FC = () => {
  const { selectedSeat, setSelectedSeat, getPassengerBySeat, manifest, resolvedIssues, toggleIssueResolved } = useStore();

  if (!selectedSeat || !manifest) return null;

  const passenger = getPassengerBySeat(selectedSeat);
  const cabinClass = getCabinClass(manifest.aircraftType, selectedSeat);
  const showComanda = cabinClass === 'business' && !!passenger;

  const getCodeDescription = (code: string) => {
    for (const category of Object.values(FLIGHT_CODES)) {
      if ((category as Record<string, string>)[code]) return (category as Record<string, string>)[code];
    }
    return 'Requerimiento especial';
  };

  const close = () => setSelectedSeat(null);

  const isResolved = passenger && manifest ? !!resolvedIssues[`${manifest.flightNumber}::${selectedSeat}`] : false;
  const handleToggleResolved = () => {
    if (selectedSeat) toggleIssueResolved(selectedSeat);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={close}
      />

      <div className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-[#E20613] flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <User size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">{selectedSeat}</h3>
              <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">
                {showComanda ? 'Pasajero · Business' : 'Detalles del Pasajero'}
              </p>
            </div>
          </div>
          <button onClick={close} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto scrollbar-hide">
          {!passenger ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                <Info size={32} />
              </div>
              <p className="text-slate-400 font-medium">Este asiento está vacío</p>
            </div>
          ) : (
            <>
              {/* Prior Issue Banner */}
              {passenger.priorIssue && (
                <section className={`p-5 rounded-2xl border ${
                  isResolved 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : passenger.priorIssue.severity === 'high' 
                      ? 'bg-rose-50 border-rose-200 text-rose-900' 
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {isResolved ? <Sparkles size={20} className="text-emerald-600" /> : <AlertTriangle size={20} className={passenger.priorIssue.severity === 'high' ? 'text-rose-600' : 'text-amber-600'} />}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-black uppercase tracking-widest mb-1">
                        {isResolved ? 'Atención Compensatoria Brindada' : 'Experiencia Previa Negativa'}
                      </h4>
                      <p className="text-sm font-medium mb-2">{passenger.priorIssue.description}</p>
                      
                      {!isResolved && (
                        <div className="mb-4 p-3 bg-white/60 rounded-xl text-xs font-bold">
                          <span className="uppercase tracking-wide text-[9px] opacity-70 block mb-1">Acción sugerida:</span>
                          {passenger.priorIssue.action}
                        </div>
                      )}
                      
                      <button 
                        onClick={handleToggleResolved}
                        className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${
                          isResolved 
                            ? 'bg-white text-emerald-700 hover:bg-emerald-100 border border-emerald-200' 
                            : passenger.priorIssue.severity === 'high'
                              ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-md'
                              : 'bg-amber-500 text-white hover:bg-amber-600 shadow-md'
                        }`}
                      >
                        {isResolved ? 'Revertir estado' : 'Marcar atención ofrecida'}
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* Nombre */}
              <section>
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-2">
                  Pasajero
                </label>
                <div className="text-3xl font-black text-slate-900 leading-tight">
                  {passenger.lastName},{' '}
                  <span className="text-[#E20613]">{passenger.firstName}</span>
                </div>
              </section>

              {/* Estatus LifeMiles */}
              <section className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <Star size={14} className="text-amber-500 fill-amber-500" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Estatus LifeMiles
                  </span>
                </div>
                {passenger.status ? (
                  <div className="flex items-center gap-3">
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                        passenger.status === 'DIAM' || passenger.status === 'D'
                          ? 'bg-slate-900 text-white'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {passenger.status}
                    </div>
                    <span className="text-sm font-bold text-slate-700">
                      {getCodeDescription(passenger.status)}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-slate-400 italic">Sin estatus frecuente</span>
                )}
              </section>

              {/* SSR / Requerimientos */}
              <section className="space-y-4">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block">
                  Requerimientos Especiales
                </label>
                {passenger.codes.length > 0 ? (
                  <div className="grid gap-3">
                    {passenger.codes.map((code) => {
                      const desc = getCodeDescription(code);
                      let Icon = Info;
                      let iconColor = 'bg-slate-100 text-slate-500';

                      if (['WCHR', 'WCHS', 'WCHC', 'WCMP', 'WCOB'].includes(code)) {
                        Icon = Accessibility;
                        iconColor = 'bg-blue-100 text-blue-600';
                      } else if (Object.keys(FLIGHT_CODES.MEALS).includes(code)) {
                        Icon = Utensils;
                        iconColor = 'bg-green-100 text-green-600';
                      } else if (
                        Object.keys(FLIGHT_CODES.MEDICAL).includes(code) ||
                        Object.keys(FLIGHT_CODES.LEGAL).includes(code)
                      ) {
                        Icon = AlertCircle;
                        iconColor = 'bg-rose-100 text-rose-600';
                      }

                      return (
                        <div
                          key={code}
                          className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-[#E20613]/20 transition-colors"
                        >
                          <div className={`p-2.5 rounded-xl ${iconColor}`}>
                            <Icon size={20} />
                          </div>
                          <div>
                            <div className="text-xs font-black text-slate-900">{code}</div>
                            <div className="text-[10px] text-slate-500 font-medium">{desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 rounded-2xl text-center">
                    <p className="text-xs text-slate-400 italic">
                      No hay servicios especiales registrados
                    </p>
                  </div>
                )}
              </section>

              {/* Comanda de comida (solo business) */}
              {showComanda && (
                <div className="border-t border-slate-100 pt-6">
                  <ComandaForm passenger={passenger} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
            Información Confidencial • Solo para uso operativo
          </p>
        </div>
      </div>
    </div>
  );
};
