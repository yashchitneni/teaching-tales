/**
 * @fileoverview Integration Smoke Test for Question Generation Service
 * 
 * This file demonstrates how to perform integration testing with the real AI service.
 * Uncomment and run this test to verify the service works end-to-end.
 * 
 * Note: Requires valid API credentials in environment variables.
 */

import { QuestionGenerationService } from './question-generation-service';
import type { SectionQuestionGenInput } from './types';

/**
 * Smoke test to verify the Question Generation Service works with real AI service
 * 
 * Usage:
 * 1. Set up environment variables (GOOGLE_AI_API_KEY)
 * 2. Uncomment the code below
 * 3. Run: npx ts-node src/lib/ai/question-generation-smoke-test.ts
 */
async function runSmokeTest() {
  console.log('🔥 Starting Question Generation Service Smoke Test...');
  
  const service = new QuestionGenerationService();
  
  // Test input with a simple story section
  const testInput: SectionQuestionGenInput = {
    sectionContent: `
      Once upon a time, in a small village nestled between rolling hills, there lived a young baker named Emma. 
      Every morning, Emma would wake up before dawn to prepare fresh bread for the villagers. 
      She took great pride in her work, carefully measuring each ingredient and kneading the dough with love.
      The aroma of her baking bread would drift through the village streets, waking people with the most wonderful smell.
      One particular morning, Emma discovered something unusual in her flour sack - a tiny, glowing seed.
    `,
    sectionIndex: 0,
    gradeLevel: '4-5',
    constraints: {
      questionCount: 2,
      questionTypes: ['comprehension', 'inference']
    }
  };

  try {
    console.log('📝 Testing question generation...');
    
    const startTime = Date.now();
    const result = await service.generateQuestionsForSection(testInput);
    const endTime = Date.now();
    
    console.log('✅ Question generation successful!');
    console.log(`⏱️  Generation took ${endTime - startTime}ms`);
    console.log(`📊 Metadata:`, result.metadata);
    
    console.log('\n📋 Generated Questions:');
    result.questions.forEach((question, index) => {
      console.log(`\n${index + 1}. ${question.question}`);
      console.log(`   Type: ${question.type}`);
      console.log(`   Question Type: ${question.questionType}`);
      console.log(`   Difficulty: ${question.difficultyLevel}`);
      
      if (question.options) {
        question.options.forEach((option, optionIndex) => {
          const marker = optionIndex === question.correct ? '✅' : '  ';
          console.log(`   ${marker} ${String.fromCharCode(65 + optionIndex)}. ${option}`);
        });
      }
      
      console.log(`   📝 Explanation: ${question.explanation}`);
      
      if (question.validationMetadata) {
        console.log(`   🔍 Validation: ${question.validationMetadata.validationPassed ? 'PASSED' : 'FAILED'}`);
        if (question.validationMetadata.warnings.length > 0) {
          console.log(`   ⚠️  Warnings: ${question.validationMetadata.warnings.join(', ')}`);
        }
      }
    });
    
    console.log('\n🎉 Smoke test completed successfully!');
    
    // Verify service info
    const serviceInfo = service.getServiceInfo();
    console.log('\n📊 Service Information:');
    console.log(`   Name: ${serviceInfo.name}`);
    console.log(`   Version: ${serviceInfo.version}`);
    console.log(`   Model: ${serviceInfo.modelInfo.name}`);
    console.log(`   Supported Question Types: ${serviceInfo.supportedQuestionTypes.join(', ')}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Smoke test failed:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    throw error;
  }
}

/**
 * Run multiple smoke tests with different configurations
 */
async function runComprehensiveSmokeTest() {
  console.log('🚀 Running comprehensive smoke tests...');
  
  const service = new QuestionGenerationService();
  
  const testCases: Array<{ name: string; input: SectionQuestionGenInput }> = [
    {
      name: 'Basic K-1 Test',
      input: {
        sectionContent: 'The cat sat on the mat. The cat was happy. The mat was red.',
        sectionIndex: 0,
        gradeLevel: 'K-1'
      }
    },
    {
      name: 'Elementary 2-3 Test',
      input: {
        sectionContent: 'Sarah planted seeds in her garden. She watered them every day and watched them grow. Soon, beautiful flowers bloomed in many colors.',
        sectionIndex: 1,
        gradeLevel: '2-3'
      }
    },
    {
      name: 'Intermediate 4-5 Test',
      input: {
        sectionContent: 'The ancient civilization developed sophisticated engineering techniques. Their buildings stood strong against earthquakes, and their water systems supplied clean water to thousands of people.',
        sectionIndex: 2,
        gradeLevel: '4-5'
      }
    },
    {
      name: 'Advanced 6-8 Test',
      input: {
        sectionContent: 'The protagonist\'s internal conflict reflected the broader societal tensions of the era. Through her journey, readers witness the transformation of not just an individual, but an entire community grappling with change.',
        sectionIndex: 3,
        gradeLevel: '6-8',
        constraints: {
          questionCount: 3,
          questionTypes: ['comprehension', 'vocabulary', 'inference']
        }
      }
    }
  ];
  
  const results = [];
  
  for (const testCase of testCases) {
    console.log(`\n🧪 Running test: ${testCase.name}`);
    try {
      const result = await service.generateQuestionsForSection(testCase.input);
      console.log(`✅ ${testCase.name} - SUCCESS (${result.questions.length} questions, ${result.metadata.generationTimeMs}ms)`);
      results.push({ ...testCase, result, success: true });
    } catch (error) {
      console.error(`❌ ${testCase.name} - FAILED:`, error instanceof Error ? error.message : 'Unknown error');
      results.push({ ...testCase, error, success: false });
    }
  }
  
  console.log('\n📊 Comprehensive Test Results:');
  results.forEach(({ name, success, result, error }) => {
    if (success && result) {
      console.log(`✅ ${name}: ${result.questions.length} questions, validation: ${result.metadata.validationPassed}`);
    } else {
      console.log(`❌ ${name}: FAILED - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n🎯 Overall Results: ${successCount}/${results.length} tests passed`);
  
  return results;
}

// Uncomment to run smoke tests
// Note: Requires valid API credentials

/*
async function main() {
  try {
    // Run basic smoke test
    await runSmokeTest();
    
    // Run comprehensive tests
    await runComprehensiveSmokeTest();
    
    process.exit(0);
  } catch (error) {
    console.error('Smoke test suite failed:', error);
    process.exit(1);
  }
}

// Uncomment to run
// main();
*/

export { runSmokeTest, runComprehensiveSmokeTest };
