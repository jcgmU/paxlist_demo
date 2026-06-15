import { Plane, RotateCcw, FlaskConical, ChevronDown, ChefHat } from 'lucide-react';
import { useStore } from './presentation/store/useStore';
import { DemoSelector } from './presentation/components/DemoSelector';
import { SeatMap } from './presentation/components/SeatMap';
import { StatsSidebar } from './presentation/components/StatsSidebar';
import { PassengerModal } from './presentation/components/PassengerModal';
import { ComandaMode } from './presentation/components/ComandaMode';
import type { ServiceType } from './domain/mealService';

const SERVICE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: 'INSIGNIA', label: 'Servicio Insignia' },
  { value: 'AMERICAS', label: 'Business Americas' },
];

function App() {
  const { manifest, reset, serviceOverride, setServiceOverride, getActiveServiceType, openComanda, getComandaStatus } = useStore();
  const activeService = getActiveServiceType();

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <nav className="h-16 shrink-0 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-2">
          <div className="bg-[#E20613] p-2 rounded-xl text-white">
            <Plane size={20} />
          </div>
          <h1 className="font-black text-slate-900 tracking-tight hidden sm:block italic">
            <span className="text-[#E20613]">Avianca</span> <span className="text-slate-900 not-italic">SeatMap Pro</span>
          </h1>
        </div>

        {manifest && (
          <div className="flex items-center gap-3 md:gap-5">
            {/* Info del vuelo */}
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                Vuelo Activo
              </span>
              <span className="text-sm font-bold text-slate-700">
                {manifest.flightNumber} · {manifest.origin} → {manifest.destination} · {manifest.departureTime}
              </span>
            </div>

            {/* Override de tipo de servicio */}
            <div className="relative flex items-center">
              <select
                value={serviceOverride ?? manifest.serviceType}
                onChange={(e) => {
                  const val = e.target.value as ServiceType;
                  setServiceOverride(val === manifest.serviceType ? null : val);
                }}
                className={`
                  appearance-none pl-3 pr-7 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer outline-none
                  focus:ring-2 focus:ring-[#E20613]/30
                  ${activeService === 'INSIGNIA'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'}
                  ${serviceOverride ? 'ring-2 ring-[#E20613]/40' : ''}
                `}
              >
                {SERVICE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className={`absolute right-2 pointer-events-none ${
                  activeService === 'INSIGNIA' ? 'text-amber-600' : 'text-blue-600'
                }`}
              />
              {serviceOverride && (
                <span className="ml-1 text-[9px] font-black text-[#E20613] uppercase">override</span>
              )}
            </div>

            {/* Botón Comanda con estado de color */}
            {(() => {
              const status = getComandaStatus();
              const btnClass =
                status === 'complete'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : status === 'in-progress'
                  ? 'bg-[#E20613] text-white hover:bg-red-700'
                  : 'bg-white text-[#E20613] border border-[#E20613] hover:bg-red-50';
              return (
                <button
                  onClick={openComanda}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${btnClass}`}
                >
                  <ChefHat size={14} />
                  <span className="hidden sm:inline">Comanda</span>
                </button>
              );
            })()}

            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Cambiar Vuelo</span>
            </button>
          </div>
        )}

        {!manifest && (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
            <FlaskConical size={14} />
            <span className="text-[10px] font-black uppercase tracking-wider">Modo Demo</span>
          </div>
        )}
      </nav>

      <main className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
        {!manifest ? (
          <div className="flex-1 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-6">
              <DemoSelector />
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row lg:h-full lg:overflow-hidden">
            <div className="flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-auto lg:flex-row lg:overflow-hidden lg:contents">
              <SeatMap />
              <StatsSidebar />
            </div>
            <PassengerModal />
            <ComandaMode />
          </div>
        )}
      </main>

      {!manifest && (
        <footer className="lg:hidden h-6 bg-slate-900 text-white flex items-center justify-center">
          <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-50">
            Modo Demo · iPad/Mobile Ready
          </p>
        </footer>
      )}
    </div>
  );
}

export default App;
