/**
 * 코드 AST 정규화기 (Babel Parser 기반)
 *
 * TSX/CSS 코드 → StandardElement 변환
 * Babel Parser를 사용하여 정확한 AST 파싱 수행
 * Step 3: 독립 컴포넌트 처리 통합
 *
 * NOTE: 이 모듈은 @babel/parser, @babel/traverse, @babel/types 의존성이 있습니다.
 * 선택적 기능으로 사용하려면 이 의존성들을 설치해야 합니다.
 */

import { parse } from '@babel/parser';
import * as t from '@babel/types';
import { createRequire } from 'module';

// Load @babel/traverse with proper CommonJS interop
const require = createRequire(import.meta.url);
const traverseModule = require('@babel/traverse');
const traverse = traverseModule.default || traverseModule;

import type {
  StandardElement,
  StyleProperties,
  ElementType,
  LayoutProperties,
} from '../types.js';
import type { StyleMap, ExtractionContext } from './types.js';
import { parseCSSModules } from './css-parser.js';
import { buildPath } from '../utils/path.js';
import { convertCSSValue, camelCase, generateId } from '../utils/format.js';
import {
  isIndependentComponent,
  getIndependentComponentCodeName,
} from '../config/independent-components.js';
import { CODE_CLASS_TO_PENCIL_NAME } from '../config/name-mapping.js';

/**
 * @babel/traverse 동적 import (ESM 호환)
 */
async function getTraverse() {
  const traverseModule = await import('@babel/traverse');
  return traverseModule.default;
}

/**
 * JSX 태그명 → 표준 타입 매핑
 */
const TAG_TYPE_MAP: Record<string, ElementType> = {
  'span': 'text',
  'p': 'text',
  'h1': 'text',
  'h2': 'text',
  'h3': 'text',
  'h4': 'text',
  'h5': 'text',
  'h6': 'text',
  'a': 'text',
  'strong': 'text',
  'em': 'text',
  'small': 'text',
  'div': 'container',
  'section': 'container',
  'article': 'container',
  'main': 'container',
  'header': 'container',
  'footer': 'container',
  'nav': 'container',
  'aside': 'container',
  'button': 'button',
  'input': 'input',
  'textarea': 'input',
  'select': 'input',
  'img': 'image',
  'svg': 'icon',
  'i': 'icon',
};

/**
 * JSXOpeningElement에서 태그명 추출
 */
function getTagName(openingElement: t.JSXOpeningElement): string {
  const name = openingElement.name;

  if (!name) return '';

  if (t.isJSXIdentifier(name)) {
    return name.name;
  }

  if (t.isJSXMemberExpression(name)) {
    // MemberExpression (예: styled.div)은 첫 부분만 사용
    if (t.isJSXIdentifier(name.object)) {
      return name.object.name;
    }
  }

  return '';
}

/**
 * Hook 콜백(useMemo, useCallback 등) 내부인지 확인
 * Hook 콜백 내부의 return 문은 컴포넌트의 최상위 return이 아님
 */
function isInsideHookCallback(path: any): boolean {
  let current = path;

  // 최대 5단계까지 상위 경로 확인
  for (let i = 0; i < 5; i++) {
    if (!current || !current.parent) return false;

    const parent = current.parent;
    const parentType = parent?.type;

    // CallExpression을 찾았으면, 그것이 Hook인지 확인
    if (parentType === 'CallExpression') {
      const callee = parent?.callee;
      if (callee && t.isIdentifier(callee)) {
        const name = callee.name;
        // Hook으로 시작하는 이름이면 true 반환
        return name.startsWith('use');
      }
    }

    // FunctionDeclaration, FunctionExpression, ArrowFunctionExpression을 찾으면
    // 그 안의 CallExpression을 확인해야 함 (계속 탐색)
    if (parentType === 'FunctionDeclaration' ||
        parentType === 'FunctionExpression' ||
        parentType === 'ArrowFunctionExpression') {
      // 이 함수의 부모를 확인하여 Hook 콜백인지 체크
      const parentPath = current.parentPath;
      if (parentPath && parentPath.parent) {
        const grandParent = parentPath.parent;
        const grandParentType = grandParent?.type;

        if (grandParentType === 'CallExpression') {
          const callee = grandParent?.callee;
          if (callee && t.isIdentifier(callee)) {
            const name = callee.name;
            return name.startsWith('use');
          }
        }
      }
      // 함수를 찾았지만 Hook 콜백이 아니면 컴포넌트 함수로 간주
      return false;
    }

    current = current.parentPath;
  }

  return false;
}
function mapTagToElementType(tagName: string): ElementType {
  return TAG_TYPE_MAP[tagName] || 'container';
}

