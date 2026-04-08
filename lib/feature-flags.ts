/**
 * Feature Flags configuration.
 *
 * This utility allows us to easily toggle features based on the environment.
 * In development, we might want to see and test features that are not yet
 * ready for production.
 */

export const FEATURES = {
  /**
   * Toggle for the sidebar in the Secretary Portal (DocsPortal).
   * Hidden in production until the backend integration is fully ready.
   */
  SHOW_DOCS_SIDEBAR: process.env.NODE_ENV === "development",
  /**
   * Toggle for recruitment pages.
   * Exposed in development for local testing, hidden in production.
   */
  ALLOW_PENDAFTARAN: process.env.NODE_ENV === "development",
};
