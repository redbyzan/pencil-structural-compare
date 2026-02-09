/**
 * 구조적 비교 엔진
 *
 * 전체 비교 워크플로우 구현
 * Step 3: 독립 컴포넌트 처리 통합
 */

import type {
  StandardElement,
  ComparisonResult,
  ComparisonOptions,
  ElementMatch,
  ElementDiff,
  StyleDiff,
  ComparisonSummary,
} from '../types.js';
import { indexByPath, arePathsEquivalentByName } from '../utils/path.js';
import { compareElements } from './element.js';
import { compareStyles as compareStyleProps } from './style.js';
import {
  isIndependentComponent,
  getIndependentComponentCodeName,
} from '../config/independent-components.js';
import {
  areNamesEquivalent,
  stripNumericSuffix,
  mapPencilNameToCode,
} from '../config/name-mapping.js';

/**
 * 구조적 비교 메인 함수
 * @param pencilElements Pencil 요소 배열
 * @param codeElements 코드 요소 배열
 * @param options 비교 옵션
 */
export function compareStructures(
  pencilElements: StandardElement[],
  codeElements: StandardElement[],
  options: ComparisonOptions = {}
): ComparisonResult {
  const result: ComparisonResult = {
    meta: {
      timestamp: new Date().toISOString(),
      screen: {} as any,
      sources: {} as any,
      options,
    },
    matches: [],
    missingInCode: [],
    extraInCode: [],
    styleDiffs: [],
    summary: {
      totalElements: 0,
      matchedElements: 0,
      missingElements: 0,
      extraElements: 0,
      styleDiffs: 0,
      matchRate: 0,
      status: 'pass',
    },
  };

  // 1. 경로 기반 인덱싱
  const pencilByPath = indexByPath(pencilElements);
  const codeByPath = indexByPath(codeElements);

  // 2. 모든 경로 수집
  const allPaths = new Set([
    ...Object.keys(pencilByPath),
    ...Object.keys(codeByPath),
  ]);

  // 3. 콘텐츠 기반 인덱싱 (폴백용)
  const pencilByContent = indexByContent(pencilElements);
  const codeByContent = indexByContent(codeElements);

  // 4. 매칭된 요소 추적
  const matchedPencilIds = new Set<string>();
  const matchedCodeIds = new Set<string>();

  // 5. Step 4: 이름 매핑 기반 경로 매칭 (구조적 차이 허용)
  // Pencil 경로에 대해 코드에서 매칭 시도 (이름 매핑 고려)
  const pathMatches: Record<string, string> = {};
  for (const pencilPath of Object.keys(pencilByPath)) {
    const pencilEl = pencilByPath[pencilPath];

    // 정확한 경로 일치 확인
    if (codeByPath[pencilPath]) {
      pathMatches[pencilPath] = pencilPath;
      continue;
    }

    // 이름 매핑 기반 경로 일치 확인
    for (const codePath of Object.keys(codeByPath)) {
      if (arePathsEquivalentByName(pencilPath, codePath, mapPencilNameToCode)) {
        pathMatches[pencilPath] = codePath;
        break;
      }
    }
  }

  // 6. 경로별 비교
  for (const path of allPaths) {
    // Step 4: 이름 매핑 경로 확인
    const actualCodePath = pathMatches[path] || path;
    const pencilEl = pencilByPath[path];
    const codeEl = codeByPath[actualCodePath];

    // Pencil에만 있는 요소
    if (pencilEl && !codeEl) {
      // 콘텐츠 기반 폴백 매칭 시도
      if (pencilEl.content && pencilEl.content.trim()) {
        const contentMatch = findMatchByContent(pencilEl, codeByContent, matchedCodeIds);
        if (contentMatch) {
          // 경로는 다르지만 콘텐츠가 같은 요소 찾음
          result.matches.push({
            path: pencilEl.path,
            pencil: pencilEl,
            code: contentMatch,
            confidence: 0.7, // 콘텐츠 매칭은 낮은 확신도
            propertiesMatch: { content: true },
            metadata: { matchMethod: 'content' },
          });

          matchedPencilIds.add(pencilEl.id);
          matchedCodeIds.add(contentMatch.id);
          continue;
        }
      }

      result.missingInCode.push({
        path,
        element: pencilEl,
        type: 'missing',
        severity: 'error',
        reason: 'Pencil에 있지만 코드에 없음',
        suggestion: generateSuggestion(pencilEl),
      });
      continue;
    }

    // 코드에만 있는 요소
    if (codeEl && !pencilEl) {
      // 콘텐츠 기반 폴백 매칭 시도
      if (codeEl.content && codeEl.content.trim()) {
        const contentMatch = findMatchByContent(codeEl, pencilByContent, matchedPencilIds);
        if (contentMatch) {
          // 경로는 다르지만 콘텐츠가 같은 요소 찾음
          result.matches.push({
            path: codeEl.path,
            pencil: contentMatch,
            code: codeEl,
            confidence: 0.7,
            propertiesMatch: { content: true },
            metadata: { matchMethod: 'content' },
          });

          matchedPencilIds.add(contentMatch.id);
          matchedCodeIds.add(codeEl.id);
          continue;
        }
      }

      result.extraInCode.push({
        path,
        element: codeEl,
        type: 'extra',
        severity: options.severity === 'strict' ? 'error' : 'warning',
        reason: '코드에 있지만 Pencil에 없음',
      });
      continue;
    }

    // 양쪽에 모두 있는 요소
    if (pencilEl && codeEl) {
      const match = compareElements(pencilEl, codeEl, options);
      result.matches.push(match);

      // 속성 차이 확인
      const styleDiffs = compareStyleProps(pencilEl, codeEl, options, path);
      result.styleDiffs.push(...styleDiffs);

      matchedPencilIds.add(pencilEl.id);
      matchedCodeIds.add(codeEl.id);
    }
  }

  // 4. 요약 계산
  result.summary = calculateSummary(result, options);

  return result;
}

