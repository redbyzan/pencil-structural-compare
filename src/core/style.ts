/**
 * 스타일 비교
 *
 * 속성 단위 비교 로직
 */

import type { StyleProperties } from '../types.js';
import { valuesEqual } from '../utils/format.js';
import { colorsEqual, hexToRgb } from '../utils/color.js';
import type { ComparisonOptions, StyleDiff } from '../types.js';

/**
 * 중요 속성 목록
 */
const CRITICAL_PROPERTIES = [
  'content',
  'fontSize',
  'fontWeight',
  'color',
  'backgroundColor',
  'padding',
  'gap',
];

/**
 * 속성 비교 (허용 오차 포함)
 * @param pencil Pencil 요소
 * @param code 코드 요소
 * @param options 비교 옵션
 * @param elementPath 요소 경로
 */
export function compareStyles(
  pencil: { styles?: StyleProperties; content?: string },
  code: { styles?: StyleProperties; content?: string },
  options: ComparisonOptions = {},
  elementPath: string = ''
): StyleDiff[] {
  const diffs: StyleDiff[] = [];
  const ignoreProps = new Set(options.ignoreProperties || []);
  const tolerance = options.tolerance || 0;
  const colorTolerance = options.colorTolerance || 0;

  // 콘텐츠 비교
  if (!ignoreProps.has('content')) {
    if (pencil.content !== code.content) {
      diffs.push({
        path: elementPath,
        property: 'content',
        pencilValue: pencil.content,
        codeValue: code.content,
        severity: 'error',
      });
    }
  }

  // 스타일 속성 비교
  const pencilStyles = pencil.styles || {};
  const codeStyles = code.styles || {};

  // 모든 속성 검사
  const allProps = new Set([
    ...Object.keys(pencilStyles),
    ...Object.keys(codeStyles),
  ]);

  for (const prop of allProps) {
    if (ignoreProps.has(prop)) continue;

    const pencilValue = pencilStyles[prop];
    const codeValue = codeStyles[prop];

    const isEqual = compareProperty(
      prop,
      pencilValue,
      codeValue,
      tolerance,
      colorTolerance
    );

    if (!isEqual) {
      const severity = getSeverity(prop, options);
      const diff = calculateDiff(pencilValue, codeValue);
      diffs.push({
        path: elementPath,
        property: prop,
        pencilValue,
        codeValue,
        diff,
        severity,
      });
    }
  }

  return diffs;
}

/**
 * 단일 속성 비교
 * @param property 속성명
 * @param pencilValue Pencil 값
 * @param codeValue 코드 값
 * @param tolerance 일반 허용 오차
 * @param colorTolerance 색상 허용 오차
 */
function compareProperty(
  property: string,
  pencilValue: any,
  codeValue: any,
  tolerance: number,
  colorTolerance: number = 0
): boolean {
  // 색상 속성
  if (property === 'color' || property === 'backgroundColor') {
    if (typeof pencilValue === 'string' && typeof codeValue === 'string') {
      return colorsEqual(pencilValue, codeValue, colorTolerance);
    }
  }

  // 그 외 속성 (property 전달)
  return valuesEqual(pencilValue, codeValue, tolerance, property);
}

/**
 * 속성별 심각도 결정
 * @param property 속성명
 * @param options 비교 옵션
 */
function getSeverity(
  property: string,
  options: ComparisonOptions
): 'error' | 'warning' | 'info' {
  // 엄격 모드
  if (options.severity === 'strict') {
    return 'error';
  }

  // 관대 모드
  if (options.severity === 'lenient') {
    return 'info';
  }

  // 중요 속성은 error
  if (CRITICAL_PROPERTIES.includes(property)) {
    return 'error';
  }

  return 'warning';
}

/**
 * 스타일 차이 계산
 * @param pencilValue Pencil 값
 * @param codeValue 코드 값
 */
export function calculateDiff(pencilValue: any, codeValue: any): number | undefined {
  // 숫자 차이
  if (typeof pencilValue === 'number' && typeof codeValue === 'number') {
    return Math.abs(pencilValue - codeValue);
  }

  // 색상 차이
  if (typeof pencilValue === 'string' && typeof codeValue === 'string') {
    if (pencilValue.startsWith('#') && codeValue.startsWith('#')) {
      const rgb1 = hexToRgb(pencilValue);
      const rgb2 = hexToRgb(codeValue);

      if (rgb1 && rgb2) {
        return Math.sqrt(
          Math.pow(rgb1.r - rgb2.r, 2) +
          Math.pow(rgb1.g - rgb2.g, 2) +
          Math.pow(rgb1.b - rgb2.b, 2)
        );
      }
    }
  }

  return undefined;
}
