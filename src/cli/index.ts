/**
 * CLI Entry Point
 *
 * Command-line interface for structural comparison tool.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Import from compare package
import {
  compareStructures,
  normalizePencilFrame,
  normalizeCodeFile,
  reportToMarkdown,
  reportToConsole,
  reportToJSON,
  reportToCISummary,
  type ComparisonResult,
  type ComparisonOptions,
  type PencilNode,
} from '../index.js';

// Import configuration
import {
  cliOptionsSchema,
  type Config,
  type CLIOptions,
  type ScreenConfig,
} from '../config/schema.js';
import {
  loadConfig,
  mergeConfigWithCliOptions,
  getExampleConfig,
  findConfigFile,
  loadConfigFile,
} from '../config/loader.js';

// ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * CLI Application
 */
class StructuralCompareCLI {
  private program: Command;
  private config: Config | null = null;

  constructor() {
    this.program = new Command();
    this.setupCommands();
  }

  /**
   * Setup CLI commands
   */
  private setupCommands(): void {
    this.program
      .name('structural-compare')
      .description('Pencil ↔ 코드 구조적 비교 도구')
      .version('0.1.0');

    // Main compare command
    this.program
      .command('compare')
      .description('Pencil 디자인과 코드를 구조적으로 비교')
      .option('-s, --screen <id>', '비교할 화면 ID (지정하지 않으면 모든 화면)')
      .option('-v, --verbose', '상세 출력 모드')
      .option('-f, --format <format>', '리포트 형식 (console|markdown|json|ci-summary)', 'markdown')
      .option('-o, --output <path>', '출력 디렉토리 또는 파일 경로')
      .option('-c, --config <path>', '설정 파일 경로')
      .option('--changed', 'Git 변경 파일만 비교 (CI/CD용)')
      .action(this.handleCompare.bind(this));

    // Init command - generate example config
    this.program
      .command('init')
      .description('예제 설정 파일 생성')
      .option('-f, --force', '기존 파일 덮어쓰기')
      .action(this.handleInit.bind(this));

    // Validate command - validate config file
    this.program
      .command('validate')
      .description('설정 파일 유효성 검사')
      .option('-c, --config <path>', '설정 파일 경로')
      .action(this.handleValidate.bind(this));
  }

