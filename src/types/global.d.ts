declare global {
  interface Window {
    /**
     * Navigate to the auth page with a custom redirect URL
     * @param redirectUrl - URL to redirect to after successful authentication
     */
    navigateToAuth: (redirectUrl: string) => void;
  }
}

// Fix TypeScript resolution for Google provider from @convex-dev/auth.
// Some versions don't ship type declarations for this subpath.
declare module "@convex-dev/auth/providers/Google" {
  export const Google: unknown;
}

declare module "@convex-dev/auth/providers/google" {
  export const Google: unknown;
}

// Ensure ambient typings for @auth/core Google provider are present
declare module "@auth/core/providers/google" {
  const Google: unknown;
  export default Google;
}

export {};