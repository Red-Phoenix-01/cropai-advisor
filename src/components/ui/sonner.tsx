import type React from "react";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ theme, ...props }: ToasterProps) => {
  // Resolve theme without next-themes; keep in sync with global toggle using localStorage + media query
  let resolved: ToasterProps["theme"] = "system";
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") resolved = "dark";
    else if (stored === "light") resolved = "light";
    else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) resolved = "dark";
    else resolved = "light";
  }

  return (
    <Sonner
      theme={(theme as ToasterProps["theme"]) ?? resolved}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
