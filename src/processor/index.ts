/**
 * @pencil-structural/compare - Component Processor
 *
 * 독립 컴포넌트 처리 공개 API
 */

// Props 추출
export {
  extractComponentProps,
  validatePropsUsage
} from './props-extractor.js';

// 컴포넌트 처리
export {
  processComponent,
  processBatch,
  toIndependentComponents
} from './processor.js';

// 타입
export type {
  IndependentComponent,
  ComponentProp,
  ProcessorOptions,
  ProcessResult,
  BatchProcessResult
} from './types.js';
