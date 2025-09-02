/**
 * Bundle analysis utilities for SPFx solutions
 * Provides tools for analyzing bundle sizes, dependencies, and optimization opportunities
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Bundle analysis result interface
 */
export interface IBundleAnalysisResult {
  /** Total bundle size in bytes */
  totalSize: number;
  /** Total size formatted as string */
  totalSizeFormatted: string;
  /** Number of chunks */
  chunkCount: number;
  /** Number of modules */
  moduleCount: number;
  /** Individual chunk analysis */
  chunks: IChunkAnalysis[];
  /** Module analysis */
  modules: IModuleAnalysis[];
  /** Dependency analysis */
  dependencies: IDependencyAnalysis[];
  /** Optimization recommendations */
  recommendations: string[];
  /** Performance score (0-100) */
  performanceScore: number;
}

/**
 * Individual chunk analysis
 */
export interface IChunkAnalysis {
  /** Chunk name */
  name: string;
  /** Chunk size in bytes */
  size: number;
  /** Formatted size string */
  sizeFormatted: string;
  /** Percentage of total bundle */
  percentage: number;
  /** Modules in this chunk */
  moduleCount: number;
  /** Whether this chunk is too large */
  isLarge: boolean;
  /** Chunk type (vendor, app, common, etc.) */
  type: 'vendor' | 'app' | 'common' | 'runtime' | 'unknown';
}

/**
 * Module analysis interface
 */
export interface IModuleAnalysis {
  /** Module name/path */
  name: string;
  /** Module size in bytes */
  size: number;
  /** Formatted size string */
  sizeFormatted: string;
  /** Which chunks contain this module */
  chunks: string[];
  /** Whether module appears in multiple chunks */
  isDuplicated: boolean;
  /** Module type (npm, local, etc.) */
  type: 'npm' | 'local' | 'builtin';
}

/**
 * Dependency analysis interface
 */
export interface IDependencyAnalysis {
  /** Package name */
  name: string;
  /** Total size across all chunks */
  totalSize: number;
  /** Formatted size string */
  sizeFormatted: string;
  /** Version used */
  version?: string;
  /** Whether it's a dev dependency */
  isDevDependency: boolean;
  /** Whether it could be externalized */
  canExternalize: boolean;
  /** Optimization suggestions */
  suggestions: string[];
}

/**
 * Bundle size thresholds
 */
export const BUNDLE_THRESHOLDS = {
  chunk: {
    small: 50 * 1024,      // 50KB
    medium: 250 * 1024,    // 250KB
    large: 500 * 1024,     // 500KB
    huge: 1024 * 1024      // 1MB
  },
  total: {
    good: 1024 * 1024,     // 1MB
    acceptable: 2048 * 1024, // 2MB
    poor: 4096 * 1024      // 4MB
  }
};

/**
 * Common packages that can be externalized in SPFx
 */
export const EXTERNALIZABLE_PACKAGES = [
  'react',
  'react-dom',
  '@microsoft/sp-core-library',
  '@microsoft/sp-webpart-base',
  '@microsoft/sp-component-base',
  '@microsoft/sp-property-pane',
  '@fluentui/react'
];

/**
 * Bundle analyzer class
 * Analyzes webpack stats and provides optimization insights
 */
export class BundleAnalyzer {
  /**
   * Analyze webpack stats file
   * @param statsPath - Path to webpack stats.json file
   * @param packageJsonPath - Path to package.json file
   * @returns Bundle analysis result
   */
  public static async analyzeStats(
    statsPath: string, 
    packageJsonPath?: string
  ): Promise<IBundleAnalysisResult> {
    const stats = this.loadStats(statsPath);
    const packageJson = packageJsonPath ? this.loadPackageJson(packageJsonPath) : null;

    const chunks = this.analyzeChunks(stats);
    const modules = this.analyzeModules(stats);
    const dependencies = this.analyzeDependencies(stats, packageJson);
    
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const recommendations = this.generateRecommendations(chunks, modules, dependencies, totalSize);
    const performanceScore = this.calculatePerformanceScore(totalSize, chunks, modules);

    return {
      totalSize,
      totalSizeFormatted: this.formatBytes(totalSize),
      chunkCount: chunks.length,
      moduleCount: modules.length,
      chunks,
      modules,
      dependencies,
      recommendations,
      performanceScore
    };
  }

