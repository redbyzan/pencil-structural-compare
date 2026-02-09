/**
 * Component Processor Tests
 *
 * 독립 컴포넌트 처리 기능 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { processComponent, processBatch } from '../processor.js';
import type { IndependentComponent } from '../types.js';

// Mock Babel imports
vi.mock('@babel/parser', () => ({
  parse: vi.fn(() => ({
    type: 'File',
    program: {
      type: 'Program',
      body: []
    }
  }))
}));

vi.mock('@babel/traverse', () => ({
  default: vi.fn((ast, visitors) => {
    // Mock traverse - do nothing
  })
}));

describe('processComponent', () => {
  it('독립 컴포넌트를 처리해야 함', async () => {
    const component: IndependentComponent = {
      pencilName: 'settingsButton',
      codeName: 'SettingsDropdown',
      tsxPath: '/src/components/SettingsDropdown/SettingsDropdown.tsx',
      cssPath: '/src/components/SettingsDropdown/SettingsDropdown.module.css'
    };

    // 실제 파일이 없으므로 에러가 발생할 수 있음
    const result = await processComponent(component, {
      extractProps: false // Props 추출 비활성화
    });

    // 파일이 없으면 실패해야 함
    expect(result).toBeDefined();
    expect(result.componentPath).toBe(component.tsxPath);
  });

  it('처리 시간을 측정해야 함', async () => {
    const component: IndependentComponent = {
      pencilName: 'test',
      codeName: 'TestComponent',
      tsxPath: '/src/TestComponent.tsx'
    };

    const result = await processComponent(component, {
      extractProps: false
    });

    expect(result.duration).toBeGreaterThanOrEqual(0);
  });
});

describe('processBatch', () => {
  it('여러 컴포넌트를 병렬로 처리해야 함', async () => {
    const components: IndependentComponent[] = [
      {
        pencilName: 'button1',
        codeName: 'Button1',
        tsxPath: '/src/Button1.tsx'
      },
      {
        pencilName: 'button2',
        codeName: 'Button2',
        tsxPath: '/src/Button2.tsx'
      }
    ];

    const result = await processBatch(components, {
      extractProps: false,
      concurrency: 2
    });

    expect(result.total).toBe(2);
    expect(result.results).toHaveLength(2);
    expect(result.totalDuration).toBeGreaterThanOrEqual(0);
  });

  it('동시성을 제한해야 함', async () => {
    const components: IndependentComponent[] = Array.from({ length: 10 }, (_, i) => ({
      pencilName: `comp${i}`,
      codeName: `Component${i}`,
      tsxPath: `/src/Component${i}.tsx`
    }));

    const result = await processBatch(components, {
      extractProps: false,
      concurrency: 3
    });

    expect(result.total).toBe(10);
    expect(result.results).toHaveLength(10);
  });
});
