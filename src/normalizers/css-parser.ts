/**
 * CSS Modules 파서
 *
 * CSS 코드 → StyleProperties 맵 변환
 */

import type { StyleProperties } from '../types.js';
import { convertCSSValue, camelCase } from '../utils/format.js';

/**
 * CSS 클래스 패턴
 */
const CSS_CLASS_PATTERN = /\.([a-zA-Z_][\w-]*)\s*\{([^}]+)\}/g;

/**
 * CSS 속성 패턴
 */
const CSS_PROPERTY_PATTERN = /([a-z-]+)\s*:\s*([^;]+);?/gi;

/**
 * CSS Modules 파싱
 * @param cssCode CSS 코드
 */
export function parseCSSModules(cssCode: string): Map<string, StyleProperties> {
  const styles = new Map<string, StyleProperties>();

  // 각 CSS 클래스에 대해 반복 (String.prototype.matchAll 사용)
  const classMatches = cssCode.matchAll(CSS_CLASS_PATTERN);

  for (const match of classMatches) {
    const className = match[1];
    const propertiesBlock = match[2];

    const styleProps: StyleProperties = {};

    // 개별 속성 파싱 (matchAll 사용)
    const propMatches = propertiesBlock.matchAll(CSS_PROPERTY_PATTERN);

    for (const propMatch of propMatches) {
      const property = propMatch[1];
      const value = propMatch[2].trim();

      // camelCase 변환 및 값 변환
      const camelProp = camelCase(property);
      styleProps[camelProp] = convertCSSValue(value);
    }

    styles.set(className, styleProps);
  }

  return styles;
}

/**
 * CSS 속성 값에서 단위 추출
 * @param value CSS 값
 */
export function extractUnit(value: string): { value: number; unit: string } | null {
  const match = value.match(/^([\d.]+)(px|rem|em|em|%|vh|vw|s|ms)?$/);
  if (!match) return null;

  return {
    value: parseFloat(match[1]),
    unit: match[2] || '',
  };
}

/**
 * 단위 있는 값을 px로 변환
 * @param value 값
 * @param unit 단위
 * @param rootFontSize 루트 폰트 크기 (기본 16px)
 */
export function convertToPx(
  value: number,
  unit: string,
  rootFontSize: number = 16
): number {
  switch (unit) {
    case 'px':
      return value;
    case 'rem':
      return value * rootFontSize;
    case 'em':
      return value * rootFontSize;
    case '%':
      return (value / 100) * rootFontSize;
    default:
      return value;
  }
}

/**
 * 색상값 파싱
 * @param value 색상값
 */
export function parseColor(value: string): string | null {
  // HEX 색상
  if (value.startsWith('#') || value.startsWith('rgb')) {
    return value;
  }

  // named color
  return null;
}

/**
 * 복합 속성 분해
 * @param property 속성명
 * @param value 속성값
 */
export function expandShorthand(
  property: string,
  value: string
): Record<string, string> | null {
  // margin, padding 등의 복합 속성 분해
  if (property === 'margin' || property === 'padding') {
    const parts = value.split(/\s+/);
    const values = {
      top: parts[0],
      right: parts[1] || parts[0],
      bottom: parts[2] || parts[0],
      left: parts[3] || parts[1] || parts[0],
    };

    return values as Record<string, string>;
  }

  return null;
}

/**
 * 미디어 쿼리 제거
 * @param cssCode CSS 코드
 */
export function stripMediaQueries(cssCode: string): string {
  return cssCode.replace(/@media[^{]+\{([^}]|\{[^}]*\})*\}\}/g, '');
}

/**
 * 주석 제거
 * @param cssCode CSS 코드
 */
export function stripComments(cssCode: string): string {
  return cssCode.replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, '');
}

/**
 * CSS 정리 (공백, 주석, 미디어 쿼리 제거)
 * @param cssCode CSS 코드
 */
export function cleanCSS(cssCode: string): string {
  let cleaned = cssCode;

  // 주석 제거
  cleaned = stripComments(cleaned);

  // 미디어 쿼리 제거
  cleaned = stripMediaQueries(cleaned);

  return cleaned;
}

/**
 * CSS 클래스 목록 추출
 * @param cssCode CSS 코드
 */
export function extractClassNames(cssCode: string): string[] {
  const classNames = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = CSS_CLASS_PATTERN.exec(cssCode)) !== null) {
    classNames.add(match[1]);
  }

  return Array.from(classNames);
}
