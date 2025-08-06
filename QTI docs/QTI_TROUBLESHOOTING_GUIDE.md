# QTI Troubleshooting Guide

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Status**: ✅ PRODUCTION READY  

## 📋 **Overview**

This guide provides comprehensive troubleshooting information for the QTI (Question & Test Interoperability) 3.0 package generation system. It covers common issues, diagnostic procedures, error resolution, and performance optimization techniques.

## 🚨 **Common Issues & Solutions**

### **Generation Errors**

#### **Issue: "Invalid story structure" Error**

**Symptoms:**
```
Error: Invalid story structure - missing required field 'title'
```

**Causes:**
- Story object missing required fields
- Incorrect data structure format
- Null or undefined story input

**Solutions:**
```typescript
// ✅ Correct story structure
const validStory = {
  title: "The Adventure",           // Required
  sections: [{                      // Required array
    content: "Story content...",    // Required
    questions: [{                   // Required array
      question: "What happened?",   // Required
      type: "multiple_choice",      // Required
      options: ["A", "B", "C"],     // Required for multiple_choice
      correct: "A"                  // Required
    }]
  }]
};

// ❌ Invalid story structure
const invalidStory = {
  // Missing title
  sections: [{
    // Missing content
    questions: [{
      question: "What happened?",
      // Missing type
      // Missing options for multiple_choice
      correct: "A"
    }]
  }]
};
```

**Prevention:**
```typescript
// Validate story structure before generation
function validateStoryStructure(story: any): boolean {
  if (!story || typeof story !== 'object') return false;
  if (!story.title || typeof story.title !== 'string') return false;
  if (!Array.isArray(story.sections)) return false;
  
  return story.sections.every((section: any) => {
    if (!section.content || typeof section.content !== 'string') return false;
    if (!Array.isArray(section.questions)) return false;
    
    return section.questions.every((question: any) => {
      if (!question.question || !question.type || !question.correct) return false;
      if (question.type === 'multiple_choice' && !Array.isArray(question.options)) return false;
      return true;
    });
  });
}
```

#### **Issue: Template Loading Failures**

**Symptoms:**
```
Error: Template 'assessment-test' not found
TemplateError: Failed to load template from path
```

**Causes:**
- Missing template files
- Incorrect template path configuration
- Permission issues accessing template directory

**Solutions:**
```typescript
// Check template path configuration
const templateLoader = new TemplateLoader('./src/lib/qti/templates', true);

// Verify template files exist
import { existsSync } from 'fs';
const templatePath = './src/lib/qti/templates/assessment-test.xml';
if (!existsSync(templatePath)) {
  console.error('Template file missing:', templatePath);
}

// Use absolute paths in production
const absoluteTemplatePath = path.resolve(__dirname, '../lib/qti/templates');
const loader = new TemplateLoader(absoluteTemplatePath, true);
```

**File Check:**
```bash
# Verify template files exist
ls -la src/lib/qti/templates/
# Should show:
# assessment-test.xml
# assessment-section.xml  
# assessment-item.xml
# imsmanifest.xml
```

#### **Issue: XML Generation Errors**

**Symptoms:**
```
Error: Invalid XML character in content
XMLError: Malformed XML structure
```

**Causes:**
- Special characters in story content
- Unescaped XML entities
- Invalid XML structure in templates

**Solutions:**
```typescript
// Use XMLBuilder for safe XML generation
import { XMLBuilder } from '@/lib/qti/utils';

// Escape content automatically
const safeContent = XMLBuilder.escapeXML(story.content);

// Validate generated XML
const isValid = XMLBuilder.validateXML(generatedXML);
if (!isValid) {
  console.error('Generated XML is invalid');
}
```

**Content Sanitization:**
```typescript
function sanitizeContent(content: string): string {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
}
```

### **Validation Errors**

#### **Issue: Schema Validation Failures**

**Symptoms:**
```
ValidationError: Element 'qti-assessment-test' is not valid
Schema validation failed: Missing required attribute 'identifier'
```

