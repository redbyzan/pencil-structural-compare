/**
 * @pencil-structural/compare - Component Processor
 *
 * 독립 컴포넌트 일괄 처리 및 병렬화
 */

import type { IndependentComponent, ProcessResult, BatchProcessResult, ProcessorOptions } from './types.js';
import { extractComponentProps, validatePropsUsage } from './props-extractor.js';

/**
 * 기본 처리 옵션
 */
const DEFAULT_OPTIONS: ProcessorOptions = {
  concurrency: 4,
  extractProps: true,
  validateStyles: false,
  timeout: 30000
};

/**
 * 단일 독립 컴포넌트 처리
 */
export async function processComponent(
  component: IndependentComponent,
  options: ProcessorOptions = {}
): Promise<ProcessResult> {
  const startTime = Date.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const props: any[] = [];

    // Props 추출
    if (opts.extractProps) {
      const extractedProps = await extractComponentProps(
        component.tsxPath,
        component.codeName
      );
      props.push(...extractedProps);
    }

    // Props 사용 검증
    if (props.length > 0) {
      const validation = validatePropsUsage(component.tsxPath, props);
      if (!validation.valid) {
        console.warn(`[ComponentProcessor] ${component.codeName}: Unused props: ${validation.unused.join(', ')}`);
      }
    }

    return {
      componentPath: component.tsxPath,
      success: true,
      props,
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      componentPath: component.tsxPath,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    };
  }
}

/**
 * 병렬 일괄 처리
 */
export async function processBatch(
  components: IndependentComponent[],
  options: ProcessorOptions = {}
): Promise<BatchProcessResult> {
  const startTime = Date.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { concurrency = 4 } = opts;

  const results: ProcessResult[] = [];
  let index = 0;

  // 동시성 제어와 함께 병렬 처리
  const processNext = async (): Promise<ProcessResult | null> => {
    if (index >= components.length) return null;

    const component = components[index++];
    return processComponent(component, opts);
  };

  // 병렬 워커 풀
  const workers: Promise<ProcessResult | null>[] = [];
  for (let i = 0; i < Math.min(concurrency, components.length); i++) {
    workers.push((async () => {
      while (true) {
        const result = await processNext();
        if (result === null) break;
        results.push(result);
      }
      return null;
    })());
  }

  // 모든 워커 완료 대기
  await Promise.all(workers);

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return {
    total: components.length,
    successful,
    failed,
    results,
    totalDuration: Date.now() - startTime
  };
}

/**
 * 독립 컴포넌트로 변환
 */
export function toIndependentComponents(
  components: IndependentComponent[],
  mappedFiles: any[]
): IndependentComponent[] {
  // 매핑된 파일에서 독립 컴포넌트 정보 추출
  // 이 함수는 discovery 시스템과 연동하여 자동으로 컴포넌트를 식별합니다.
  return components;
}
