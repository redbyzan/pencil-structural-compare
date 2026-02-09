/**
 * 요소 이름 매핑 시스템 (Step 4: Name Mapping)
 *
 * Pencil 디자인의 요소 이름과 코드의 요소 이름 사이의 매핑을 관리합니다.
 *
 * 문제:
 * - Pencil: `settingsButton`, `divider1`, `chatLabel`
 * - 코드: `SettingsDropdown`, `divider`, `sectionLabel`
 *
 * 해결:
 * - 이름 매핑 테이블을 사용하여 서로 다른 이름을 매칭
 */

/**
 * Pencil 이름 → 코드 이름 매핑
 */
export const PENCIL_TO_CODE_NAME: Record<string, string> = {
  // 설정 관련
  'settingsButton': 'SettingsDropdown',
  'settingsIndicator': 'SettingsDropdown',
  'settingsIndicatorContainer': 'SettingsDropdown',

  // 구분선 (숫자 접미사 자동 처리됨)
  // 'divider1': 'divider',  // stripNumericSuffix로 자동 처리
  // 'divider2': 'divider',

  // 환영 메시지
  'welcomeMsg': 'welcomeMessage',

  // 향후 추가 예정
  // 'sectionLabel': 'sectionLabel', // 동일 이름
};

/**
 * 코드 이름 → Pencil 이름 매핑 (역방향)
 */
export const CODE_TO_PENCIL_NAME: Record<string, string> = Object.entries(
  PENCIL_TO_CODE_NAME
).reduce((acc, [pencil, code]) => {
  acc[code] = pencil;
  return acc;
}, {} as Record<string, string>);

/**
 * 추가 코드 → Pencil 이름 매핑 (CSS 클래스명 기반)
 * 코드 정규화기는 CSS 클래스명을 사용하여 경로를 생성하므로,
 * 코드의 CSS 클래스명을 Pencil 요소 이름으로 매핑
 */
export const CODE_CLASS_TO_PENCIL_NAME: Record<string, string> = {
  // 환영 메시지
  'welcomeMessage': 'welcomeMsg',
  // 향후 추가 예정
};

/**
 * Pencil 이름에 해당하는 코드 이름을 반환
 */
export function mapPencilNameToCode(pencilName: string): string {
  return PENCIL_TO_CODE_NAME[pencilName] || pencilName;
}

/**
 * 코드 이름에 해당하는 Pencil 이름을 반환
 */
export function mapCodeNameToPencil(codeName: string): string {
  return CODE_TO_PENCIL_NAME[codeName] || codeName;
}

/**
 * 두 이름이 매핑 관계에 있는지 확인 (동등성)
 */
export function areNamesEquivalent(pencilName: string, codeName: string): boolean {
  // 1. 정확히 일치
  if (pencilName === codeName) {
    return true;
  }

  // 2. 매핑 테이블 확인
  const mappedCodeName = mapPencilNameToCode(pencilName);
  if (mappedCodeName === codeName) {
    return true;
  }

  // 3. 역방향 매핑 확인
  const mappedPencilName = mapCodeNameToPencil(codeName);
  if (mappedPencilName === pencilName) {
    return true;
  }

  return false;
}

/**
 * 접두사 기반 매칭 (예: `divider1`, `divider2` → `divider`)
 */
export function matchByPrefix(name: string, prefix: string): boolean {
  return name.startsWith(prefix) && name.length > prefix.length;
}

/**
 * 숫자 접미사 제거 (예: `divider1` → `divider`)
 */
export function stripNumericSuffix(name: string): string {
  return name.replace(/\d+$/, '');
}
