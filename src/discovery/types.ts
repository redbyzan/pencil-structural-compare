/**
 * @pencil-structural/compare - File Discovery Types
 *
 * 파일 검색 및 컨벤션 기반 매핑을 위한 타입 정의
 */

/**
 * 파일 타입
 */
export type FileType =
  | 'pencil'      // Pencil .pen 파일
  | 'tsx'         // React TypeScript 컴포넌트
  | 'css'         // CSS Module 파일
  | 'unknown';    // 알 수 없는 파일 타입

/**
 * 파일 정보
 */
export interface FileInfo {
  /** 파일 경로 */
  path: string;

  /** 파일 타입 */
  type: FileType;

  /** 파일 이름 (확장자 제외) */
  name: string;

  /** 상대 경로 */
  relativePath: string;

  /** 파일 크기 (bytes) */
  size?: number;

  /** 수정 일시 */
  modifiedAt?: Date;
}

/**
 * 매핑된 파일 쌍
 */
export interface MappedFiles {
  /** Pencil 파일 (.pen) */
  pencil: FileInfo;

  /** 코드 파일 (TSX) */
  tsx: FileInfo;

  /** 스타일 파일 (CSS Module) */
  css?: FileInfo;

  /** 매핑 컨벤션 */
  convention: MappingConvention;
}

/**
 * 매핑 컨벤션
 */
export type MappingConvention =
  | 'standard'    // 표준: {name}.pen → src/{name}.tsx → src/{name}.module.css
  | 'page'        // 페이지: {name}.pen → src/components/views/{name}View.tsx → src/components/views/{name}View.module.css
  | 'independent' // 독립 컴포넌트: {name}.pen → src/components/{name}/{name}.tsx
  | 'custom';     // 사용자 정의

/**
 * 파일 검색 옵션
 */
export interface FileDiscoveryOptions {
  /** 검색 루트 디렉토리 */
  rootDir: string;

  /** Pencil 파일 디렉토리 */
  pencilDir?: string;

  /** 코드 소스 디렉토리 */
  srcDir?: string;

  /** Git 변경 사항만 검색 (--changed 플래그) */
  changedOnly?: boolean;

  /** Git 베이스 커밋 (변경 비교 기준) */
  gitBase?: string;

  /** 포함할 파일 패턴 */
  include?: string[];

  /** 제외할 파일 패턴 */
  exclude?: string[];

  /** 매핑 컨벤션 (자동 감지) */
  conventions?: MappingConvention[];
}

/**
 * 파일 검색 결과
 */
export interface FileDiscoveryResult {
  /** 발견된 모든 파일 */
  files: FileInfo[];

  /** 매핑된 파일 쌍 */
  mapped: MappedFiles[];

  /** 매핑되지 않은 파일 */
  unmapped: {
    pencil: FileInfo[];
    code: FileInfo[];
  };

  /** 검색 메타데이터 */
  meta: {
    timestamp: string;
    rootDir: string;
    totalFiles: number;
    mappedCount: number;
    unmappedCount: number;
  };
}

/**
 * Git 변경 파일 정보
 */
export interface GitChangedFile {
  /** 파일 상태 */
  status: 'added' | 'modified' | 'deleted' | 'renamed';

  /** 파일 경로 */
  path: string;

  /** 이전 경로 (renamed인 경우) */
  oldPath?: string;
}

/**
 * 매핑 규칙
 */
export interface MappingRule {
  /** 컨벤션 타입 */
  convention: MappingConvention;

  /** Pencil 파일 패턴 */
  pencilPattern: string;

  /** TSX 파일 패턴 */
  tsxPattern: string;

  /** CSS 파일 패턴 */
  cssPattern?: string;

  /** 패턴 매칭 함수 */
  match: (pencil: FileInfo, files: FileInfo[]) => MappedFiles | null;
}
