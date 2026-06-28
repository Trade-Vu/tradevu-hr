/**
 * featureFlags.js — Lightweight environment-aware feature flag system.
 *
 * HOW IT WORKS:
 *   - Flags are read from Vite env vars (VITE_FEATURE_<FLAG_NAME>)
 *   - DEV_ONLY flags are always disabled in production builds regardless of env vars
 *   - Prod defaults are intentionally conservative (false = off)
 *
 * USAGE:
 *   import { isFeatureEnabled } from '@/lib/featureFlags';
 *   if (!isFeatureEnabled('CSV_IMPORT')) return null;
 *
 * TO ENABLE A FLAG LOCALLY:
 *   Add to your .env.local:   VITE_FEATURE_CSV_IMPORT=true
 *
 * TO ENABLE IN CI/STAGING:
 *   Set the env var in your CI pipeline or hosting config.
 *
 * FLAGS CATALOGUE:
 * ┌─────────────────────────────┬───────────────────────────────────────────────────────────────┐
 * │ Flag                        │ Description                                                   │
 * ├─────────────────────────────┼───────────────────────────────────────────────────────────────┤
 * │ CSV_IMPORT                  │ HR bulk employee CSV upload step in ProfileCompletionWizard   │
 * │ MOCK_CEO_LOGIN              │ [DEV_ONLY] Allow ceo@tradevu.com to bypass real auth          │
 * │ ORG_SETUP_BYPASS            │ [DEV_ONLY] Skip org setup with a local dev button             │
 * └─────────────────────────────┴───────────────────────────────────────────────────────────────┘
 */

const IS_DEV = import.meta.env.DEV;

/**
 * Feature flags with their prod-safe defaults.
 * DEV_ONLY flags are automatically forced to false in production.
 */
const FLAG_DEFINITIONS = {
  CSV_IMPORT: {
    devOnly: false,
    default: false, // Off in prod until CSV parsing is fully validated
    envVar: 'VITE_FEATURE_CSV_IMPORT',
  },
  MOCK_CEO_LOGIN: {
    devOnly: true, // Hardcoded off in all non-dev environments
    default: true,
    envVar: 'VITE_FEATURE_MOCK_CEO_LOGIN',
  },
  ORG_SETUP_BYPASS: {
    devOnly: true,
    default: true,
    envVar: 'VITE_FEATURE_ORG_SETUP_BYPASS',
  },
};

/**
 * Returns true if a given feature flag is enabled in the current environment.
 * @param {keyof typeof FLAG_DEFINITIONS} flagName
 * @returns {boolean}
 */
export function isFeatureEnabled(flagName) {
  const def = FLAG_DEFINITIONS[flagName];
  if (!def) {
    console.warn(`[featureFlags] Unknown flag: "${flagName}". Returning false.`);
    return false;
  }

  // DEV_ONLY flags are always off in production
  if (def.devOnly && !IS_DEV) {
    return false;
  }

  // Check if an explicit env var override exists
  const envValue = import.meta.env[def.envVar];
  if (envValue !== undefined) {
    return envValue === 'true' || envValue === true;
  }

  // Otherwise use the safe default (dev gets the default, prod respects devOnly rule)
  return IS_DEV ? def.default : false;
}

/**
 * Returns all currently enabled flags. Useful for debugging.
 * Only available in DEV mode.
 */
export function getEnabledFlags() {
  if (!IS_DEV) return {};
  return Object.fromEntries(
    Object.keys(FLAG_DEFINITIONS).map((key) => [key, isFeatureEnabled(key)])
  );
}
