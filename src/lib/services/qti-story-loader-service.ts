/**
 * @fileoverview QTI Story Loader Service
 * 
 * This service handles loading stories and assessments using proper QTI APIs,
 * including XML parsing, section unlocking, and assessment state management.
 */

import { QTIXMLParser, type ParsedQTIContent } from '../qti/parsers/qti-xml-parser';
import { UnlockEngine, type SectionState, type UnlockContext } from '../qti/engines/unlock-engine';
import { ResponseStorageService, type StoredResponse } from './response-storage-service';
import { getStimulus, getAssessmentTest, type Stimulus } from '../api/qti-client';

// Story loading interfaces
export interface QTIStory {
  id: string;
  title: string;
  description?: string;
  wordCount: number;
  readingTime: string;
  imageUrl?: string;
  sections: QTISection[];
  assessments: QTIAssessment[];
  metadata: QTIStoryMetadata;
  unlockRules: QTISectionUnlockRules;
}

export interface QTISection {
  id: string;
  title: string;
  content: string;
  orderIndex: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  isInProgress: boolean;
  wordCount?: number;
  estimatedReadingTime?: number;
  assessmentId?: string;
  unlockConditions?: string[];
  metadata?: Record<string, any>;
}

export interface QTIAssessment {
  id: string;
  title: string;
  sectionId: string;
  questions: QTIQuestion[];
  maxScore: number;
  timeLimit?: number;
  attempts: number;
  maxAttempts?: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'locked';
  metadata?: Record<string, any>;
}

export interface QTIQuestion {
  id: string;
  type: 'choice' | 'text' | 'match' | 'order' | 'hotspot';
  prompt: string;
  content: string;
  responseIdentifier: string;
  interactions: QTIInteraction[];
  correctResponse?: any;
  scoring?: QTIScoring;
  feedback?: QTIFeedback[];
  metadata?: Record<string, any>;
}

export interface QTIInteraction {
  type: string;
  responseIdentifier: string;
  choices?: QTIChoice[];
  expectedLength?: number;
  patternMask?: string;
  shuffle?: boolean;
  maxChoices?: number;
  minChoices?: number;
}

export interface QTIChoice {
  identifier: string;
  content: string;
  fixed?: boolean;
}

export interface QTIScoring {
  method: 'match_correct' | 'map_response' | 'custom';
  maxScore: number;
  partialCredit?: boolean;
  mapping?: Record<string, number>;
}

export interface QTIFeedback {
  type: 'correct' | 'incorrect' | 'general' | 'hint';
  content: string;
  showCondition?: string;
}

export interface QTIStoryMetadata {
  universe: string;
  character: string;
  spark: string;
  gradeLevel: string;
  studentId: string;
  createdAt: string;
  updatedAt: string;
  version: string;
  oneRosterIntegration?: {
    classId?: string;
    lineItemIds?: string[];
    enrollmentId?: string;
    integrationStatus: string;
  };
}

export interface QTISectionUnlockRules {
  unlockMode: 'linear' | 'score_based' | 'custom';
  globalRules: {
    requirePreviousCompletion: boolean;
    minimumAccuracy?: number;
    minimumTimeSpent?: number;
  };
  sectionRules: Record<string, {
    dependsOn?: string[];
    minimumScore?: number;
    minimumAccuracy?: number;
    customConditions?: string[];
  }>;
}

export interface StoryLoadResult {
  success: boolean;
  story?: QTIStory;
  error?: string;
  loadTime: number;
  source: 'qti_api' | 'qti_xml' | 'localStorage' | 'cache';
}

/**
 * QTI Story Loader Service
 * 
 * Handles comprehensive story loading with QTI compliance
 */
export class QTIStoryLoaderService {
  private static readonly CACHE_KEY = 'teaching-tales-qti-stories';
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static storyCache = new Map<string, { story: QTIStory; timestamp: number }>();

