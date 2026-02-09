/**
 * JSON 리포터
 *
 * CI/CD 연동을 위한 JSON 출력
 */

import type { ComparisonResult } from '../types.js';

/**
 * JSON 결과 생성
 * @param result 비교 결과
 */
export function reportToJSON(result: ComparisonResult): string {
  return JSON.stringify(result, null, 2);
}

/**
 * 최소화 JSON 결과 생성
 * @param result 비교 결과
 */
export function reportToMinifiedJSON(result: ComparisonResult): string {
  return JSON.stringify(result);
}

/**
 * CI/CD용 요약 JSON 생성
 * @param result 비교 결과
 */
export function reportToCISummary(result: ComparisonResult): CISummary {
  return {
    status: result.summary.status,
    matchRate: result.summary.matchRate,
    missingCount: result.summary.missingElements,
    extraCount: result.summary.extraElements,
    styleDiffCount: result.summary.styleDiffs,
    timestamp: result.meta.timestamp,
  };
}

/**
 * CI 요약 인터페이스
 */
export interface CISummary {
  status: 'pass' | 'warning' | 'fail';
  matchRate: number;
  missingCount: number;
  extraCount: number;
  styleDiffCount: number;
  timestamp: string;
}
