/**
 * @pencil-structural/compare
 *
 * 구조적 비교 엔진 - 메인 진입점
 *
 * Pencil 디자인과 코드를 구조적으로 비교하는 라이브러리입니다.
 */

// 공개 API: 코어 비교 엔진
export { compareStructures, generateElementTemplate, formatStyleDiff } from './core/compare.js';
export { compareElements } from './core/element.js';
export { compareStyles, calculateDiff } from './core/style.js';

// 공개 API: 타입
export type {
  // 요소 모델
  ElementType,
  StandardElement,
  StyleProperties,
  LayoutProperties,
  ElementMetadata,

  // 비교 모델
  ComparisonResult,
  ComparisonOptions,
  ComparisonMeta,
  ComparisonSummary,
  ElementMatch,
  ElementDiff,
  StyleDiff,

  // Pencil 모델
  PencilNode,
  PencilFrame,
} from './types.js';

// 공개 API: 정규화기 (핵심 기능)
export { normalizePencilFrame, normalizePencilNode } from './normalizers/pencil.js';
export { parseCSSModules } from './normalizers/css-parser.js';

// 공개 API: 정규화기 (선택적 - Babel 의존성 있음)
export { normalizeCodeFile, extractComponentName, extractExportedComponent } from './normalizers/code.js';

// 공개 API: 정규화기 타입
export type {
  StyleMap,
  JSXAttributeInfo,
  ExtractionContext,
} from './normalizers/types.js';

// 공개 API: 리포터
export { reportToConsole } from './reporters/console.js';
export { reportToMarkdown } from './reporters/markdown.js';
export { reportToJSON, reportToMinifiedJSON, reportToCISummary } from './reporters/json.js';
export type { CISummary } from './reporters/json.js';

// 공개 API: 유틸리티
export {
  buildPath,
  indexByPath,
  getNameFromPath,
  getParentPath,
  getPathDepth,
  sortPaths,
  matchPathPattern,
  arePathsEquivalentByName,
  extractAllNames,
} from './utils/path.js';

export {
  camelCase,
  kebabCase,
  convertCSSValue,
  toPx,
  normalizeValue,
  valuesEqual,
  colorsEqual,
  generateId,
  isEmpty,
  deepClone,
} from './utils/format.js';

export {
  hexToRgb,
  rgbToHex,
  colorDistance,
  isLightColor,
  isDarkColor,
  getContrastRatio,
  passesWCAG_AA,
} from './utils/color.js';

// 공개 API: 설정
export {
  isIndependentComponent,
  getIndependentComponentCodeName,
  INDEPENDENT_COMPONENT_MAPPING,
  INDEPENDENT_COMPONENT_PENCIL_NAMES,
} from './config/independent-components.js';

// 공개 API: 파일 검색 및 매핑
export {
  detectFileType,
  discoverFiles,
  groupFilesByType,
  getGitChangedFiles,
  findMatchingFiles,
  mapAllFiles,
  detectConvention,
  MAPPING_RULES,
} from './discovery/index.js';

// 공개 API: 파일 검색 타입
export type {
  FileType,
  FileInfo,
  MappedFiles,
  MappingConvention,
  FileDiscoveryOptions,
  FileDiscoveryResult,
  GitChangedFile,
} from './discovery/types.js';

// 공개 API: 컴포넌트 처리
export {
  extractComponentProps,
  validatePropsUsage,
  processComponent,
  processBatch,
  toIndependentComponents,
} from './processor/index.js';

// 공개 API: 컴포넌트 처리 타입
export type {
  IndependentComponent,
  ComponentProp,
  ProcessorOptions,
  ProcessResult,
  BatchProcessResult,
} from './processor/types.js';

export {
  mapPencilNameToCode,
  mapCodeNameToPencil,
  areNamesEquivalent,
  matchByPrefix,
  stripNumericSuffix,
  PENCIL_TO_CODE_NAME,
  CODE_TO_PENCIL_NAME,
  CODE_CLASS_TO_PENCIL_NAME,
} from './config/name-mapping.js';

// 버전 정보
export const VERSION = '0.1.0';