  /**
   * Load a story with full QTI integration
   */
  static async loadStory(
    storyId: string, 
    studentId: string,
    options: {
      useCache?: boolean;
      includeResponses?: boolean;
      parseXML?: boolean;
    } = {}
  ): Promise<StoryLoadResult> {
    const startTime = Date.now();
    const { useCache = true, includeResponses = true, parseXML = true } = options;

    try {
      console.log('📖 Loading QTI story:', { storyId, studentId, options });

      // Check cache first
      if (useCache) {
        const cachedStory = this.getCachedStory(storyId);
        if (cachedStory) {
          console.log('✅ Story loaded from cache');
          return {
            success: true,
            story: cachedStory,
            loadTime: Date.now() - startTime,
            source: 'cache'
          };
        }
      }

      // Load from QTI API
      const qtiResult = await this.loadFromQTIAPI(storyId, studentId, parseXML);
      if (qtiResult.success && qtiResult.story) {
        // Load student responses if requested
        if (includeResponses) {
          await this.loadStudentResponses(qtiResult.story, studentId);
        }

        // Update unlock states
        await this.updateSectionUnlockStates(qtiResult.story, studentId);

        // Cache the result
        if (useCache) {
          this.cacheStory(storyId, qtiResult.story);
        }

        console.log('✅ Story loaded from QTI API successfully');
        return {
          ...qtiResult,
          loadTime: Date.now() - startTime
        };
      }

      // Fallback to localStorage
      console.log('🔄 Falling back to localStorage...');
      const localResult = await this.loadFromLocalStorage(storyId);
      
      return {
        ...localResult,
        loadTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('❌ Error loading story:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        loadTime: Date.now() - startTime,
        source: 'qti_api'
      };
    }
  }

  /**
   * Load story from QTI API with optional XML parsing
   */
  private static async loadFromQTIAPI(
    storyId: string, 
    studentId: string, 
    parseXML: boolean
  ): Promise<StoryLoadResult> {
    try {
      // Load QTI Stimulus
      const stimulus = await getStimulus(storyId);
      
      if (!stimulus) {
        return {
          success: false,
          error: 'Stimulus not found',
          loadTime: 0,
          source: 'qti_api'
        };
      }

      // Parse story content
      let storyData: any;
      try {
        // Support both content and contentText shapes and handle empty/"undefined" strings
        const contentField = (stimulus as any).content;
        const contentTextField = (stimulus as any).contentText;

        const normalize = (val: unknown): string | undefined => {
          if (typeof val !== 'string') return undefined;
          const t = val.trim();
          if (!t) return undefined; // treat empty string as missing
          if (t.toLowerCase() === 'undefined') return undefined; // treat literal "undefined" as missing
          return t;
        };

        const contentCandidate = normalize(contentField);
        const contentTextCandidate = normalize(contentTextField);

        // Prefer content if valid; otherwise fall back to contentText
        const chosen = contentCandidate ?? contentTextCandidate ?? '{}';

        try {
          storyData = JSON.parse(chosen);
        } catch (e1) {
          // If first parse fails, attempt the other candidate if available
          const alt = chosen === contentCandidate ? contentTextCandidate : contentCandidate;
          if (alt) {
            try {
              storyData = JSON.parse(alt);
            } catch (e2) {
              // Fall through to final fallback
            }
          }

          if (!storyData) {
            // Final fallback: keep raw text for visibility but still return an object
            storyData = { content: (contentTextCandidate ?? contentCandidate ?? '') };
          }
        }
      } catch (parseError) {
        console.warn('Failed to parse stimulus content, using raw text');
        const fallbackRaw = (stimulus as any).contentText ?? (stimulus as any).content ?? '';
        const fallbackText = typeof fallbackRaw === 'string' ? fallbackRaw : '';
        // Best-effort: try parsing fallback as JSON, otherwise keep as plain text
        try {
          storyData = JSON.parse(fallbackText);
        } catch {
          storyData = { content: String(fallbackText) };
        }
      }

      // Load associated assessments
      const assessments = await this.loadAssociatedAssessments(
        stimulus.metadata?.assessmentIds || [],
        parseXML
      );

      // Build QTI story structure
      const story: QTIStory = {
        id: stimulus.id,
        title: stimulus.title,
        description: storyData.description,
        wordCount: storyData.wordCount || 0,
        readingTime: storyData.readingTime || '5 minutes',
        imageUrl: storyData.imageUrl,
        sections: this.buildSectionsFromStoryData(storyData, assessments),
        assessments: assessments,
        metadata: this.extractStoryMetadata(stimulus.metadata),
        unlockRules: this.buildUnlockRules(storyData, assessments)
      };

      return {
        success: true,
        story,
        loadTime: 0,
        source: 'qti_api'
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'QTI API error',
        loadTime: 0,
        source: 'qti_api'
      };
    }
  }

  /**
   * Load associated assessments for a story
   */
  private static async loadAssociatedAssessments(
    assessmentIds: string[],
    parseXML: boolean
  ): Promise<QTIAssessment[]> {
    const assessments: QTIAssessment[] = [];

    for (const assessmentId of assessmentIds) {
      try {
        console.log(`📝 Loading assessment: ${assessmentId}`);
        // Use client helper to normalize shapes returned by upstream
        const test = await getAssessmentTest(assessmentId);
        if (!test) continue;

        // Build JSON shape expected by our parser, sourcing questions from metadata
        const data = {
          id: test.id,
          title: test.title,
          sectionId: (test as any).metadata?.sectionId,
          questions: (test as any).metadata?.questions || (test as any).questions || []
        };

        const parsed = this.parseAssessmentFromJSON(data, assessmentId);
        if (parsed) assessments.push(parsed);

      } catch (error) {
        console.error(`Error loading assessment ${assessmentId}:`, error);
      }
    }

    console.log(`✅ Loaded ${assessments.length} assessments`);
    return assessments;
  }

  /**
   * Parse assessment from QTI XML
   */
  private static parseAssessmentFromXML(xmlContent: string, assessmentId: string): QTIAssessment | null {
    try {
      const parsedContent = QTIXMLParser.parseQTIXML(xmlContent);
      
      // Convert parsed QTI to our assessment format
      const questions: QTIQuestion[] = [];
      
      parsedContent.items.forEach(item => {
        const question: QTIQuestion = {
          id: item.identifier,
          type: this.mapQTIInteractionType(item.itemBody.interactions[0]?.type || 'choice'),
          prompt: 'Question', // Would extract from item body
          content: item.itemBody.content,
          responseIdentifier: item.responseDeclarations[0]?.identifier || 'RESPONSE',
          interactions: item.itemBody.interactions.map(interaction => ({
            type: interaction.type,
            responseIdentifier: interaction.responseIdentifier,
            choices: interaction.choices?.map(choice => ({
              identifier: choice.identifier,
              content: choice.content,
              fixed: choice.fixed
            })),
            shuffle: interaction.shuffle,
            maxChoices: interaction.maxChoices,
            minChoices: interaction.minChoices
          })),
          correctResponse: item.responseDeclarations[0]?.correctResponse?.values,
          scoring: {
            method: item.responseProcessing?.template as any || 'match_correct',
            maxScore: item.outcomeDeclarations?.find(o => o.identifier === 'MAXSCORE')?.defaultValue || 1
          },
          feedback: item.modalFeedbacks?.map(feedback => ({
            type: feedback.identifier as any,
            content: feedback.content,
            showCondition: feedback.showHide
          }))
        };
        
        questions.push(question);
      });

      return {
        id: assessmentId,
        title: parsedContent.assessmentTest.title,
        sectionId: 'unknown', // Would need to be determined from context
        questions,
        maxScore: questions.reduce((sum, q) => sum + (q.scoring?.maxScore || 1), 0),
        attempts: 0,
        status: 'not_started'
      };

    } catch (error) {
      console.error('Error parsing assessment XML:', error);
      return null;
    }
  }

  /**
   * Parse assessment from JSON format
   */
  private static parseAssessmentFromJSON(assessmentData: any, assessmentId: string): QTIAssessment | null {
    try {
      // This would handle the simplified JSON format from our current system
      const questions: QTIQuestion[] = (assessmentData.questions || []).map((q: any) => ({
        id: q.id || `q-${Math.random().toString(36).substr(2, 9)}`,
        type: 'choice' as const,
        prompt: q.question || q.text || '',
        content: q.question || q.text || '',
        responseIdentifier: 'RESPONSE',
        interactions: [{
          type: 'choiceInteraction',
          responseIdentifier: 'RESPONSE',
          choices: (q.options || []).map((option: string, index: number) => ({
            identifier: `choice_${index}`,
            content: option
          })),
          shuffle: false,
          maxChoices: 1,
          minChoices: 1
        }],
        correctResponse: [q.correct?.toString() || '0'],
        scoring: {
          method: 'match_correct',
          maxScore: 1
        },
        feedback: q.explanation ? [{
          type: 'correct',
          content: q.explanation
        }] : undefined
      }));

      return {
        id: assessmentId,
        title: assessmentData.title || 'Assessment',
        sectionId: assessmentData.sectionId || 'unknown',
        questions,
        maxScore: questions.length,
        attempts: 0,
        status: 'not_started'
      };

    } catch (error) {
      console.error('Error parsing assessment JSON:', error);
      return null;
    }
  }

  /**
   * Map QTI interaction types to our simplified types
   */
  private static mapQTIInteractionType(qtiType: string): QTIQuestion['type'] {
    const typeMap: Record<string, QTIQuestion['type']> = {
      'choiceInteraction': 'choice',
      'orderInteraction': 'order',
      'associateInteraction': 'match',
      'matchInteraction': 'match',
      'textEntryInteraction': 'text',
      'extendedTextInteraction': 'text',
      'hotspotInteraction': 'hotspot',
      'hotTextInteraction': 'hotspot'
    };

    return typeMap[qtiType] || 'choice';
  }

  /**
   * Build sections from story data and assessments
   */
  private static buildSectionsFromStoryData(
    storyData: any, 
    assessments: QTIAssessment[]
  ): QTISection[] {
    const sections: QTISection[] = [];

    if (storyData.sections && Array.isArray(storyData.sections)) {
      storyData.sections.forEach((sectionData: any, index: number) => {
        const sectionId = sectionData.id || `section-${index}`;
        const associatedAssessment = assessments.find(a => 
          a.sectionId === sectionId || a.id.includes(sectionId)
        );

        sections.push({
          id: sectionId,
          title: sectionData.title || `Section ${index + 1}`,
          content: sectionData.content || '',
          orderIndex: index,
          isUnlocked: index === 0, // First section always unlocked
          isCompleted: false,
          isInProgress: false,
          wordCount: sectionData.wordCount,
          estimatedReadingTime: sectionData.readingTime,
          assessmentId: associatedAssessment?.id,
          unlockConditions: index > 0 ? [`section-${index - 1}`] : [],
          metadata: sectionData.metadata
        });
      });
    }

    return sections;
  }

  /**
   * Extract story metadata from stimulus metadata
   */
  private static extractStoryMetadata(metadata: any): QTIStoryMetadata {
    return {
      universe: metadata?.universe || 'Unknown',
      character: metadata?.character || 'Unknown',
      spark: metadata?.spark || 'Unknown',
      gradeLevel: metadata?.gradeLevel || 'Unknown',
      studentId: metadata?.studentId || 'Unknown',
      createdAt: metadata?.createdAt || new Date().toISOString(),
      updatedAt: metadata?.updatedAt || new Date().toISOString(),
      version: metadata?.version || '1.0',
      oneRosterIntegration: metadata?.oneRosterIntegration
    };
  }

  /**
   * Build unlock rules from story and assessment data
   */
  private static buildUnlockRules(
    storyData: any, 
    assessments: QTIAssessment[]
  ): QTISectionUnlockRules {
    return {
      unlockMode: 'linear', // Default to linear progression
      globalRules: {
        requirePreviousCompletion: true,
        minimumAccuracy: 60 // 60% accuracy required
      },
      sectionRules: {} // Would be populated based on story configuration
    };
  }

  /**
   * Load student responses and update assessment states
   */
  private static async loadStudentResponses(story: QTIStory, studentId: string): Promise<void> {
    try {
      // Load responses for all assessments
      const responses = await ResponseStorageService.getResponses({
        studentId,
        assessmentId: story.id
      });

      // Update assessment states based on responses
      story.assessments.forEach(assessment => {
        const assessmentResponses = responses.filter(r => 
          r.itemId.includes(assessment.id) || r.metadata?.assessmentId === assessment.id
        );

        if (assessmentResponses.length > 0) {
          assessment.attempts = Math.max(...assessmentResponses.map(r => r.attempts || 1));
          assessment.status = assessmentResponses.length >= assessment.questions.length 
            ? 'completed' 
            : 'in_progress';
        }
      });

      console.log(`✅ Loaded ${responses.length} student responses`);

    } catch (error) {
      console.error('❌ Error loading student responses:', error);
    }
  }

  /**
   * Update section unlock states based on student progress
   */
  private static async updateSectionUnlockStates(story: QTIStory, studentId: string): Promise<void> {
    try {
      // Get student responses for unlock calculation
      const responses = await ResponseStorageService.getResponses({
        studentId,
        assessmentId: story.id
      });

      // Build section states for unlock engine
      const sectionStates: SectionState[] = story.sections.map(section => ({
        id: section.id,
        title: section.title,
        isUnlocked: section.isUnlocked,
        isCompleted: section.isCompleted,
        isInProgress: section.isInProgress,
        completedItems: [],
        totalItems: story.assessments
          .filter(a => a.sectionId === section.id)
          .flatMap(a => a.questions.map(q => q.id)),
        score: 0,
        maxScore: 0,
        accuracy: 0,
        timeSpent: 0,
        attempts: 0,
        unlockConditions: UnlockEngine.createLinearUnlockConditions(story.sections.map(s => s.id))
          .filter(condition => condition.target === section.id)
      }));

      // Create unlock context
      const unlockContext: UnlockContext = {
        studentId,
        assessmentId: story.id,
        currentSection: story.sections[0]?.id || '',
        targetSection: story.sections[story.sections.length - 1]?.id || '',
        responses,
        sectionStates,
        startTime: Date.now() - (24 * 60 * 60 * 1000), // 24 hours ago as default
        currentTime: Date.now()
      };

      // Check unlock conditions
      const unlockResult = UnlockEngine.checkUnlockConditions(unlockContext);

      // Update story sections with new unlock states
      unlockResult.unlockedSections.forEach(sectionId => {
        const section = story.sections.find(s => s.id === sectionId);
        if (section) {
          section.isUnlocked = true;
        }
      });

      console.log(`✅ Updated unlock states: ${unlockResult.unlockedSections.length} sections unlocked`);

    } catch (error) {
      console.error('❌ Error updating section unlock states:', error);
    }
  }

  /**
   * Load story from localStorage (fallback)
   */
  private static async loadFromLocalStorage(storyId: string): Promise<StoryLoadResult> {
    try {
      const stories = JSON.parse(localStorage.getItem('teaching-tales-stories') || '[]');
      const foundStory = stories.find((s: any) => s.id === storyId);

      if (!foundStory) {
        return {
          success: false,
          error: 'Story not found in localStorage',
          loadTime: 0,
          source: 'localStorage'
        };
      }

      // Convert localStorage story to QTI format
      const qtiStory: QTIStory = {
        id: foundStory.id,
        title: foundStory.title,
        wordCount: foundStory.wordCount || 0,
        readingTime: foundStory.readingTime || '5 minutes',
        imageUrl: foundStory.imageUrl,
        sections: (foundStory.sections || []).map((section: any, index: number) => ({
          id: section.id || `section-${index}`,
          title: section.title || `Section ${index + 1}`,
          content: section.content || '',
          orderIndex: index,
          isUnlocked: index === 0,
          isCompleted: false,
          isInProgress: false,
          assessmentId: `assessment-${section.id || index}`
        })),
        assessments: [], // Would need to be built from section questions
        metadata: {
          universe: foundStory.universe || 'Unknown',
          character: foundStory.character || 'Unknown',
          spark: foundStory.spark || 'Unknown',
          gradeLevel: foundStory.gradeLevel || 'Unknown',
          studentId: foundStory.studentId || 'Unknown',
          createdAt: foundStory.createdAt || new Date().toISOString(),
          updatedAt: foundStory.updatedAt || new Date().toISOString(),
          version: '1.0'
        },
        unlockRules: {
          unlockMode: 'linear',
          globalRules: {
            requirePreviousCompletion: true
          },
          sectionRules: {}
        }
      };

      return {
        success: true,
        story: qtiStory,
        loadTime: 0,
        source: 'localStorage'
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'localStorage error',
        loadTime: 0,
        source: 'localStorage'
      };
    }
  }

  /**
   * Cache story in memory
   */
  private static cacheStory(storyId: string, story: QTIStory): void {
    this.storyCache.set(storyId, {
      story: { ...story }, // Deep clone to prevent mutations
      timestamp: Date.now()
    });

    // Clean up old cache entries
    this.cleanupCache();
  }

  /**
   * Get cached story if available and not expired
   */
  private static getCachedStory(storyId: string): QTIStory | null {
    const cached = this.storyCache.get(storyId);
    
    if (!cached) {
      return null;
    }

    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.storyCache.delete(storyId);
      return null;
    }

    return { ...cached.story }; // Return clone to prevent mutations
  }

  /**
   * Clean up expired cache entries
   */
  private static cleanupCache(): void {
    const now = Date.now();
    
    for (const [storyId, cached] of this.storyCache.entries()) {
      if (now - cached.timestamp > this.CACHE_DURATION) {
        this.storyCache.delete(storyId);
      }
    }
  }

  /**
   * Clear all cached stories
   */
  static clearCache(): void {
    this.storyCache.clear();
    console.log('🧹 Story cache cleared');
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    size: number;
    stories: string[];
    oldestEntry?: number;
    newestEntry?: number;
  } {
    const entries = Array.from(this.storyCache.entries());
    const timestamps = entries.map(([, cached]) => cached.timestamp);

    return {
      size: this.storyCache.size,
      stories: entries.map(([storyId]) => storyId),
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : undefined,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : undefined
    };
  }
}

// Export default instance for convenience
export const qtiStoryLoaderService = QTIStoryLoaderService;