**Causes:**
- Generated XML doesn't conform to QTI 3.0 schema
- Missing required elements or attributes
- Incorrect XML namespace declarations

**Solutions:**
```typescript
// Enable detailed validation logging
const validator = new QTIValidator({
  strictMode: false,  // Don't treat warnings as errors initially
  enablePerformanceMetrics: true
});

const result = validator.validateAssessmentTest(xml);

// Examine validation errors in detail
result.errors.forEach(error => {
  console.log(`Line ${error.line}: ${error.message}`);
  console.log(`Context: ${error.context}`);
});
```

**Schema Issues Resolution:**
```typescript
// Ensure proper namespace declarations
const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" 
                     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                     xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 
                                       http://www.imsglobal.org/xsd/qti/qtiv3p0/imsqti_asiv3p0.xsd"
                     identifier="${identifier}"
                     title="${title}">`;

// Verify all required attributes are present
const requiredAttributes = ['identifier', 'title'];
requiredAttributes.forEach(attr => {
  if (!element.hasAttribute(attr)) {
    console.error(`Missing required attribute: ${attr}`);
  }
});
```

#### **Issue: Low Compliance Scores**

**Symptoms:**
```
Compliance Score: 45/100
Warning: Multiple QTI standard violations detected
```

**Causes:**
- Missing optional but recommended elements
- Suboptimal QTI structure
- Accessibility issues

**Solutions:**
```typescript
// Generate detailed compliance report
const reporter = new ComplianceReporter();
const report = await reporter.generateComplianceReport(qtiPackage, {
  includeRecommendations: true,
  detailLevel: 'comprehensive'
});

// Review and implement recommendations
report.recommendations.forEach(rec => {
  console.log(`${rec.priority}: ${rec.title}`);
  console.log(`Description: ${rec.description}`);
  console.log(`Action: ${rec.actionSteps.join(', ')}`);
});

// Focus on high-impact improvements
const criticalIssues = report.issues.filter(issue => issue.severity === 'CRITICAL');
console.log(`Critical issues to fix: ${criticalIssues.length}`);
```

### **Performance Issues**

#### **Issue: Slow Generation Times**

**Symptoms:**
```
Generation taking > 5 seconds for simple stories
Memory usage growing continuously
High CPU usage during generation
```

**Causes:**
- Template caching disabled
- Large story content
- Memory leaks
- Inefficient processing

**Solutions:**
```typescript
// Enable caching for better performance
const optimizedGenerator = new QTIGenerator(
  undefined, // Use default transformer
  new TemplateLoader('./templates', true), // Enable caching
  // ... other components
);

// Monitor performance
const startTime = Date.now();
const startMemory = process.memoryUsage().heapUsed;

const package = await optimizedGenerator.generatePackage(story, {
  optimizePerformance: true,
  includeMetadata: false,    // Skip if not needed
  validateContent: false     // Skip for development
});

const endTime = Date.now();
const endMemory = process.memoryUsage().heapUsed;

console.log(`Generation time: ${endTime - startTime}ms`);
console.log(`Memory used: ${(endMemory - startMemory) / 1024 / 1024}MB`);
```

**Performance Optimization:**
```typescript
// Batch processing for multiple stories
async function optimizedBatchGeneration(stories: StoryGenerationResponse[]) {
  const batchSize = 5;
  const results = [];
  
  for (let i = 0; i < stories.length; i += batchSize) {
    const batch = stories.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(story => generator.generatePackage(story, {
        optimizePerformance: true
      }))
    );
    results.push(...batchResults);
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}
```

#### **Issue: Memory Leaks**

**Symptoms:**
```
Node.js heap out of memory
Gradual memory increase over time
Process crashes after multiple generations
```

**Causes:**
- Circular references in generated objects
- Event listeners not being removed
- Large objects not being garbage collected

**Solutions:**
```typescript
// Monitor memory usage
function monitorMemory() {
  const usage = process.memoryUsage();
  console.log({
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
    rss: `${Math.round(usage.rss / 1024 / 1024)} MB`
  });
}

