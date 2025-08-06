# QTI User Guide

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Status**: ✅ PRODUCTION READY  

## 📋 **Overview**

This guide provides comprehensive instructions for using the QTI (Question & Test Interoperability) 3.0 package generation system. Whether you're a developer integrating QTI functionality or an educator creating assessments, this guide will help you get started and make the most of the system's capabilities.

## 🚀 **Quick Start**

### **Basic Setup**

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Import QTI Components**
   ```typescript
   import { QTIGenerator } from '@/lib/qti';
   ```

3. **Generate Your First QTI Package**
   ```typescript
   const generator = new QTIGenerator();
   const storyResponse = {
     title: "The Magic Garden",
     sections: [{
       content: "Lucy found a magical garden behind her house. The flowers could sing and the trees could dance.",
       questions: [{
         question: "What did Lucy find behind her house?",
         type: "multiple_choice",
         options: ["A playground", "A magical garden", "A pond", "A shed"],
         correct: "A magical garden"
       }]
     }]
   };

   const qtiPackage = await generator.generatePackage(storyResponse);
   console.log(`Generated QTI package: ${qtiPackage.identifier}`);
   ```

## 🎯 **Core Concepts**

### **What is QTI?**

QTI (Question & Test Interoperability) is an open standard for representing assessment content. It enables:
- **Interoperability**: Assessments work across different platforms
- **Standardization**: Consistent format for educational assessments
- **Portability**: Move assessments between learning management systems
- **Accessibility**: Built-in support for accessibility standards

### **Story-to-Assessment Transformation**

The system transforms AI-generated stories into interactive assessments by:
1. **Analyzing Story Structure**: Identifying sections and narrative flow
2. **Extracting Questions**: Converting comprehension questions to QTI format
3. **Creating Adaptive Logic**: Adding branching based on student performance
4. **Ensuring Compliance**: Validating against QTI 3.0 standards

### **Key Components**

- **Assessment Test**: The overall assessment structure
- **Assessment Sections**: Logical groupings of questions
- **Assessment Items**: Individual questions with interactions
- **Branching Rules**: Conditional navigation logic
- **Manifest**: Package metadata and file references

## 📚 **Getting Started**

### **Step 1: Prepare Your Story Content**

Your story should follow this structure:

```typescript
interface StoryGenerationResponse {
  title: string;                    // Story title
  sections: StorySection[];         // Story sections
}

interface StorySection {
  content: string;                  // Section narrative content
  questions: ComprehensionQuestion[]; // Comprehension questions
}

interface ComprehensionQuestion {
  question: string;                 // Question text
  type: 'multiple_choice' | 'short_answer' | 'essay';
  options?: string[];               // Answer options (for multiple choice)
  correct: string;                  // Correct answer
}
```

**Example Story:**
```typescript
const myStory = {
  title: "The Time Traveler's Adventure",
  sections: [
    {
      content: "Emma discovered an ancient clock in her grandmother's attic. When she touched it, she was transported to ancient Egypt.",
      questions: [
        {
          question: "Where did Emma find the clock?",
          type: "multiple_choice",
          options: ["Basement", "Attic", "Kitchen", "Garden"],
          correct: "Attic"
        },
        {
          question: "Where was Emma transported to?",
          type: "multiple_choice",
          options: ["Ancient Rome", "Medieval England", "Ancient Egypt", "The Future"],
          correct: "Ancient Egypt"
        }
      ]
    },
    {
      content: "In ancient Egypt, Emma met a young pharaoh who needed help solving riddles to unlock a treasure chamber.",
      questions: [
        {
          question: "Who did Emma meet in ancient Egypt?",
          type: "multiple_choice",
          options: ["A merchant", "A young pharaoh", "A priest", "A farmer"],
          correct: "A young pharaoh"
        },
        {
          question: "What did the pharaoh need help with?",
          type: "short_answer",
          correct: "solving riddles"
        }
      ]
    }
  ]
};
```

### **Step 2: Configure Generation Options**

Customize your QTI package with generation options:

```typescript
const options = {
  // Time Management
  timeLimit: 1800,                 // 30 minutes (in seconds)
  showTimer: true,                 // Display timer to students
  
  // Question Behavior
  shuffleChoices: true,            // Randomize answer choices
  shuffleSections: false,          // Keep story sections in order
  enableFeedback: true,            // Show feedback after answers
  
  // Advanced Features
  enableBranching: true,           // Enable adaptive branching
  adaptiveProgression: true,       // Maintain story flow
  
  // Quality Settings
  preserveStoryOrder: true,        // Keep narrative sequence
  validateContent: true            // Enable content validation
};
```

