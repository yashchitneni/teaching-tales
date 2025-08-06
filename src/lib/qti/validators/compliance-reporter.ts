/**
 * QTI Compliance Reporting System
 * 
 * Generates detailed compliance reports, tracks validation metrics,
 * and provides actionable insights for QTI package quality improvement.
 * 
 * Features:
 * - Comprehensive validation reporting with categorized issues
 * - Compliance scoring and trend analysis
 * - Fix suggestions and best practice recommendations
 * - Performance metrics and validation statistics
 * - Export capabilities for reports and dashboards
 */

import { ValidationResult, ValidationError, ValidationWarning, ValidationErrorType, ValidationWarningType } from './qti-validator';

// Compliance reporting interfaces
export interface ComplianceReport {
  id: string;
  timestamp: Date;
  packageInfo: PackageInfo;
  overallScore: number;
  validationResults: ValidationResult[];
  categoryBreakdown: CategoryBreakdown;
  recommendations: Recommendation[];
  trends: ComplianceTrend[];
  summary: ComplianceSummary;
}

export interface PackageInfo {
  name: string;
  version: string;
  type: 'story-based' | 'standard' | 'adaptive';
  itemCount: number;
  sectionCount: number;
  generatedAt: Date;
  generationTime: number;
}

export interface CategoryBreakdown {
  structural: IssueCategory;
  semantic: IssueCategory;
  accessibility: IssueCategory;
  performance: IssueCategory;
  bestPractices: IssueCategory;
}

export interface IssueCategory {
  name: string;
  errorCount: number;
  warningCount: number;
  score: number; // 0-100
  issues: CategorizedIssue[];
  recommendations: string[];
}

export interface CategorizedIssue {
  type: ValidationErrorType | ValidationWarningType;
  severity: 'critical' | 'major' | 'minor' | 'info';
  message: string;
  location?: string;
  suggestion?: string;
  frequency: number;
  impact: 'high' | 'medium' | 'low';
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  actionItems: string[];
  estimatedEffort: 'low' | 'medium' | 'high';
  impact: string;
  resources?: string[];
}

export interface ComplianceTrend {
  metric: string;
  current: number;
  previous: number;
  change: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface ComplianceSummary {
  totalIssues: number;
  criticalIssues: number;
  resolvedIssues: number;
  complianceLevel: 'excellent' | 'good' | 'fair' | 'poor';
  keyInsights: string[];
  nextSteps: string[];
}

// Report generation options
export interface ReportOptions {
  includeDetails: boolean;
  includeTrends: boolean;
  includeRecommendations: boolean;
  format: 'json' | 'html' | 'markdown' | 'pdf';
  exportPath?: string;
}

// Compliance metrics tracking
export interface ComplianceMetrics {
  validationCount: number;
  averageScore: number;
  commonIssues: Map<string, number>;
  improvementRate: number;
  validationTime: number;
  lastUpdated: Date;
}

/**
 * QTI Compliance Reporter
 * 
 * Generates comprehensive compliance reports and tracks quality metrics
 * for QTI package validation results.
 */
export class ComplianceReporter {
  private reportHistory: ComplianceReport[] = [];
  private metrics: ComplianceMetrics;

  constructor() {
    this.metrics = {
      validationCount: 0,
      averageScore: 0,
      commonIssues: new Map(),
      improvementRate: 0,
      validationTime: 0,
      lastUpdated: new Date()
    };
  }

  /**
   * Generate comprehensive compliance report
   */
  generateComplianceReport(
    validationResults: ValidationResult[],
    packageInfo: PackageInfo,
    options: Partial<ReportOptions> = {}
  ): ComplianceReport {
    const startTime = Date.now();
    console.log('📊 Generating compliance report...');

    const reportId = this.generateReportId(packageInfo);
    const overallScore = this.calculateOverallScore(validationResults);
    
    const report: ComplianceReport = {
      id: reportId,
      timestamp: new Date(),
      packageInfo,
      overallScore,
      validationResults,
      categoryBreakdown: this.generateCategoryBreakdown(validationResults),
      recommendations: this.generateRecommendations(validationResults, packageInfo),
      trends: this.generateTrends(overallScore),
      summary: this.generateSummary(validationResults, overallScore)
    };

    // Update metrics
    this.updateMetrics(report);
    
    // Store report in history
    this.reportHistory.push(report);
    
    const generationTime = Date.now() - startTime;
    console.log(`✅ Compliance report generated in ${generationTime}ms`);
    console.log(`📈 Overall Compliance Score: ${overallScore}/100`);

    return report;
  }