// Clean up after generation
async function safeGeneration(story: StoryGenerationResponse) {
  let generator: QTIGenerator | null = new QTIGenerator();
  
  try {
    const result = await generator.generatePackage(story);
    return result;
  } finally {
    // Clean up references
    generator = null;
    
    // Force garbage collection in development
    if (process.env.NODE_ENV === 'development' && global.gc) {
      global.gc();
    }
  }
}
```

### **Integration Issues**

#### **Issue: API Integration Failures**

**Symptoms:**
```
HTTP 500: Internal Server Error
Connection timeout
Invalid JSON response
```

**Causes:**
- Network connectivity issues
- Server overload
- Invalid request format
- Authentication failures

**Solutions:**
```typescript
// Implement retry logic with exponential backoff
async function resilientApiCall(url: string, data: any, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-Request-ID': generateRequestId()
        },
        body: JSON.stringify(data),
        timeout: 30000 // 30 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
      
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}
```

**Request Validation:**
```typescript
// Validate requests before sending
function validateApiRequest(data: any): string[] {
  const errors = [];
  
  if (!data.story) {
    errors.push('Missing story data');
  }
  
  if (data.story && !data.story.title) {
    errors.push('Story missing title');
  }
  
  if (data.story && !Array.isArray(data.story.sections)) {
    errors.push('Story sections must be an array');
  }
  
  return errors;
}
```

#### **Issue: LMS Import Failures**

**Symptoms:**
```
Moodle: "Invalid QTI package format"
Canvas: "Package import failed"
Package not recognized by LMS
```

**Causes:**
- Incompatible QTI version
- Missing manifest files
- Incorrect package structure
- LMS-specific requirements not met

**Solutions:**
```typescript
// Create LMS-specific packages
class LMSCompatibilityLayer {
  static async createMoodlePackage(qtiPackage: GeneratedQTIPackage): Promise<Buffer> {
    const JSZip = require('jszip');
    const zip = new JSZip();
    
    // Moodle-specific structure
    zip.file('imsmanifest.xml', this.adaptManifestForMoodle(qtiPackage.manifest.xml));
    zip.file('assessment.xml', qtiPackage.assessmentTest.xml);
    
    // Add items with Moodle naming
    qtiPackage.assessmentItems.forEach((item, index) => {
      zip.file(`question_${index + 1}.xml`, item.xml);
    });
    
    return await zip.generateAsync({ type: 'nodebuffer' });
  }
  
  static async createCanvasPackage(qtiPackage: GeneratedQTIPackage): Promise<Buffer> {
    const JSZip = require('jszip');
    const zip = new JSZip();
    
    // Canvas-specific structure
    zip.file('imsmanifest.xml', qtiPackage.manifest.xml);
    zip.file('assessment_qti.xml', qtiPackage.assessmentTest.xml);
    
    // Canvas naming convention
    qtiPackage.assessmentItems.forEach((item, index) => {
      zip.file(`assessment_question_${index + 1}.xml`, item.xml);
    });
    
    return await zip.generateAsync({ type: 'nodebuffer' });
  }
}
```

**Package Validation:**
```typescript
// Validate package before LMS import
async function validateForLMS(qtiPackage: GeneratedQTIPackage, lmsType: string) {
  const validator = new QTIValidator();
  
  // Basic QTI validation
  const testResult = validator.validateAssessmentTest(qtiPackage.assessmentTest.xml);
  const manifestResult = validator.validateManifest(qtiPackage.manifest.xml);
  
  if (!testResult.isValid || !manifestResult.isValid) {
    throw new Error('Package fails basic QTI validation');
  }
  
  // LMS-specific validation
  switch (lmsType.toLowerCase()) {
    case 'moodle':
      await this.validateMoodleCompatibility(qtiPackage);
      break;
    case 'canvas':
      await this.validateCanvasCompatibility(qtiPackage);
      break;
    default:
      console.warn(`Unknown LMS type: ${lmsType}`);
  }
}
```

## 🔍 **Diagnostic Procedures**

### **Debug Mode Setup**

```typescript
// Enable comprehensive debugging
process.env.QTI_DEBUG = 'true';
process.env.QTI_LOG_LEVEL = 'debug';

