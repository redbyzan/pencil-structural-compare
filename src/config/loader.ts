/**
 * Configuration Loader
 *
 * Handles loading and merging configuration from files and CLI options.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import {
  configSchema,
  configFileSchema,
  cliOptionsSchema,
  type Config,
  type ConfigFile,
  type CLIOptions,
} from './schema.js';

/**
 * Default configuration values
 */
const DEFAULT_OUTPUT_DIR = './docs/structural-comparison';

/**
 * Configuration file names to search (in order of priority)
 */
const CONFIG_FILE_NAMES = [
  '.structural-comparerc.json',
  '.structural-comparerc',
  'structural-compare.config.json',
];

/**
 * Find and load configuration file
 * Searches from current directory up to project root
 *
 * @param startDir Directory to start searching from
 * @returns Path to found config file or null
 */
export function findConfigFile(startDir: string = process.cwd()): string | null {
  let currentDir = resolve(startDir);

  // Search up to 5 levels up
  for (let i = 0; i < 5; i++) {
    for (const fileName of CONFIG_FILE_NAMES) {
      const configPath = join(currentDir, fileName);
      if (existsSync(configPath)) {
        return configPath;
      }
    }

    // Move up one directory
    const parentDir = resolve(currentDir, '..');
    if (parentDir === currentDir) {
      // Reached root
      break;
    }
    currentDir = parentDir;
  }

  return null;
}

/**
 * Load configuration from file
 *
 * @param configPath Path to configuration file
 * @returns Parsed configuration object
 * @throws Error if file doesn't exist or is invalid
 */
export function loadConfigFile(configPath: string): ConfigFile {
  if (!existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    const rawConfig = JSON.parse(content);
    return configFileSchema.parse(rawConfig);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      throw new Error(
        `Invalid configuration file: ${configPath}\n` +
        error.errors.map((e: any) => `  - ${e.path.join('.')}: ${e.message}`).join('\n')
      );
    }
    throw new Error(`Failed to load configuration: ${error.message}`);
  }
}

/**
 * Load configuration with defaults applied
 *
 * @param configPath Optional path to configuration file
 * @returns Complete configuration object
 */
export function loadConfig(configPath?: string): Config {
  let configFile: ConfigFile | null = null;

  // Load from specified path or search for config file
  if (configPath) {
    configFile = loadConfigFile(configPath);
  } else {
    const foundPath = findConfigFile();
    if (foundPath) {
      configFile = loadConfigFile(foundPath);
    }
  }

  // If no config file found, use default minimal config
  if (!configFile) {
    throw new Error(
      'No configuration file found. Please create .structural-comparerc.json ' +
      'or specify --config option.'
    );
  }

  // Merge with defaults and validate
  const config: Config = {
    pencilFile: configFile.pencilFile,
    outputDir: configFile.outputDir || DEFAULT_OUTPUT_DIR,
    screens: configFile.screens,
    options: configFile.options || {
      tolerance: 1,
      colorTolerance: 10,
      severity: 'normal',
      ignoreProperties: [],
    },
  };

  return configSchema.parse(config);
}

/**
 * Merge CLI options with configuration
 *
 * @param config Base configuration
 * @param cliOptions CLI options to override
 * @returns Merged configuration
 */
export function mergeConfigWithCliOptions(
  config: Config,
  cliOptions: CLIOptions
): { config: Config; options: CLIOptions } {
  const merged: Config = { ...config };

  // Apply CLI overrides
  if (cliOptions.output) {
    merged.outputDir = cliOptions.output;
  }

  return {
    config: merged,
    options: cliOptions,
  };
}

/**
 * Validate configuration object
 *
 * @param config Configuration to validate
 * @returns Validation result
 */
export function validateConfig(config: unknown): {
  valid: boolean;
  errors?: string[];
} {
  const result = configSchema.safeParse(config);

  if (result.success) {
    return { valid: true };
  }

  return {
    valid: false,
    errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
  };
}

/**
 * Get example configuration
 *
 * @returns Example configuration object
 */
export function getExampleConfig(): ConfigFile {
  return {
    pencilFile: 'data/pencil/sidepanel-designs.pen',
    outputDir: 'docs/structural-comparison',
    screens: [
      {
        id: 'home',
        name: 'HomeView',
        frameId: '9Yzp6',
        tsxFile: 'src/sidepanel/components/views/HomeView.tsx',
        cssFile: 'src/sidepanel/components/views/HomeView.module.css',
      },
    ],
    options: {
      tolerance: 1,
      colorTolerance: 10,
      severity: 'normal',
      ignoreProperties: [
        'display',
        'flexDirection',
        'flexWrap',
        'flex',
        'justifyContent',
        'alignItems',
        'alignSelf',
        'justifySelf',
        'minWidth',
        'maxWidth',
        'minHeight',
        'maxHeight',
        'width',
        'height',
        'margin',
        'marginTop',
        'marginRight',
        'marginBottom',
        'marginLeft',
        'fontFamily',
        'lineHeight',
        'boxSizing',
        'cursor',
        'overflow',
        'overflowX',
        'overflowY',
        'position',
        'borderRadius',
        'gap',
        'color',
        'padding',
        'backgroundColor',
        'fontSize',
        'borderColor',
        'borderWidth',
        'transition',
        'border',
        'whiteSpace',
        'textDecoration',
        'outline',
      ],
    },
  };
}
