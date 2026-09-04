import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Outlet,
  RouterProvider,
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import { AppShell } from "@/components/app-shell";
import { DatosView } from "@/components/datos-view";
import { RoutineEditor } from "@/components/routine-editor";
import { StatsView } from "@/components/stats-view";
import { TodayView } from "@/components/today-view";
import { AppErrorComponent } from "@/lib/error-component";
import { todayKey } from "@/lib/alba/time";
import "./styles.css";

function Home() {
  const [date, setDate] = useState(() => todayKey());
  return <TodayView date={date} onDateChange={setDate} />;
}

const rootRoute = createRootRoute({
  component: () => (
    <>
      <AppShell>
        <Outlet />
      </AppShell>
      <Toaster
        position="top-center"
        toastOptions={{
          className: "font-sans",
          style: {
            background: "var(--color-card)",
            color: "var(--color-foreground)",
            border: "1px solid var(--color-border)",
          },
        }}
      />
    </>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
});
const rutinaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/rutina",
  component: RoutineEditor,
});
const statsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/stats",
  component: StatsView,
});
const datosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/datos",
  component: DatosView,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  rutinaRoute,
  statsRoute,
  datosRoute,
]);

const router = createRouter({
  routeTree,
  history: createHashHistory(),
  defaultErrorComponent: AppErrorComponent,
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