// Create debug-enabled generator
const debugGenerator = new QTIGenerator(
  new AIToQTITransformer(/* debug options */),
  new TemplateLoader('./templates', false), // Disable caching for debugging
  // ... other components with debug enabled
);

// Generate with detailed logging
const package = await debugGenerator.generateResilientPackage(
  story,
  options,
  FallbackLevel.STANDARD,
  true // Enable validation for more debugging info
);
```

### **Logging Configuration**

```typescript
// Configure detailed logging
import { createLogger, transports, format } from 'winston';

const logger = createLogger({
  level: process.env.QTI_LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({ 
      filename: 'qti-debug.log',
      level: 'debug'
    }),
    new transports.File({ 
      filename: 'qti-error.log', 
      level: 'error' 
    })
  ]
});

// Use in QTI components
export { logger };
```

### **Performance Profiling**

```typescript
// Profile generation performance
async function profileGeneration(story: StoryGenerationResponse) {
  const profile = {
    phases: {} as Record<string, number>,
    memory: {} as Record<string, number>
  };
  
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;
  
  // Phase 1: Transformation
  const transformStart = Date.now();
  const transformer = new AIToQTITransformer();
  const qtiStructure = await transformer.transform(story);
  profile.phases.transformation = Date.now() - transformStart;
  profile.memory.afterTransformation = process.memoryUsage().heapUsed;
  
  // Phase 2: XML Generation
  const xmlStart = Date.now();
  const generator = new QTIGenerator();
  const package = await generator.generatePackage(story);
  profile.phases.xmlGeneration = Date.now() - xmlStart;
  profile.memory.afterGeneration = process.memoryUsage().heapUsed;
  
  // Phase 3: Validation
  const validationStart = Date.now();
  const validator = new QTIValidator();
  const validationResult = validator.validatePackage(package);
  profile.phases.validation = Date.now() - validationStart;
  profile.memory.afterValidation = process.memoryUsage().heapUsed;
  
  profile.phases.total = Date.now() - startTime;
  profile.memory.total = process.memoryUsage().heapUsed - startMemory;
  
  console.log('Performance Profile:', JSON.stringify(profile, null, 2));
  return profile;
}
```

### **Health Check Implementation**

```typescript
// Comprehensive health check
export class QTIHealthCheck {
  async checkSystem(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkTemplates(),
      this.checkSchemas(),
      this.checkDatabase(),
      this.checkMemory(),
      this.checkGeneration()
    ]);
    
    const results = checks.map((check, index) => ({
      name: ['templates', 'schemas', 'database', 'memory', 'generation'][index],
      status: check.status === 'fulfilled' ? 'healthy' : 'unhealthy',
      details: check.status === 'fulfilled' ? check.value : check.reason
    }));
    
    const overallStatus = results.every(r => r.status === 'healthy') ? 'healthy' : 'degraded';
    
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: results
    };
  }
  
  private async checkTemplates(): Promise<any> {
    const templateLoader = new TemplateLoader();
    const requiredTemplates = ['assessment-test', 'assessment-item', 'imsmanifest'];
    
    for (const template of requiredTemplates) {
      try {
        await templateLoader.loadTemplate(template);
      } catch (error) {
        throw new Error(`Template ${template} failed to load: ${error.message}`);
      }
    }
    
    return { message: 'All templates loaded successfully' };
  }
  
  private async checkGeneration(): Promise<any> {
    const testStory = {
      title: "Health Check Story",
      sections: [{
        content: "This is a test story for health checking.",
        questions: [{
          question: "What is this story for?",
          type: "multiple_choice" as const,
          options: ["Health check", "Production", "Testing"],
          correct: "Health check"
        }]
      }]
    };
    
    const generator = new QTIGenerator();
    const startTime = Date.now();
    
    try {
      const package = await generator.generatePackage(testStory);
      const duration = Date.now() - startTime;
      
      return {
        message: 'Generation test successful',
        duration: `${duration}ms`,
        packageId: package.identifier
      };
    } catch (error) {
      throw new Error(`Generation test failed: ${error.message}`);
    }
  }
}
```

## 🛠️ **Recovery Procedures**

### **System Recovery**

#### **Service Restart Procedure**
```bash
# 1. Check current system status
curl -f http://localhost:3000/health || echo "Service is down"

