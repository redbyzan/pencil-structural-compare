/**
 * @pencil-structural/compare - Props Extractor
 *
 * TypeScript 코드에서 컴포넌트 Props 추출
 */

import { readFileSync } from 'fs';
import type { ComponentProp } from './types.js';

/**
 * TSX 파일에서 Props 인터페이스 추출
 */
export async function extractComponentProps(
  tsxPath: string,
  componentName: string
): Promise<ComponentProp[]> {
  const content = readFileSync(tsxPath, 'utf-8');

  // Babel 파서 동적 로드
  const { parse } = await import('@babel/parser');
  const t = await import('@babel/types');

  // AST 파싱
  const ast = parse(content, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx']
  });

  const props: ComponentProp[] = [];

  // AST 순회하며 Props 인터페이스 찾기
  const { default: traverse } = await import('@babel/traverse');

  // @ts-ignore - traverse 타입 문제 무시
  traverse(ast, {
    // TypeScript 인터페이스 정의 찾기
    TSInterfaceDeclaration(path) {
      const interfaceName = path.node.id.name;

      // {ComponentName}Props 패턴 찾기
      if (interfaceName === `${componentName}Props`) {
        // 인터페이스 속성 추출
        path.node.body.body.forEach(property => {
          if (t.isTSPropertySignature(property)) {
            // 키 이름 추출 (Identifier 또는 StringLiteral)
            let propName: string | undefined;
            if (t.isIdentifier(property.key)) {
              propName = property.key.name;
            } else if (t.isStringLiteral(property.key)) {
              propName = property.key.value;
            }

            if (!propName) return;

            const propType = property.typeAnnotation
              ? getTypeString(property.typeAnnotation.typeAnnotation)
              : 'any';
            const required = !property.optional;

            props.push({
              name: propName,
              type: propType,
              required,
              description: extractJSDoc(property.leadingComments)
            });
          }
        });
      }
    }
  });

  return props;
}

/**
 * 타입 노드를 문자열로 변환
 */
function getTypeString(typeNode: any): string {
  const t = require('@babel/types');

  if (t.isTSStringKeyword(typeNode)) return 'string';
  if (t.isTSNumberKeyword(typeNode)) return 'number';
  if (t.isTSBooleanKeyword(typeNode)) return 'boolean';
  if (t.isTSVoidKeyword(typeNode)) return 'void';
  if (t.isTSAnyKeyword(typeNode)) return 'any';
  if (t.isTSUnknownKeyword(typeNode)) return 'unknown';

  if (t.isTSLiteralType(typeNode)) {
    return JSON.stringify(typeNode.literal.value);
  }

  if (t.isTSUnionType(typeNode)) {
    return typeNode.types.map(getTypeString).join(' | ');
  }

  if (t.isTSArrayType(typeNode)) {
    return `${getTypeString(typeNode.elementType)}[]`;
  }

  if (t.isTSTypeReference(typeNode)) {
    return typeNode.typeName.name;
  }

  return 'unknown';
}

/**
 * JSDoc 주석 추출
 */
function extractJSDoc(comments: any): string | undefined {
  if (!comments || comments.length === 0) return undefined;

  return comments
    .map((c: any) => c.value.trim())
    .filter(Boolean)
    .join('\n');
}

/**
 * Props가 사용 가능한지 검증
 */
export function validatePropsUsage(
  tsxPath: string,
  props: ComponentProp[]
): { valid: boolean; unused: string[]; missing: string[] } {
  const content = readFileSync(tsxPath, 'utf-8');
  const unused: string[] = [];
  const missing: string[] = [];

  // Props 사용 여부 확인
  for (const prop of props) {
    const regex = new RegExp(`\\bprops\\.${prop.name}\\b`);
    const destructuredRegex = new RegExp(`\\b${prop.name}\\b`);

    if (!regex.test(content) && !destructuredRegex.test(content)) {
      unused.push(prop.name);
    }
  }

  return {
    valid: unused.length === 0 && missing.length === 0,
    unused,
    missing
  };
}
