/**
 * Reading Level Service
 * 
 * Provides reading level parameters based on TEKS/Lexile standards
 * for tailoring story generation to appropriate grade levels.
 */

export interface ReadingLevelParameters {
  gradeLevel: string;
  lexileRange: { min: number; max: number };
  targetWordCount: { min: number; max: number };
  sentenceComplexity: 'simple' | 'compound' | 'complex' | 'varied';
  vocabularyLevel: 'basic' | 'intermediate' | 'advanced' | 'academic';
  maxSentenceLength: number;
  averageWordsPerSentence: number;
  figurativeLanguage: boolean;
  scaffoldingLevel: 'high' | 'medium' | 'low' | 'minimal';
  conceptualComplexity: 'concrete' | 'mixed' | 'abstract';
  backgroundKnowledge: 'minimal' | 'some' | 'moderate' | 'extensive';
  thematicDepth: 'simple' | 'moderate' | 'complex' | 'nuanced';
}

export interface PromptParameters {
  sentenceStructureGuidance: string;
  vocabularyGuidance: string;
  lengthGuidance: string;
  complexityGuidance: string;
  scaffoldingGuidance: string;
  thematicGuidance: string;
}

export class ReadingLevelService {
  private static readonly GRADE_LEVEL_CONFIGS: Record<string, ReadingLevelParameters> = {
    'K-1': {
      gradeLevel: 'K-1',
      lexileRange: { min: 0, max: 300 }, // BR to 300L
      targetWordCount: { min: 150, max: 300 },
      sentenceComplexity: 'simple',
      vocabularyLevel: 'basic',
      maxSentenceLength: 8,
      averageWordsPerSentence: 6,
      figurativeLanguage: false,
      scaffoldingLevel: 'high',
      conceptualComplexity: 'concrete',
      backgroundKnowledge: 'minimal',
      thematicDepth: 'simple'
    },
    '2-3': {
      gradeLevel: '2-3',
      lexileRange: { min: 300, max: 700 },
      targetWordCount: { min: 300, max: 600 },
      sentenceComplexity: 'compound',
      vocabularyLevel: 'basic',
      maxSentenceLength: 12,
      averageWordsPerSentence: 8,
      figurativeLanguage: false,
      scaffoldingLevel: 'high',
      conceptualComplexity: 'concrete',
      backgroundKnowledge: 'some',
      thematicDepth: 'simple'
    },
    '4-5': {
      gradeLevel: '4-5',
      lexileRange: { min: 700, max: 1000 },
      targetWordCount: { min: 600, max: 1000 },
      sentenceComplexity: 'varied',
      vocabularyLevel: 'intermediate',
      maxSentenceLength: 16,
      averageWordsPerSentence: 10,
      figurativeLanguage: true,
      scaffoldingLevel: 'medium',
      conceptualComplexity: 'mixed',
      backgroundKnowledge: 'moderate',
      thematicDepth: 'moderate'
    },
    '6-8': {
      gradeLevel: '6-8',
      lexileRange: { min: 925, max: 1185 },
      targetWordCount: { min: 1000, max: 1500 },
      sentenceComplexity: 'complex',
      vocabularyLevel: 'advanced',
      maxSentenceLength: 20,
      averageWordsPerSentence: 12,
      figurativeLanguage: true,
      scaffoldingLevel: 'low',
      conceptualComplexity: 'abstract',
      backgroundKnowledge: 'extensive',
      thematicDepth: 'complex'
    },
    '9-12': {
      gradeLevel: '9-12',
      lexileRange: { min: 1050, max: 1400 },
      targetWordCount: { min: 1200, max: 2000 },
      sentenceComplexity: 'complex',
      vocabularyLevel: 'academic',
      maxSentenceLength: 25,
      averageWordsPerSentence: 15,
      figurativeLanguage: true,
      scaffoldingLevel: 'minimal',
      conceptualComplexity: 'abstract',
      backgroundKnowledge: 'extensive',
      thematicDepth: 'nuanced'
    }
  };

  static getReadingLevelParameters(gradeLevel: string): ReadingLevelParameters {
    return this.GRADE_LEVEL_CONFIGS[gradeLevel] || this.GRADE_LEVEL_CONFIGS['4-5'];
  }

  static generatePromptParameters(gradeLevel: string): PromptParameters {
    const config = this.getReadingLevelParameters(gradeLevel);
    
    return {
      sentenceStructureGuidance: this.getSentenceStructureGuidance(config),
      vocabularyGuidance: this.getVocabularyGuidance(config),
      lengthGuidance: this.getLengthGuidance(config),
      complexityGuidance: this.getComplexityGuidance(config),
      scaffoldingGuidance: this.getScaffoldingGuidance(config),
      thematicGuidance: this.getThematicGuidance(config)
    };
  }

