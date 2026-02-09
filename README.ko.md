# @pencil-structural/compare

[![npm version](https://badge.fury.io/js/%40pencil-structural%2Fcompare.svg)](https://www.npmjs.com/package/@pencil-structural/compare)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

구조적 비교 엔진 - Pencil 디자인과 코드의 일치성을 검증합니다.

## 개요

이 패키지는 [Pencil](https://pencil.pm) 디자인 도구로 만든 UI 디자인과 실제 구현된 코드(TSX/CSS)를 구조적으로 비교하여 일치성을 검증합니다.

### 핵심 기능

- **구조적 비교**: 요소 계층 구조, 속성, 스타일 비교
- **자동 검색**: Globby 기반 파일 검색 및 컨벤션 기반 매핑
- **독립 컴포넌트 처리**: Props 추출 및 병렬 처리
- **CI/CD 통합**: GitHub Actions 워크플로우 지원

## 설치

```bash
npm install @pencil-structural/compare
```

## CLI 사용

### 기본 명령

```bash
# 설정 파일 초기화
npx structural-compare init

# 비교 실행
npx structural-compare compare

# 특정 화면만 비교
npx structural-compare compare --screen home

# 상세 출력
npx structural-compare compare --verbose

# CI 요약 형식 (GitHub Actions용)
npx structural-compare compare --format ci-summary --output .results.json

# Git 변경 파일만 비교
npx structural-compare compare --changed
```

### 설정 파일

프로젝트 루트에 `.structural-comparerc.json` 생성:

```json
{
  "pencilFile": "docs/design/pencil/design.pen",
  "outputDir": "./docs/structural-comparison",
  "screens": [
    {
      "id": "home",
      "name": "홈 화면",
      "frameId": "9Yzp6",
      "tsxFile": "src/components/views/HomeView.tsx",
      "cssFile": "src/components/views/HomeView.module.css"
    }
  ],
  "options": {
    "tolerance": 1,
    "colorTolerance": 10,
    "severity": "normal",
    "ignoreProperties": ["transition"]
  }
}
```

## 프로그래매틱 API

```typescript
import {
  compareStructures,
  normalizePencilFrame,
  normalizeCodeFile,
  discoverFiles,
  findMatchingFiles,
  processBatch
} from '@pencil-structural/compare';

// 구조적 비교
const result = compareStructures(pencilElements, codeElements, {
  tolerance: 1,
  colorTolerance: 10
});

// 파일 검색
const discovery = await discoverFiles({
  rootDir: process.cwd(),
  changedOnly: false
});

const mapped = mapAllFiles(discovery);

// 독립 컴포넌트 처리
const batchResult = await processBatch(components, {
  concurrency: 4,
  extractProps: true
});
```

## 파일 컨벤션 매핑

이 패키지는 세 가지 매핑 컨벤션을 지원합니다:

### 1. 표준 컨벤션
```
docs/design/pencil/HomeView.pen → src/HomeView.tsx
                                  src/HomeView.module.css
```

### 2. 페이지 컨벤션
```
pages/home/HomeView.pen → src/pages/home/HomeView.tsx
                          src/pages/home/HomeView.module.css
```

### 3. 독립 컴포넌트
별도 TSX/CSS 파일과 props 추출 지원

## GitHub Actions 통합

```yaml
name: Structural Compare

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  compare:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx structural-compare compare --changed --format ci-summary --output .results.json
      - uses: actions/github-script@v7
        with:
          script: |
            const results = require('.results.json');
            // PR 코멘트로 결과 게시
```

## 설정 옵션

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|---------|------|
| `tolerance` | number | 1 | 레이아웃 비교 픽셀 허용 오차 |
| `colorTolerance` | number | 10 | 색상 차이 허용 오차 (0-255) |
| `severity` | string | 'normal' | 'strict', 'normal', 'lenient' |
| `ignoreProperties` | string[] | [] | 무시할 CSS 속성 |

## 요구사항

- Node.js >= 18.0.0
- TypeScript >= 5.3.0 (타입 검증용)

## 라이선스

MIT

## 저장소

https://github.com/redbyzan/pencil-structural-compare

## 기여

기여는 환영합니다! [CONTRIBUTING.md](CONTRIBUTING.md)를 참조해 주세요.

## 라이선스

[MIT](LICENSE)
