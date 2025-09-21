import { Toaster as Sonner, ToasterProps } from "sonner"
import type React from "react"

const Toaster = ({ theme, ...props }: ToasterProps) => {
  return (
    <Sonner
      theme={(theme ?? "system") as ToasterProps["theme"]}
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
  )
}

export { Toaster }