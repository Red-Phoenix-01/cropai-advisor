import { Toaster } from "@/components/ui/sonner";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { InstrumentationProvider } from "@/instrumentation.tsx";
import AuthPage from "@/pages/Auth.tsx";
import Dashboard from "@/pages/Dashboard.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";
import Landing from "./pages/Landing.tsx";
import NotFound from "./pages/NotFound.tsx";
import "./types/global.d.ts";
import ConnectPage from "./pages/Connect.tsx";
import { Moon, Sun } from "lucide-react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

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
      className="fixed right-4 bottom-4 z-[60] inline-flex h-10 w-10 items-center justify-center rounded-full border bg-background/80 backdrop-blur hover:bg-accent"
      onClick={() => setDark((d) => !d)}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <VlyToolbar />
    <InstrumentationProvider>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <RouteSyncer />
          {/* Global Dark Mode Toggle on every route */}
          <ThemeToggle />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<AuthPage redirectAfterAuth="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/connect" element={<ConnectPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          {/* Global footer */}
          <footer className="mt-10 border-t">
            <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
              Made with ❤️ for Indian Farmers
            </div>
          </footer>
        </BrowserRouter>
        <Toaster />
      </ConvexAuthProvider>
    </InstrumentationProvider>
  </StrictMode>,
);