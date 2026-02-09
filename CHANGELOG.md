# Changelog

All notable changes to @pencil-structural/compare will be documented in this file.

## [0.1.0] - 2025-02-09

### Added
- 구조적 비교 엔진 코어 (compare, element, style)
- Pencil 정규화기 (normalizePencilFrame, normalizePencilNode)
- 코드 정규화기 (normalizeCodeFile, parseCSSModules)
- 파일 검색 시스템 (discoverFiles, findMatchingFiles)
- 컨벤션 기반 매핑 (standard, page, independent)
- 독립 컴포넌트 처리 (processComponent, processBatch)
- Props 추출기 (extractComponentProps)
- CLI 도구 (init, validate, compare)
- CI/CD 통합 (ci-summary 형식)
- 리포터 (console, markdown, json, ci-summary)

### Features
- Globby 기반 자동 파일 검색
- Git 변경 파일 필터링 (--changed 플래그)
- 병렬 처리 (동시성 제어)
- GitHub Actions 워크플로우 템플릿
