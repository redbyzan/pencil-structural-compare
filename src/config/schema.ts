/**
 * Configuration Schema Definition
 *
 * Zod schemas for validating configuration files and CLI options.
 */

import { z } from 'zod';

/**
 * Screen configuration schema
 * Represents a single screen to compare
 */
export const screenConfigSchema = z.object({
  /** Unique screen identifier */
  id: z.string().min(1),
  /** Display name */
  name: z.string().min(1),
  /** Pencil Frame ID */
  frameId: z.string().min(1),
  /** Path to TSX file */
  tsxFile: z.string().min(1),
  /** Path to CSS Module file */
  cssFile: z.string().min(1),
});

/**
 * Comparison severity levels
 */
export const severitySchema = z.enum(['strict', 'normal', 'lenient']);

/**
 * Comparison options schema
 */
export const comparisonOptionsSchema = z.object({
  /** Pixel tolerance for size comparisons */
  tolerance: z.number().int().min(0).default(1),
  /** Color tolerance (0-255) */
  colorTolerance: z.number().int().min(0).max(255).default(10),
  /** Comparison severity */
  severity: severitySchema.default('normal'),
  /** Properties to ignore during comparison */
  ignoreProperties: z.array(z.string()).default([]),
});

/**
 * Main configuration schema
 */
export const configSchema = z.object({
  /** Path to Pencil design file */
  pencilFile: z.string().min(1),
  /** Output directory for reports */
  outputDir: z.string().default('./docs/structural-comparison'),
  /** Screens to compare */
  screens: z.array(screenConfigSchema).min(1),
  /** Comparison options */
  options: comparisonOptionsSchema.optional(),
});

/**
 * CLI options schema (subset of config for CLI overrides)
 */
export const cliOptionsSchema = z.object({
  /** Screen ID to filter */
  screen: z.string().optional(),
  /** Verbose output */
  verbose: z.boolean().default(false),
  /** Report format */
  format: z.enum(['console', 'markdown', 'json', 'ci-summary']).default('markdown'),
  /** Custom output path */
  output: z.string().optional(),
  /** Config file path */
  config: z.string().optional(),
  /** Changed files only (--changed flag) */
  changed: z.boolean().default(false),
});

/**
 * Configuration file schema (.structural-comparerc.json)
 */
export const configFileSchema = z.object({
  /** Pencil file path (required) */
  pencilFile: z.string().min(1),
  /** Output directory */
  outputDir: z.string().optional(),
  /** Screens configuration */
  screens: z.array(screenConfigSchema).min(1),
  /** Comparison options */
  options: comparisonOptionsSchema.optional(),
});

// Type exports
export type ScreenConfig = z.infer<typeof screenConfigSchema>;
export type Severity = z.infer<typeof severitySchema>;
export type ComparisonOptions = z.infer<typeof comparisonOptionsSchema>;
export type Config = z.infer<typeof configSchema>;
export type CLIOptions = z.infer<typeof cliOptionsSchema>;
export type ConfigFile = z.infer<typeof configFileSchema>;
