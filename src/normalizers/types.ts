/**
 * 정규화 레이어 타입 정의
 */

import type { StyleProperties } from '../types.js';

/**
 * CSS 스타일 맵
 */
export type StyleMap = Map<string, StyleProperties>;

/**
 * JSX 속성 정보
 */
export interface JSXAttributeInfo {
  name: string;
  value?: string | boolean | null;
  isExpression?: boolean;
}

/**
 * JSX 요소 추출 컨텍스트
 */
export interface ExtractionContext {
  /** CSS 스타일 맵 */
  cssStyles: StyleMap;
  /** 현재 경로 */
  currentPath: string;
  /** 부모 요소 타입 */
  parentType?: string;
  /** 현재 인덱스 */
  index: number;
}