  /**
   * Generate category breakdown of validation issues
   */
  private generateCategoryBreakdown(validationResults: ValidationResult[]): CategoryBreakdown {
    const allErrors = validationResults.flatMap(r => r.errors);
    const allWarnings = validationResults.flatMap(r => r.warnings);

    return {
      structural: this.categorizeStructuralIssues(allErrors, allWarnings),
      semantic: this.categorizeSemanticIssues(allErrors, allWarnings),
      accessibility: this.categorizeAccessibilityIssues(allErrors, allWarnings),
      performance: this.categorizePerformanceIssues(allErrors, allWarnings),
      bestPractices: this.categorizeBestPracticeIssues(allErrors, allWarnings)
    };
  }

  /**
   * Categorize structural issues (schema violations, missing elements)
   */
  private categorizeStructuralIssues(errors: ValidationError[], warnings: ValidationWarning[]): IssueCategory {
    const structuralErrorTypes = [
      ValidationErrorType.SCHEMA_VIOLATION,
      ValidationErrorType.MISSING_REQUIRED_ELEMENT,
      ValidationErrorType.STRUCTURE_ERROR,
      ValidationErrorType.NAMESPACE_ERROR
    ];

    const relevantErrors = errors.filter(e => structuralErrorTypes.includes(e.type));
    const relevantWarnings = warnings.filter(w => 
      w.type === ValidationWarningType.SUBOPTIMAL_STRUCTURE
    );

    const issues: CategorizedIssue[] = [
      ...relevantErrors.map(e => this.createCategorizedIssue(e, 'error')),
      ...relevantWarnings.map(w => this.createCategorizedIssue(w, 'warning'))
    ];

    return {
      name: 'Structural Integrity',
      errorCount: relevantErrors.length,
      warningCount: relevantWarnings.length,
      score: this.calculateCategoryScore(relevantErrors.length, relevantWarnings.length),
      issues,
      recommendations: this.generateStructuralRecommendations(issues)
    };
  }

  /**
   * Categorize semantic issues (invalid values, broken references)
   */
  private categorizeSemanticIssues(errors: ValidationError[], warnings: ValidationWarning[]): IssueCategory {
    const semanticErrorTypes = [
      ValidationErrorType.INVALID_ATTRIBUTE_VALUE,
      ValidationErrorType.DUPLICATE_IDENTIFIER,
      ValidationErrorType.BROKEN_REFERENCE
    ];

    const relevantErrors = errors.filter(e => semanticErrorTypes.includes(e.type));
    const relevantWarnings: ValidationWarning[] = []; // No semantic warnings currently

    const issues: CategorizedIssue[] = [
      ...relevantErrors.map(e => this.createCategorizedIssue(e, 'error')),
      ...relevantWarnings.map(w => this.createCategorizedIssue(w, 'warning'))
    ];

    return {
      name: 'Semantic Correctness',
      errorCount: relevantErrors.length,
      warningCount: relevantWarnings.length,
      score: this.calculateCategoryScore(relevantErrors.length, relevantWarnings.length),
      issues,
      recommendations: this.generateSemanticRecommendations(issues)
    };
  }

  /**
   * Categorize accessibility issues
   */
  private categorizeAccessibilityIssues(errors: ValidationError[], warnings: ValidationWarning[]): IssueCategory {
    const relevantWarnings = warnings.filter(w => 
      w.type === ValidationWarningType.ACCESSIBILITY_ISSUE
    );

    const issues: CategorizedIssue[] = [
      ...relevantWarnings.map(w => this.createCategorizedIssue(w, 'warning'))
    ];

    return {
      name: 'Accessibility',
      errorCount: 0,
      warningCount: relevantWarnings.length,
      score: this.calculateCategoryScore(0, relevantWarnings.length),
      issues,
      recommendations: this.generateAccessibilityRecommendations(issues)
    };
  }

