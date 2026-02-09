/**
 * 콘솔 출력 리포터
 */

import type { ComparisonResult } from '../types.js';

/**
 * 콘솔에 결과 출력
 * @param result 비교 결과
 */
export function reportToConsole(result: ComparisonResult): void {
  console.log('\n' + '[=] Pencil ' + String.fromCharCode(8596) + ' 코드 구조적 비교 결과\n');

  // 화면 정보
  console.log('화면: ' + result.meta.screen.name);
  console.log('Frame ID: ' + result.meta.screen.frameId);
  console.log('TSX: ' + result.meta.sources.tsx);
  console.log('CSS: ' + result.meta.sources.css);
  console.log('');

  // 요약
  console.log('━ 요약');
  console.log('  총 요소: ' + result.summary.totalElements + '개');
  console.log('  일치: ' + result.summary.matchedElements + '개 [O]');
  console.log('  누락: ' + result.summary.missingElements + '개 [X]');
  console.log('  추가: ' + result.summary.extraElements + '개 [!]');
  console.log('  스타일 차이: ' + result.summary.styleDiffs + '개');
  console.log('  일치율: ' + result.summary.matchRate.toFixed(1) + '%');
  console.log('  상태: ' + getStatusEmoji(result.summary.status) + ' ' + result.summary.status.toUpperCase());
  console.log('');

  // 일치하는 요소
  if (result.matches.length > 0) {
    console.log('━ 일치하는 요소');
    for (const match of result.matches.slice(0, 10)) {
      const confidence = (match.confidence * 100).toFixed(0);
      console.log('  [O] [' + match.path + '] ' + confidence + '% 일치');
    }
    if (result.matches.length > 10) {
      console.log('  ... 외 ' + (result.matches.length - 10) + '개');
    }
    console.log('');
  }

  // 누락된 요소
  if (result.missingInCode.length > 0) {
    console.log('━ 코드에 누락된 요소');
    for (const diff of result.missingInCode) {
      console.log('  [X] [' + diff.path + '] ' + diff.reason);
      if (diff.suggestion) {
        console.log('     [*] ' + diff.suggestion);
      }
    }
    console.log('');
  }

  // 추가된 요소
  if (result.extraInCode.length > 0) {
    console.log('━ 코드에 추가된 요소');
    for (const diff of result.extraInCode) {
      console.log('  [!] [' + diff.path + '] ' + diff.reason);
    }
    console.log('');
  }

  // 스타일 차이
  if (result.styleDiffs.length > 0) {
    console.log('━ 스타일 차이');
    for (const diff of result.styleDiffs.slice(0, 10)) {
      const emoji = diff.severity === 'error' ? '[X]' : '[!]';
      console.log('  ' + emoji + ' [' + diff.path + '] ' + diff.property + ': ' + diff.pencilValue + ' vs ' + diff.codeValue);
    }
    if (result.styleDiffs.length > 10) {
      console.log('  ... 외 ' + (result.styleDiffs.length - 10) + '개');
    }
    console.log('');
  }

  // 최종 상태
  console.log('━ 최종 상태');
  if (result.summary.status === 'pass') {
    console.log('  [O] 모든 검증 통과');
  } else if (result.summary.status === 'warning') {
    console.log('  [!] 경고 발생 (수신 권장)');
  } else {
    console.log('  [X] 검증 실패 (수정 필요)');
  }
}

/**
 * 상태 이모지
 */
function getStatusEmoji(status: string): string {
  switch (status) {
    case 'pass':
      return '[O]';
    case 'warning':
      return '[!]';
    case 'fail':
      return '[X]';
    default:
      return '[?]';
  }
}
