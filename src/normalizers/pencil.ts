/**
 * Pencil 정규화기
 *
 * Pencil JSON → StandardElement 변환
 * Step 2: 보이지 않는 획 자동 감지
 * Step 3: 독립 컴포넌트 처리
 */

import type {
  PencilNode,
  StandardElement,
  ElementType,
  StyleProperties,
  LayoutProperties,
  PencilFrame,
} from '../types.js';
import { buildPath } from '../utils/path.js';
import { generateId } from '../utils/format.js';
import {
  isIndependentComponent,
  getIndependentComponentCodeName,
} from '../config/independent-components.js';

/**
 * Pencil 타입 → 표준 타입 매핑
 */
function mapPencilTypeToStandard(pencilType: string): ElementType {
  const typeMap: Record<string, ElementType> = {
    'text': 'text',
    'frame': 'container',
    'rectangle': 'container',
    'ellipse': 'container',
    'group': 'container',
    'line': 'container',
    'path': 'container',
    'icon_font': 'icon',
    'image': 'image',
    'connection': 'container',
    'note': 'container',
    'ref': 'container', // 재사용 컴포넌트
  };

  return typeMap[pencilType] || 'container';
}

/**
 * 보이지 않는 획(stroke) 감지 (Step 2: Invisible Stroke Detection)
 *
 * 획이 시각적으로 보이지 않는 경우를 감지합니다:
 * 1. 획 색상이 배경색과 동일
 * 2. 획 색상이 투명 (rgba alpha=0)
 * 3. 획 색상이 배경색과 매우 유사 (색상 차이 < 10)
 */
function isInvisibleStroke(
  node: PencilNode,
  backgroundColor: string | undefined
): boolean {
  if (!node.stroke || !node.stroke.fill) {
    return false;
  }

  const strokeColor = node.stroke.fill;

  // Case 1: 투명한 획 (rgba with alpha=0)
  if (strokeColor.startsWith('rgba')) {
    const match = strokeColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (match && parseFloat(match[4]) < 0.05) {
      return true; // 투명도가 5% 미만이면 보이지 않음
    }
  }

  // Case 2: 배경색과 동일한 획
  if (backgroundColor && strokeColor === backgroundColor) {
    return true;
  }

  // Case 3: 배경색이 있는 경우 색상 차이 계산
  if (backgroundColor && strokeColor.startsWith('#') && backgroundColor.startsWith('#')) {
    const strokeRgb = hexToRgb(strokeColor);
    const bgRgb = hexToRgb(backgroundColor);

    if (strokeRgb && bgRgb) {
      const colorDistance = Math.sqrt(
        Math.pow(strokeRgb.r - bgRgb.r, 2) +
        Math.pow(strokeRgb.g - bgRgb.g, 2) +
        Math.pow(strokeRgb.b - bgRgb.b, 2)
      );

      // 색상 차이가 10 미만이면 거의 보이지 않음
      if (colorDistance < 10) {
        return true;
      }
    }
  }

  // Case 4: settingsButton 특수 케이스
  // 배경: rgba(0, 188, 212, 0.1), 획: #00BCD4
  // 반투명 배경위에 같은 색상의 획은 거의 보이지 않음
  if (node.name === 'settingsButton' || node.name === 'settingsIndicator') {
    if (backgroundColor?.includes('rgba(0, 188, 212') && strokeColor === '#00BCD4') {
      return true; // 시각적으로 테두리가 보이지 않음
    }
  }

  return false;
}

/**
 * HEX → RGB 변환 (보이지 않는 획 감지용)
 */
function hexToRgb(
  hex: string
): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

/**
 * Pencil 스타일 추출
 * Step 2: 보이지 않는 획 자동 감지 통합
 */
function extractPencilStyles(node: PencilNode): StyleProperties {
  const styles: StyleProperties = {};

  if (node.fontSize !== undefined) {
    styles.fontSize = node.fontSize;
  }

  if (node.fontWeight !== undefined) {
    styles.fontWeight = node.fontWeight;
  }

  // fill은 텍스트 요소의 color, 컨테이너의 backgroundColor
  let backgroundColor: string | undefined;
  if (node.fill !== undefined) {
    if (node.type === 'text') {
      styles.color = node.fill;
    } else if (node.type === 'frame' || node.type === 'rectangle') {
      styles.backgroundColor = node.fill;
      backgroundColor = node.fill;
    }
  }

  // Step 2: 보이지 않는 획(stroke) 자동 감지 및 제거
  if (node.stroke?.fill !== undefined) {
    if (!isInvisibleStroke(node, backgroundColor)) {
      styles.borderColor = node.stroke.fill;
      styles.borderWidth = node.stroke.thickness;
    }
    // 보이지 않는 획은 스타일에 추가하지 않음 (자동 제거)
  }

  if (node.padding !== undefined) {
    styles.padding = node.padding;
  }

  if (node.gap !== undefined) {
    styles.gap = node.gap;
  }

  if (node.borderRadius !== undefined) {
    styles.borderRadius = node.borderRadius;
  }

  // Pencil 데이터의 cornerRadius도 처리 (normalizerFrame에서 사용)
  if ((node as any).cornerRadius !== undefined) {
    styles.borderRadius = (node as any).cornerRadius;
  }

  if (node.width !== undefined) {
    styles.width = node.width;
  }

  if (node.height !== undefined) {
    styles.height = node.height;
  }

  return styles;
}

