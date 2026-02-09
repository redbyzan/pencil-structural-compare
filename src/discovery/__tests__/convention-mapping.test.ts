/**
 * Convention Mapping Tests
 *
 * 컨벤션 기반 Pencil-to-code 매핑 테스트
 */

import { describe, it, expect } from 'vitest';
import { findMatchingFiles, detectConvention } from '../convention-mapping.js';
import type { FileInfo } from '../types.js';

describe('findMatchingFiles', () => {
  const createFileInfo = (path: string, type: FileInfo['type']): FileInfo => {
    const filename = path.split('/').pop()!;
    // 확장자 제거 (모든 확장자 제거)
    const name = filename.replace(/\.[^/.]+$/, '');
    return {
      path,
      type,
      name,
      relativePath: path
    };
  };

  it('표준 컨벤션으로 매핑해야 함', () => {
    const files: FileInfo[] = [
      createFileInfo('docs/design/pencil/Home.pen', 'pencil'),
      createFileInfo('src/Home.tsx', 'tsx'),
      createFileInfo('src/Home.module.css', 'css'),
    ];

    const pencil = files[0];
    const match = findMatchingFiles(pencil, files, ['standard']);

    expect(match).toBeDefined();
    expect(match?.convention).toBe('standard');
    expect(match?.tsx.name).toBe('Home');
    expect(match?.css?.name).toBe('Home.module');
  });

  it('페이지 컨벤션으로 매핑해야 함', () => {
    const files: FileInfo[] = [
      createFileInfo('docs/design/pencil/Settings.pen', 'pencil'),
      createFileInfo('src/components/views/SettingsView.tsx', 'tsx'),
      createFileInfo('src/components/views/SettingsView.module.css', 'css'),
    ];

    const pencil = files[0];
    const match = findMatchingFiles(pencil, files, ['page']);

    expect(match).toBeDefined();
    expect(match?.convention).toBe('page');
    expect(match?.tsx.name).toBe('SettingsView');
  });

  it('독립 컴포넌트 컨벤션으로 매핑해야 함', () => {
    const files: FileInfo[] = [
      createFileInfo('docs/design/pencil/Widget.pen', 'pencil'),
      createFileInfo('src/components/Widget/Widget.tsx', 'tsx'),
      createFileInfo('src/components/Widget/Widget.module.css', 'css'),
    ];

    const pencil = files[0];
    const match = findMatchingFiles(pencil, files, ['independent']);

    expect(match).toBeDefined();
    expect(match?.convention).toBe('independent');
    expect(match?.tsx.name).toBe('Widget');
  });

  it('매칭되는 파일이 없으면 null을 반환해야 함', () => {
    const files: FileInfo[] = [
      createFileInfo('docs/design/pencil/Orphan.pen', 'pencil'),
      createFileInfo('src/Other.tsx', 'tsx'),
    ];

    const pencil = files[0];
    const match = findMatchingFiles(pencil, files, ['standard', 'page', 'independent']);

    expect(match).toBeNull();
  });
});

describe('detectConvention', () => {
  it('가장 많이 사용된 컨벤션을 감지해야 함', () => {
    const mapped = [
      { convention: 'standard' as const, pencil: {} as any, tsx: {} as any },
      { convention: 'standard' as const, pencil: {} as any, tsx: {} as any },
      { convention: 'page' as const, pencil: {} as any, tsx: {} as any },
    ];

    const detected = detectConvention(mapped);
    expect(detected).toBe('standard');
  });

  it('빈 배열이면 standard를 반환해야 함', () => {
    const detected = detectConvention([]);
    expect(detected).toBe('standard');
  });
});