  /**
   * Categorize performance issues
   */
  private categorizePerformanceIssues(errors: ValidationError[], warnings: ValidationWarning[]): IssueCategory {
    const relevantWarnings = warnings.filter(w => 
      w.type === ValidationWarningType.PERFORMANCE_CONCERN
    );

    const issues: CategorizedIssue[] = [
      ...relevantWarnings.map(w => this.createCategorizedIssue(w, 'warning'))
    ];

    return {
      name: 'Performance',
      errorCount: 0,
      warningCount: relevantWarnings.length,
      score: this.calculateCategoryScore(0, relevantWarnings.length),
      issues,
      recommendations: this.generatePerformanceRecommendations(issues)
    };
  }

  /**
   * Categorize best practice violations
   */
  private categorizeBestPracticeIssues(errors: ValidationError[], warnings: ValidationWarning[]): IssueCategory {
    const relevantWarnings = warnings.filter(w => 
      w.type === ValidationWarningType.BEST_PRACTICE_VIOLATION ||
      w.type === ValidationWarningType.DEPRECATED_ELEMENT
    );

    const issues: CategorizedIssue[] = [
      ...relevantWarnings.map(w => this.createCategorizedIssue(w, 'warning'))
    ];

    return {
      name: 'Best Practices',
      errorCount: 0,
      warningCount: relevantWarnings.length,
      score: this.calculateCategoryScore(0, relevantWarnings.length),
      issues,
      recommendations: this.generateBestPracticeRecommendations(issues)
    };
  }

  /**
   * Create categorized issue from validation error/warning
   */
  private createCategorizedIssue(
    issue: ValidationError | ValidationWarning, 
    sourceType: 'error' | 'warning'
  ): CategorizedIssue {
    const severity = sourceType === 'error' ? 
      (issue.severity === 'error' ? 'critical' : 'major') : 
      'minor';

    const impact = severity === 'critical' ? 'high' : 
                  severity === 'major' ? 'medium' : 'low';

    return {
      type: issue.type,
      severity: severity as 'critical' | 'major' | 'minor' | 'info',
      message: issue.message,
      location: issue.element || `Line ${issue.line}`,
      suggestion: 'suggestion' in issue ? issue.suggestion : 
                 'recommendation' in issue ? issue.recommendation : undefined,
      frequency: 1, // Would be calculated from historical data
      impact: impact as 'high' | 'medium' | 'low'
    };
  }

