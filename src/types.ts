/**
 * @pencil-structural/compare - 타입 정의
 *
 * 구조적 비교 시스템의 공개 타입 정의
 */

/**
 * 요소 타입
 */
export type ElementType =
  | 'text'        // 텍스트 요소
  | 'container'   // 컨테이너 (frame, rectangle)
  | 'button'      // 버튼
  | 'image'       // 이미지
  | 'icon'        // 아이콘
  | 'input';      // 입력 요소

/**
 * 스타일 속성
 */
export interface StyleProperties {
  /** 폰트 크기 (px 또는 단위 없는 숫자) */
  fontSize?: number | string;

  /** 폰트 굵기 */
  fontWeight?: string;

  /** 텍스트 색상 */
  color?: string;

  /** 배경 색상 */
  backgroundColor?: string;

  /** 테두리 색상 */
  borderColor?: string;

  /** 테두리 두께 */
  borderWidth?: number;

  /** 안쪽 여백 */
  padding?: string | number;

  /** 바깥 여백 */
  margin?: string | number;

  /** 요소 간 간격 */
  gap?: string | number;

  /** 테두리 둥글기 */
  borderRadius?: string | number;

  /** 너비 */
  width?: string | number;

  /** 높이 */
  height?: string | number;

  /** 기타 스타일 */
  [key: string]: any;
}

/**
 * 레이아웃 속성
 */
export interface LayoutProperties {
  /** 레이아웃 타입 */
  type?: 'flex' | 'grid' | 'stack' | 'absolute';

  /** 방향 (flex일 때) */
  direction?: 'row' | 'column';

  /** 정렬 (주축) */
  justifyContent?: 'start' | 'center' | 'end' | 'space-between' | 'space-around';

  /** 정렬 (교차축) */
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
}

/**
 * 요소 메타데이터
 */
export interface ElementMetadata {
  /** 데이터 소스 (pencil 또는 code) */
  source: 'pencil' | 'code';

  /** 원본 ID */
  originalId?: string;

  /** 원본 노드 */
  originalNode?: any;

  /** 독립 컴포넌트 여부 */
  isIndependentComponent?: boolean;

  /** 코드 컴포넌트 이름 (독립 컴포넌트인 경우) */
  codeComponentName?: string;

  /** Pencil 컴포넌트 이름 (독립 컴포넌트인 경우) */
  pencilComponentName?: string;
}

/**
 * 정규화된 표준 요소 모델
 * Pencil과 코드에서 공통으로 사용하는 데이터 구조
 */
export interface StandardElement {
  /** 고유 식별자 */
  id: string;

  /** 요소 타입 */
  type: ElementType;

  /** 요소 경로 (ex: "header > title[0]") */
  path: string;

  /** 텍스트 콘텐츠 */
  content?: string;

  /** 스타일 속성 */
  styles: StyleProperties;

  /** 레이아웃 속성 */
  layout?: LayoutProperties;

  /** 하위 요소 */
  children?: StandardElement[];

  /** 메타데이터 */
  metadata?: ElementMetadata;
}

// ============================================================================
// 비교 결과 모델
// ============================================================================

/**
 * 비교 메타데이터
 */
export interface ComparisonMeta {
  /** 비교 일시 */
  timestamp: string;

  /** 화면 정보 */
  screen: {
    id: string;
    name: string;
    frameId: string;
  };

  /** 소스 파일 */
  sources: {
    pencil: string;
    tsx: string;
    css: string;
  };

  /** 비교 옵션 */
  options: ComparisonOptions;
}

/**
 * 비교 옵션
 */
export interface ComparisonOptions {
  /** 스타일 허용 오차 (px) */
  tolerance?: number;

  /** 색상 허용 오차 (0-255) */
  colorTolerance?: number;

  /** 무시할 속성 */
  ignoreProperties?: string[];

  /** 심각도 레벨 */
  severity?: 'strict' | 'normal' | 'lenient';
}