  /**
   * Handle compare command
   */
  private async handleCompare(options: any): Promise<void> {
    try {
      // Parse and validate CLI options
      const cliOptions = cliOptionsSchema.parse(options);

      // Load configuration
      const config = loadConfig(cliOptions.config);
      const { config: mergedConfig, options: mergedCliOptions } =
        mergeConfigWithCliOptions(config, cliOptions);

      this.config = mergedConfig;

      // Filter screens if specific screen requested
      const screensToCompare = mergedCliOptions.screen
        ? config.screens.filter((s: ScreenConfig) => s.frameId === mergedCliOptions.screen || s.id === mergedCliOptions.screen)
        : config.screens;

      if (screensToCompare.length === 0) {
        console.error(chalk.red(`❌ 화면을 찾을 수 없습니다: ${mergedCliOptions.screen}`));
        process.exit(1);
      }

      // Ensure output directory exists
      const outputDir = resolve(mergedConfig.outputDir);
      this.ensureDir(outputDir);

      // Run comparison
      const results = await this.runComparison(screensToCompare, mergedConfig.options || {}, mergedCliOptions);

      // Generate report
      await this.generateReport(results, mergedCliOptions, outputDir);

      // Print summary
      this.printSummary(results, mergedCliOptions);

      // Exit with appropriate code
      const hasErrors = results.screens.some(
        (screen) => screen.summary.missingElements > 0 || screen.summary.styleDiffs > 0
      );
      process.exit(hasErrors ? 1 : 0);

    } catch (error: any) {
      console.error(chalk.red('❌ 오류:'), error.message);
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  /**
   * Run structural comparison
   */
  private async runComparison(
    screens: ScreenConfig[],
    options: ComparisonOptions,
    cliOptions: CLIOptions
  ): Promise<{ timestamp: string; screens: ComparisonResult[] }> {
    const results = {
      timestamp: new Date().toISOString(),
      screens: [] as ComparisonResult[],
    };

    for (const screen of screens) {
      console.log(chalk.blue(`\n[*] 분석 중: ${screen.name} (${screen.id})`));

      try {
        // Load Pencil data
        const pencilFrame = await this.loadPencilData(screen.frameId);
        const pencilElements = normalizePencilFrame(pencilFrame);

        // Load and normalize code files
        const tsxCode = this.readFile(screen.tsxFile);
        const cssCode = this.readFile(screen.cssFile);
        const codeElements = await normalizeCodeFile(tsxCode, cssCode);

        // Compare structures
        const result = compareStructures(pencilElements, codeElements, options);

        // Add metadata
        result.meta.screen = {
          id: screen.id,
          name: screen.name,
          frameId: screen.frameId,
        };
        result.meta.sources = {
          pencil: this.config!.pencilFile,
          tsx: screen.tsxFile,
          css: screen.cssFile,
        };

        results.screens.push(result);

        // Print progress
        const status = result.summary.status === 'pass' ? chalk.green('✓') :
                       result.summary.status === 'warning' ? chalk.yellow('⚠') :
                       chalk.red('✗');

        console.log(
          `  ${status} 완료: ${result.summary.matchedElements}/${result.summary.totalElements} 일치, ` +
          `${result.summary.missingElements} 누락, ${result.summary.extraElements} 추가`
        );

        // Verbose output
        if (cliOptions.verbose) {
          reportToConsole(result);
        }

      } catch (error: any) {
        console.error(chalk.red(`  ✗ 에러: ${error.message}`));
        if (cliOptions.verbose && error.stack) {
          console.error(error.stack);
        }
      }
    }

    return results;
  }

  /**
   * Generate report
   */
  private async generateReport(
    results: { timestamp: string; screens: ComparisonResult[] },
    cliOptions: CLIOptions,
    outputDir: string
  ): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    switch (cliOptions.format) {
      case 'console':
        // Already printed during comparison
        break;

      case 'json':
        const jsonPath = resolve(outputDir, `comparison-report-${timestamp}.json`);
        const jsonReport = JSON.stringify(results, null, 2);
        writeFileSync(jsonPath, jsonReport, 'utf-8');
        console.log(chalk.green(`\n[*] JSON 리포트 생성: ${jsonPath}`));
        break;

      case 'ci-summary':
        // CI 요약 생성 (GitHub Actions용)
        const ciSummaryPath = resolve(outputDir, '.structural-compare-results.json');
        const aggregated = this.aggregateCISummary(results);
        writeFileSync(ciSummaryPath, JSON.stringify(aggregated, null, 2), 'utf-8');
        console.log(chalk.green(`\n[*] CI 요약 생성: ${ciSummaryPath}`));
        break;

      case 'markdown':
      default:
        const mdPath = resolve(outputDir, 'comparison-report.md');
        const markdownReport = this.generateMarkdownReport(results);
        writeFileSync(mdPath, markdownReport, 'utf-8');
        console.log(chalk.green(`\n[*] Markdown 리포트 생성: ${mdPath}`));
        break;
    }
  }

  /**
   * Generate markdown report
   */
  private generateMarkdownReport(results: {
    timestamp: string;
    screens: ComparisonResult[];
  }): string {
    const lines: string[] = [];

    lines.push('# Pencil ↔ 코드 구조적 비교 리포트\n');
    lines.push(`생성일시: ${new Date().toLocaleString('ko-KR')}\n`);
    lines.push('> 구조적 데이터 기반 비교로 Pencil 디자인과 코드의 일치성을 검증합니다.\n');

    lines.push('## 전체 요약');
    lines.push('');

    for (const screenResult of results.screens) {
      const summary = screenResult.summary;
      const status = this.getStatusEmoji(summary.status);
      const screenInfo = screenResult.meta.screen;
      lines.push(`### ${screenInfo.name}`);
      lines.push(`- Frame ID: \`${screenInfo.frameId}\``);
      lines.push(`- 일치율: ${summary.matchRate.toFixed(1)}%`);
      lines.push(`- 상태: ${status} ${summary.status.toUpperCase()}`);
      lines.push('');

      // Add detailed report
      lines.push(reportToMarkdown(screenResult));
      lines.push('');
    }

    lines.push('---');
    lines.push('\n*이 리포트는 구조적 비교 시스템에 의해 자동 생성되었습니다.*');

    return lines.join('\n');
  }

  /**
   * Print summary
   */
  private printSummary(
    results: { timestamp: string; screens: ComparisonResult[] },
    cliOptions: CLIOptions
  ): void {
    console.log(chalk.bold('\n요약:'));

    for (const screenResult of results.screens) {
      const summary = screenResult.summary;
      const status = this.getStatusEmoji(summary.status);
      const screenInfo = screenResult.meta.screen;
      console.log(
        `  ${status} ${screenInfo.name}: ` +
        `${summary.matchedElements}/${summary.totalElements} 일치, ` +
        `${summary.missingElements} 누락, ` +
        `${summary.extraElements} 추가`
      );
    }

    const hasErrors = results.screens.some(
      (screen) => screen.summary.missingElements > 0 || screen.summary.styleDiffs > 0
    );

    if (hasErrors) {
      console.log(chalk.yellow('\n[*] 수정이 필요합니다. 위 차이점을 확인하고 코드를 수정하세요.'));
    }
  }

  /**
   * Handle init command
   */
  private handleInit(options: { force?: boolean }): void {
    const configPath = resolve(process.cwd(), '.structural-comparerc.json');

    if (existsSync(configPath) && !options.force) {
      console.error(chalk.red('❌ 설정 파일이 이미 존재합니다: .structural-comparerc.json'));
      console.error(chalk.gray('   덮어쓰려면 --force 옵션을 사용하세요.'));
      process.exit(1);
    }

    const exampleConfig = getExampleConfig();
    writeFileSync(configPath, JSON.stringify(exampleConfig, null, 2), 'utf-8');

    console.log(chalk.green('✓ 설정 파일 생성 완료: .structural-comparerc.json'));
    console.log(chalk.gray('  필요에 따라 설정을 수정하고 사용하세요.'));
  }

  /**
   * Handle validate command
   */
  private handleValidate(options: { config?: string }): void {
    try {
      let configPath = options.config;

      if (!configPath) {
        const foundPath = findConfigFile();
        if (!foundPath) {
          console.error(chalk.red('❌ 설정 파일을 찾을 수 없습니다.'));
          process.exit(1);
        }
        configPath = foundPath;
      }

      const config = loadConfigFile(configPath);

      console.log(chalk.green('✓ 설정 파일이 유효합니다:'), configPath);
      console.log(chalk.gray(`  Pencil 파일: ${config.pencilFile}`));
      console.log(chalk.gray(`  화면 개수: ${config.screens.length}`));
      console.log(chalk.gray(`  출력 디렉토리: ${config.outputDir || 'default'}`));

    } catch (error: any) {
      console.error(chalk.red('❌ 설정 파일 유효성 검사 실패:'));
      console.error(chalk.gray(`  ${error.message}`));
      process.exit(1);
    }
  }

  /**
   * Load Pencil data from file
   */
  private async loadPencilData(frameId: string): Promise<{
    id: string;
    type: string;
    name: string;
    fill?: string;
    cornerRadius?: number;
    gap?: number;
    padding?: number;
    width?: number;
    height?: number;
    layout?: string;
    children: PencilNode[];
  }> {
    const dataFilePath = resolve(process.cwd(), 'scripts/structural-compare/data', `pencil-${frameId}.json`);

    if (!existsSync(dataFilePath)) {
      throw new Error(
        `Pencil 데이터 파일을 찾을 수 없습니다: ${dataFilePath}\n` +
        `먼저 Pencil MCP 도구로 데이터를 추출하세요: mcp__pencil__batch_get`
      );
    }

    const jsonContent = readFileSync(dataFilePath, 'utf-8');
    return JSON.parse(jsonContent);
  }

  /**
   * Read file content
   */
  private readFile(filePath: string): string {
    const fullPath = resolve(process.cwd(), filePath);
    return readFileSync(fullPath, 'utf-8');
  }

  /**
   * Ensure directory exists
   */
  private ensureDir(dirPath: string): void {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Get status emoji
   */
  private getStatusEmoji(status: string): string {
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

  /**
   * CI 요약 집계 (GitHub Actions용)
   */
  private aggregateCISummary(results: {
    timestamp: string;
    screens: ComparisonResult[];
  }): any {
    const totalElements = results.screens.reduce((sum, s) => sum + s.summary.totalElements, 0);
    const matchedElements = results.screens.reduce((sum, s) => sum + s.summary.matchedElements, 0);
    const missingElements = results.screens.reduce((sum, s) => sum + s.summary.missingElements, 0);
    const extraElements = results.screens.reduce((sum, s) => sum + s.summary.extraElements, 0);
    const styleDiffs = results.screens.reduce((sum, s) => sum + s.summary.styleDiffs, 0);

    const overallStatus = results.screens.some(s => s.summary.status === 'fail')
      ? 'fail'
      : results.screens.some(s => s.summary.status === 'warning')
        ? 'warning'
        : 'pass';

    const matchRate = totalElements > 0
      ? Math.round((matchedElements / totalElements) * 100)
      : 0;

    // 모든 화면의 누락/추가 요소 수집
    const missingInCode = results.screens.flatMap(s => s.missingInCode);
    const extraInCode = results.screens.flatMap(s => s.extraInCode);
    const styleDiffList = results.screens.flatMap(s => s.styleDiffs);

    return {
      summary: {
        totalElements,
        matchedElements,
        missingElements,
        extraElements,
        styleDiffs,
        matchRate,
        status: overallStatus
      },
      missingInCode,
      extraInCode,
      styleDiffs: styleDiffList,
      timestamp: results.timestamp,
      screens: results.screens.map(s => ({
        id: s.meta.screen.id,
        name: s.meta.screen.name,
        summary: s.summary,
        status: s.summary.status
      }))
    };
  }

  /**
   * Run CLI
   */
  async run(args: string[]): Promise<void> {
    await this.program.parseAsync(args);
  }
}

// Export CLI instance factory
export function createCLI(): StructuralCompareCLI {
  return new StructuralCompareCLI();
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = createCLI();
  cli.run(process.argv).catch((error) => {
    console.error('치명적 오류:', error);
    process.exit(1);
  });
}