  private static getSentenceStructureGuidance(config: ReadingLevelParameters): string {
    switch (config.sentenceComplexity) {
      case 'simple':
        return `
SENTENCE STRUCTURE (${config.gradeLevel}):
- Use simple sentences with subject-verb-object structure
- Maximum ${config.maxSentenceLength} words per sentence
- Average ${config.averageWordsPerSentence} words per sentence
- Use present tense primarily
- Avoid complex clauses or multiple ideas per sentence
- Use clear, direct language`;

      case 'compound':
        return `
SENTENCE STRUCTURE (${config.gradeLevel}):
- Use simple and compound sentences
- Maximum ${config.maxSentenceLength} words per sentence
- Average ${config.averageWordsPerSentence} words per sentence
- Connect ideas with "and," "but," "or"
- Introduce some past tense
- Keep ideas clear and connected`;

      case 'varied':
        return `
SENTENCE STRUCTURE (${config.gradeLevel}):
- Mix simple, compound, and some complex sentences
- Maximum ${config.maxSentenceLength} words per sentence
- Average ${config.averageWordsPerSentence} words per sentence
- Use varied sentence beginnings
- Include dependent clauses occasionally
- Balance short and medium-length sentences`;

      case 'complex':
        return `
SENTENCE STRUCTURE (${config.gradeLevel}):
- Use complex and compound-complex sentences
- Maximum ${config.maxSentenceLength} words per sentence
- Average ${config.averageWordsPerSentence} words per sentence
- Include subordinate clauses and varied structures
- Use sophisticated transitions
- Create rhythm through sentence variety`;

      default:
        return this.getSentenceStructureGuidance({ ...config, sentenceComplexity: 'varied' });
    }
  }

  private static getVocabularyGuidance(config: ReadingLevelParameters): string {
    switch (config.vocabularyLevel) {
      case 'basic':
        return `
VOCABULARY (${config.gradeLevel}):
- Use high-frequency, familiar words
- Choose concrete nouns over abstract concepts
- Limit syllables: mostly 1-2 syllable words
- Avoid technical or specialized terms
- Use common action verbs
- Include 2-3 new vocabulary words with clear context clues`;

      case 'intermediate':
        return `
VOCABULARY (${config.gradeLevel}):
- Mix familiar and some challenging words
- Include 3-4 syllable words occasionally
- Introduce subject-specific vocabulary with definitions
- Use descriptive adjectives and adverbs
- Include 3-4 new vocabulary words with context support
- Balance concrete and some abstract concepts`;

      case 'advanced':
        return `
VOCABULARY (${config.gradeLevel}):
- Use sophisticated and precise word choices
- Include academic and domain-specific vocabulary
- Use multi-syllabic words appropriately
- Employ varied synonyms and word forms
- Include 4-5 challenging vocabulary words
- Use abstract concepts with clear explanations`;

      case 'academic':
        return `
VOCABULARY (${config.gradeLevel}):
- Use discipline-specific and academic vocabulary
- Employ precise, nuanced word choices
- Include technical terms with appropriate context
- Use sophisticated transitions and connectors
- Include 5-6 advanced vocabulary words
- Handle complex abstract concepts`;

      default:
        return this.getVocabularyGuidance({ ...config, vocabularyLevel: 'intermediate' });
    }
  }

  private static getLengthGuidance(config: ReadingLevelParameters): string {
    return `
LENGTH REQUIREMENTS (${config.gradeLevel}):
- Target word count: ${config.targetWordCount.min}-${config.targetWordCount.max} words per chapter
- Lexile range: ${config.lexileRange.min}L-${config.lexileRange.max}L
- Break content into digestible chunks
- Use appropriate pacing for attention span
- Include natural stopping points`;
  }

  private static getComplexityGuidance(config: ReadingLevelParameters): string {
    const figurativeText = config.figurativeLanguage 
      ? "Include appropriate figurative language (similes, metaphors, personification)"
      : "Avoid figurative language; use literal descriptions";

    switch (config.conceptualComplexity) {
      case 'concrete':
        return `
CONCEPTUAL COMPLEXITY (${config.gradeLevel}):
- Focus on concrete, observable events and objects
- Use familiar settings and situations
- Present linear, cause-and-effect relationships
- Avoid abstract themes or complex symbolism
- ${figurativeText}`;

      case 'mixed':
        return `
CONCEPTUAL COMPLEXITY (${config.gradeLevel}):
- Balance concrete events with some abstract ideas
- Introduce simple themes and lessons
- Include some non-linear elements
- Use relatable metaphors and comparisons
- ${figurativeText}`;

      case 'abstract':
        return `
CONCEPTUAL COMPLEXITY (${config.gradeLevel}):
- Handle abstract concepts and themes
- Include complex character motivations
- Use sophisticated plot structures
- Explore nuanced relationships and ideas
- ${figurativeText}`;

      default:
        return this.getComplexityGuidance({ ...config, conceptualComplexity: 'mixed' });
    }
  }

