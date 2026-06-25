/**
 * Notion CMS Glossarium
 * =======================
 * The central developer contract between the Notion CMS (A layer)
 * and the Next.js page builder (C layer).
 *
 * This layer (B) provides typed constants for database names,
 * property names, component types, and relations to eliminate
 * magic strings and improve discoverability.
 */

export * from "./components";
export * from "./databases";
export * from "./properties";
export * from "./relations";
