/**
 * 경로 생성 및 조작 유틸리티
 */

import type { StandardElement } from '../types.js';

/**
 * 경로 구분자
 */
const PATH_SEPARATOR = ' > ';

/**
 * 요소 경로 생성
 * @param parentPath 부모 경로
 * @param name 요소 이름
 * @param index 인덱스
 *
 * 참고: 최상위 요소(parentPath가 비어있을 때)는 인덱스 없이 이름만 사용
 * 코드 정규화기와 동일한 경로 형식을 사용하기 위함
 */
export function buildPath(
  parentPath: string,
  name: string,
  index: number = 0
): string {
  // 최상위 요소는 인덱스 없이 이름만 사용 (코드 정규화기와 일치)
  if (!parentPath) {
    return name;
  }
  return `${parentPath}${PATH_SEPARATOR}${name}[${index}]`;
}

/**
 * 경로에서 상위 경로 추출
 * @param path 전체 경로
 */
export function getParentPath(path: string): string {
  const lastSeparator = path.lastIndexOf(PATH_SEPARATOR);
  if (lastSeparator === -1) {
    return '';
  }
  return path.substring(0, lastSeparator);
}

/**
 * 경로에서 요소 이름 추출
 * @param path 전체 경로
 */
export function getNameFromPath(path: string): string {
  const lastSeparator = path.lastIndexOf(PATH_SEPARATOR);
  const lastBracket = path.lastIndexOf('[');

  const start = lastSeparator === -1 ? 0 : lastSeparator + PATH_SEPARATOR.length;
  const end = lastBracket === -1 ? path.length : lastBracket;

  return path.substring(start, end);
}

/**
 * 요소 트리를 경로 기반으로 인덱싱
 * @param elements 요소 배열
 */
export function indexByPath(
  elements: StandardElement[]
): Record<string, StandardElement> {
  const index: Record<string, StandardElement> = {};

  function addElement(el: StandardElement) {
    index[el.path] = el;
    el.children?.forEach(addElement);
  }

  elements.forEach(addElement);

  return index;
}

/**
 * 경로 깊이 계산
 * @param path 요소 경로
 */
export function getPathDepth(path: string): number {
  return path.split(PATH_SEPARATOR).length;
}

/**
 * 경로 정렬 (깊이 → 이름 순)
 */
export function sortPaths(paths: string[]): string[] {
  return paths.sort((a, b) => {
    const depthA = getPathDepth(a);
    const depthB = getPathDepth(b);

    if (depthA !== depthB) {
      return depthA - depthB;
    }

    return a.localeCompare(b);
  });
}

/**
 * 경로 패턴 매칭 (와일드카드 지원)
 * @param path 요소 경로
 * @param pattern 패턴 (예: "header > *")
 */
export function matchPathPattern(path: string, pattern: string): boolean {
  // 와일드카드 변환
  const regexPattern = pattern
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\*/g, '[^\\s>]+');

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}

/**
 * Step 4: 이름 매핑 기반 경로 일치성 확인
 *
 * Pencil 경로와 코드 경로가 이름 매핑을 고려하여 일치하는지 확인합니다.
 *
 * 예시:
 * - Pencil: `header > settingsButton[1]`
 * - 코드: `header > headerActions[1] > settingsIndicatorContainer[0] > SettingsDropdown[0]`
 * - 결과: true (settingsButton → SettingsDropdown 매핑)
 *
 * @param pencilPath Pencil 요소 경로
 * @param codePath 코드 요소 경로
 * @param nameMapping 이름 매핑 함수 (선택 사항)
 */
export function arePathsEquivalentByName(
  pencilPath: string,
  codePath: string,
  nameMapping?: (pencilName: string) => string
): boolean {
  // 1. 정확히 일치하면 true
  if (pencilPath === codePath) {
    return true;
  }

  // 2. 경로의 각 부분 분해
  const pencilParts = pencilPath.split(' > ');
  const codeParts = codePath.split(' > ');

  // 3. 루트 요소 이름 비교 (최상위 요소)
  const pencilRootName = extractName(pencilParts[0]);
  const codeRootName = extractName(codeParts[0]);

  if (pencilRootName !== codeRootName) {
    return false;
  }

  // 4. 마지막 요소 이름 추출 및 비교
  const pencilLastName = extractName(pencilParts[pencilParts.length - 1]);
  const codeLastName = extractName(codeParts[codeParts.length - 1]);

  // 5. 이름 매핑 적용 (제공된 경우)
  const mappedPencilName = nameMapping ? nameMapping(pencilLastName) : pencilLastName;

  // 6. 마지막 요소 이름이 일치하면 true (구조적 차이는 무시)
  if (mappedPencilName === codeLastName) {
    return true;
  }

  return false;
}

/**
 * 경로 부분에서 요소 이름 추출 (인덱스 제거)
 * 예: `settingsButton[1]` → `settingsButton`
 */
function extractName(pathPart: string): string {
  const bracketIndex = pathPart.indexOf('[');
  if (bracketIndex === -1) {
    return pathPart;
  }
  return pathPart.substring(0, bracketIndex);
}

/**
 * 경로에서 모든 요소 이름 추출
 * 예: `header > settingsButton[1]` → `['header', 'settingsButton']`
 */
export function extractAllNames(path: string): string[] {
  return path.split(' > ').map(extractName);
}