  /**
   * Analyze bundle from build output directory
   * @param buildPath - Path to build output directory
   * @returns Bundle analysis result
   */
  public static async analyzeBuildOutput(buildPath: string): Promise<IBundleAnalysisResult> {
    const files = this.getBundleFiles(buildPath);
    const chunks: IChunkAnalysis[] = [];
    let totalSize = 0;

    for (const file of files) {
      const filePath = path.join(buildPath, file);
      const stats = fs.statSync(filePath);
      const size = stats.size;
      
      totalSize += size;
      
      chunks.push({
        name: file,
        size,
        sizeFormatted: this.formatBytes(size),
        percentage: 0, // Will be calculated later
        moduleCount: 0, // Not available from file system
        isLarge: size > BUNDLE_THRESHOLDS.chunk.large,
        type: this.inferChunkType(file)
      });
    }

    // Calculate percentages
    chunks.forEach(chunk => {
      chunk.percentage = (chunk.size / totalSize) * 100;
    });

    const recommendations = this.generateFileBasedRecommendations(chunks, totalSize);
    const performanceScore = this.calculatePerformanceScore(totalSize, chunks, []);

    return {
      totalSize,
      totalSizeFormatted: this.formatBytes(totalSize),
      chunkCount: chunks.length,
      moduleCount: 0,
      chunks,
      modules: [],
      dependencies: [],
      recommendations,
      performanceScore
    };
  }

  /**
   * Generate bundle report
   * @param analysis - Bundle analysis result
   * @returns Formatted report string
   */
  public static generateReport(analysis: IBundleAnalysisResult): string {
    const lines: string[] = [];
    
    lines.push('📊 Bundle Analysis Report');
    lines.push('========================\n');
    
    // Summary
    lines.push(`📦 Total Size: ${analysis.totalSizeFormatted}`);
    lines.push(`🧩 Chunks: ${analysis.chunkCount}`);
    lines.push(`📄 Modules: ${analysis.moduleCount}`);
    lines.push(`⭐ Performance Score: ${analysis.performanceScore}/100\n`);
    
    // Performance assessment
    const performance = this.getPerformanceAssessment(analysis.performanceScore);
    lines.push(`📈 Performance: ${performance.emoji} ${performance.label}`);
    lines.push(`${performance.description}\n`);
    
    // Largest chunks
    if (analysis.chunks.length > 0) {
      lines.push('📦 Largest Chunks:');
      analysis.chunks
        .sort((a, b) => b.size - a.size)
        .slice(0, 5)
        .forEach(chunk => {
          const icon = chunk.isLarge ? '🔴' : chunk.size > BUNDLE_THRESHOLDS.chunk.medium ? '🟡' : '🟢';
          lines.push(`  ${icon} ${chunk.name}: ${chunk.sizeFormatted} (${chunk.percentage.toFixed(1)}%)`);
        });
      lines.push('');
    }
    
    // Dependencies
    if (analysis.dependencies.length > 0) {
      lines.push('📚 Largest Dependencies:');
      analysis.dependencies
        .sort((a, b) => b.totalSize - a.totalSize)
        .slice(0, 5)
        .forEach(dep => {
          const canOptimize = dep.canExternalize ? '⚡' : '📦';
          lines.push(`  ${canOptimize} ${dep.name}: ${dep.sizeFormatted}`);
        });
      lines.push('');
    }
    
    // Recommendations
    if (analysis.recommendations.length > 0) {
      lines.push('💡 Optimization Recommendations:');
      analysis.recommendations.forEach(rec => {
        lines.push(`  • ${rec}`);
      });
      lines.push('');
    }
    
    return lines.join('\n');
  }

  /**
   * Save analysis results to file
   * @param analysis - Bundle analysis result
   * @param outputPath - Output file path
   */
  public static saveAnalysis(analysis: IBundleAnalysisResult, outputPath: string): void {
    const report = this.generateReport(analysis);
    fs.writeFileSync(outputPath, report, 'utf8');
    
    // Also save JSON data
    const jsonPath = outputPath.replace(/\.[^.]+$/, '.json');
    fs.writeFileSync(jsonPath, JSON.stringify(analysis, null, 2), 'utf8');
  }

  // Private helper methods
  
  private static loadStats(statsPath: string): any {
    if (!fs.existsSync(statsPath)) {
      throw new Error(`Stats file not found: ${statsPath}`);
    }
    
    try {
      return JSON.parse(fs.readFileSync(statsPath, 'utf8'));
    } catch (error) {
      throw new Error(`Failed to parse stats file: ${error.message}`);
    }
  }

  private static loadPackageJson(packageJsonPath: string): any {
    if (!fs.existsSync(packageJsonPath)) {
      return null;
    }
    
    try {
      return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    } catch (error) {
      console.warn(`Failed to parse package.json: ${error.message}`);
      return null;
    }
  }

