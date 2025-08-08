/**
 * @fileoverview Question Mapping Service
 * 
 * This module provides advanced question mapping capabilities for transforming
 * AI comprehension questions into QTI assessment items with sophisticated
 * interaction types, response processing, and adaptive difficulty.
 */

import { 
  ComprehensionQuestion, 
  StorySection 
} from '../../ai/types';
import {
  QTIAssessmentItem,
  QTIResponseDeclaration,
  QTIResponseProcessing,
  QTIOutcomeDeclaration,
  QTIInteractionType,
  QTIFeedback,
  QTIChoiceInteraction,
  QTITextEntryInteraction,
  QTIExtendedTextInteraction,
  QTISimpleChoice,
  QTICorrectResponse,
  QTIMapping,
  QTIMapEntry,
  AIToQTITransformationContext,
  QTIGenerationOptions,
  QTIError,
  QTIErrorType
} from '../types';
import { 
  IdentifierGenerator,
  IdentifierType,
  defaultIdentifierGenerator 
} from '../utils/identifier-generator';
import { INTERACTION_TYPE_MAPPINGS, DEFAULT_SCORING } from '../index';

/**
 * Question mapping configuration
 */
export interface QuestionMappingConfig {
  /** Enable adaptive difficulty adjustment */
  enableAdaptiveDifficulty?: boolean;
  /** Enable partial credit scoring */
  enablePartialCredit?: boolean;
  /** Enable rich feedback generation */
  enableRichFeedback?: boolean;
  /** Default time per question in seconds */
  defaultTimePerQuestion?: number;
  /** Enable question type auto-detection */
  enableTypeDetection?: boolean;
  /** Enable distractor analysis for multiple choice */
  enableDistractorAnalysis?: boolean;
  /** Maximum choices for multiple choice questions */
  maxChoicesPerQuestion?: number;
}

/**
 * Question analysis result
 */
export interface QuestionAnalysis {
  /** Question difficulty level (1-10) */
  difficulty: number;
  /** Question type classification */
  type: 'literal' | 'inferential' | 'evaluative' | 'creative';
  /** Cognitive complexity level */
  cognitiveLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  /** Estimated completion time in seconds */
  estimatedTime: number;
  /** Content keywords */
  keywords: string[];
  /** Whether question requires story context */
  requiresContext: boolean;
  /** Suggested interaction type */
  suggestedInteractionType: QTIInteractionType;
}

/**
 * Question mapping result with metadata
 */
export interface QuestionMappingResult {
  /** The mapped QTI item */
  item: QTIAssessmentItem;
  /** Question analysis metadata */
  analysis: QuestionAnalysis;
  /** Mapping metadata */
  metadata: {
    /** Original question ID */
    originalQuestionId: string;
    /** Section context */
    sectionIndex: number;
    /** Question index within section */
    questionIndex: number;
    /** Generated identifiers */
    identifiers: {
      item: string;
      response: string;
      choices?: string[];
    };
  };
}

/**
 * Advanced question mapping service
 * 
 * Provides sophisticated mapping of comprehension questions to QTI assessment items
 * with support for multiple interaction types, adaptive difficulty, and rich
 * response processing.
 */
export class QuestionMapper {
  private identifierGenerator: IdentifierGenerator;
  private config: QuestionMappingConfig;

  constructor(
    config: QuestionMappingConfig = {},
    identifierGenerator?: IdentifierGenerator
  ) {
    this.config = {
      enableAdaptiveDifficulty: true,
      enablePartialCredit: true,
      enableRichFeedback: true,
      defaultTimePerQuestion: 60,
      enableTypeDetection: true,
      enableDistractorAnalysis: true,
      maxChoicesPerQuestion: 4,
      ...config
    };
    this.identifierGenerator = identifierGenerator || defaultIdentifierGenerator;
  }

  /**
   * Map multiple questions to QTI assessment items
   * 
   * @param questions - Array of questions to map
   * @param storySection - Story section containing the questions
   * @param sectionIndex - Index of the section in the story
   * @param context - Transformation context
   * @returns Array of question mapping results
   */
  async mapQuestions(
    questions: ComprehensionQuestion[],
    storySection: StorySection,
    sectionIndex: number,
    context: AIToQTITransformationContext
  ): Promise<QuestionMappingResult[]> {

    const results: QuestionMappingResult[] = [];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      const result = await this.mapQuestion(
        question,
        storySection,
        sectionIndex,
        i,
        context
      );
      results.push(result);
    }

