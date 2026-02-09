/**
 * 독립 컴포넌트 레지스트리 (Step 3: Independent Components)
 *
 * 독립 컴포넌트는 자체 TSX/CSS 파일을 가진 React 컴포넌트입니다.
 * 이들의 내부 구조는 검증하지 않고, props만 검증합니다.
 *
 * 등록된 독립 컴포넌트:
 * - SettingsDropdown: 설정 드롭다운 (SettingsDropdown.tsx)
 * - Modal: 모달 컴포넌트 (추가 예정)
 * - Tooltip: 툴팁 컴포넌트 (추가 예정)
 */

/**
 * 독립 컴포넌트 이름 매핑
 *
 * Pencil 디자인의 요소 이름이 코드의 독립 컴포넌트와 매핑됩니다.
 * 예: Pencil의 'settingsButton' → 코드의 'SettingsDropdown'
 */
export const INDEPENDENT_COMPONENT_MAPPING: Record<string, string> = {
  // Pencil 이름 → 코드 독립 컴포넌트 이름
  'settingsButton': 'SettingsDropdown',
  'settingsIndicator': 'SettingsDropdown',
  'settingsIndicatorContainer': 'SettingsDropdown',
  'headerActions': 'SettingsDropdown', // 래퍼 요소
  // 향후 추가 예정
  // 'modal': 'Modal',
  // 'tooltip': 'Tooltip',
};

/**
 * 독립 컴포넌트인지 확인
 */
export function isIndependentComponent(pencilName: string): boolean {
  return INDEPENDENT_COMPONENT_MAPPING[pencilName] !== undefined;
}

/**
 * Pencil 이름에 해당하는 독립 컴포넌트 코드 이름을 반환
 */
export function getIndependentComponentCodeName(pencilName: string): string | undefined {
  return INDEPENDENT_COMPONENT_MAPPING[pencilName];
}

/**
 * 모든 독립 컴포넌트 Pencil 이름 목록
 */
export const INDEPENDENT_COMPONENT_PENCIL_NAMES = Object.keys(
  INDEPENDENT_COMPONENT_MAPPING
);