  private static analyzeChunks(stats: any): IChunkAnalysis[] {
    if (!stats.chunks) {
      return [];
    }

    return stats.chunks.map((chunk: any) => {
      const size = chunk.size || 0;
      const name = chunk.names?.[0] || `chunk-${chunk.id}`;
      
      return {
        name,
        size,
        sizeFormatted: this.formatBytes(size),
        percentage: 0, // Will be calculated later
        moduleCount: chunk.modules?.length || 0,
        isLarge: size > BUNDLE_THRESHOLDS.chunk.large,
        type: this.inferChunkType(name)
      };
    });
  }

  private static analyzeModules(stats: any): IModuleAnalysis[] {
    if (!stats.modules) {
      return [];
    }

    const moduleMap = new Map<string, IModuleAnalysis>();
    
    stats.modules.forEach((module: any) => {
      const name = module.name || module.identifier || 'unknown';
      const size = module.size || 0;
      
      if (moduleMap.has(name)) {
        const existing = moduleMap.get(name)!;
        existing.chunks = [...new Set([...existing.chunks, ...module.chunks])];
        existing.isDuplicated = existing.chunks.length > 1;
      } else {
        moduleMap.set(name, {
          name,
          size,
          sizeFormatted: this.formatBytes(size),
          chunks: module.chunks || [],
          isDuplicated: false,
          type: this.inferModuleType(name)
        });
      }
    });

    return Array.from(moduleMap.values());
  }

  private static analyzeDependencies(stats: any, packageJson?: any): IDependencyAnalysis[] {
    if (!stats.modules || !packageJson) {
      return [];
    }

    const dependencyMap = new Map<string, IDependencyAnalysis>();
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    stats.modules.forEach((module: any) => {
      const moduleName = module.name || module.identifier || '';
      const packageMatch = moduleName.match(/node_modules[\\/](@?[^\/\\]+)/);
      
      if (packageMatch) {
        const packageName = packageMatch[1];
        const size = module.size || 0;
        
        if (dependencyMap.has(packageName)) {
          const existing = dependencyMap.get(packageName)!;
          existing.totalSize += size;
          existing.sizeFormatted = this.formatBytes(existing.totalSize);
        } else {
          dependencyMap.set(packageName, {
            name: packageName,
            totalSize: size,
            sizeFormatted: this.formatBytes(size),
            version: dependencies[packageName],
            isDevDependency: Boolean(packageJson.devDependencies?.[packageName]),
            canExternalize: EXTERNALIZABLE_PACKAGES.includes(packageName),
            suggestions: this.generateDependencySuggestions(packageName, size)
          });
        }
      }
    });

    return Array.from(dependencyMap.values());
  }

  private static generateRecommendations(
    chunks: IChunkAnalysis[],
    modules: IModuleAnalysis[],
    dependencies: IDependencyAnalysis[],
    totalSize: number
  ): string[] {
    const recommendations: string[] = [];

    // Total size recommendations
    if (totalSize > BUNDLE_THRESHOLDS.total.poor) {
      recommendations.push('Bundle is very large (>4MB). Implement aggressive code splitting.');
    } else if (totalSize > BUNDLE_THRESHOLDS.total.acceptable) {
      recommendations.push('Bundle is large (>2MB). Consider code splitting and lazy loading.');
    }

    // Large chunk recommendations
    const largeChunks = chunks.filter(chunk => chunk.isLarge);
    if (largeChunks.length > 0) {
      recommendations.push(`${largeChunks.length} chunks are large (>500KB). Split them into smaller pieces.`);
    }

    // Vendor chunk recommendations
    const vendorChunks = chunks.filter(chunk => chunk.type === 'vendor');
    const totalVendorSize = vendorChunks.reduce((sum, chunk) => sum + chunk.size, 0);
    if (totalVendorSize > BUNDLE_THRESHOLDS.chunk.huge) {
      recommendations.push('Vendor chunks are very large. Split by library or externalize common dependencies.');
    }

    // Duplicate module recommendations
    const duplicatedModules = modules.filter(module => module.isDuplicated);
    if (duplicatedModules.length > 0) {
      recommendations.push(`${duplicatedModules.length} modules appear in multiple chunks. Extract to common chunk.`);
    }

    // Externalization recommendations
    const externalizableDeps = dependencies.filter(dep => dep.canExternalize && dep.totalSize > 50 * 1024);
    if (externalizableDeps.length > 0) {
      recommendations.push(`Consider externalizing: ${externalizableDeps.map(d => d.name).join(', ')}`);
    }

    // Tree shaking recommendations
    const largeDependencies = dependencies.filter(dep => dep.totalSize > 200 * 1024);
    largeDependencies.forEach(dep => {
      if (dep.name === 'lodash') {
        recommendations.push('Use lodash-es instead of lodash for better tree shaking');
      } else if (dep.name.includes('moment')) {
        recommendations.push('Consider date-fns instead of moment for smaller bundle size');
      }
    });

    return recommendations;
  }

