import { Plane, RotateCcw, FlaskConical } from 'lucide-react';
import { useStore } from './presentation/store/useStore';
import { DemoSelector } from './presentation/components/DemoSelector';
import { SeatMap } from './presentation/components/SeatMap';
import { StatsSidebar } from './presentation/components/StatsSidebar';
import { PassengerModal } from './presentation/components/PassengerModal';

function App() {
  const { manifest, reset } = useStore();

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <nav className="h-16 shrink-0 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-2">
          <div className="bg-[#E20613] p-2 rounded-xl text-white">
            <Plane size={20} />
          </div>
          <h1 className="font-black text-slate-900 tracking-tight hidden sm:block italic">
            Avianca <span className="text-[#E20613] not-italic">SeatMap Pro</span>
          </h1>
        </div>

        {manifest && (
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Vuelo Activo</span>
              <span className="text-sm font-bold text-slate-700">
                {manifest.flightNumber} • {manifest.origin} → {manifest.destination} • {manifest.date}
              </span>
            </div>
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
          <div className="flex-1 overflow-y-auto flex items-center justify-center p-6">
            <DemoSelector />
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row lg:h-full lg:overflow-hidden">
            <div className="flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-auto lg:flex-row lg:overflow-hidden lg:contents">
              <SeatMap />
              <StatsSidebar />
            </div>
            <PassengerModal />
          </div>
        )}
      </main>

      {!manifest && (
        <footer className="lg:hidden h-6 bg-slate-900 text-white flex items-center justify-center">
          <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-50">
            Modo Demo • iPad/Mobile Ready
          </p>
        </footer>
      )}
    </div>
  );
}

export default App;
