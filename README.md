# Avianca SeatMap Pro

**Avianca SeatMap Pro** es una aplicación web interactiva diseñada como herramienta de soporte para la tripulación de cabina (TC). Permite la visualización dinámica del mapa de asientos, la gestión del servicio a bordo y el seguimiento detallado de los pasajeros y sus necesidades específicas.

## 🌟 Características Principales

*   **Mapa de Asientos Dinámico:** Renderizado preciso de diferentes configuraciones de aeronaves (ej. A320, B787) separando cabinas (Business, Plus, Economy).
*   **Gestión de Estatus LifeMiles:** Identificación visual rápida de pasajeros élite (**Diamond** y **Gold**) para priorizar su atención.
*   **Seguimiento SSR (Special Service Requirements):** Sistema de íconos que identifica necesidades médicas, sillas de ruedas (WCHR/WCHS), mascotas en cabina (PETC), y comidas especiales precargadas.
*   **Atención Experiencia (NPS):** 
    * Identificación proactiva de pasajeros que tuvieron una mala experiencia en su vuelo anterior.
    * Banner con detalles del incidente y acciones sugeridas para la tripulación actual.
    * Posibilidad de "Marcar atención ofrecida", lo que actualiza en tiempo real el mapa y notifica al resto del equipo que el pasajero ya fue compensado exitosamente.
*   **Módulo de Comanda (Business Class):** Interfaz para tomar órdenes de comida, manejar opciones de desayuno/almuerzo, controlar inventario en tiempo real y registrar solicitudes de no molestar o "Despertar".
*   **Panel de Estadísticas en Vivo:** Barra lateral (o modal deslizable en móvil) con el resumen del vuelo: pasajeros totales, sillas vacías, conteo de menores (INF), resumen de SSRs y métricas de comandas y NPS.
*   **Buscador Integrado:** Búsqueda en tiempo real por número de asiento, nombre o apellido.
*   **Diseño 100% Responsivo:** Interfaz diseñada bajo la filosofía "Mobile-First", garantizando que los Jefes de Cabina puedan operarla cómodamente desde un dispositivo móvil o tableta a bordo.

## 🛠️ Tecnologías Utilizadas

*   **[React](https://reactjs.org/)** (con Hooks y componentes funcionales)
*   **[Vite](https://vitejs.dev/)** como empaquetador ultrarrápido
*   **[Tailwind CSS](https://tailwindcss.com/)** para el diseño y estructuración visual
*   **[Zustand](https://github.com/pmndrs/zustand)** para la gestión del estado global (Inventario, NPS, Comandas, etc.)
*   **[Lucide React](https://lucide.dev/)** para la iconografía moderna e intuitiva
*   **TypeScript** para garantizar un tipado fuerte y seguro

## 🚀 Inicio Rápido (Desarrollo Local)

Para clonar y ejecutar este proyecto de forma local, necesitas [Node.js](https://nodejs.org/es/) instalado.

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Ejecutar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   *La aplicación estará disponible por defecto en `http://localhost:5173` (o el puerto que indique la terminal).*

## 📦 Despliegue (Producción)

El proyecto está preparado para ser desplegado fácilmente en **Vercel**. 

1. Construir la versión de producción:
   ```bash
   npm run build
   ```
2. Desplegar en Vercel:
   ```bash
   vercel deploy --prod --yes
   ```

## 📁 Estructura del Proyecto

*   `/src/presentation/components/`: Componentes visuales (SeatMap, PassengerModal, StatsSidebar, etc.)
*   `/src/presentation/store/`: Manejo de estado con Zustand (`useStore.ts`)
*   `/src/domain/`: Lógica de negocio (Códigos de vuelo, configuraciones de aviones, tipos de servicio).
*   `/src/infrastructure/`: Origen de los datos (actualmente configurado con `mockData.ts` simulando los vuelos de prueba).

---
*Uso confidencial / operativo simulado.*
