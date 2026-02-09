# @pencil-structural/compare

[![npm version](https://badge.fury.io/js/%40pencil-structural%2Fcompare.svg)](https://www.npmjs.com/package/@pencil-structural/compare)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Languages:** [English](README.md) | [한국어](README.ko.md)

---

Structural comparison engine for Pencil designs and code - verifies consistency between UI designs and implementation.

## Overview

This package structurally compares UI designs made with [Pencil](https://pencil.pm) design tool against implemented code (TSX/CSS) to verify design-to-code consistency.

### Key Features

- **Structural Comparison**: Compare element hierarchy, attributes, and styles
- **Auto Discovery**: Globby-based file search with convention-based mapping
- **Independent Component Processing**: Props extraction and parallel processing
- **CI/CD Integration**: GitHub Actions workflow support

## Installation

```bash
npm install @pencil-structural/compare
```

## CLI Usage

### Basic Commands

```bash
# Initialize configuration file
npx structural-compare init

# Run comparison
npx structural-compare compare

# Compare specific screen
npx structural-compare compare --screen home

# Verbose output
npx structural-compare compare --verbose

# CI summary format (for GitHub Actions)
npx structural-compare compare --format ci-summary --output .results.json

# Compare only Git changed files
npx structural-compare compare --changed
```

### Configuration File

Create `.structural-comparerc.json` in your project root:

```json
{
  "pencilFile": "docs/design/pencil/design.pen",
  "outputDir": "./docs/structural-comparison",
  "screens": [
    {
      "id": "home",
      "name": "Home Screen",
      "frameId": "9Yzp6",
      "tsxFile": "src/sidepanel/components/views/HomeView.tsx",
      "cssFile": "src/sidepanel/components/views/HomeView.module.css"
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

## Programmatic API

```typescript
import {
  compareStructures,
  normalizePencilFrame,
  normalizeCodeFile,
  discoverFiles,
  findMatchingFiles,
  processBatch
} from '@pencil-structural/compare';

// Structural comparison
const result = compareStructures(pencilElements, codeElements, {
  tolerance: 1,
  colorTolerance: 10
});

// File discovery
const discovery = await discoverFiles({
  rootDir: process.cwd(),
  changedOnly: false
});

const mapped = mapAllFiles(discovery);

// Independent component processing
const batchResult = await processBatch(components, {
  concurrency: 4,
  extractProps: true
});
```

## File Convention Mapping

The package supports three mapping conventions:

### 1. Standard Convention
```
docs/design/pencil/HomeView.pen → src/HomeView.tsx
                                  src/HomeView.module.css
```

### 2. Page Convention
```
pages/home/HomeView.pen → src/pages/home/HomeView.tsx
                          src/pages/home/HomeView.module.css
```

### 3. Independent Component
Separate TSX/CSS files with props extraction support.

## GitHub Actions Integration

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
            // Post results as PR comment
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `tolerance` | number | 1 | Pixel tolerance for layout comparison |
| `colorTolerance` | number | 10 | Color difference tolerance (0-255) |
| `severity` | string | 'normal' | 'strict', 'normal', or 'lenient' |
| `ignoreProperties` | string[] | [] | CSS properties to ignore |

## Requirements

- Node.js >= 18.0.0
- TypeScript >= 5.3.0 (for type checking)

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)

## Repository

https://github.com/redbyzan/pencil-structural-compare
