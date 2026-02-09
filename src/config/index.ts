/**
 * Configuration Module
 *
 * Exports configuration loading, validation, and schema definitions.
 */

// Schema exports
export {
  screenConfigSchema,
  severitySchema,
  comparisonOptionsSchema,
  configSchema,
  cliOptionsSchema,
  configFileSchema,
  type ScreenConfig,
  type Severity,
  type ComparisonOptions,
  type Config,
  type CLIOptions,
  type ConfigFile,
} from './schema.js';

// Loader exports
export {
  findConfigFile,
  loadConfigFile,
  loadConfig,
  mergeConfigWithCliOptions,
  validateConfig,
  getExampleConfig,
} from './loader.js';

// Legacy exports (for backward compatibility)
export {
  isIndependentComponent,
  getIndependentComponentCodeName,
  INDEPENDENT_COMPONENT_MAPPING,
  INDEPENDENT_COMPONENT_PENCIL_NAMES,
} from './independent-components.js';

export {
  mapPencilNameToCode,
  mapCodeNameToPencil,
  areNamesEquivalent,
  matchByPrefix,
  stripNumericSuffix,
  PENCIL_TO_CODE_NAME,
  CODE_TO_PENCIL_NAME,
  CODE_CLASS_TO_PENCIL_NAME,
} from './name-mapping.js';
