/**
 * File Discovery Tests
 *
 * 파일 검색 및 타입 감지 기능 테스트
 */

import { describe, it, expect } from 'vitest';
import { detectFileType, groupFilesByType } from '../file-discovery.js';
import type { FileInfo } from '../types.js';

describe('detectFileType', () => {
  it('Pencil 파일 타입을 감지해야 함', () => {
    expect(detectFileType('design/screen.pen')).toBe('pencil');
    expect(detectFileType('docs/pencil/demo.pen')).toBe('pencil');
  });

  it('TSX 파일 타입을 감지해야 함', () => {
    expect(detectFileType('src/App.tsx')).toBe('tsx');
    expect(detectFileType('src/components/Button.ts')).toBe('tsx');
  });

  it('CSS 파일 타입을 감지해야 함', () => {
    expect(detectFileType('src/styles.css')).toBe('css');
    expect(detectFileType('src/styles.module.css')).toBe('css');
    expect(detectFileType('src/styles.scss')).toBe('css');
    expect(detectFileType('src/styles.sass')).toBe('css');
  });

  it('알 수 없는 파일 타입을 반환해야 함', () => {
    expect(detectFileType('README.md')).toBe('unknown');
    expect(detectFileType('package.json')).toBe('unknown');
  });
});

describe('groupFilesByType', () => {
  it('파일을 타입별로 그룹화해야 함', () => {
    const files: FileInfo[] = [
      { path: '/a.pen', type: 'pencil', name: 'a', relativePath: 'a.pen' },
      { path: '/b.tsx', type: 'tsx', name: 'b', relativePath: 'b.tsx' },
      { path: '/c.css', type: 'css', name: 'c', relativePath: 'c.css' },
      { path: '/d.tsx', type: 'tsx', name: 'd', relativePath: 'd.tsx' },
    ];

    const grouped = groupFilesByType(files);

    expect(grouped.pencil).toHaveLength(1);
    expect(grouped.tsx).toHaveLength(2);
    expect(grouped.css).toHaveLength(1);
    expect(grouped.unknown).toHaveLength(0);
  });
});
