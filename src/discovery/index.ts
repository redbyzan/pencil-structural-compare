/**
 * @pencil-structural/compare - File Discovery
 *
 * 파일 검색 및 컨벤션 기반 매핑 공개 API
 */

// 파일 타입 감지 및 검색
export {
  detectFileType,
  discoverFiles,
  groupFilesByType,
  getGitChangedFiles
} from './file-discovery.js';

// 컨벤션 기반 매핑
export {
  findMatchingFiles,
  mapAllFiles,
  detectConvention,
  MAPPING_RULES
} from './convention-mapping.js';

// 타입
export type {
  FileType,
  FileInfo,
  MappedFiles,
  MappingConvention,
  FileDiscoveryOptions,
  FileDiscoveryResult,
  GitChangedFile,
  MappingRule
} from './types.js';
