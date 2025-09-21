import { Toaster } from "@/components/ui/sonner";
import { InstrumentationProvider } from "@/instrumentation.tsx";
import AuthPage from "@/pages/Auth.tsx";
import Dashboard from "@/pages/Dashboard.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Outlet, useLocation } from "react-router";
import "./index.css";
import Landing from "./pages/Landing.tsx";
import NotFound from "./pages/NotFound.tsx";
import "./types/global.d.ts";
import ConnectPage from "./pages/Connect.tsx";
import NewsPage from "./pages/News.tsx";
import { Moon, Sun } from "lucide-react";

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

function ThemeToggle() {
  // Global dark mode with persistence
  const isInitialDark =
    typeof window !== "undefined" &&
    (localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches));

  const [dark, setDark] = useState<boolean>(isInitialDark);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button
      aria-label="Toggle dark mode"
      className="fixed right-4 top-4 z-[60] inline-flex h-10 w-10 items-center justify-center rounded-full border bg-background/80 backdrop-blur hover:bg-accent"
      onClick={() => setDark((d) => !d)}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function Root() {
  return (
    <>
      <RouteSyncer />
      {/* Global Dark Mode Toggle on every route */}
      <ThemeToggle />
      <Outlet />
      {/* Global footer */}
      <footer className="mt-10 border-t">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          Made with ❤️ for Indian Farmers
        </div>
      </footer>
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      { index: true, element: <Landing /> },
      { path: "auth", element: <AuthPage redirectAfterAuth="/dashboard" /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "connect", element: <ConnectPage /> },
      { path: "news", element: <NewsPage /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

function App() {
  const convexUrl = (import.meta as any).env?.VITE_CONVEX_URL as string | undefined;

  if (!convexUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold mb-2">Missing configuration</h1>
          <p className="text-muted-foreground">
            Please set the VITE_CONVEX_URL environment variable in the API keys tab to load the app.
          </p>
        </div>
      </div>
    );
  }

  const convex = new ConvexReactClient(convexUrl);
  return (
    <InstrumentationProvider>
      <ConvexAuthProvider client={convex}>
        <RouterProvider router={router} />
        <Toaster />
      </ConvexAuthProvider>
    </InstrumentationProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);