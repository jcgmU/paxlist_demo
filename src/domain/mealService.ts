export type ServiceType = 'INSIGNIA' | 'AMERICAS';
export type MealSlot = 'DESAYUNO' | 'ALMUERZO' | 'CENA';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
}

export interface ServiceCourse {
  slot: MealSlot;
  label: string;
  hasEntrada: boolean;
  hasWakeUp: boolean;
  entradas: MenuItem[];
  platosFuertes: MenuItem[];
}

// ─── Catálogos de menú ────────────────────────────────────────────────────────

const INSIGNIA_ENTRADAS: Record<MealSlot, MenuItem[]> = {
  DESAYUNO: [
    { id: 'E-DES-1', name: 'Fruta fresca de temporada', description: 'Selección de frutas tropicales con miel de agave' },
    { id: 'E-DES-2', name: 'Yogur griego con granola', description: 'Yogur natural con granola artesanal y frutos rojos' },
    { id: 'E-DES-3', name: 'Salmón ahumado noruego', description: 'Con alcaparras, cebolla morada y queso crema' },
  ],
  ALMUERZO: [
    { id: 'E-ALM-1', name: 'Ceviche de langostinos', description: 'Leche de tigre, ají amarillo y crocante de maíz' },
    { id: 'E-ALM-2', name: 'Ensalada César premium', description: 'Lechuga romana, anchoas, aderezo César y parmesano' },
    { id: 'E-ALM-3', name: 'Carpaccio de res', description: 'Con rúgula, alcaparras y aceite de trufa blanca' },
  ],
  CENA: [
    { id: 'E-CEN-1', name: 'Foie gras con brioche', description: 'Con mermelada de higos y reducción de oporto' },
    { id: 'E-CEN-2', name: 'Terrina de mariscos', description: 'Langosta, camarón y vieiras con salsa de mantequilla' },
    { id: 'E-CEN-3', name: 'Sopa de cebolla gratinada', description: 'Estilo francés con croûton y queso gruyère' },
  ],
};

const INSIGNIA_PLATOS: Record<MealSlot, MenuItem[]> = {
  DESAYUNO: [
    { id: 'P-DES-1', name: 'Huevos Benedict', description: 'Con jamón serrano, salsa holandesa y espinacas' },
    { id: 'P-DES-2', name: 'Omelette de hongos y brie', description: 'Con hongos porcini, queso brie y hierbas finas' },
    { id: 'P-DES-3', name: 'Tostadas francesas', description: 'Brioche caramelizado con coulis de frutos rojos y crema chantilly' },
    { id: 'P-DES-4', name: 'Granola bowl vegano', description: 'Leche de almendras, fruta fresca y semillas de chía' },
  ],
  ALMUERZO: [
    { id: 'P-ALM-1', name: 'Lomo de res al vino tinto', description: 'Con puré trufado, espárragos y salsa demi-glace' },
    { id: 'P-ALM-2', name: 'Salmón en costra de hierbas', description: 'Con risotto de limón y espinacas salteadas' },
    { id: 'P-ALM-3', name: 'Pechuga de pollo rellena', description: 'Con prosciutto, queso fontina y papas gratinadas' },
    { id: 'P-ALM-4', name: 'Risotto de hongos silvestres', description: 'Con parmesano, trufa negra y aceite de albahaca (vegetariano)' },
  ],
  CENA: [
    { id: 'P-CEN-1', name: 'Filete mignon con bordelesa', description: 'Término medio, con papas dauphine y judías verdes' },
    { id: 'P-CEN-2', name: 'Langosta a la mantequilla', description: 'Con arroz salvaje y ensalada de hinojo' },
    { id: 'P-CEN-3', name: 'Magret de pato a la naranja', description: 'Con puré de batata y salsa grand veneur' },
    { id: 'P-CEN-4', name: 'Ravioli de ricotta y espinacas', description: 'Con salsa de tomate pomodoro y albahaca (vegetariano)' },
  ],
};

const AMERICAS_PLATOS: Record<MealSlot, MenuItem[]> = {
  DESAYUNO: [
    { id: 'A-DES-1', name: 'Huevos revueltos con tocineta', description: 'Acompañados de tostadas de brioche y jugo de naranja' },
    { id: 'A-DES-2', name: 'Pancakes de arándanos', description: 'Con sirope de maple, mantequilla y fruta fresca' },
    { id: 'A-DES-3', name: 'Bowl de açaí', description: 'Con granola, plátano, fresas y miel (vegetariano)' },
  ],
  ALMUERZO: [
    { id: 'A-ALM-1', name: 'Pollo a la parrilla', description: 'Con ensalada verde y papas al vapor' },
    { id: 'A-ALM-2', name: 'Pasta primavera', description: 'Con vegetales frescos y salsa de tomate (vegetariano)' },
    { id: 'A-ALM-3', name: 'Salmón teriyaki', description: 'Con arroz jazmín y edamame' },
  ],
  CENA: [
    { id: 'A-CEN-1', name: 'Lomo de cerdo glaseado', description: 'Con camote asado y vegetales de temporada' },
    { id: 'A-CEN-2', name: 'Pechuga de pollo al limón', description: 'Con risotto de vegetales y aceite de albahaca' },
    { id: 'A-CEN-3', name: 'Pasta con vegetales', description: 'Penne con salsa arrabiata y parmesano (vegetariano)' },
  ],
};

// ─── Lógica de derivación ─────────────────────────────────────────────────────

function mealForHour(hour: number): MealSlot {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 5 && h <= 10) return 'DESAYUNO';
  if (h >= 11 && h <= 16) return 'ALMUERZO';
  return 'CENA';
}

export function deriveMealSlots(serviceType: ServiceType, departureTime: string): MealSlot[] {
  const [hStr, mStr] = departureTime.split(':');
  const serviceHour = parseInt(hStr) + 1 + parseInt(mStr) / 60;
  const first = mealForHour(serviceHour);

  if (serviceType === 'AMERICAS') {
    return [first];
  }

  // INSIGNIA: 2 servicios
  const second: MealSlot = first === 'DESAYUNO' ? 'ALMUERZO' : 'DESAYUNO';
  return [first, second];
}

export function buildCourses(serviceType: ServiceType, slots: MealSlot[]): ServiceCourse[] {
  const SLOT_LABELS: Record<MealSlot, string> = {
    DESAYUNO: 'Desayuno',
    ALMUERZO: 'Almuerzo',
    CENA: 'Cena',
  };

  return slots.map((slot) => {
    const isInsignia = serviceType === 'INSIGNIA';
    return {
      slot,
      label: SLOT_LABELS[slot],
      hasEntrada: isInsignia,
      hasWakeUp: isInsignia,
      entradas: isInsignia ? (INSIGNIA_ENTRADAS[slot] ?? []) : [],
      platosFuertes: isInsignia
        ? (INSIGNIA_PLATOS[slot] ?? [])
        : (AMERICAS_PLATOS[slot] ?? []),
    };
  });
}