  private static getScaffoldingGuidance(config: ReadingLevelParameters): string {
    switch (config.scaffoldingLevel) {
      case 'high':
        return `
SCAFFOLDING SUPPORT (${config.gradeLevel}):
- Provide explicit context for new concepts
- Use repetition to reinforce key ideas
- Include clear transitions between ideas
- Offer multiple examples for abstract concepts
- Use predictable story structures`;

      case 'medium':
        return `
SCAFFOLDING SUPPORT (${config.gradeLevel}):
- Provide some context for challenging concepts
- Use moderate repetition for key terms
- Include helpful transitions
- Offer examples when introducing new ideas
- Balance familiar and novel elements`;

      case 'low':
        return `
SCAFFOLDING SUPPORT (${config.gradeLevel}):
- Provide minimal explicit support
- Allow readers to infer some connections
- Use subtle transitions and connections
- Introduce concepts with brief context
- Trust reader's growing independence`;

      case 'minimal':
        return `
SCAFFOLDING SUPPORT (${config.gradeLevel}):
- Assume strong reading independence
- Allow complex inferential thinking
- Use sophisticated transitions
- Present concepts without extensive explanation
- Challenge readers appropriately`;

      default:
        return this.getScaffoldingGuidance({ ...config, scaffoldingLevel: 'medium' });
    }
  }

  private static getThematicGuidance(config: ReadingLevelParameters): string {
    switch (config.thematicDepth) {
      case 'simple':
        return `
THEMATIC CONTENT (${config.gradeLevel}):
- Focus on clear, universal themes (friendship, kindness, courage)
- Present moral lessons explicitly
- Use straightforward character development
- Avoid ambiguous or complex ethical dilemmas
- Ensure positive, hopeful outcomes`;

      case 'moderate':
        return `
THEMATIC CONTENT (${config.gradeLevel}):
- Explore relatable themes with some depth
- Include character growth and learning
- Present some moral complexity
- Allow for multiple perspectives on issues
- Balance challenge with resolution`;

      case 'complex':
        return `
THEMATIC CONTENT (${config.gradeLevel}):
- Explore sophisticated themes and ideas
- Include complex character development
- Present moral ambiguity and ethical dilemmas
- Allow for multiple valid interpretations
- Challenge readers' thinking and assumptions`;

      case 'nuanced':
        return `
THEMATIC CONTENT (${config.gradeLevel}):
- Handle highly sophisticated themes
- Include subtle character psychology
- Present complex moral and ethical questions
- Allow for ambiguous or open endings
- Encourage deep critical thinking`;

      default:
        return this.getThematicGuidance({ ...config, thematicDepth: 'moderate' });
    }
  }

  static validateReadingLevel(content: string, gradeLevel: string): {
    isValid: boolean;
    metrics: {
      wordCount: number;
      averageSentenceLength: number;
      estimatedLexile: number;
    };
    suggestions: string[];
  } {
    const config = this.getReadingLevelParameters(gradeLevel);
    const words = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgSentenceLength = sentences > 0 ? words / sentences : 0;
    
    // Simple Lexile estimation (actual Lexile calculation is more complex)
    const estimatedLexile = Math.round(
      (avgSentenceLength * 0.39) + 
      (this.calculateSyllableComplexity(content) * 11.8) + 
      36.6
    );

    const suggestions: string[] = [];
    let isValid = true;

    // Check word count
    if (words < config.targetWordCount.min || words > config.targetWordCount.max) {
      isValid = false;
      suggestions.push(`Adjust word count to ${config.targetWordCount.min}-${config.targetWordCount.max} words`);
    }

    // Check sentence length
    if (avgSentenceLength > config.maxSentenceLength) {
      isValid = false;
      suggestions.push(`Reduce average sentence length to under ${config.maxSentenceLength} words`);
    }

    // Check Lexile range
    if (estimatedLexile < config.lexileRange.min || estimatedLexile > config.lexileRange.max) {
      isValid = false;
      suggestions.push(`Adjust complexity for Lexile range ${config.lexileRange.min}L-${config.lexileRange.max}L`);
    }

    return {
      isValid,
      metrics: {
        wordCount: words,
        averageSentenceLength: Math.round(avgSentenceLength * 10) / 10,
        estimatedLexile
      },
      suggestions
    };
  }

  private static calculateSyllableComplexity(content: string): number {
    // Simplified syllable counting for complexity estimation
    const words = content.toLowerCase().split(/\s+/);
    let totalSyllables = 0;
    
    words.forEach(word => {
      // Simple syllable counting heuristic
      const syllables = word.replace(/[^aeiou]/g, '').length || 1;
      totalSyllables += syllables;
    });

    return words.length > 0 ? totalSyllables / words.length : 1;
  }
}