/**
 * JSX 요소에서 텍스트 콘텐츠 추출
 */
function extractTextContent(node: t.JSXElement): string | undefined {
  const texts: string[] = [];

  function collectFromChild(child: any): void {
    if (t.isJSXText(child)) {
      const text = child.value?.trim();
      if (text) {
        texts.push(text);
      }
    } else if (t.isJSXExpressionContainer(child)) {
      const expression = child.expression;
      if (t.isStringLiteral(expression)) {
        texts.push(expression.value);
      } else if (t.isTemplateLiteral(expression)) {
        // 템플릿 리터럴 처리
        const parts = expression.quasis.map(q => q.value.cooked || '').join('');
        texts.push(parts.trim());
      }
    }
  }

  node.children?.forEach(collectFromChild);

  return texts.length > 0 ? texts.join(' ') : undefined;
}

/**
 * JSXOpeningElement에서 className 추출
 * 템플릿 리터럴, 조건부 표현식 등 복잡한 형태도 처리
 */
function extractClassNames(openingElement: t.JSXOpeningElement): string[] {
  const classNames: string[] = [];

  for (const attr of openingElement.attributes) {
    if (!t.isJSXAttribute(attr)) continue;

    if (t.isJSXIdentifier(attr.name) && attr.name.name === 'className') {
      if (t.isStringLiteral(attr.value)) {
        classNames.push(...attr.value.value.split(' ').filter(Boolean));
      } else if (t.isJSXExpressionContainer(attr.value)) {
        // 표현식에서 className 추출
        const expr = attr.value.expression;
        extractClassNamesFromExpression(expr, classNames);
      }
    }
  }

  return classNames;
}

/**
 * 표현식에서 className 추출 (재귀)
 */
function extractClassNamesFromExpression(expr: any, classNames: string[]): void {
  // 1. 단순 memberExpression: styles.xxx
  if (t.isMemberExpression(expr)) {
    if (t.isIdentifier(expr.property)) {
      classNames.push(expr.property.name);
    }
  }
  // 2. 템플릿 리터럴: `${styles.xxx} ${styles.yyy}`
  else if (t.isTemplateLiteral(expr)) {
    for (const elem of expr.expressions) {
      extractClassNamesFromExpression(elem, classNames);
    }
  }
  // 3. 논리식: test ? consequent : alternate
  else if (t.isLogicalExpression(expr)) {
    extractClassNamesFromExpression(expr.left, classNames);
    extractClassNamesFromExpression(expr.right, classNames);
  }
  // 4. 조건식: test ? consequent : alternate
  else if (t.isConditionalExpression(expr)) {
    extractClassNamesFromExpression(expr.consequent, classNames);
    extractClassNamesFromExpression(expr.alternate, classNames);
  }
  // 5. 이항 표현식: a + b
  else if (t.isBinaryExpression(expr)) {
    extractClassNamesFromExpression(expr.left, classNames);
    extractClassNamesFromExpression(expr.right, classNames);
  }
}

/**
 * JSXOpeningElement에서 스타일 속성 추출
 */