    // Apply cross-question optimizations
    await this.optimizeQuestionSet(results, context);


    return results;
  }

  /**
   * Map a single question to QTI assessment item
   * 
   * @param question - Question to map
   * @param storySection - Story section containing the question
   * @param sectionIndex - Index of the section
   * @param questionIndex - Index of the question within the section
   * @param context - Transformation context
   * @returns Question mapping result
   */
  async mapQuestion(
    question: ComprehensionQuestion,
    storySection: StorySection,
    sectionIndex: number,
    questionIndex: number,
    context: AIToQTITransformationContext
  ): Promise<QuestionMappingResult> {
    try {
      // Analyze question characteristics
      const analysis = this.analyzeQuestion(question, storySection, context);
      
      // Generate item identifier
      const itemIdentifier = this.identifierGenerator.generateItemIdentifier(
        sectionIndex,
        questionIndex,
        { humanReadable: true }
      );

      // Determine interaction type
      const interactionType = this.determineInteractionType(question, analysis);

      // Create response declaration
      const responseDeclaration = this.createResponseDeclaration(
        question,
        interactionType,
        analysis
      );

      // Create outcome declarations
      const outcomeDeclaration = this.createOutcomeDeclaration(analysis);

      // Create response processing
      const responseProcessing = this.createResponseProcessing(
        question,
        interactionType,
        analysis
      );

      // Create item body
      const itemBody = this.createItemBody(
        question,
        storySection,
        interactionType,
        analysis,
        context
      );

      // Create feedback
      const feedback = this.createFeedback(question, analysis);

      // Calculate time limit
      const timeLimit = this.calculateTimeLimit(question, analysis);

      // Create the QTI assessment item
      const qtiItem: QTIAssessmentItem = {
        identifier: itemIdentifier,
        title: this.createItemTitle(question, questionIndex),
        body: itemBody,
        responseDeclaration,
        outcomeDeclaration,
        responseProcessing,
        interactionType,
        feedback: this.config.enableRichFeedback ? feedback : undefined,
        timeLimits: timeLimit
      };

      // Generate choice identifiers if needed
      const choiceIds = interactionType === 'choiceInteraction' && question.options
        ? question.options.map((_, i) => this.identifierGenerator.generateChoiceIdentifier(i))
        : undefined;

      const result: QuestionMappingResult = {
        item: qtiItem,
        analysis,
        metadata: {
          originalQuestionId: question.id,
          sectionIndex,
          questionIndex,
          identifiers: {
            item: itemIdentifier,
            response: 'RESPONSE',
            choices: choiceIds
          }
        }
      };

        identifier: itemIdentifier,
        type: interactionType,
        difficulty: analysis.difficulty,
        cognitiveLevel: analysis.cognitiveLevel
      });

      return result;

    } catch (error) {
      throw new QTIError(
        `Failed to map question ${questionIndex + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        QTIErrorType.TRANSFORMATION_ERROR,
        { 
          questionId: question.id,
          sectionIndex,
          questionIndex,
          error 
        }
      );
    }
  }

  /**
   * Analyze question characteristics for adaptive mapping
   */
  private analyzeQuestion(
    question: ComprehensionQuestion,
    storySection: StorySection,
    context: AIToQTITransformationContext
  ): QuestionAnalysis {
    // Analyze question text complexity
    const questionWords = question.question.split(/\s+/).length;
    const hasComplexVocabulary = this.detectComplexVocabulary(question.question);
    const requiresInference = this.detectInferenceRequirement(question.question);

    // Determine question type
    const type = this.classifyQuestionType(question.question);
    
    // Determine cognitive level using Bloom's taxonomy
    const cognitiveLevel = this.determineCognitiveLevel(question.question, type);

    // Calculate difficulty (1-10 scale)
    let difficulty = 5; // Base difficulty
    
    // Adjust for question complexity
    if (questionWords > 15) difficulty += 1;
    if (hasComplexVocabulary) difficulty += 1;
    if (requiresInference) difficulty += 1;
    if (question.type === 'short_answer') difficulty += 1;
    if (question.type === 'essay') difficulty += 2;
    
    // Adjust for cognitive level
    const cognitiveAdjustments = {
      'remember': -1,
      'understand': 0,
      'apply': 1,
      'analyze': 2,
      'evaluate': 2,
      'create': 3
    };
    difficulty += cognitiveAdjustments[cognitiveLevel];
    
    // Adjust for grade level
    const gradeLevel = context.storyResponse.metadata?.gradeLevel;
    if (gradeLevel === 'K-1') difficulty -= 2;
    else if (gradeLevel === '2-3') difficulty -= 1;
    else if (gradeLevel === '6-8') difficulty += 1;
    
    // Clamp to 1-10 range
    difficulty = Math.max(1, Math.min(10, difficulty));

    // Extract keywords
    const keywords = this.extractKeywords(question.question);

    // Estimate completion time
    const baseTime = this.config.defaultTimePerQuestion || 60;
    const timeMultiplier = 1 + (difficulty - 5) * 0.1; // ±10% per difficulty point
    const estimatedTime = Math.ceil(baseTime * timeMultiplier);

    // Determine suggested interaction type
    const suggestedInteractionType = this.suggestInteractionType(question, type, cognitiveLevel);

    return {
      difficulty,
      type,
      cognitiveLevel,
      estimatedTime,
      keywords,
      requiresContext: true, // Story questions always need context
      suggestedInteractionType
    };
  }

  /**
   * Classify question type based on content
   */
  private classifyQuestionType(questionText: string): 'literal' | 'inferential' | 'evaluative' | 'creative' {
    const lowerText = questionText.toLowerCase();
    
    // Literal questions (direct recall)
    if (lowerText.includes('what') && (lowerText.includes('happen') || lowerText.includes('did'))) {
      return 'literal';
    }
    
    // Inferential questions (reading between the lines)
    if (lowerText.includes('why') || lowerText.includes('how') || lowerText.includes('feel')) {
      return 'inferential';
    }
    
    // Evaluative questions (judgment and opinion)
    if (lowerText.includes('should') || lowerText.includes('better') || lowerText.includes('agree')) {
      return 'evaluative';
    }
    
    // Creative questions (extension and application)
    if (lowerText.includes('what if') || lowerText.includes('imagine') || lowerText.includes('create')) {
      return 'creative';
    }
    
    // Default to inferential for comprehension questions
    return 'inferential';
  }

  /**
   * Determine cognitive level using Bloom's taxonomy
   */
  private determineCognitiveLevel(
    questionText: string,
    type: string
  ): 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create' {
    const lowerText = questionText.toLowerCase();
    
    // Remember (recall facts)
    if (lowerText.includes('what') || lowerText.includes('when') || lowerText.includes('where')) {
      return 'remember';
    }
    
    // Understand (explain concepts)
    if (lowerText.includes('explain') || lowerText.includes('describe') || lowerText.includes('summarize')) {
      return 'understand';
    }
    
    // Apply (use knowledge)
    if (lowerText.includes('use') || lowerText.includes('apply') || lowerText.includes('solve')) {
      return 'apply';
    }
    
    // Analyze (break down)
    if (lowerText.includes('analyze') || lowerText.includes('compare') || lowerText.includes('contrast')) {
      return 'analyze';
    }
    
    // Evaluate (make judgments)
    if (lowerText.includes('evaluate') || lowerText.includes('judge') || lowerText.includes('critique')) {
      return 'evaluate';
    }
    
    // Create (produce new work)
    if (lowerText.includes('create') || lowerText.includes('design') || lowerText.includes('compose')) {
      return 'create';
    }
    
    // Default based on question type
    const typeMapping = {
      'literal': 'remember',
      'inferential': 'understand',
      'evaluative': 'evaluate',
      'creative': 'create'
    };
    
    return typeMapping[type] as any || 'understand';
  }

  /**
   * Detect complex vocabulary in question text
   */
  private detectComplexVocabulary(text: string): boolean {
    const complexWords = [
      'analyze', 'evaluate', 'synthesize', 'compare', 'contrast',
      'infer', 'predict', 'conclude', 'determine', 'interpret'
    ];
    
    const lowerText = text.toLowerCase();
    return complexWords.some(word => lowerText.includes(word));
  }

  /**
   * Detect if question requires inference
   */
  private detectInferenceRequirement(text: string): boolean {
    const inferenceIndicators = [
      'why', 'how', 'feel', 'think', 'believe', 'probably',
      'likely', 'suggest', 'imply', 'conclude'
    ];
    
    const lowerText = text.toLowerCase();
    return inferenceIndicators.some(indicator => lowerText.includes(indicator));
  }

  /**
   * Extract keywords from question text
   */
  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - in production, use more sophisticated NLP
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['what', 'when', 'where', 'why', 'how', 'which', 'that', 'this'].includes(word));
    
    return [...new Set(words)].slice(0, 5); // Top 5 unique keywords
  }

  /**
   * Suggest optimal interaction type
   */
  private suggestInteractionType(
    question: ComprehensionQuestion,
    type: string,
    cognitiveLevel: string
  ): QTIInteractionType {
    // Use type detection if enabled
    if (this.config.enableTypeDetection) {
      // For creative/evaluative questions, prefer text interactions
      if (type === 'creative' || type === 'evaluative') {
        return cognitiveLevel === 'create' ? 'extendedTextInteraction' : 'textEntryInteraction';
      }
      
      // For complex analysis, prefer extended text
      if (cognitiveLevel === 'analyze' || cognitiveLevel === 'evaluate') {
        return 'extendedTextInteraction';
      }
    }
    
    // Fall back to original question type mapping
    const originalType = INTERACTION_TYPE_MAPPINGS[question.type as keyof typeof INTERACTION_TYPE_MAPPINGS];
    return (originalType as QTIInteractionType) || 'choiceInteraction';
  }

  /**
   * Determine final interaction type
   */
  private determineInteractionType(
    question: ComprehensionQuestion,
    analysis: QuestionAnalysis
  ): QTIInteractionType {
    // Use suggestion if type detection is enabled
    if (this.config.enableTypeDetection) {
      return analysis.suggestedInteractionType;
    }
    
    // Use original mapping
    const mappedType = INTERACTION_TYPE_MAPPINGS[question.type as keyof typeof INTERACTION_TYPE_MAPPINGS];
    return (mappedType as QTIInteractionType) || 'choiceInteraction';
  }

  /**
   * Create response declaration with advanced features
   */
  private createResponseDeclaration(
    question: ComprehensionQuestion,
    interactionType: QTIInteractionType,
    analysis: QuestionAnalysis
  ): QTIResponseDeclaration {
    const baseDeclaration = {
      identifier: 'RESPONSE',
      baseType: 'identifier' as const,
      cardinality: 'single' as const
    };

    switch (interactionType) {
      case 'choiceInteraction':
        return {
          ...baseDeclaration,
          correctResponse: this.createCorrectResponse(question),
          mapping: this.config.enablePartialCredit 
            ? this.createPartialCreditMapping(question)
            : undefined
        };

      case 'textEntryInteraction':
        return {
          ...baseDeclaration,
          baseType: 'string',
          correctResponse: {
            values: [String(question.correct)]
          }
        };

      case 'extendedTextInteraction':
        return {
          ...baseDeclaration,
          baseType: 'string'
          // Extended text typically requires manual scoring
        };

      default:
        return baseDeclaration;
    }
  }

  /**
   * Create correct response for choice interactions
   */
  private createCorrectResponse(question: ComprehensionQuestion): QTICorrectResponse {
    if (typeof question.correct === 'number' && question.options) {
      const choiceId = this.identifierGenerator.generateChoiceIdentifier(question.correct);
      return { values: [choiceId] };
    }
    
    return { values: [String(question.correct)] };
  }

  /**
   * Create partial credit mapping for multiple choice
   */
  private createPartialCreditMapping(question: ComprehensionQuestion): QTIMapping | undefined {
    if (!question.options || typeof question.correct !== 'number') {
      return undefined;
    }

    const mapEntries: QTIMapEntry[] = [];
    
    // Full credit for correct answer
    const correctChoiceId = this.identifierGenerator.generateChoiceIdentifier(question.correct);
    mapEntries.push({
      mapKey: correctChoiceId,
      mappedValue: DEFAULT_SCORING.CORRECT_SCORE
    });
    
    // Partial credit for distractors (if analysis suggests they're reasonable)
    if (this.config.enableDistractorAnalysis) {
      question.options.forEach((option, index) => {
        if (index !== question.correct) {
          const choiceId = this.identifierGenerator.generateChoiceIdentifier(index);
          // Give small partial credit for reasonable distractors
          mapEntries.push({
            mapKey: choiceId,
            mappedValue: 0.1 // 10% partial credit
          });
        }
      });
    }

    return {
      defaultValue: DEFAULT_SCORING.INCORRECT_SCORE,
      mapEntries
    };
  }

  /**
   * Create outcome declaration
   */
  private createOutcomeDeclaration(analysis: QuestionAnalysis): QTIOutcomeDeclaration {
    return {
      identifier: 'SCORE',
      baseType: 'float',
      cardinality: 'single',
      defaultValue: 0,
      normalMaximum: 1,
      normalMinimum: 0
    };
  }

  /**
   * Create response processing rules
   */
  private createResponseProcessing(
    question: ComprehensionQuestion,
    interactionType: QTIInteractionType,
    analysis: QuestionAnalysis
  ): QTIResponseProcessing {
    // Use template-based processing for most cases
    switch (interactionType) {
      case 'choiceInteraction':
        return this.config.enablePartialCredit
          ? { template: 'map_response' }
          : { template: 'match_correct' };
      
      case 'textEntryInteraction':
        return { template: 'match_correct' };
      
      case 'extendedTextInteraction':
        // Extended text requires custom processing or manual scoring
        return {
          responseRules: [
            {
              type: 'responseCondition',
              actions: [
                {
                  type: 'setOutcomeValue',
                  identifier: 'SCORE',
                  expression: {
                    type: 'baseValue',
                    value: 0,
                    baseType: 'float'
                  }
                }
              ]
            }
          ]
        };
      
      default:
        return { template: 'match_correct' };
    }
  }

  /**
   * Create rich item body with context and interaction
   */
  private createItemBody(
    question: ComprehensionQuestion,
    storySection: StorySection,
    interactionType: QTIInteractionType,
    analysis: QuestionAnalysis,
    context: AIToQTITransformationContext
  ): string {
    const parts: string[] = [];

    // Add story context
    parts.push('<div class="story-context">');
    parts.push('<h3>Story Section</h3>');
    parts.push(`<div class="story-content">${this.escapeHtml(storySection.content)}</div>`);
    parts.push('</div>');

    // Add question with difficulty indicator
    parts.push('<div class="question-prompt">');
    if (analysis.difficulty > 7) {
      parts.push('<div class="difficulty-indicator">🌟 Challenge Question</div>');
    }
    parts.push(`<p><strong>${this.escapeHtml(question.question)}</strong></p>`);
    parts.push('</div>');

    // Add interaction
    parts.push(this.createInteractionHTML(question, interactionType, analysis, context));

    return parts.join('\n');
  }

  /**
   * Create interaction HTML based on type
   */
  private createInteractionHTML(
    question: ComprehensionQuestion,
    interactionType: QTIInteractionType,
    analysis: QuestionAnalysis,
    context: AIToQTITransformationContext
  ): string {
    switch (interactionType) {
      case 'choiceInteraction':
        return this.createChoiceInteractionHTML(question, analysis, context);
      
      case 'textEntryInteraction':
        return this.createTextEntryInteractionHTML(question, analysis);
      
      case 'extendedTextInteraction':
        return this.createExtendedTextInteractionHTML(question, analysis);
      
      default:
        return '<div>Unsupported interaction type</div>';
    }
  }

  /**
   * Create choice interaction HTML
   */
  private createChoiceInteractionHTML(
    question: ComprehensionQuestion,
    analysis: QuestionAnalysis,
    context: AIToQTITransformationContext
  ): string {
    if (!question.options) {
      throw new QTIError(
        'Choice interaction requires options',
        QTIErrorType.TRANSFORMATION_ERROR,
        { questionId: question.id }
      );
    }

    const parts: string[] = [];
    const maxChoices = 1; // Single selection for comprehension questions
    const shuffle = context.options.shuffleChoices ? 'true' : 'false';

    parts.push(`<qti-choice-interaction response-identifier="RESPONSE" max-choices="${maxChoices}" shuffle="${shuffle}">`);
    
    question.options.forEach((option, index) => {
      const choiceId = this.identifierGenerator.generateChoiceIdentifier(index);
      parts.push(`  <qti-simple-choice identifier="${choiceId}">`);
      parts.push(`    ${this.escapeHtml(option)}`);
      parts.push(`  </qti-simple-choice>`);
    });
    
    parts.push('</qti-choice-interaction>');

    return parts.join('\n');
  }

  /**
   * Create text entry interaction HTML
   */
  private createTextEntryInteractionHTML(
    question: ComprehensionQuestion,
    analysis: QuestionAnalysis
  ): string {
    const expectedLength = Math.max(20, analysis.keywords.join(' ').length);
    return `<qti-text-entry-interaction response-identifier="RESPONSE" expected-length="${expectedLength}" />`;
  }

  /**
   * Create extended text interaction HTML
   */
  private createExtendedTextInteractionHTML(
    question: ComprehensionQuestion,
    analysis: QuestionAnalysis
  ): string {
    const expectedLines = analysis.difficulty > 6 ? 5 : 3;
    const maxStrings = expectedLines * 50; // ~50 words per line
    
    return `<qti-extended-text-interaction response-identifier="RESPONSE" expected-lines="${expectedLines}" max-strings="${maxStrings}" />`;
  }

  /**
   * Create rich feedback
   */
  private createFeedback(
    question: ComprehensionQuestion,
    analysis: QuestionAnalysis
  ): QTIFeedback {
    const baseFeedback = {
      correct: `Excellent! ${question.explanation}`,
      incorrect: `Not quite right. ${question.explanation}`
    };

    // Add difficulty-specific encouragement
    if (analysis.difficulty > 7) {
      baseFeedback.correct = `Outstanding work on this challenging question! ${question.explanation}`;
      baseFeedback.incorrect = `This was a tough question. ${question.explanation} Try reading that section again.`;
    } else if (analysis.difficulty < 4) {
      baseFeedback.correct = `Good job! ${question.explanation}`;
    }

    // Add cognitive level guidance
    const cognitiveGuidance = {
      'remember': 'Remember to look for specific details in the text.',
      'understand': 'Think about what the text is telling you.',
      'apply': 'Consider how you can use what you learned.',
      'analyze': 'Break down the information to understand the parts.',
      'evaluate': 'Think carefully about your judgment and reasoning.',
      'create': 'Use your imagination and the story details together.'
    };

    const guidance = cognitiveGuidance[analysis.cognitiveLevel];
    if (guidance) {
      baseFeedback.general = guidance;
    }

    return baseFeedback;
  }

  /**
   * Calculate time limit for question
   */
  private calculateTimeLimit(
    question: ComprehensionQuestion,
    analysis: QuestionAnalysis
  ): number {
    return analysis.estimatedTime;
  }

  /**
   * Create item title
   */
  private createItemTitle(question: ComprehensionQuestion, questionIndex: number): string {
    return `Question ${questionIndex + 1}`;
  }

  /**
   * Optimize question set for better flow
   */
  private async optimizeQuestionSet(
    results: QuestionMappingResult[],
    context: AIToQTITransformationContext
  ): Promise<void> {
    
    // Analyze difficulty progression
    const difficulties = results.map(r => r.analysis.difficulty);
    const avgDifficulty = difficulties.reduce((sum, d) => sum + d, 0) / difficulties.length;
    
    // Adjust timing based on overall difficulty
    if (avgDifficulty > 6) {
      results.forEach(result => {
        if (result.item.timeLimits) {
          result.item.timeLimits = Math.ceil(result.item.timeLimits * 1.2);
        }
      });
    }
    
  }

  /**
   * Calculate average difficulty of question set
   */
  private calculateAverageDifficulty(results: QuestionMappingResult[]): number {
    const total = results.reduce((sum, result) => sum + result.analysis.difficulty, 0);
    return Math.round((total / results.length) * 10) / 10; // One decimal place
  }

  /**
   * Escape HTML content
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<QuestionMappingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get mapping statistics
   */
  getStats() {
    return {
      questionsProcessed: 0,
      averageDifficulty: 0,
      interactionTypes: {},
      cognitiveDistribution: {}
    };
  }

  /**
   * Reset internal state
   */
  reset(): void {
    // Reset any cached state if needed
  }
}

/**
 * Default question mapper instance
 */
export const defaultQuestionMapper = new QuestionMapper();

/**
 * Convenience function to map a single question
 */
export async function mapComprehensionQuestion(
  question: ComprehensionQuestion,
  storySection: StorySection,
  sectionIndex: number,
  questionIndex: number,
  context: AIToQTITransformationContext,
  config?: QuestionMappingConfig
): Promise<QuestionMappingResult> {
  const mapper = config ? new QuestionMapper(config) : defaultQuestionMapper;
  return mapper.mapQuestion(question, storySection, sectionIndex, questionIndex, context);
}