/**
 * 요약 계산
 */
function calculateSummary(
  result: ComparisonResult,
  options: ComparisonOptions
): ComparisonSummary {
  const totalElements =
    result.matches.length +
    result.missingInCode.length +
    result.extraInCode.length;

  const matchedElements = result.matches.filter(
    m => m.confidence >= 0.5  // 콘텐츠 매칭도 인정하도록 낮춤
  ).length;

  const missingElements = result.missingInCode.filter(
    d => d.severity === 'error'
  ).length;

  const extraElements = result.extraInCode.filter(
    d => d.severity === 'error'
  ).length;

  const styleDiffs = result.styleDiffs.filter(
    d => d.severity === 'error'
  ).length;

  const matchRate = totalElements > 0
    ? (matchedElements / totalElements) * 100
    : 100;

  let status: 'pass' | 'warning' | 'fail';
  if (missingElements > 0 || styleDiffs > 0) {
    status = 'fail';
  } else if (extraElements > 0) {
    // extra 요소가 error severity면 fail
    status = 'fail';
  } else if (result.extraInCode.length > 0) {
    // extra 요소가 warning severity면 warning
    status = 'warning';
  } else {
    status = 'pass';
  }

  return {
    totalElements,
    matchedElements,
    missingElements,
    extraElements,
    styleDiffs,
    matchRate,
    status,
  };
}

/**
 * 수정 제안 생성
 */
function generateSuggestion(element: StandardElement): string {
  const parts: string[] = [];

  if (element.content) {
    parts.push(`"${element.content}"`);
  }

  if (element.type === 'text') {
    parts.push(`텍스트 요소`);
  } else if (element.type === 'button') {
    parts.push(`버튼`);
  } else if (element.type === 'container') {
    parts.push(`컨테이너`);
  }

  return `추가: ${parts.join(' ')}`;
}

/**
 * 콘텐츠 기반 요소 인덱싱
 * @param elements 요소 배열
 */
function indexByContent(elements: StandardElement[]): Map<string, StandardElement[]> {
  const index = new Map<string, StandardElement[]>();

  function addElement(el: StandardElement) {
    if (el.content && el.content.trim()) {
      const key = el.content.trim().toLowerCase();
      if (!index.has(key)) {
        index.set(key, []);
      }
      index.get(key)!.push(el);
    }
    el.children?.forEach(addElement);
  }

  elements.forEach(addElement);

  return index;
}

/**
 * 콘텐츠 기반 요소 매칭
 * @param target 찾을 요소
 * @param contentIndex 콘텐츠 인덱스
 * @param matchedIds 이미 매칭된 요소 ID
 */
function findMatchByContent(
  target: StandardElement,
  contentIndex: Map<string, StandardElement[]>,
  matchedIds: Set<string>
): StandardElement | null {
  if (!target.content || !target.content.trim()) {
    return null;
  }

  const key = target.content.trim().toLowerCase();
  const candidates = contentIndex.get(key);

  if (!candidates || candidates.length === 0) {
    return null;
  }

  // 아직 매칭되지 않은 후보 찾기
  for (const candidate of candidates) {
    if (!matchedIds.has(candidate.id)) {
      // 타입도 같으면 우선 매칭
      if (candidate.type === target.type) {
        return candidate;
      }
    }
  }

  // 타입이 다른 경우 첫 번째 후보 반환
  for (const candidate of candidates) {
    if (!matchedIds.has(candidate.id)) {
      return candidate;
    }
  }

  return null;
}

/**
 * 요소 타입별 기본 속성
 */
const DEFAULT_ATTRIBUTES_BY_TYPE: Record<string, string[]> = {
  text: ['content', 'fontSize', 'fontWeight', 'color'],
  button: ['content', 'backgroundColor', 'padding', 'borderRadius'],
  container: ['padding', 'gap', 'backgroundColor'],
};

/**
 * 요소 생성을 위한 템플릿 제안
 */
export function generateElementTemplate(element: StandardElement): string {
  const type = element.type;

  switch (type) {
    case 'text':
      return `<span style="${getStyleString(element.styles)}">${element.content || 'Text'}</span>`;

    case 'button':
      return `<button style="${getStyleString(element.styles)}">${element.content || 'Button'}</button>`;

    case 'container':
      return `<div style="${getStyleString(element.styles)}">...</div>`;

    default:
      return `<!-- ${type} element -->`;
  }
}

/**
 * 스타일 속성을 CSS 문자열로 변환
 */
function getStyleString(styles: any): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(styles)) {
    if (value !== undefined) {
      parts.push(`${key}: ${value};`);
    }
  }

  return parts.join(' ');
}

/**
 * 차이점 보고 생성 (사람이 읽기 쉬운 형식)
 */
export function formatStyleDiff(diff: StyleDiff): string {
  const pencilStr = formatValue(diff.pencilValue);
  const codeStr = formatValue(diff.codeValue);
  const diffValue = diff.diff !== undefined ? ` (차이: ${diff.diff.toFixed(2)})` : '';

  return `${diff.path} → ${diff.property}: ${pencilStr} vs ${codeStr}${diffValue}`;
}

/**
 * 값을 표시용 문자열로 변환
 */
function formatValue(value: any): string {
  if (value === undefined) return '(undefined)';
  if (value === null) return '(null)';
  if (typeof value === 'string') return `"${value}"`;
  return String(value);
}
