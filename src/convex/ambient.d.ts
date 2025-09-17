// Ambient types for Convex server-side TypeScript to recognize optional providers.

// Some versions of @convex-dev/auth don't ship type declarations for this subpath.
// Declare it here so `import { Google } from "@convex-dev/auth/providers/Google"` compiles.
declare module "@convex-dev/auth/providers/Google" {
  export const Google: unknown;
}

declare module "@convex-dev/auth/providers/google" {
  export const Google: unknown;
}

// Add ambient module declaration for @auth/core Google provider (ensures TS compiles even if types are missing)
declare module "@auth/core/providers/google" {
  const Google: unknown;
  export default Google;
}

export {};