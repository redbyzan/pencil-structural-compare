/**
 * @pencil-structural/compare - Processor Types
 *
 * 독립 컴포넌트 처리를 위한 타입 정의
 */

/**
 * 독립 컴포넌트 정보
 */
export interface IndependentComponent {
  /** Pencil 이름 */
  pencilName: string;

  /** 코드 컴포넌트 이름 */
  codeName: string;

  /** TSX 파일 경로 */
  tsxPath: string;

  /** CSS 파일 경로 (선택적) */
  cssPath?: string;

  /** Props 인터페이스 이름 */
  propsInterface?: string;

  /** 추출된 Props */
  props?: ComponentProp[];
}

/**
 * 컴포넌트 Prop 정보
 */
export interface ComponentProp {
  /** Prop 이름 */
  name: string;

  /** Prop 타입 */
  type: string;

  /** 필수 여부 */
  required: boolean;

  /** 기본값 */
  defaultValue?: any;

  /** 설명 (JSDoc) */
  description?: string;
}

/**
 * 처리 옵션
 */
export interface ProcessorOptions {
  /** 병렬 처리 수 */
  concurrency?: number;

  /** Props 추출 활성화 */
  extractProps?: boolean;

  /** 스타일 검증 활성화 */
  validateStyles?: boolean;

  /** 타임아웃 (ms) */
  timeout?: number;
}

/**
 * 처리 결과
 */
export interface ProcessResult {
  /** 컴포넌트 경로 */
  componentPath: string;

  /** 성공 여부 */
  success: boolean;

  /** 오류 메시지 */
  error?: string;

  /** Props 정보 */
  props?: ComponentProp[];

  /** 스타일 검증 결과 */
  styleValidation?: {
    /** 일치 여부 */
    matches: boolean;

    /** 차이점 */
    diffs: string[];
  };

  /** 처리 시간 (ms) */
  duration: number;
}

/**
 * 일괄 처리 결과
 */
export interface BatchProcessResult {
  /** 처리된 컴포넌트 수 */
  total: number;

  /** 성공한 컴포넌트 수 */
  successful: number;

  /** 실패한 컴포넌트 수 */
  failed: number;

  /** 개별 결과 */
  results: ProcessResult[];

  /** 총 처리 시간 (ms) */
  totalDuration: number;
}
