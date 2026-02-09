/**
 * @pencil-structural/compare - File Discovery
 *
 * Globby 기반 파일 검색 및 파일 타입 감지
 */

import { promises as fs } from 'fs';
import { join, relative, extname, basename } from 'path';
import type {
  FileInfo,
  FileType,
  FileDiscoveryOptions,
  FileDiscoveryResult,
  GitChangedFile
} from './types.js';

/**
 * 파일 확장자로 파일 타입 감지
 */
export function detectFileType(path: string): FileType {
  const ext = extname(path).toLowerCase();

  if (ext === '.pen') return 'pencil';
  if (ext === '.tsx' || ext === '.ts') return 'tsx';
  if (ext === '.css' || ext === '.scss' || ext === '.sass') return 'css';

  return 'unknown';
}

/**
 * 파일 정보 생성
 */
async function createFileInfo(
  rootDir: string,
  filePath: string
): Promise<FileInfo> {
  const stats = await fs.stat(filePath);

  return {
    path: filePath,
    type: detectFileType(filePath),
    name: basename(filePath, extname(filePath)),
    relativePath: relative(rootDir, filePath),
    size: stats.size,
    modifiedAt: stats.mtime
  };
}

/**
 * Git 변경 파일 목록 가져오기
 */
export async function getGitChangedFiles(
  rootDir: string,
  base: string = 'main'
): Promise<Set<string>> {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');

  const execAsync = promisify(exec);

  try {
    // Git이 있는지 확인
    await execAsync('git --version', { cwd: rootDir });

    // 변경된 파일 목록 가져오기
    const { stdout } = await execAsync(
      `git diff --name-only --diff-filter=ADM ${base}`,
      { cwd: rootDir }
    );

    const changedFiles = new Set(
      stdout
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(f => join(rootDir, f))
    );

    return changedFiles;
  } catch (error) {
    // Git이 없거나 에러가 발생하면 빈 세트 반환
    return new Set();
  }
}

/**
 * Globby 패턴으로 파일 검색
 */
async function findFilesByPattern(
  rootDir: string,
  patterns: string[]
): Promise<string[]> {
  const { globby } = await import('globby');

  const paths = await globby(patterns, {
    cwd: rootDir,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**']
  });

  return paths;
}

/**
 * 파일 검색 (메인 함수)
 */
export async function discoverFiles(
  options: FileDiscoveryOptions
): Promise<FileDiscoveryResult> {
  const {
    rootDir,
    pencilDir = 'docs/design/pencil',
    srcDir = 'src',
    changedOnly = false,
    gitBase = 'main',
    include,
    exclude
  } = options;

  const timestamp = new Date().toISOString();

  // 기본 검색 패턴
  const defaultPatterns: string[] = [
    join(pencilDir, '**/*.pen'),
    join(srcDir, '**/*.tsx'),
    join(srcDir, '**/*.css')
  ];

  const patterns = include || defaultPatterns;

  // 파일 검색
  const filePaths = await findFilesByPattern(rootDir, patterns);

  // 제외 패턴 필터링
  let filteredPaths = filePaths;
  if (exclude) {
    const { isMatch } = await import('micromatch');
    filteredPaths = filePaths.filter(path => !isMatch(path, exclude));
  }

  // Git 변경 파일 필터링 (--changed 플래그)
  let changedFilesSet: Set<string> = new Set();
  if (changedOnly) {
    changedFilesSet = await getGitChangedFiles(rootDir, gitBase);
  }

  // 파일 정보 생성
  const files: FileInfo[] = [];

  for (const path of filteredPaths) {
    // 변경 파일만 필터링
    if (changedOnly && !changedFilesSet.has(path)) {
      continue;
    }

    const fileInfo = await createFileInfo(rootDir, path);
    files.push(fileInfo);
  }

  return {
    files,
    mapped: [], // 나중에 convention-mapping에서 채움
    unmapped: {
      pencil: files.filter(f => f.type === 'pencil'),
      code: files.filter(f => f.type === 'tsx' || f.type === 'css')
    },
    meta: {
      timestamp,
      rootDir,
      totalFiles: files.length,
      mappedCount: 0,
      unmappedCount: files.length
    }
  };
}

/**
 * 파일 타입별로 그룹화
 */
export function groupFilesByType(files: FileInfo[]): Record<FileType, FileInfo[]> {
  return {
    pencil: files.filter(f => f.type === 'pencil'),
    tsx: files.filter(f => f.type === 'tsx'),
    css: files.filter(f => f.type === 'css'),
    unknown: files.filter(f => f.type === 'unknown')
  };
}
