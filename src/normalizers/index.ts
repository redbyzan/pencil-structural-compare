/**
 * 정규화 레이어 진입점
 *
 * Pencil JSON과 코드를 표준 요소 모델로 변환
 */

// 타입 내보내기
export type {
  StyleMap,
  JSXAttributeInfo,
  ExtractionContext,
} from './types.js';

// Pencil 정규화
export { normalizePencilFrame, normalizePencilNode } from './pencil.js';

// 코드 정규화 (Babel AST 기반) - 선택적 의존성
export {
  normalizeCodeFile,
  extractComponentName,
  extractExportedComponent,
} from './code.js';

// CSS 파싱
export {
  parseCSSModules,
  extractUnit,
  convertToPx,
  parseColor,
  expandShorthand,
  stripMediaQueries,
  stripComments,
  cleanCSS,
  extractClassNames,
} from './css-parser.js';