  private static generateFileBasedRecommendations(chunks: IChunkAnalysis[], totalSize: number): string[] {
    const recommendations: string[] = [];

    if (totalSize > BUNDLE_THRESHOLDS.total.acceptable) {
      recommendations.push('Total bundle size is large. Enable code splitting and lazy loading.');
    }

    const largeFiles = chunks.filter(chunk => chunk.size > BUNDLE_THRESHOLDS.chunk.large);
    if (largeFiles.length > 0) {
      recommendations.push(`${largeFiles.length} files are large. Consider splitting or optimizing.`);
    }

    return recommendations;
  }

  private static generateDependencySuggestions(packageName: string, size: number): string[] {
    const suggestions: string[] = [];

    if (EXTERNALIZABLE_PACKAGES.includes(packageName) && size > 100 * 1024) {
      suggestions.push('Consider externalizing this dependency');
    }

    if (packageName === 'lodash' && size > 50 * 1024) {
      suggestions.push('Use lodash-es for better tree shaking');
    }

    if (packageName === 'moment' && size > 200 * 1024) {
      suggestions.push('Consider date-fns as a lighter alternative');
    }

    return suggestions;
  }

  private static calculatePerformanceScore(
    totalSize: number,
    chunks: IChunkAnalysis[],
    modules: IModuleAnalysis[]
  ): number {
    let score = 100;

    // Penalize large total size
    if (totalSize > BUNDLE_THRESHOLDS.total.poor) {
      score -= 40;
    } else if (totalSize > BUNDLE_THRESHOLDS.total.acceptable) {
      score -= 20;
    } else if (totalSize > BUNDLE_THRESHOLDS.total.good) {
      score -= 10;
    }

    // Penalize large chunks
    const largeChunks = chunks.filter(chunk => chunk.isLarge);
    score -= largeChunks.length * 10;

    // Penalize duplicated modules
    const duplicatedModules = modules.filter(module => module.isDuplicated);
    score -= duplicatedModules.length * 5;

    // Bonus for small chunks (good splitting)
    const smallChunks = chunks.filter(chunk => chunk.size < BUNDLE_THRESHOLDS.chunk.small);
    score += Math.min(smallChunks.length * 2, 10);

    return Math.max(0, Math.min(100, score));
  }

  private static getPerformanceAssessment(score: number): { emoji: string; label: string; description: string } {
    if (score >= 90) {
      return {
        emoji: '🟢',
        label: 'Excellent',
        description: 'Bundle is well optimized with minimal room for improvement.'
      };
    } else if (score >= 75) {
      return {
        emoji: '🟡',
        label: 'Good',
        description: 'Bundle is reasonably optimized with some opportunities for improvement.'
      };
    } else if (score >= 50) {
      return {
        emoji: '🟠',
        label: 'Fair',
        description: 'Bundle has significant optimization opportunities.'
      };
    } else {
      return {
        emoji: '🔴',
        label: 'Poor',
        description: 'Bundle requires substantial optimization to improve performance.'
      };
    }
  }

  private static getBundleFiles(buildPath: string): string[] {
    if (!fs.existsSync(buildPath)) {
      return [];
    }

    return fs.readdirSync(buildPath).filter(file => 
      file.endsWith('.js') || file.endsWith('.css')
    );
  }

  private static inferChunkType(name: string): IChunkAnalysis['type'] {
    if (name.includes('vendor') || name.includes('node_modules')) {
      return 'vendor';
    } else if (name.includes('common') || name.includes('shared')) {
      return 'common';
    } else if (name.includes('runtime')) {
      return 'runtime';
    } else if (name.includes('webpart') || name.includes('component')) {
      return 'app';
    } else {
      return 'unknown';
    }
  }

  private static inferModuleType(name: string): IModuleAnalysis['type'] {
    if (name.includes('node_modules')) {
      return 'npm';
    } else if (name.startsWith('./') || name.startsWith('../') || name.includes('/src/')) {
      return 'local';
    } else {
      return 'builtin';
    }
  }

  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }
}