function extractStyleFromProps(
  openingElement: t.JSXOpeningElement,
  cssStyles: StyleMap
): StyleProperties {
  const styles: StyleProperties = {};

  for (const attr of openingElement.attributes) {
    if (!t.isJSXAttribute(attr)) continue;

    const attrName = t.isJSXIdentifier(attr.name) ? attr.name.name : undefined;

    // 1. className → CSS Modules 스타일 매핑
    if (attrName === 'className' && t.isJSXExpressionContainer(attr.value)) {
      const expr = attr.value.expression;
      if (t.isMemberExpression(expr) && t.isIdentifier(expr.property)) {
        const className = expr.property.name;
        const classStyles = cssStyles.get(className);
        if (classStyles) {
          Object.assign(styles, classStyles);
        }
      }
    }

    // 2. style prop (인라인 스타일)
    if (attrName === 'style' && t.isJSXExpressionContainer(attr.value)) {
      const expr = attr.value.expression;
      if (t.isObjectExpression(expr)) {
        for (const prop of expr.properties) {
          if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
            const key = prop.key.name;
            if (t.isStringLiteral(prop.value)) {
              styles[key] = convertCSSValue(prop.value.value);
            } else if (t.isNumericLiteral(prop.value)) {
              styles[key] = prop.value.value;
            }
          }
        }
      }
    }
  }

  return styles;
}

/**
 * JSXOpeningElement에서 레이아웃 속성 추출
 */
function extractLayoutProps(openingElement: t.JSXOpeningElement): LayoutProperties | undefined {
  const layout: LayoutProperties = {};

  for (const attr of openingElement.attributes) {
    if (!t.isJSXAttribute(attr)) continue;

    const attrName = t.isJSXIdentifier(attr.name) ? attr.name.name : undefined;

    // flexDirection 등의 Flexbox 속성
    if (attrName === 'flexDirection' && t.isStringLiteral(attr.value)) {
      layout.type = 'flex';
      layout.direction = attr.value.value === 'row' ? 'row' : 'column';
    }

    // justifyContent
    if (attrName === 'justifyContent' && t.isStringLiteral(attr.value)) {
      layout.justifyContent = attr.value.value as any;
    }

    // alignItems
    if (attrName === 'alignItems' && t.isStringLiteral(attr.value)) {
      layout.alignItems = attr.value.value as any;
    }
  }

  return Object.keys(layout).length > 0 ? layout : undefined;
}

/**
 * JSX 요소의 경로 생성 (CSS 클래스명 포함)
 * Pencil 경로 형식과 일치하도록 수정: name[index] 형식 사용
 * 최상위 요소는 인덱스 없이 이름만 사용 (Pencil과 일치)
 * 대소문자 변환: 최상위 요소는 PascalCase 유지 (HomeView)
 * Step 4: CSS 클래스명 → Pencil 요소명 매핑 통합
 */