  /**
   * Generate actionable recommendations based on validation results
   */
  private generateRecommendations(
    validationResults: ValidationResult[], 
    packageInfo: PackageInfo
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    const totalErrors = validationResults.reduce((sum, r) => sum + r.summary.totalErrors, 0);
    const totalWarnings = validationResults.reduce((sum, r) => sum + r.summary.totalWarnings, 0);

    // Critical issues recommendation
    if (totalErrors > 0) {
      recommendations.push({
        priority: 'high',
        category: 'Critical Issues',
        title: 'Resolve Critical Validation Errors',
        description: `${totalErrors} critical errors must be resolved for QTI compliance.`,
        actionItems: [
          'Review all schema violations and fix structural issues',
          'Ensure all required elements and attributes are present',
          'Validate identifier uniqueness across all components',
          'Fix namespace declarations and element naming'
        ],
        estimatedEffort: totalErrors > 10 ? 'high' : 'medium',
        impact: 'QTI packages will not function correctly until these are resolved'
      });
    }

    // Best practices recommendation
    if (totalWarnings > 5) {
      recommendations.push({
        priority: 'medium',
        category: 'Quality Improvement',
        title: 'Improve QTI Package Quality',
        description: `${totalWarnings} warnings indicate opportunities for improvement.`,
        actionItems: [
          'Add descriptive titles and metadata',
          'Improve accessibility with alt text and labels',
          'Optimize XML structure for better performance',
          'Follow QTI best practices for interaction design'
        ],
        estimatedEffort: 'medium',
        impact: 'Better user experience and maintainability'
      });
    }

    // Story-specific recommendations
    if (packageInfo.type === 'story-based') {
      recommendations.push({
        priority: 'medium',
        category: 'Story-Based Assessment',
        title: 'Optimize Story-Based Assessment Features',
        description: 'Enhance story-based assessment with advanced QTI features.',
        actionItems: [
          'Add narrative progression tracking',
          'Implement story-aware branching rules',
          'Include character and plot consistency checks',
          'Add story comprehension outcome variables'
        ],
        estimatedEffort: 'medium',
        impact: 'Enhanced educational effectiveness and student engagement',
        resources: [
          'QTI 3.0 Branching Guide',
          'Story-Based Assessment Best Practices'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Generate compliance trends
   */
  private generateTrends(currentScore: number): ComplianceTrend[] {
    const trends: ComplianceTrend[] = [];

    // Get previous score for comparison
    const previousReport = this.reportHistory[this.reportHistory.length - 1];
    const previousScore = previousReport ? previousReport.overallScore : currentScore;

    trends.push({
      metric: 'Overall Compliance Score',
      current: currentScore,
      previous: previousScore,
      change: currentScore - previousScore,
      trend: currentScore > previousScore ? 'improving' : 
             currentScore < previousScore ? 'declining' : 'stable'
    });

    // Add more trend metrics as needed
    trends.push({
      metric: 'Validation Speed',
      current: this.metrics.validationTime,
      previous: this.metrics.validationTime,
      change: 0,
      trend: 'stable'
    });

    return trends;
  }

  /**
   * Generate compliance summary
   */
  private generateSummary(validationResults: ValidationResult[], overallScore: number): ComplianceSummary {
    const totalIssues = validationResults.reduce(
      (sum, r) => sum + r.summary.totalErrors + r.summary.totalWarnings, 0
    );
    
    const criticalIssues = validationResults.reduce(
      (sum, r) => sum + r.summary.criticalIssues, 0
    );

    const complianceLevel: 'excellent' | 'good' | 'fair' | 'poor' = 
      overallScore >= 90 ? 'excellent' :
      overallScore >= 75 ? 'good' :
      overallScore >= 50 ? 'fair' : 'poor';

    const keyInsights: string[] = [];
    const nextSteps: string[] = [];

    // Generate insights based on score
    if (overallScore >= 90) {
      keyInsights.push('Excellent QTI compliance with minimal issues');
      nextSteps.push('Focus on performance optimization and advanced features');
    } else if (criticalIssues > 0) {
      keyInsights.push(`${criticalIssues} critical issues require immediate attention`);
      nextSteps.push('Prioritize fixing critical validation errors');
    }

    if (totalIssues > 0) {
      keyInsights.push(`${totalIssues} total issues identified across all components`);
    }

    return {
      totalIssues,
      criticalIssues,
      resolvedIssues: 0, // Would track from previous reports
      complianceLevel,
      keyInsights,
      nextSteps
    };
  }

  /**
   * Calculate overall compliance score
   */
  private calculateOverallScore(validationResults: ValidationResult[]): number {
    if (validationResults.length === 0) return 0;

    const totalScore = validationResults.reduce((sum, result) => sum + result.summary.complianceScore, 0);
    return Math.round(totalScore / validationResults.length);
  }

  /**
   * Calculate category-specific score
   */
  private calculateCategoryScore(errorCount: number, warningCount: number): number {
    const errorPenalty = errorCount * 15;
    const warningPenalty = warningCount * 3;
    const totalPenalty = errorPenalty + warningPenalty;
    
    return Math.max(0, 100 - totalPenalty);
  }

  /**
   * Generate category-specific recommendations
   */
  private generateStructuralRecommendations(issues: CategorizedIssue[]): string[] {
    const recommendations = [
      'Validate XML structure against QTI 3.0 schemas',
      'Ensure all required elements are present',
      'Check namespace declarations and prefixes'
    ];

    if (issues.some(i => i.type === ValidationErrorType.DUPLICATE_IDENTIFIER)) {
      recommendations.push('Use unique identifiers across all QTI components');
    }

    return recommendations;
  }

  private generateSemanticRecommendations(issues: CategorizedIssue[]): string[] {
    return [
      'Verify attribute values match expected formats',
      'Check all cross-references resolve correctly',
      'Ensure identifier consistency across files'
    ];
  }

  private generateAccessibilityRecommendations(issues: CategorizedIssue[]): string[] {
    return [
      'Add alt text for images and media content',
      'Include descriptive labels for interactive elements',
      'Ensure proper heading structure and navigation'
    ];
  }

  private generatePerformanceRecommendations(issues: CategorizedIssue[]): string[] {
    return [
      'Optimize XML structure for faster parsing',
      'Minimize redundant elements and attributes',
      'Consider content packaging optimizations'
    ];
  }

  private generateBestPracticeRecommendations(issues: CategorizedIssue[]): string[] {
    return [
      'Follow QTI 3.0 best practices and conventions',
      'Add descriptive metadata and documentation',
      'Use semantic element names and structure'
    ];
  }

  /**
   * Update compliance metrics
   */
  private updateMetrics(report: ComplianceReport): void {
    this.metrics.validationCount++;
    
    // Update average score
    const totalScore = this.reportHistory.reduce((sum, r) => sum + r.overallScore, 0) + report.overallScore;
    this.metrics.averageScore = totalScore / (this.reportHistory.length + 1);
    
    // Update common issues
    report.validationResults.forEach(result => {
      result.errors.forEach(error => {
        const count = this.metrics.commonIssues.get(error.type) || 0;
        this.metrics.commonIssues.set(error.type, count + 1);
      });
    });

    this.metrics.lastUpdated = new Date();
  }

  /**
   * Generate unique report ID
   */
  private generateReportId(packageInfo: PackageInfo): string {
    const timestamp = Date.now();
    const packageName = packageInfo.name.replace(/[^a-zA-Z0-9]/g, '_');
    return `compliance_${packageName}_${timestamp}`;
  }

  /**
   * Export report in specified format
   */
  async exportReport(report: ComplianceReport, options: ReportOptions): Promise<string> {
    console.log(`📤 Exporting compliance report in ${options.format} format...`);

    switch (options.format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      case 'markdown':
        return this.generateMarkdownReport(report);
      case 'html':
        return this.generateHTMLReport(report);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Generate Markdown report
   */
  private generateMarkdownReport(report: ComplianceReport): string {
    return `# QTI Compliance Report

**Package:** ${report.packageInfo.name}
**Generated:** ${report.timestamp.toISOString()}
**Overall Score:** ${report.overallScore}/100

## Summary
- **Compliance Level:** ${report.summary.complianceLevel}
- **Total Issues:** ${report.summary.totalIssues}
- **Critical Issues:** ${report.summary.criticalIssues}

## Category Breakdown
${Object.entries(report.categoryBreakdown).map(([key, category]) => `
### ${category.name}
- **Score:** ${category.score}/100
- **Errors:** ${category.errorCount}
- **Warnings:** ${category.warningCount}
`).join('')}

## Recommendations
${report.recommendations.map(rec => `
### ${rec.title} (${rec.priority} priority)
${rec.description}

**Action Items:**
${rec.actionItems.map(item => `- ${item}`).join('\n')}
`).join('')}
`;
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(report: ComplianceReport): string {
    return `<!DOCTYPE html>
<html>
<head>
    <title>QTI Compliance Report - ${report.packageInfo.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .score { font-size: 24px; font-weight: bold; }
        .excellent { color: #28a745; }
        .good { color: #17a2b8; }
        .fair { color: #ffc107; }
        .poor { color: #dc3545; }
        .category { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        .recommendation { margin: 15px 0; padding: 10px; background: #f8f9fa; }
    </style>
</head>
<body>
    <h1>QTI Compliance Report</h1>
    <p><strong>Package:</strong> ${report.packageInfo.name}</p>
    <p><strong>Generated:</strong> ${report.timestamp.toISOString()}</p>
    <p class="score ${report.summary.complianceLevel}">Overall Score: ${report.overallScore}/100</p>
    
    <h2>Category Breakdown</h2>
    ${Object.entries(report.categoryBreakdown).map(([key, category]) => `
    <div class="category">
        <h3>${category.name}</h3>
        <p>Score: ${category.score}/100</p>
        <p>Errors: ${category.errorCount}, Warnings: ${category.warningCount}</p>
    </div>
    `).join('')}
    
    <h2>Recommendations</h2>
    ${report.recommendations.map(rec => `
    <div class="recommendation">
        <h3>${rec.title}</h3>
        <p><strong>Priority:</strong> ${rec.priority}</p>
        <p>${rec.description}</p>
    </div>
    `).join('')}
</body>
</html>`;
  }

  /**
   * Get compliance metrics
   */
  getMetrics(): ComplianceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get report history
   */
  getReportHistory(): ComplianceReport[] {
    return [...this.reportHistory];
  }

  /**
   * Clear report history
   */
  clearHistory(): void {
    this.reportHistory = [];
    this.metrics = {
      validationCount: 0,
      averageScore: 0,
      commonIssues: new Map(),
      improvementRate: 0,
      validationTime: 0,
      lastUpdated: new Date()
    };
  }
}

// Default compliance reporter instance
export const defaultComplianceReporter = new ComplianceReporter();