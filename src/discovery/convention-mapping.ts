/**
 * @pencil-structural/compare - Convention Mapping
 *
 * 컨벤션 기반 Pencil-to-code 파일 매핑
 */

import { basename, dirname, join } from 'path';
import type {
  FileInfo,
  MappedFiles,
  MappingConvention,
  MappingRule,
  FileDiscoveryResult
} from './types.js';
import { groupFilesByType } from './file-discovery.js';

/**
 * 표준 매핑 규칙
 *
 * {name}.pen → src/{name}.tsx → src/{name}.module.css
 */
function matchStandardConvention(
  pencil: FileInfo,
  files: FileInfo[]
): MappedFiles | null {
  const pencilName = pencil.name;
  const srcDir = dirname(pencil.relativePath).replace(/^docs\/design\/pencil/, 'src');

  // TSX 매칭: src/{name}.tsx
  const tsxFiles = files.filter(
    f => f.type === 'tsx' &&
    f.name === pencilName &&
    f.relativePath.startsWith(srcDir)
  );

  // CSS 매칭: src/{name}.module.css
  const cssFiles = files.filter(
    f => f.type === 'css' &&
    f.name === `${pencilName}.module` &&
    f.relativePath.startsWith(srcDir)
  );

  if (tsxFiles.length === 0) return null;

  return {
    pencil,
    tsx: tsxFiles[0],
    css: cssFiles[0],
    convention: 'standard'
  };
}

/**
 * 페이지 매핑 규칙
 *
 * {name}.pen → src/components/views/{name}View.tsx → src/components/views/{name}View.module.css
 */
function matchPageConvention(
  pencil: FileInfo,
  files: FileInfo[]
): MappedFiles | null {
  const pencilName = pencil.name;

  // TSX 매칭: src/components/views/{name}View.tsx
  const tsxFiles = files.filter(
    f => f.type === 'tsx' &&
    f.name === `${pencilName}View` &&
    f.relativePath.includes('components/views')
  );

  // CSS 매칭: src/components/views/{name}View.module.css
  const cssFiles = files.filter(
    f => f.type === 'css' &&
    f.name === `${pencilName}View.module` &&
    f.relativePath.includes('components/views')
  );

  if (tsxFiles.length === 0) return null;

  return {
    pencil,
    tsx: tsxFiles[0],
    css: cssFiles[0],
    convention: 'page'
  };
}

/**
 * 독립 컴포넌트 매핑 규칙
 *
 * {name}.pen → src/components/{name}/{name}.tsx → src/components/{name}/{name}.module.css
 */
function matchIndependentConvention(
  pencil: FileInfo,
  files: FileInfo[]
): MappedFiles | null {
  const pencilName = pencil.name;

  // TSX 매칭: src/components/{name}/{name}.tsx
  const tsxFiles = files.filter(
    f => f.type === 'tsx' &&
    f.name === pencilName &&
    f.relativePath.match(new RegExp(`src/components/${pencilName}/${pencilName}\\.tsx$`))
  );

  // CSS 매칭: src/components/{name}/{name}.module.css
  const cssFiles = files.filter(
    f => f.type === 'css' &&
    f.name === `${pencilName}.module` &&
    f.relativePath.match(new RegExp(`src/components/${pencilName}/${pencilName}\\.module\\.css$`))
  );

  if (tsxFiles.length === 0) return null;

  return {
    pencil,
    tsx: tsxFiles[0],
    css: cssFiles[0],
    convention: 'independent'
  };
}

/**
 * 매핑 규칙 등록
 */
const MAPPING_RULES: MappingRule[] = [
  {
    convention: 'standard',
    pencilPattern: '{name}.pen',
    tsxPattern: 'src/{name}.tsx',
    cssPattern: 'src/{name}.module.css',
    match: matchStandardConvention
  },
  {
    convention: 'page',
    pencilPattern: '{name}.pen',
    tsxPattern: 'src/components/views/{name}View.tsx',
    cssPattern: 'src/components/views/{name}View.module.css',
    match: matchPageConvention
  },
  {
    convention: 'independent',
    pencilPattern: '{name}.pen',
    tsxPattern: 'src/components/{name}/{name}.tsx',
    cssPattern: 'src/components/{name}/{name}.module.css',
    match: matchIndependentConvention
  }
];

/**
 * Pencil 파일에 맞는 코드 파일 찾기
 */
export function findMatchingFiles(
  pencil: FileInfo,
  files: FileInfo[],
  conventions: MappingConvention[] = ['standard', 'page', 'independent']
): MappedFiles | null {
  for (const convention of conventions) {
    const rule = MAPPING_RULES.find(r => r.convention === convention);
    if (!rule) continue;

    const match = rule.match(pencil, files);
    if (match) {
      return match;
    }
  }

  return null;
}

/**
 * 모든 파일 매핑
 */
export function mapAllFiles(
  result: FileDiscoveryResult,
  conventions: MappingConvention[] = ['standard', 'page', 'independent']
): FileDiscoveryResult {
  const { files } = result;
  const grouped = groupFilesByType(files);

  const mapped: MappedFiles[] = [];
  const mappedTsxPaths = new Set<string>();
  const unmappedPencil: FileInfo[] = [];

  // Pencil 파일 순회하며 매핑
  for (const pencil of grouped.pencil) {
    const match = findMatchingFiles(pencil, files, conventions);

    if (match) {
      mapped.push(match);
      mappedTsxPaths.add(match.tsx.path);
    } else {
      unmappedPencil.push(pencil);
    }
  }

  // 매핑되지 않은 코드 파일
  const unmappedCode = files.filter(
    f => (f.type === 'tsx' || f.type === 'css') && !mappedTsxPaths.has(f.path)
  );

  return {
    ...result,
    mapped,
    unmapped: {
      pencil: unmappedPencil,
      code: unmappedCode
    },
    meta: {
      ...result.meta,
      mappedCount: mapped.length,
      unmappedCount: unmappedPencil.length + unmappedCode.length
    }
  };
}

/**
 * 컨벤션 자동 감지
 */
export function detectConvention(files: MappedFiles[]): MappingConvention {
  if (files.length === 0) return 'standard';

  const conventionCounts: Record<MappingConvention, number> = {
    standard: 0,
    page: 0,
    independent: 0,
    custom: 0
  };

  for (const file of files) {
    conventionCounts[file.convention]++;
  }

  // 가장 많이 사용된 컨벤션 반환
  return Object.entries(conventionCounts)
    .sort(([, a], [, b]) => b - a)[0][0] as MappingConvention;
}

export { MAPPING_RULES };