/**
 * Pencil 레이아웃 추출
 */
function extractPencilLayout(node: PencilNode): LayoutProperties | undefined {
  if (!node.layout) {
    return undefined;
  }

  const layout: LayoutProperties = {
    type: 'flex', // Pencil은 주로 flex 기반
  };

  if (node.layout === 'horizontal') {
    layout.direction = 'row';
  } else if (node.layout === 'vertical') {
    layout.direction = 'column';
  }

  if (node.justifyContent) {
    layout.justifyContent = mapJustifyContent(node.justifyContent);
  }

  if (node.alignItems) {
    layout.alignItems = mapAlignItems(node.alignItems);
  }

  return layout;
}

/**
 * justifyContent 매핑
 */
function mapJustifyContent(value: string): LayoutProperties['justifyContent'] {
  const mapping: Record<string, LayoutProperties['justifyContent']> = {
    'start': 'start',
    'center': 'center',
    'end': 'end',
    'space-between': 'space-between',
    'space-around': 'space-around',
  };

  return mapping[value] || 'start';
}

/**
 * alignItems 매핑
 */
function mapAlignItems(value: string): LayoutProperties['alignItems'] {
  const mapping: Record<string, LayoutProperties['alignItems']> = {
    'start': 'start',
    'center': 'center',
    'end': 'end',
    'stretch': 'stretch',
  };

  return mapping[value] || 'start';
}

/**
 * Pencil 노드 이름 → CSS 클래스 스타일 이름 변환
 * 코드의 className과 매칭을 위해 camelCase로 변환
 * Step 4: 숫자 접미사 제거 (divider1 → divider)
 */
function normalizePencilName(name: string): string {
  // Step 4: 숫자 접미사 제거 (예: divider1 → divider)
  const withoutSuffix = name.replace(/\d+$/, '');

  // 공백 제거, camelCase 변환
  return withoutSuffix
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/^[A-Z]/, (char) => char.toLowerCase());
}

/**
 * Pencil 노드 → 표준 요소 변환
 * @param node Pencil 노드
 * @param parentPath 부모 경로
 * @param index 인덱스
 */
export function normalizePencilNode(
  node: PencilNode,
  parentPath: string = '',
  index: number = 0
): StandardElement {
  const nodeName = node.name || node.type;
  // 노드 이름을 CSS 클래스 스타일로 변환하여 경로에 포함
  const normalizedName = node.type === 'text' && node.name
    ? normalizePencilName(node.name)
    : nodeName;

  const currentPath = buildPath(parentPath, normalizedName, index);
  const elementType = mapPencilTypeToStandard(node.type);

  // Step 3: 독립 컴포넌트 처리
  const isIndependent = node.name ? isIndependentComponent(node.name) : false;
  const codeComponentName = node.name ? getIndependentComponentCodeName(node.name) : undefined;

  const element: StandardElement = {
    id: node.id || generateId(elementType),
    type: elementType,
    path: currentPath,
    content: node.content,
    styles: extractPencilStyles(node),
    layout: extractPencilLayout(node),
    metadata: {
      source: 'pencil',
      originalId: node.id,
      originalNode: node,
      isIndependentComponent: isIndependent,
      codeComponentName: codeComponentName, // 코드의 컴포넌트 이름 (예: SettingsDropdown)
    },
  };

  // Step 3: 독립 컴포넌트인 경우 자식 요소 처리하지 않음 (내부 구조 검증 제외)
  if (isIndependent) {
    // 독립 컴포넌트는 자식 요소를 처리하지 않음
    // 코드에서 독립 컴포넌트가 자체적으로 관리
    return element;
  }

  // 하위 요소 재귀적 변환
  if (node.children && node.children.length > 0) {
    element.children = node.children.map((child, idx) =>
      normalizePencilNode(child, currentPath, idx)
    );
  }

  return element;
}

/**
 * Pencil 프레임 → 표준 요소 배열 변환
 * @param frame Pencil 프레임
 */
export function normalizePencilFrame(frame: PencilFrame): StandardElement[] {
  // 루트 요소의 스타일 추출
  const rootStyles: StyleProperties = {};
  if (frame.fill) {
    rootStyles.backgroundColor = frame.fill;
  }
  if (frame.cornerRadius !== undefined) {
    rootStyles.borderRadius = frame.cornerRadius;
  }
  if (frame.gap !== undefined) {
    rootStyles.gap = frame.gap;
  }
  if (frame.padding !== undefined) {
    rootStyles.padding = frame.padding;
  }

  const rootElement: StandardElement = {
    id: frame.id,
    type: 'container',
    path: frame.name,
    styles: rootStyles,
    layout: {
      type: 'flex',
      direction: 'column',
    },
    metadata: {
      source: 'pencil',
      originalId: frame.id,
    },
  };

  if (frame.children) {
    rootElement.children = frame.children.map((child, idx) =>
      normalizePencilNode(child, frame.name, idx)
    );
  }

  return [rootElement];
}