### **Step 3: Generate QTI Package**

Choose the generation method that fits your needs:

#### **Basic Generation**
```typescript
const qtiPackage = await generator.generatePackage(myStory, options);
```

#### **Generation with Validation**
```typescript
const validatedPackage = await generator.generateValidatedPackage(myStory, options);

// Check validation results
if (validatedPackage.validation?.success) {
  console.log('✅ Package validated successfully');
  console.log(`Compliance Score: ${validatedPackage.validation.complianceReport?.overallScore}/100`);
} else {
  console.log('❌ Validation failed');
  validatedPackage.validation?.errors.forEach(error => {
    console.log(`Error: ${error.message}`);
  });
}
```

#### **Resilient Generation (Recommended)**
```typescript
import { FallbackLevel } from '@/lib/qti';

const resilientPackage = await generator.generateResilientPackage(
  myStory,
  options,
  FallbackLevel.STANDARD,  // Fallback level
  true                     // Enable validation
);
```

### **Step 4: Use the Generated Package**

The generated package contains everything needed for deployment:

```typescript
// Access package components
console.log('Package ID:', resilientPackage.identifier);
console.log('Assessment Test XML:', resilientPackage.assessmentTest.xml);
console.log('Number of Items:', resilientPackage.assessmentItems.length);
console.log('Manifest XML:', resilientPackage.manifest.xml);

// Save files for deployment
Object.entries(resilientPackage.files).forEach(([filename, content]) => {
  // Save each file for LMS deployment
  console.log(`File: ${filename} (${content.length} characters)`);
});
```

## 🔧 **Configuration Guide**

### **Generation Options**

#### **Time and Navigation Settings**
```typescript
{
  timeLimit: 3600,                 // Assessment time limit (seconds)
  showTimer: true,                 // Show countdown timer
  allowReview: true,               // Allow students to review answers
}
```

#### **Question Behavior Settings**
```typescript
{
  shuffleChoices: true,            // Randomize answer order
  shuffleSections: false,          // Keep story sections in order
  enableFeedback: true,            // Show answer feedback
  showCorrectAnswers: false,       // Hide correct answers initially
}
```

#### **Advanced Features**
```typescript
{
  enableBranching: true,           // Enable adaptive branching
  branchingStrategy: 'PERFORMANCE_BASED', // Branching algorithm
  adaptiveProgression: true,       // Maintain story narrative
}
```

#### **Quality Control**
```typescript
{
  preserveStoryOrder: true,        // Maintain narrative sequence
  enhanceQuestions: true,          // Apply question improvements
  validateContent: true,           // Enable content validation
}
```

### **Validation Configuration**

```typescript
const validationOptions = {
  enableSchemaValidation: true,    // XSD schema validation
  enableComplianceChecking: true, // QTI compliance analysis
  strictMode: false,               // Treat warnings as errors
  validationLevel: 'standard'     // Validation depth
};
```

### **Error Handling Configuration**

```typescript
const errorOptions = {
  enableEnhancedErrors: true,      // Detailed error information
  enableAutomaticRecovery: true,   // Automatic error recovery
  fallbackLevel: 'STANDARD',      // Recovery level
  maxRecoveryAttempts: 3          // Maximum retry attempts
};
```

## 🎨 **Question Types Guide**

### **Multiple Choice Questions**

**Best for**: Factual recall, concept identification, simple comprehension

```typescript
{
  question: "What color was the dragon in the story?",
  type: "multiple_choice",
  options: ["Red", "Blue", "Green", "Gold"],
  correct: "Red"
}
```

**Generated QTI**: Creates `choiceInteraction` with randomizable options

### **Short Answer Questions**

**Best for**: Fill-in-the-blank, simple recall, vocabulary

```typescript
{
  question: "What was the name of the main character?",
  type: "short_answer",
  correct: "Emma"
}
```

**Generated QTI**: Creates `textEntryInteraction` with text matching

### **Essay Questions**

**Best for**: Analysis, explanation, creative response

```typescript
{
  question: "Describe how Emma changed throughout her adventure.",
  type: "essay",
  correct: "Sample answer showing character growth..."
}
```

