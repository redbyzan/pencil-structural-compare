/**
 * Markdown 리포터
 */

import type { ComparisonResult } from '../types.js';

/**
 * Markdown 리포트 생성
 * @param result 비교 결과
 */
export function reportToMarkdown(result: ComparisonResult): string {
  const lines: string[] = [];

  lines.push('# Pencil ' + String.fromCharCode(8596) + ' 코드 구조적 비교 리포트\n');
  lines.push('생성일시: ' + new Date().toLocaleString('ko-KR') + '\n');
  lines.push('> 구조적 데이터 기반 비교로 Pencil 디자인과 코드의 일치성을 검증합니다.\n');

  // 화면 정보
  lines.push('## 대상 화면');
  lines.push('');
  lines.push('- **이름**: ' + result.meta.screen.name);
  lines.push('- **Frame ID**: "' + result.meta.screen.frameId + '"');
  lines.push('- **TSX**: "' + result.meta.sources.tsx + '"');
  lines.push('- **CSS**: "' + result.meta.sources.css + '"');
  lines.push('');

  // 요약
  lines.push('## 요약');
  lines.push('');
  lines.push('| 항목 | 개수 |');
  lines.push('|------|------|');
  lines.push('| [O] 일치 | ' + result.summary.matchedElements + ' |');
  lines.push('| [X] 누락 | ' + result.summary.missingElements + ' |');
  lines.push('| [!] 추가 | ' + result.summary.extraElements + ' |');
  lines.push('| [#] 스타일 차이 | ' + result.summary.styleDiffs + ' |');
  lines.push('| [%] 일치율 | ' + result.summary.matchRate.toFixed(1) + '% |');
  lines.push('| [*] 상태 | ' + getStatusText(result.summary.status) + ' |');
  lines.push('');

  // 세부 사항
  if (result.missingInCode.length > 0) {
    lines.push('## [X] 코드에 누락된 요소');
    lines.push('');
    for (const diff of result.missingInCode) {
      lines.push('### ' + diff.path);
      lines.push('- **이유**: ' + diff.reason);
      if (diff.suggestion) {
        lines.push('- **제안**: ' + diff.suggestion);
      }
      lines.push('');
    }
    lines.push('');
  }

  if (result.extraInCode.length > 0) {
    lines.push('## [!] 코드에 추가된 요소');
    lines.push('');
    for (const diff of result.extraInCode) {
      lines.push('### ' + diff.path);
      lines.push('- **이유**: ' + diff.reason);
      lines.push('');
    }
    lines.push('');
  }

  if (result.styleDiffs.length > 0) {
    lines.push('## [#] 스타일 차이');
    lines.push('');
    lines.push('| 경로 | 속성 | Pencil | 코드 |');
    lines.push('|------|------|--------|------|');
    for (const diff of result.styleDiffs.slice(0, 20)) {
      const pencilVal = formatValue(diff.pencilValue);
      const codeVal = formatValue(diff.codeValue);
      lines.push('| ' + diff.path + ' | ' + diff.property + ' | ' + pencilVal + ' | ' + codeVal + ' |');
    }
    if (result.styleDiffs.length > 20) {
      lines.push('| ... | ... | ... | ... | (외 ' + (result.styleDiffs.length - 20) + '개)');
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('\n*이 리포트는 구조적 비교 시스템에 의해 자동 생성되었습니다.*');

  return lines.join('\n');
}

/**
 * 상태 텍스트
 */
function getStatusText(status: string): string {
  switch (status) {
    case 'pass':
      return ':white_check_mark: 통과';
    case 'warning':
      return ':warning: 경고';
    case 'fail':
      return ':x: 실패';
    default:
      return ':question: 알 수 없음';
  }
}

/**
 * 값 포맷팅
 */
function formatValue(value: any): string {
  if (value === undefined) return '(undefined)';
  if (value === null) return '(null)';
  if (typeof value === 'string') return '`' + value + '`';
  return String(value);
}