function buildElementPath(
  tagName: string,
  classNames: string[],
  parentPath: string,
  index: number
): string {
  // CSS 클래스명에서 name 속성 추출 (예: homeView, header, title)
  const className = classNames.length > 0 ? classNames[0] : '';

  // Pencil 형식과 일치하도록 name[index] 형식 사용
  // CSS 클래스명이 있으면 그것을 이름으로 사용, 없으면 태그명 사용
  let name = className || tagName;

  // Step 4: CSS 클래스명 → Pencil 요소명 매핑
  // 코드의 CSS 클래스명을 Pencil 요소명으로 변환
  const mappedName = CODE_CLASS_TO_PENCIL_NAME[name] || name;
  name = mappedName;

  // 최상위 요소(parentPath가 비어있을 때)는 인덱스 없이 이름만 사용
  // 대소문자 변환: 첫 글자를 대문자로 변환 (homeView → HomeView)
  if (!parentPath) {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  return `${parentPath} > ${name}[${index}]`;
}

/**
 * JSX 요소 → StandardElement 변환 (재귀)
 * Step 3: 독립 컴포넌트 처리 - 자식 요소 검증 제외
 */
function extractJSXElement(
  node: t.JSXElement,
  context: ExtractionContext,
  childIndex: number = 0
): StandardElement | null {
  const openingElement = node.openingElement;

  const tagName = getTagName(openingElement);
  if (!tagName) return null;

  // 1. 텍스트 콘텐츠 추출
  const content = extractTextContent(node);

  // 2. 스타일 추출
  const styles = extractStyleFromProps(openingElement, context.cssStyles);

  // 3. 레이아웃 추출
  const layout = extractLayoutProps(openingElement);

  // 4. 현재 경로 생성 (CSS 클래스명 포함)
  const classNames = extractClassNames(openingElement);
  const currentPath = buildElementPath(
    tagName,
    classNames,
    context.currentPath,
    childIndex
  );

  // Step 3: 독립 컴포넌트 확인
  // 태그명(PascalCase)이 독립 컴포넌트 목록에 있는지 확인
  const isIndependent = isIndependentComponent(tagName);

  // 5. 하위 요소 추출 (node.children 직접 순회)
  // Step 3: 독립 컴포넌트인 경우 자식 요소 처리하지 않음 (내부 구조 검증 제외)
  const children: StandardElement[] = [];

  if (!isIndependent && node.children) {
    for (const child of node.children) {
      if (t.isJSXElement(child)) {
        const childElement = extractJSXElement(
          child,
          {
            ...context,
            currentPath,
            parentType: tagName,
          },
          children.length
        );
        if (childElement) {
          children.push(childElement);
        }
      }
    }
  }

  return {
    id: generateId(tagName),
    type: mapTagToElementType(tagName),
    path: currentPath,
    content: content,
    styles: styles,
    layout: layout,
    children: children.length > 0 ? children : undefined,
    metadata: {
      source: 'code',
      originalNode: node,
      isIndependentComponent: isIndependent,
      pencilComponentName: tagName, // 코드 컴포넌트명 (예: SettingsDropdown)
    },
  };
}

/**
 * TSX 코드 → 표준 요소 배열 변환 (AST 기반)
 *
 * @param tsxCode TSX 코드
 * @param cssCode CSS 코드
 * @returns 정규화된 요소 배열
 */
export async function normalizeCodeFile(
  tsxCode: string,
  cssCode: string
): Promise<StandardElement[]> {
  const elements: StandardElement[] = [];

  try {
    // 1. CSS 파싱
    const cssStyles = parseCSSModules(cssCode);

    // 2. AST 파싱
    const ast = parse(tsxCode, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });

    // 3. JSX 요소 추출
    const traverse = await getTraverse();
    traverse(ast, {
      // 최상위 JSXElement 방문 - 컴포넌트 함수의 return 문 내부만 처리
      JSXElement(path) {
        const parent = path.parent;
        const parentType = parent?.type;

        // ReturnStatement의 직접 자식인 경우만 처리
        if (parentType === 'ReturnStatement') {
          // Hook 콜백 내부인지 확인 (useMemo, useCallback 등)
          if (!isInsideHookCallback(path)) {
            const context: ExtractionContext = {
              cssStyles,
              currentPath: '',
              index: elements.length,
            };

            const element = extractJSXElement(path.node, context, elements.length);
            if (element) {
              elements.push(element);
            }
          }
        }
      },

      // JSXFragment는 제거 (조건부 렌더링 요소를 최상위로 추출하지 않음)
    });

  } catch (error) {
    console.error('AST 파싱 오류:', error);
    // 파싱 실패 시 빈 배열 반환
    return [];
  }

  return elements;
}

/**
 * AST 노드에서 컴포넌트 이름 추출
 */
export async function extractComponentName(ast: t.File): Promise<string | undefined> {
  let componentName: string | undefined;

  const traverse = await getTraverse();
  traverse(ast, {
    FunctionDeclaration(path) {
      if (path.node.id && t.isIdentifier(path.node.id)) {
        componentName = path.node.id.name;
      }
    },

    FunctionExpression(path) {
      const parent = path.parent;
      if (
        t.isVariableDeclarator(parent) &&
        t.isIdentifier(parent.id)
      ) {
        componentName = parent.id.name;
      }
    },

    ArrowFunctionExpression(path) {
      const parent = path.parent;
      if (
        t.isVariableDeclarator(parent) &&
        t.isIdentifier(parent.id)
      ) {
        componentName = parent.id.name;
      }
    },
  });

  return componentName;
}

/**
 * TSX 파일에서 export되는 컴포넌트 추출
 */
export async function extractExportedComponent(
  tsxCode: string,
  cssCode: string
): Promise<{ name?: string; elements: StandardElement[] }> {
  try {
    const ast = parse(tsxCode, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });

    const componentName = await extractComponentName(ast);
    const elements = await normalizeCodeFile(tsxCode, cssCode);

    return {
      name: componentName,
      elements,
    };
  } catch (error) {
    console.error('컴포넌트 추출 오류:', error);
    return {
      elements: [],
    };
  }
}