**Generated QTI**: Creates `extendedTextInteraction` for long-form responses

## 🌟 **Advanced Features**

### **Adaptive Branching**

Enable branching to create personalized learning paths:

```typescript
const options = {
  enableBranching: true,
  branchingStrategy: 'PERFORMANCE_BASED',
  adaptiveProgression: true
};

const package = await generator.generatePackage(story, options);
```

**How it works**:
- **High Performance**: Students advance to challenging content
- **Medium Performance**: Students get standard progression
- **Low Performance**: Students receive additional support content

### **Story Coherence**

Maintain narrative flow even with adaptive branching:

```typescript
const options = {
  enableBranching: true,
  adaptiveProgression: true,      // Maintains story continuity
  preserveStoryOrder: true        // Keeps sections in logical order
};
```

### **Content Enhancement**

Automatically improve question quality:

```typescript
const options = {
  enhanceQuestions: true,         // Apply question improvements
  validateContent: true           // Ensure content quality
};
```

## 🔍 **Validation and Quality Assurance**

### **Understanding Validation Results**

```typescript
const package = await generator.generateValidatedPackage(story, options);

if (package.validation) {
  // Overall validation status
  console.log(`Validation Success: ${package.validation.success}`);
  
  // Compliance scoring
  const compliance = package.validation.complianceReport;
  if (compliance) {
    console.log(`Compliance Score: ${compliance.overallScore}/100`);
    
    // Category breakdown
    Object.entries(compliance.categoryScores).forEach(([category, score]) => {
      console.log(`${category}: ${score}/100`);
    });
    
    // Recommendations for improvement
    compliance.recommendations.forEach(rec => {
      console.log(`💡 ${rec.title}: ${rec.description}`);
    });
  }
  
  // Validation errors and warnings
  package.validation.errors.forEach(error => {
    console.log(`❌ Error: ${error.message}`);
  });
  
  package.validation.warnings.forEach(warning => {
    console.log(`⚠️ Warning: ${warning.message}`);
  });
}
```

### **Quality Scoring**

The system provides quality scores across multiple categories:

- **Schema Compliance** (30% weight): Adherence to QTI 3.0 standards
- **Content Quality** (25% weight): Story preservation and question accuracy
- **Accessibility** (20% weight): WCAG compliance and inclusive design
- **Interoperability** (15% weight): Cross-platform compatibility
- **Performance** (10% weight): Generation efficiency and optimization

### **Improving Quality Scores**

**To improve Schema Compliance**:
- Ensure all required story fields are provided
- Use supported question types
- Provide complete answer options

**To improve Content Quality**:
- Write clear, complete story sections
- Create well-formed questions
- Provide accurate answer keys

**To improve Accessibility**:
- Use descriptive question text
- Avoid relying solely on visual elements
- Provide alternative text for images

## 🚨 **Error Handling Guide**

### **Common Errors and Solutions**

#### **Invalid Story Structure**
```
Error: Missing required field 'title'
Solution: Ensure your story object includes a title property
```

#### **Malformed Questions**
```
Error: Multiple choice question missing options
Solution: Provide options array for multiple_choice questions
```

#### **Template Loading Errors**
```
Error: Template 'assessment-test' not found
Solution: Verify template files are in the correct directory
```

### **Using Error Recovery**

The system provides automatic error recovery:

```typescript
import { FallbackLevel } from '@/lib/qti';

try {
  const package = await generator.generateResilientPackage(
    story,
    options,
    FallbackLevel.AGGRESSIVE  // More aggressive recovery
  );
  
  // Check if recovery was used
  if (package.metadata.recoveryUsed) {
    console.log('⚠️ Package generated using error recovery');
    console.log(`Recovery strategy: ${package.metadata.recoveryStrategy}`);
  }
  
} catch (error) {
  console.error('Generation failed even with recovery:', error.message);
  
  // Try with emergency fallback
  const emergencyPackage = await generator.generateResilientPackage(
    story,
    options,
    FallbackLevel.EMERGENCY
  );
}
```

### **Fallback Levels**

- **MINIMAL**: Basic error recovery only
- **STANDARD**: Standard recovery strategies (recommended)
- **AGGRESSIVE**: Comprehensive recovery attempts
- **EMERGENCY**: Last-resort generation with minimal features

## 📊 **Performance Optimization**