# 2. Check logs for errors
tail -n 100 /var/log/qti-service/error.log

# 3. Stop service gracefully
pkill -SIGTERM qti-service

# 4. Clear temporary files
rm -rf /tmp/qti-*

# 5. Restart service
systemctl restart qti-service

# 6. Verify restart
curl -f http://localhost:3000/health && echo "Service restored"
```

#### **Database Recovery**
```sql
-- Check database connectivity
SELECT 1;

-- Check table integrity
SELECT COUNT(*) FROM qti_packages;
SELECT COUNT(*) FROM qti_files;

-- Clean up orphaned records
DELETE FROM qti_files 
WHERE package_id NOT IN (SELECT id FROM qti_packages);

-- Rebuild indexes if needed
REINDEX TABLE qti_packages;
REINDEX TABLE qti_files;
```

#### **Cache Recovery**
```typescript
// Clear and rebuild caches
async function rebuildCaches() {
  // Clear template cache
  const templateLoader = new TemplateLoader('./templates', false);
  await templateLoader.clearCache();
  
  // Warm up cache with commonly used templates
  const commonTemplates = ['assessment-test', 'assessment-item', 'imsmanifest'];
  await Promise.all(
    commonTemplates.map(template => templateLoader.loadTemplate(template))
  );
  
  console.log('Template cache rebuilt');
}
```

### **Data Recovery**

#### **Package Recovery from Storage**
```typescript
async function recoverPackageFromStorage(packageId: string) {
  try {
    // Try primary storage
    let package = await primaryStorage.retrievePackage(packageId);
    
    if (!package) {
      // Try backup storage
      package = await backupStorage.retrievePackage(packageId);
      
      if (package) {
        // Restore to primary storage
        await primaryStorage.storePackage(package);
        console.log(`Package ${packageId} recovered from backup`);
      }
    }
    
    return package;
  } catch (error) {
    console.error(`Failed to recover package ${packageId}:`, error);
    return null;
  }
}
```

#### **Corrupt Package Repair**
```typescript
async function repairCorruptPackage(packageId: string) {
  try {
    const package = await database.getPackage(packageId);
    
    if (!package) {
      throw new Error('Package not found');
    }
    
    // Validate package structure
    const validator = new QTIValidator();
    const validationResult = validator.validatePackage(package);
    
    if (validationResult.isValid) {
      console.log('Package is actually valid');
      return package;
    }
    
    // Attempt repair
    const repairedPackage = await this.attemptPackageRepair(package, validationResult);
    
    if (repairedPackage) {
      await database.savePackage(packageId, repairedPackage);
      console.log(`Package ${packageId} repaired successfully`);
      return repairedPackage;
    }
    
    throw new Error('Package repair failed');
    
  } catch (error) {
    console.error(`Failed to repair package ${packageId}:`, error);
    throw error;
  }
}
```

## 📊 **Monitoring & Alerting**

### **Key Metrics to Monitor**

#### **Generation Metrics**
- Generation success rate (target: >95%)
- Average generation time (target: <2 seconds)
- Memory usage per generation (target: <100MB)
- Queue depth for pending generations

#### **Validation Metrics**
- Validation success rate (target: >90%)
- Average compliance score (target: >80)
- Schema validation error rate (target: <5%)

#### **System Metrics**
- API response time (target: <1 second)
- Error rate (target: <5%)
- CPU usage (target: <70%)
- Memory usage (target: <80%)

### **Alert Configuration**

```typescript
// Alert thresholds
const ALERT_THRESHOLDS = {
  generation: {
    successRate: 0.90,      // Alert if below 90%
    avgTime: 5000,          // Alert if above 5 seconds
    errorRate: 0.10         // Alert if above 10%
  },
  system: {
    memoryUsage: 0.85,      // Alert if above 85%
    cpuUsage: 0.80,         // Alert if above 80%
    responseTime: 2000      // Alert if above 2 seconds
  }
};