/**
 * 요소 매칭 결과
 */
export interface ElementMatch {
  /** 요소 경로 */
  path: string;

  /** Pencil 요소 */
  pencil: StandardElement;

  /** 코드 요소 */
  code: StandardElement;

  /** 일치 확신도 (0-1) */
  confidence: number;

  /** 속성 일치 여부 */
  propertiesMatch: {
    [key: string]: boolean;
  };

  /** 매칭 메타데이터 */
  metadata?: {
    matchReason?: string;
    matchType?: 'exact' | 'fuzzy' | 'independent';
    matchMethod?: string;
  };
}

/**
 * 요소 차이
 */
export interface ElementDiff {
  /** 요소 경로 */
  path: string;

  /** 대상 요소 */
  element: StandardElement;

  /** 차이 유형 */
  type: 'missing' | 'extra' | 'mismatch';

  /** 심각도 */
  severity: 'error' | 'warning' | 'info';

  /** 설명 */
  reason: string;

  /** 제안 수정 */
  suggestion?: string;
}

/**
 * 스타일 차이
 */
export interface StyleDiff {
  /** 요소 경로 */
  path: string;

  /** 속성명 */
  property: string;

  /** Pencil 값 */
  pencilValue: any;

  /** 코드 값 */
  codeValue: any;

  /** 차이 크기 */
  diff?: number;

  /** 심각도 */
  severity: 'error' | 'warning' | 'info';
}

/**
 * 비교 요약
 */
export interface ComparisonSummary {
  /** 총 요소 수 */
  totalElements: number;

  /** 일치 요소 수 */
  matchedElements: number;

  /** 누락 요소 수 */
  missingElements: number;

  /** 추가 요소 수 */
  extraElements: number;

  /** 스타일 차이 수 */
  styleDiffs: number;

  /** 일치율 (0-100) */
  matchRate: number;

  /** 전체 상태 */
  status: 'pass' | 'warning' | 'fail';
}

/**
 * 비교 결과
 */
export interface ComparisonResult {
  /** 비교 메타데이터 */
  meta: ComparisonMeta;

  /** 일치하는 요소 */
  matches: ElementMatch[];

  /** 코드에 누락된 요소 */
  missingInCode: ElementDiff[];

  /** 코드에 추가된 요소 */
  extraInCode: ElementDiff[];

  /** 스타일 차이 */
  styleDiffs: StyleDiff[];

  /** 요약 통계 */
  summary: ComparisonSummary;
}

// ============================================================================
// Pencil 노드 타입 (MCP에서 반환하는 형태)
// ============================================================================

/**
 * Pencil 노드 (MCP batch_get에서 반환하는 형태)
 */
export interface PencilNode {
  /** 노드 ID */
  id?: string;

  /** 노드 타입 */
  type: string;

  /** 노드 이름 */
  name?: string;

  /** 텍스트 콘텐츠 */
  content?: string;

  /** 폰트 크기 */
  fontSize?: any;

  /** 폰트 굵기 */
  fontWeight?: any;

  /** 채우기 색상 */
  fill?: any;

  /** 테두리 */
  stroke?: {
    fill?: any;
    thickness?: any;
  };

  /** 안쪽 여백 */
  padding?: any;

  /** 간격 */
  gap?: any;

  /** 테두리 둥글기 */
  borderRadius?: any;

  /** 너비 */
  width?: string | number;

  /** 높이 */
  height?: string | number;

  /** 레이아웃 */
  layout?: string;

  /** 정렬 */
  justifyContent?: string;

  /** 교차축 정렬 */
  alignItems?: string;

  /** 하위 노드 */
  children?: PencilNode[];
}

/**
 * Pencil 프레임 (최상위 노드)
 */
export interface PencilFrame {
  id: string;
  type: string;
  name: string;
  fill?: any;
  cornerRadius?: any;
  gap?: any;
  padding?: any;
  children: PencilNode[];
}