### **Optimizing Generation Speed**

```typescript
// Enable performance optimizations
const options = {
  optimizePerformance: true,      // Enable all optimizations
  includeMetadata: false,         // Reduce metadata generation
  validateContent: false          // Skip content validation for speed
};

// Use caching for repeated generations
const generator = new QTIGenerator(
  undefined,                      // Default transformer
  new TemplateLoader('./templates', true), // Enable template caching
  // ... other components
);
```

### **Batch Processing**

For multiple stories, use batch processing:

```typescript
async function generateMultiplePackages(stories: StoryGenerationResponse[]) {
  const generator = new QTIGenerator();
  
  // Process in batches to manage memory
  const batchSize = 5;
  const results = [];
  
  for (let i = 0; i < stories.length; i += batchSize) {
    const batch = stories.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(story => generator.generatePackage(story))
    );
    results.push(...batchResults);
    
    // Optional: Force garbage collection
    if (global.gc) global.gc();
  }
  
  return results;
}
```

### **Memory Management**

For large-scale processing:

```typescript
// Monitor memory usage
const initialMemory = process.memoryUsage().heapUsed;

const package = await generator.generatePackage(story);

const finalMemory = process.memoryUsage().heapUsed;
const memoryUsed = (finalMemory - initialMemory) / 1024 / 1024; // MB
console.log(`Memory used: ${memoryUsed.toFixed(2)} MB`);
```

## 🔗 **Integration Examples**

### **Express.js API Integration**

```typescript
import express from 'express';
import { QTIGenerator, FallbackLevel } from '@/lib/qti';

const app = express();
const generator = new QTIGenerator();

app.post('/api/generate-qti', async (req, res) => {
  try {
    const { story, options } = req.body;
    
    // Validate input
    if (!story || !story.title) {
      return res.status(400).json({
        error: 'Invalid story structure',
        message: 'Story must include title and sections'
      });
    }
    
    // Generate QTI package
    const qtiPackage = await generator.generateResilientPackage(
      story,
      options || {},
      FallbackLevel.STANDARD,
      true
    );
    
    // Return package information
    res.json({
      success: true,
      packageId: qtiPackage.identifier,
      validation: {
        success: qtiPackage.validation?.success || false,
        complianceScore: qtiPackage.validation?.complianceReport?.overallScore || 0
      },
      files: Object.keys(qtiPackage.files),
      metadata: qtiPackage.metadata
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.context
    });
  }
});
```

### **Database Storage Integration**

```typescript
import { QTIGenerator } from '@/lib/qti';
import { database } from './database';

async function generateAndStore(storyId: string, story: StoryGenerationResponse) {
  const generator = new QTIGenerator();
  
  // Generate QTI package
  const qtiPackage = await generator.generateValidatedPackage(story);
  
  // Store in database
  const record = await database.qtiPackages.create({
    id: qtiPackage.identifier,
    storyId: storyId,
    packageData: JSON.stringify(qtiPackage),
    validationResults: JSON.stringify(qtiPackage.validation),
    complianceScore: qtiPackage.validation?.complianceReport?.overallScore || 0,
    createdAt: new Date()
  });
  
  // Store individual files if needed
  for (const [filename, content] of Object.entries(qtiPackage.files)) {
    await database.qtiFiles.create({
      packageId: qtiPackage.identifier,
      filename: filename,
      content: content,
      contentType: filename.endsWith('.xml') ? 'application/xml' : 'text/plain'
    });
  }
  
  return record.id;
}
```

### **React Component Integration**

