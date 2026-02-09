/**
 * 값 변환 및 포맷팅 유틸리티
 */

/**
 * kebab-case를 camelCase로 변환
 * @param str kebab-case 문자열
 */
export function camelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

/**
 * camelCase를 kebab-case로 변환
 * @param str camelCase 문자열
 */
export function kebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, (_, g1, g2) => `${g1}-${g2.toLowerCase()}`);
}

/**
 * CSS 값을 자바스크립트 값으로 변환
 * @param value CSS 값
 */
export function convertCSSValue(value: string): any {
  // 숫자 값 추출 (px, rem, em, % 등)
  const numMatch = value.match(/^([\d.]+)(px|rem|em|%)?$/);
  if (numMatch) {
    const num = parseFloat(numMatch[1]);
    const unit = numMatch[2];

    // px 단위는 숫자로 변환
    if (!unit || unit === 'px') {
      return num;
    }

    // 나머지 단위는 문자열 유지
    return value;
  }

  return value;
}

/**
 * 숫자를 px 단위 문자열로 변환
 * @param num 숫자 값
 */
export function toPx(num: number): string {
  return `${num}px`;
}

/**
 * 값을 정규화 (공통 형식으로 변환)
 * @param value 변환할 값
 * @param type 값 타입
 */
export function normalizeValue(value: any, type: string): any {
  if (value === null || value === undefined) {
    return undefined;
  }

  switch (type) {
    case 'number':
      return typeof value === 'number' ? value : parseFloat(value) || 0;

    case 'string':
      return String(value);

    case 'color':
      // 색상값 정규화 (#RGB → #RRGGBB)
      if (typeof value === 'string' && /^#?[a-f\d]{3}$/i.test(value)) {
        const hex = value.replace('#', '');
        return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
      }
      return value;

    default:
      return value;
  }
}

/**
 * 값이 동등한지 확인 (허용 오차 포함)
 * @param val1 첫 번째 값
 * @param val2 두 번째 값
 * @param tolerance 허용 오차
 * @param property 속성명 (특수 처리용)
 */
export function valuesEqual(
  val1: any,
  val2: any,
  tolerance: number = 0,
  property?: string
): boolean {
  // 둘 다 undefined/null이면 일치
  if (val1 === undefined || val1 === null) {
    return val2 === undefined || val2 === null;
  }
  if (val2 === undefined || val2 === null) {
    return false;
  }

  // 정확히 일치
  if (val1 === val2) {
    return true;
  }

  // fontWeight 특수 처리: 문자열 vs 숫자
  if (property === 'fontWeight') {
    // "normal" → 400 변환
    const norm1 = val1 === 'normal' ? 400 : val1;
    const norm2 = val2 === 'normal' ? 400 : val2;

    const num1 = typeof norm1 === 'string' ? parseInt(norm1, 10) : norm1;
    const num2 = typeof norm2 === 'string' ? parseInt(norm2, 10) : norm2;

    if (!isNaN(num1) && !isNaN(num2)) {
      return num1 === num2;
    }
  }

  // 숫자 비교 (허용 오차)
  if (typeof val1 === 'number' && typeof val2 === 'number') {
    return Math.abs(val1 - val2) <= tolerance;
  }

  // 문자열 비교 (대소문자 구분 없이)
  if (typeof val1 === 'string' && typeof val2 === 'string') {
    return val1.toLowerCase() === val2.toLowerCase();
  }

  return false;
}

/**
 * 색상 동등성 비교 (별도 함수)
 * 이 함수는 color.ts의 colorsEqual을 참조합니다.
 */
export { colorsEqual } from './color.js';

/**
 * 고유 ID 생성
 * @param prefix 접두사
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 값이 비어있는지 확인
 * @param val 확인할 값
 */
export function isEmpty(val: any): boolean {
  if (val === null || val === undefined) {
    return true;
  }

  if (typeof val === 'string') {
    return val.trim().length === 0;
  }

  if (Array.isArray(val)) {
    return val.length === 0;
  }

  if (typeof val === 'object') {
    return Object.keys(val).length === 0;
  }

  return false;
}

/**
 * 깊은 복사
 * @param obj 복사할 객체
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as any;
  }

  const cloned: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }

  return cloned;
}