// Monitoring implementation
class QTIMonitoring {
  checkMetrics() {
    const metrics = this.collectMetrics();
    
    // Check generation metrics
    if (metrics.generation.successRate < ALERT_THRESHOLDS.generation.successRate) {
      this.sendAlert('CRITICAL', 'Low generation success rate', metrics);
    }
    
    // Check system metrics
    if (metrics.system.memoryUsage > ALERT_THRESHOLDS.system.memoryUsage) {
      this.sendAlert('WARNING', 'High memory usage', metrics);
    }
  }
  
  private sendAlert(severity: string, message: string, data: any) {
    // Send to monitoring system (Slack, PagerDuty, etc.)
    console.log(`[${severity}] ${message}:`, data);
  }
}
```

## 📋 **Maintenance Procedures**

### **Regular Maintenance Tasks**

#### **Daily Tasks**
```bash
#!/bin/bash
# daily-maintenance.sh

echo "Starting daily QTI maintenance..."

# Check service health
curl -f http://localhost:3000/health || exit 1

# Check disk space
df -h | grep -E '(8[0-9]|9[0-9])%' && echo "WARNING: High disk usage"

# Clean up old log files
find /var/log/qti-service -name "*.log" -mtime +7 -delete

# Check database performance
psql -d qti_db -c "SELECT schemaname,tablename,n_tup_ins,n_tup_upd,n_tup_del FROM pg_stat_user_tables WHERE schemaname='public';"

echo "Daily maintenance completed"
```

#### **Weekly Tasks**
```bash
#!/bin/bash
# weekly-maintenance.sh

echo "Starting weekly QTI maintenance..."

# Database maintenance
psql -d qti_db -c "VACUUM ANALYZE;"
psql -d qti_db -c "REINDEX DATABASE qti_db;"

# Clean up old packages (>30 days)
psql -d qti_db -c "DELETE FROM qti_packages WHERE created_at < NOW() - INTERVAL '30 days';"

# Update statistics
psql -d qti_db -c "ANALYZE;"

# Check for orphaned files
node scripts/cleanup-orphaned-files.js

echo "Weekly maintenance completed"
```

#### **Monthly Tasks**
```bash
#!/bin/bash
# monthly-maintenance.sh

echo "Starting monthly QTI maintenance..."

# Full database backup
pg_dump qti_db > backups/qti_db_$(date +%Y%m%d).sql

# Performance analysis
node scripts/generate-performance-report.js

# Security audit
npm audit
docker scan qti-service:latest

# Update dependencies
npm update
npm audit fix

echo "Monthly maintenance completed"
```

## 🔧 **Configuration Troubleshooting**

### **Environment Configuration Issues**

```typescript
// Configuration validator
class ConfigValidator {
  static validate(): string[] {
    const errors = [];
    
    // Required environment variables
    const required = [
      'DATABASE_URL',
      'QTI_TEMPLATE_PATH',
      'QTI_SCHEMA_PATH'
    ];
    
    required.forEach(env => {
      if (!process.env[env]) {
        errors.push(`Missing required environment variable: ${env}`);
      }
    });
    
    // Validate paths exist
    if (process.env.QTI_TEMPLATE_PATH && !existsSync(process.env.QTI_TEMPLATE_PATH)) {
      errors.push(`Template path does not exist: ${process.env.QTI_TEMPLATE_PATH}`);
    }
    
    if (process.env.QTI_SCHEMA_PATH && !existsSync(process.env.QTI_SCHEMA_PATH)) {
      errors.push(`Schema path does not exist: ${process.env.QTI_SCHEMA_PATH}`);
    }
    
    // Validate numeric configurations
    const numericConfigs = ['QTI_MAX_ITEMS_PER_SECTION', 'QTI_DEFAULT_TIME_LIMIT'];
    numericConfigs.forEach(config => {
      if (process.env[config] && isNaN(Number(process.env[config]))) {
        errors.push(`Invalid numeric configuration: ${config}`);
      }
    });
    
    return errors;
  }
}

