/**
 * 요소 비교
 *
 * 요소 단위 매칭 및 비교 로직
 */

import type { StandardElement, ComparisonOptions, ElementMatch } from '../types.js';
import { hexToRgb } from '../utils/color.js';

/**
 * 요소 단위 비교
 * @param pencil Pencil 요소
 * @param code 코드 요소
 * @param options 비교 옵션
 */
export function compareElements(
  pencil: StandardElement,
  code: StandardElement,
  options: ComparisonOptions = {}
): ElementMatch {
  const propertiesMatch: Record<string, boolean> = {};
  let matchCount = 0;
  let totalCount = 0;

  // 비교할 속성 목록 (content는 상위 속성, 나머지는 styles 내부)
  const propertiesToCompare = [
    'content',
    'fontSize',
    'fontWeight',
    'color',
    'backgroundColor',
    'padding',
    'gap',
    'borderRadius',
  ];

  const ignoreProps = new Set(options.ignoreProperties || []);

  for (const prop of propertiesToCompare) {
    if (ignoreProps.has(prop)) continue;

    // content는 상위 속성, 나머지는 styles 내부 속성
    let pencilValue: any;
    let codeValue: any;

    if (prop === 'content') {
      pencilValue = pencil.content;
      codeValue = code.content;
    } else {
      pencilValue = pencil.styles?.[prop];
      codeValue = code.styles?.[prop];
    }

    // 둘 다 undefined면 카운트에서 제외 (비교 불가능한 속성)
    if (pencilValue === undefined && codeValue === undefined) {
      continue;
    }

    totalCount++;

    const isMatch = compareProperty(
      prop,
      pencilValue,
      codeValue,
      options
    );

    propertiesMatch[prop] = isMatch;
    if (isMatch) matchCount++;
  }

  const confidence = totalCount > 0 ? matchCount / totalCount : 1;

  return {
    path: pencil.path,
    pencil,
    code,
    confidence,
    propertiesMatch,
  };
}

/**
 * 단일 속성 비교
 */
function compareProperty(
  property: string,
  pencilValue: any,
  codeValue: any,
  options: ComparisonOptions
): boolean {
  // 둘 다 undefined면 일치
  if (pencilValue === undefined && codeValue === undefined) {
    return true;
  }

  // 하나만 undefined면 불일치
  if (pencilValue === undefined || codeValue === undefined) {
    return false;
  }

  // 정확히 일치
  if (pencilValue === codeValue) {
    return true;
  }

  // 허용 오차 적용
  const tolerance = options.tolerance || 0;

  // 숫자 비교
  if (typeof pencilValue === 'number' && typeof codeValue === 'number') {
    return Math.abs(pencilValue - codeValue) <= tolerance;
  }

  // 색상 비교
  if (typeof pencilValue === 'string' && typeof codeValue === 'string') {
    // 색상인지 확인
    if (
      (property === 'color' || property === 'backgroundColor') &&
      pencilValue.startsWith('#') &&
      codeValue.startsWith('#')
    ) {
      // colorsEqual 함수 사용 (간소화 버전)
      const rgb1 = hexToRgb(pencilValue);
      const rgb2 = hexToRgb(codeValue);

      if (rgb1 && rgb2) {
        const distance = Math.sqrt(
          Math.pow(rgb1.r - rgb2.r, 2) +
          Math.pow(rgb1.g - rgb2.g, 2) +
          Math.pow(rgb1.b - rgb2.b, 2)
        );

        const colorTolerance = options.colorTolerance || 0;
        return distance <= colorTolerance;
      }
    }
  }

  return false;
}