```typescript
import React, { useState } from 'react';
import { QTIGenerator } from '@/lib/qti';

const QTIGeneratorComponent: React.FC = () => {
  const [story, setStory] = useState<StoryGenerationResponse | null>(null);
  const [qtiPackage, setQtiPackage] = useState<GeneratedQTIPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQTI = async () => {
    if (!story) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const generator = new QTIGenerator();
      const package = await generator.generateValidatedPackage(story, {
        timeLimit: 1800,
        enableBranching: true,
        shuffleChoices: true
      });
      
      setQtiPackage(package);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>QTI Package Generator</h2>
      
      {/* Story input form */}
      <div>
        <textarea
          placeholder="Enter story JSON..."
          onChange={(e) => {
            try {
              setStory(JSON.parse(e.target.value));
            } catch {
              // Invalid JSON - ignore
            }
          }}
        />
      </div>
      
      {/* Generate button */}
      <button onClick={generateQTI} disabled={!story || loading}>
        {loading ? 'Generating...' : 'Generate QTI Package'}
      </button>
      
      {/* Error display */}
      {error && (
        <div style={{ color: 'red' }}>
          Error: {error}
        </div>
      )}
      
      {/* Results display */}
      {qtiPackage && (
        <div>
          <h3>Generated Package: {qtiPackage.identifier}</h3>
          <p>Items: {qtiPackage.assessmentItems.length}</p>
          <p>Validation: {qtiPackage.validation?.success ? '✅ Passed' : '❌ Failed'}</p>
          {qtiPackage.validation?.complianceReport && (
            <p>Compliance Score: {qtiPackage.validation.complianceReport.overallScore}/100</p>
          )}
        </div>
      )}
    </div>
  );
};
```

## 📋 **Best Practices**

### **Story Writing Guidelines**

1. **Clear Structure**: Organize content into logical sections
2. **Engaging Content**: Write compelling narratives that hold attention
3. **Appropriate Length**: Keep sections to 2-3 paragraphs for readability
4. **Educational Value**: Ensure content supports learning objectives

### **Question Design Guidelines**

1. **Clear Language**: Use simple, direct language in questions
2. **Appropriate Difficulty**: Match question difficulty to target audience
3. **Avoid Ambiguity**: Ensure questions have clear, unambiguous answers
4. **Varied Types**: Use different question types for engagement

### **Quality Assurance**

1. **Always Validate**: Use `generateValidatedPackage()` for production
2. **Monitor Compliance**: Aim for compliance scores above 85
3. **Test Thoroughly**: Test generated packages in target LMS systems
4. **Review Content**: Human review of generated assessments is recommended

### **Performance Guidelines**

1. **Use Caching**: Enable template and validation caching
2. **Batch Processing**: Process multiple stories in batches
3. **Monitor Memory**: Watch memory usage for large-scale operations
4. **Optimize Options**: Disable unnecessary features for better performance

### **Error Handling**

1. **Use Resilient Generation**: Prefer `generateResilientPackage()` for reliability
2. **Handle Gracefully**: Always handle potential errors in your application
3. **Log Appropriately**: Log errors for debugging and monitoring
4. **Provide Fallbacks**: Have fallback strategies for critical workflows

## 🔧 **Troubleshooting**

### **Common Issues**

#### **Generation Fails**
- Check story structure matches expected format
- Verify all required fields are present
- Try with simpler options first

#### **Validation Errors**
- Review validation error messages for specific issues
- Check question formats and answer keys
- Ensure story content doesn't contain problematic characters

#### **Performance Issues**
- Enable caching for repeated operations
- Process stories in smaller batches
- Monitor memory usage and implement cleanup

#### **Integration Problems**
- Verify import paths are correct
- Check that all dependencies are installed
- Ensure TypeScript configuration includes QTI types

### **Getting Help**

1. **Check Error Messages**: Error messages provide specific guidance
2. **Review Validation Reports**: Compliance reports include actionable recommendations
3. **Consult Documentation**: Refer to technical documentation for detailed information
4. **Test with Simple Examples**: Start with basic examples and gradually add complexity

## 📚 **Next Steps**

### **Learning More**

- **Technical Documentation**: Dive deeper into system architecture
- **API Reference**: Explore all available methods and options
- **Integration Guide**: Learn about advanced integration scenarios
- **Troubleshooting Guide**: Get help with specific issues

### **Advanced Usage**

- **Custom Templates**: Create custom QTI templates for specialized needs
- **Extended Validation**: Implement custom validation rules
- **Performance Monitoring**: Set up monitoring for production deployments
- **Batch Processing**: Implement large-scale content processing

---

## 📚 **Related Documentation**

- [QTI Technical Architecture](./QTI_TECHNICAL_ARCHITECTURE_DOCUMENTATION.md)
- [QTI API Reference](./QTI_API_REFERENCE.md)
- [QTI Integration Guide](./QTI_INTEGRATION_GUIDE.md)
- [QTI Troubleshooting Guide](./QTI_TROUBLESHOOTING_GUIDE.md)

---

**Document Status**: ✅ **COMPLETE** - Comprehensive user guide covering setup, configuration, usage patterns, and best practices for the QTI package generation system.