// Run validation on startup
const configErrors = ConfigValidator.validate();
if (configErrors.length > 0) {
  console.error('Configuration errors:', configErrors);
  process.exit(1);
}
```

### **Template Configuration Issues**

```typescript
// Template diagnostics
async function diagnoseTemplates() {
  const templatePath = process.env.QTI_TEMPLATE_PATH || './src/lib/qti/templates';
  const requiredTemplates = [
    'assessment-test.xml',
    'assessment-section.xml',
    'assessment-item.xml',
    'imsmanifest.xml'
  ];
  
  console.log(`Checking templates in: ${templatePath}`);
  
  for (const template of requiredTemplates) {
    const fullPath = path.join(templatePath, template);
    
    if (!existsSync(fullPath)) {
      console.error(`❌ Missing template: ${template}`);
      continue;
    }
    
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      
      // Basic XML validation
      if (!content.includes('<?xml')) {
        console.warn(`⚠️  Template ${template} missing XML declaration`);
      }
      
      // Check for required placeholders
      const placeholders = content.match(/\{\{[^}]+\}\}/g) || [];
      console.log(`✅ Template ${template}: ${placeholders.length} placeholders`);
      
    } catch (error) {
      console.error(`❌ Error reading template ${template}:`, error.message);
    }
  }
}
```

## 📞 **Getting Help**

### **Self-Service Resources**

1. **Check Error Messages**: Error messages include specific guidance and error codes
2. **Review Validation Reports**: Compliance reports include actionable recommendations
3. **Consult Documentation**: Technical documentation covers detailed implementation
4. **Use Debug Mode**: Enable debug logging for detailed troubleshooting information

### **Escalation Procedures**

#### **Level 1: Basic Issues**
- Configuration problems
- Simple validation errors
- Performance questions
- **Resolution Time**: < 1 hour

#### **Level 2: Complex Issues**
- Integration problems
- Custom template issues
- Advanced configuration
- **Resolution Time**: < 4 hours

#### **Level 3: Critical Issues**
- System failures
- Data corruption
- Security incidents
- **Resolution Time**: < 1 hour

### **Information to Provide**

When reporting issues, include:

1. **Error Messages**: Complete error text and stack traces
2. **Configuration**: Environment variables and configuration files
3. **Input Data**: Story content that caused the issue (sanitized)
4. **System Information**: Node.js version, OS, memory, CPU
5. **Steps to Reproduce**: Exact steps that lead to the issue
6. **Expected vs Actual**: What you expected vs what happened

### **Log Collection**

```bash
# Collect comprehensive logs for support
#!/bin/bash
mkdir -p support-logs

# Application logs
cp /var/log/qti-service/*.log support-logs/

# System information
node --version > support-logs/system-info.txt
npm list >> support-logs/system-info.txt
cat /proc/meminfo >> support-logs/system-info.txt
cat /proc/cpuinfo >> support-logs/system-info.txt

# Configuration
env | grep QTI_ > support-logs/qti-config.txt

# Database status
psql -d qti_db -c "\dt" > support-logs/db-tables.txt
psql -d qti_db -c "SELECT COUNT(*) FROM qti_packages;" > support-logs/db-counts.txt

# Create archive
tar -czf support-logs.tar.gz support-logs/
echo "Support logs collected in: support-logs.tar.gz"
```

---

## 📚 **Related Documentation**

- [QTI Technical Architecture](./QTI_TECHNICAL_ARCHITECTURE_DOCUMENTATION.md)
- [QTI API Reference](./QTI_API_REFERENCE.md)
- [QTI User Guide](./QTI_USER_GUIDE.md)
- [QTI Integration Guide](./QTI_INTEGRATION_GUIDE.md)

---

**Document Status**: ✅ **COMPLETE** - Comprehensive troubleshooting guide covering common issues, diagnostic procedures, recovery methods, monitoring, and support escalation procedures.