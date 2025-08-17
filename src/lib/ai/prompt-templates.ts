import { StoryGenerationRequest, ContinuationRequest, SectionQuestionGenInput } from './types';

export class PromptTemplates {
  static generateStoryPrompt(request: StoryGenerationRequest): string {
    return `Generate an educational children's story with the following requirements:

STORY PARAMETERS:
- Universe: ${request.universe}
- Main Character: ${request.character}
- Story Premise: ${request.spark}
- Target Grade Level: ${request.gradeLevel}
- Word Count Target: 800-1200 words

STORY BEAT STRUCTURE:
Create exactly 5 story sections that follow classic narrative structure with compelling cliffhangers:

1. OPENING HOOK (160-240 words): 
   - Establish character, setting, and initial situation
   - End with an intriguing discovery or unexpected event that draws readers in

2. RISING ACTION - PART 1 (160-240 words):
   - Character responds to the hook, begins their journey
   - Introduce the main challenge or mystery
   - End with a complication or obstacle that raises stakes

3. RISING ACTION - PART 2 (160-240 words):
   - Character faces the challenge, learns something important
   - Build tension and develop character growth
   - End with a major revelation or turning point that changes everything

4. CLIMAX & RESOLUTION SETUP (160-240 words):
   - Character confronts the main challenge with new knowledge/skills
   - Show character growth and problem-solving
   - End with the resolution in sight but one final challenge remaining

5. RESOLUTION & NEW BEGINNING (160-240 words):
   - Resolve the main conflict satisfyingly
   - Show character growth and lessons learned
   - End with a sense of completion but hint at future adventures

CLIFFHANGER REQUIREMENTS:
- Each section (except the last) must end with a compelling cliffhanger
- Use techniques like: unexpected discoveries, mysterious events, sudden obstacles, important revelations, or dramatic moments
- Make readers think "I need to know what happens next!"
- Ensure natural story flow between sections

VOCABULARY INTEGRATION:
- Include 3-5 age-appropriate vocabulary words per section  
- Mark vocabulary as: **word** (meaning: simple definition)
- Choose words that enhance the story and are appropriate for ${request.gradeLevel}

EDUCATIONAL INTEGRATION:
For each section, create exactly 2 comprehension questions:
- 1 literal comprehension question (what happened in the story?)
- 1 inferential question (why did this happen? what might happen next? how did the character feel?)

QUESTION ID REQUIREMENTS:
- Generate unique question IDs by combining universe, character, section and question number
- Pattern: [universe_prefix]-[character_prefix]-s[section]q[question]
- For ${request.universe} + ${request.character}: use "s1q1", "s1q2", "s2q1", "s2q2", etc.
- Make IDs short but unique to this story combination

CONTENT GUIDELINES:
- Keep content appropriate for children
- Promote positive values and problem-solving
- Include descriptive language to engage young readers
- Ensure story has a clear beginning, middle, and satisfying conclusion
- Make the character relatable and the adventure exciting but not scary

OUTPUT FORMAT: 
You must return your response as a valid JSON object with this exact structure:

{
  "title": "An engaging story title that includes the character and adventure",
  "sections": [
    {
      "id": 1,
      "content": "The story text for section 1 goes here...",
      "questions": [
        {
          "id": "GENERATE_UNIQUE_ID_FOLLOWING_PATTERN_ABOVE",
          "type": "multiple_choice",
          "question": "What did ${request.character} discover at the beginning of the story?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct": 0,
          "explanation": "Provide a detailed, educational explanation that helps students understand WHY this is the correct answer by referencing specific story details"
        },
        {
          "id": "GENERATE_UNIQUE_ID_FOLLOWING_PATTERN_ABOVE",
          "type": "multiple_choice",
          "question": "How do you think ${request.character} felt when this happened?",
          "options": ["Excited", "Worried", "Curious", "Confused"],
          "correct": 2,
          "explanation": "Explain the emotional context and what clues in the story text support this answer"
        }
      ]
    }
  ],
  "wordCount": 1000,
  "readingTime": "4 minutes",
  "metadata": {
    "universe": "${request.universe}",
    "character": "${request.character}",
    "spark": "${request.spark}",
    "gradeLevel": "${request.gradeLevel}",
    "generatedAt": "ISO timestamp"
  }
}

CRITICAL OUTPUT REQUIREMENTS:
- Return ONLY the JSON object, no additional text, markdown, or code blocks
- Do NOT wrap the response in code blocks or markdown formatting
- The response must start with { and end with }
- Ensure the JSON is valid and properly formatted
- Include all 5 sections with 2 questions each
- Make questions engaging and educational
- Keep the story cohesive and engaging throughout all sections
- Each section should build naturally from the previous one
- Cliffhangers should feel organic to the story, not forced

QUESTION EXPLANATION REQUIREMENTS:
- Each explanation must be 2-3 sentences minimum
- Reference specific details from the story text
- For correct answers: Explain what story clues lead to this answer
- For inference questions: Explain the reasoning process
- Use encouraging, educational language appropriate for ${request.gradeLevel} grade
- Help students understand reading comprehension strategies
- Connect the answer to broader story themes when relevant`;
  }

  static generateContinuationPrompt(request: ContinuationRequest): string {
    return `Continue an educational children's story with the following context:

STORY CONTEXT:
- Previous Story Title: ${request.storyContext.title}
- Universe: ${request.universe}
- Main Character: ${request.character}
- Target Grade Level: ${request.gradeLevel}
- Selected Story Path: ${request.selectedPath}

PREVIOUS CHAPTER SUMMARY:
${request.previousChapter}

CONTINUATION REQUIREMENTS:
1. Create exactly 5 new story sections that continue from where the previous chapter ended
2. Each section should be 160-240 words
3. Follow the selected path: "${request.selectedPath}"
4. Maintain character consistency and story continuity
5. Use age-appropriate vocabulary for ${request.gradeLevel}
6. Build upon the established story world and character development

EDUCATIONAL INTEGRATION:
For each section, create exactly 2 comprehension questions:
- 1 literal comprehension question (what happened in this new part?)
- 1 inferential question (why did the character make this choice? what might happen next?)

CONTENT GUIDELINES:
- Keep the adventure engaging and age-appropriate
- Show character growth and problem-solving
- Maintain the established tone and style
- Include new challenges that build on previous events
- Ensure this chapter can stand alone while connecting to the overall story

OUTPUT FORMAT: 
Return a valid JSON object with this exact structure:

{
  "title": "Chapter 2: [Descriptive chapter title]",
  "sections": [
    {
      "id": 1,
      "content": "The continuation story text goes here...",
      "questions": [
        {
          "id": "q1_1",
          "type": "multiple_choice",
          "question": "Based on the previous chapter, why did ${request.character} choose to ${request.selectedPath}?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct": 0,
          "explanation": "This choice makes sense because..."
        },
        {
          "id": "q1_2",
          "type": "multiple_choice",
          "question": "What new challenge does ${request.character} face in this chapter?",
          "options": ["Challenge A", "Challenge B", "Challenge C", "Challenge D"],
          "correct": 1,
          "explanation": "The main challenge is..."
        }
      ]
    }
  ],
  "wordCount": 1000,
  "readingTime": "4 minutes"
}

Important: Ensure JSON validity and maintain story continuity while introducing new exciting elements.`;
  }

  static generateQuestionsForSection(input: SectionQuestionGenInput): string {
    // Validate input
    const errors = this.validateQuestionGenInputs(input);
    if (errors.length > 0) {
      throw new Error(`Invalid input: ${errors.join(', ')}`);
    }

    // Get grade-level guidance
    const gradeGuidance = this.getGradeLevelGuidance(input.gradeLevel);
    
    // Extract parameters with defaults
    const questionCount = input.constraints?.questionCount || 2;
    const questionTypes = input.constraints?.questionTypes || ['comprehension', 'inference'];
    const maxQuestionLength = input.constraints?.maxQuestionLength || 100;
    const maxOptionLength = input.constraints?.maxOptionLength || 50;
    
    // Sanitize section content
    const sanitizedContent = this.sanitizeInput(input.sectionContent);
    
    // Format question types guidance
    const questionTypesGuidance = this.formatQuestionTypesGuidance(questionTypes);
    
    // Get difficulty level for grade
    const difficultyLevel = this.getDifficultyForGrade(input.gradeLevel);

    return `Generate comprehension questions for this story section:

SECTION PARAMETERS:
- Section Content: ${sanitizedContent}
- Section Index: ${input.sectionIndex}
- Target Grade Level: ${input.gradeLevel}
- Question Count: ${questionCount}

${gradeGuidance}

QUESTION GENERATION REQUIREMENTS:
For this story section, create exactly ${questionCount} comprehension questions that test reading comprehension:
${questionTypesGuidance}

QUESTION CONSTRAINTS:
- Questions must be answerable from the section content alone
- Question text should not exceed ${maxQuestionLength} characters
- Answer options should not exceed ${maxOptionLength} characters each
- Use vocabulary appropriate for ${input.gradeLevel} grade level
- Create engaging, educational questions that test reading comprehension
- Ensure questions have clear correct answers supported by text evidence
- Make answer choices plausible but clearly distinguishable
- Reference specific details, characters, or events from this section

CONTENT GUIDELINES:
- Questions must reference specific details from the provided section content
- Explanations must cite evidence from the section text using phrases like "The text states..." or "According to the section..."
- Avoid questions that require knowledge from outside this section
- Focus on comprehension skills appropriate for ${input.gradeLevel}
- Make questions engaging and educational

OUTPUT FORMAT: 
You must return your response as a valid JSON array with this exact structure:

[
  {
    "id": "section_${input.sectionIndex}_q1",
    "type": "multiple_choice",
    "question": "Based on this section, what did the character discover?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "The text states that... This shows the character discovered...",
    "questionType": "comprehension",
    "difficultyLevel": ${difficultyLevel}
  },
  {
    "id": "section_${input.sectionIndex}_q2", 
    "type": "multiple_choice",
    "question": "How do you think the character felt when this happened?",
    "options": ["Excited", "Worried", "Curious", "Confused"],
    "correct": 2,
    "explanation": "Based on the character's actions and words in the text, we can infer...",
    "questionType": "inference",
    "difficultyLevel": ${difficultyLevel}
  }
]

CRITICAL OUTPUT REQUIREMENTS:
- Return ONLY the JSON array, no additional text, markdown, or code blocks
- Do NOT wrap the response in code blocks or markdown formatting
- The response must start with [ and end with ]
- Ensure the JSON is valid and properly formatted
- Include exactly ${questionCount} questions
- Each question must have a unique ID following the pattern: section_${input.sectionIndex}_q[number]
- All questions must reference content from the provided section
- Explanations must be 2-3 sentences minimum and reference specific section details
- Make questions challenging but appropriate for ${input.gradeLevel} grade level`;
  }

  static validatePromptInputs(request: StoryGenerationRequest): string[] {
    const errors: string[] = [];

    if (!request.universe?.trim()) {
      errors.push('Universe is required');
    }

    if (!request.character?.trim()) {
      errors.push('Character is required');
    }

    if (!request.spark?.trim()) {
      errors.push('Story spark/premise is required');
    }

    if (!request.gradeLevel?.trim()) {
      errors.push('Grade level is required');
    }

    if (!request.studentId?.trim()) {
      errors.push('Student ID is required');
    }

    // Validate reasonable lengths
    if (request.universe && request.universe.length > 100) {
      errors.push('Universe name is too long (max 100 characters)');
    }

    if (request.character && request.character.length > 100) {
      errors.push('Character name is too long (max 100 characters)');
    }

    if (request.spark && request.spark.length > 500) {
      errors.push('Story spark is too long (max 500 characters)');
    }

    return errors;
  }

  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 500); // Limit length
  }

  static getGradeLevelGuidance(gradeLevel: string): string {
    const guidance: Record<string, string> = {
      'K-1': `
GRADE K-1 SPECIFIC REQUIREMENTS:
- Use simple, short sentences (5-10 words each)
- Focus on basic emotions and familiar situations
- Include repetitive phrases for engagement
- Use present tense primarily
- Cliffhangers should be gentle mysteries or discoveries, not scary
- Vocabulary should be sight words plus 1-2 new words per section`,

      '2-3': `
GRADE 2-3 SPECIFIC REQUIREMENTS:
- Use slightly longer sentences (10-15 words)
- Include more descriptive language and adjectives
- Character can face mild challenges and solve simple problems
- Mix of present and past tense
- Cliffhangers can include small obstacles or surprising discoveries
- Vocabulary can include more complex words with context clues`,

      '4-5': `
GRADE 4-5 SPECIFIC REQUIREMENTS:
- Use varied sentence lengths and more complex structures
- Include character development and emotional growth
- Character can face moderate challenges requiring problem-solving
- Use past tense primarily with dialogue
- Cliffhangers can include plot twists and character revelations
- Vocabulary can include subject-specific terms and advanced descriptive words`,

      '6-8': `
GRADE 6-8 SPECIFIC REQUIREMENTS:
- Use sophisticated sentence structures and varied paragraph lengths
- Include complex character relationships and moral dilemmas  
- Character can face significant challenges requiring critical thinking
- Use advanced literary techniques like foreshadowing
- Cliffhangers can include dramatic tension and emotional conflicts
- Vocabulary can include abstract concepts and specialized terminology`
    };

    return guidance[gradeLevel] || guidance['4-5']; // Default to 4-5 if not found
  }

  static validateQuestionGenInputs(input: SectionQuestionGenInput): string[] {
    const errors: string[] = [];

    if (!input.sectionContent?.trim()) {
      errors.push('Section content is required');
    }

    if (typeof input.sectionIndex !== 'number' || input.sectionIndex < 0) {
      errors.push('Section index must be a non-negative number');
    }

    if (!input.gradeLevel?.trim()) {
      errors.push('Grade level is required');
    }

    // Validate reasonable lengths
    if (input.sectionContent && input.sectionContent.length > 5000) {
      errors.push('Section content is too long (max 5000 characters)');
    }

    // Validate constraints if provided
    if (input.constraints) {
      if (input.constraints.questionCount !== undefined) {
        if (typeof input.constraints.questionCount !== 'number' || 
            input.constraints.questionCount < 1 || 
            input.constraints.questionCount > 5) {
          errors.push('Question count must be between 1 and 5');
        }
      }

      if (input.constraints.questionTypes) {
        const validTypes = ['comprehension', 'vocabulary', 'inference'];
        const invalidTypes = input.constraints.questionTypes.filter(type => !validTypes.includes(type));
        if (invalidTypes.length > 0) {
          errors.push(`Invalid question types: ${invalidTypes.join(', ')}. Must be one of: ${validTypes.join(', ')}`);
        }
      }

      if (input.constraints.maxQuestionLength !== undefined && 
          (typeof input.constraints.maxQuestionLength !== 'number' || input.constraints.maxQuestionLength < 10)) {
        errors.push('Maximum question length must be at least 10 characters');
      }

      if (input.constraints.maxOptionLength !== undefined && 
          (typeof input.constraints.maxOptionLength !== 'number' || input.constraints.maxOptionLength < 5)) {
        errors.push('Maximum option length must be at least 5 characters');
      }
    }

    return errors;
  }

  static formatQuestionTypesGuidance(questionTypes: string[]): string {
    const typeDescriptions: Record<string, string> = {
      'comprehension': '- 1 literal comprehension question (what happened in this section?)',
      'vocabulary': '- 1 vocabulary question (understanding of key terms or concepts)',
      'inference': '- 1 inferential question (why did this happen? what might happen next? how did character feel?)'
    };

    return questionTypes.map(type => typeDescriptions[type] || `- 1 ${type} question`).join('\n');
  }

  static getDifficultyForGrade(gradeLevel: string): number {
    const difficultyMap: Record<string, number> = {
      'K-1': 1,
      '2-3': 2,
      '4-5': 3,
      '6-8': 4
    };

    return difficultyMap[gradeLevel] || 3; // Default to level 3 if not found
  }

  static generateStoryPromptWithGradeLevel(request: StoryGenerationRequest): string {
    const basePrompt = this.generateStoryPrompt(request);
    const gradeGuidance = this.getGradeLevelGuidance(request.gradeLevel);
    
    return basePrompt.replace(
      'VOCABULARY INTEGRATION:',
      gradeGuidance + '\n\nVOCABULARY INTEGRATION:'
    );
  }

  static parseAIResponse(response: string): any {
    // Pre-clean: strip markdown code fences if the whole response is fenced
    const preStripped = this.stripCodeFences(response);
    try {
      // First, try parsing as-is (after simple fence stripping)
      return JSON.parse(preStripped);
    } catch (error) {
      // If that fails, try to extract JSON from markdown code blocks
      const codeBlockMatch = preStripped.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        const block = codeBlockMatch[1].replace(/^json\s*/i, '').trim();
        try {
          return JSON.parse(block);
        } catch {
          // Try to fix common JSON issues in code blocks
          const fixedJson = this.fixCommonJsonIssues(block);
          try {
            return JSON.parse(fixedJson);
          } catch {
            // Last try: balanced extraction inside the code block
            const balanced = this.extractBalancedJson(block);
            if (balanced) {
              try {
                return JSON.parse(this.fixCommonJsonIssues(balanced));
              } catch (ultimateError) {
                console.error('❌ Fixed code block JSON still invalid:', (ultimateError as any)?.message);
                console.error('🔍 Problematic JSON around position:', block.substring(Math.max(0, 2900), 2950));
                throw new Error(`Failed to parse JSON from code block: ${(ultimateError as any)?.message}`);
              }
            }
          }
        }
      }
      
      // Try to find JSON-like content using balanced brace extraction
      const balancedFromResponse = this.extractBalancedJson(preStripped);
      if (balancedFromResponse) {
        try {
          return JSON.parse(balancedFromResponse);
        } catch {
          try {
            return JSON.parse(this.fixCommonJsonIssues(balancedFromResponse));
          } catch (ultimateError) {
            console.error('❌ Fixed extracted JSON still invalid:', (ultimateError as any)?.message);
            console.error('🔍 Problematic JSON around position:', balancedFromResponse.substring(Math.max(0, 2900), 2950));
            throw new Error(`Failed to parse extracted JSON: ${(ultimateError as any)?.message}`);
          }
        }
      }
      
      console.error('❌ No JSON content found in response');
      throw new Error(`No valid JSON found in response: ${(error as any)?.message || 'Unknown error'}`);
    }
  }

  private static fixCommonJsonIssues(jsonStr: string): string {
    let fixed = jsonStr;
    
    // Remove line and block comments
    fixed = fixed.replace(/\/\*[^]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '');

    // Normalize backticks to quotes
    fixed = fixed.replace(/`/g, '"');

    // Convert single-quoted keys and values to double-quoted
    fixed = fixed.replace(/([{,]\s*)'([^']+)'\s*:/g, '$1"$2":');
    fixed = fixed.replace(/:\s*'([^']*)'(\s*[,}\]])/g, ': "$1"$2');

    // Remove trailing commas before closing braces/brackets
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix unescaped quotes in HTML attributes (the main issue!)
    // This handles: class="vocabulary" -> class=\"vocabulary\"
    fixed = fixed.replace(/([a-zA-Z-]+)="([^"]*?)"/g, '$1=\\"$2\\"');
    
    // More aggressive string content cleaning for large responses
    fixed = fixed.replace(/:\s*"([^"]*?)"(?=\s*[,}\]])/g, (match, content) => {
      // More comprehensive content cleaning
      const cleaned = content
        .replace(/\\/g, '\\\\')  // Escape backslashes first
        .replace(/"/g, '\\"')    // Escape quotes
        .replace(/\n/g, '\\n')   // Escape newlines
        .replace(/\r/g, '\\r')   // Escape carriage returns
        .replace(/\t/g, '\\t')   // Escape tabs
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Remove control chars
        .replace(/\u2018|\u2019/g, "'")  // Replace smart quotes
        .replace(/\u201C|\u201D/g, '\\"'); // Replace smart double quotes
      return `: "${cleaned}"`;
    });
    
    // Fix missing commas between object properties and array elements
    fixed = fixed.replace(/}(\s*"[^"]*"\s*:)/g, '},$1');
    fixed = fixed.replace(/](\s*"[^"]*"\s*:)/g, '],$1');
    fixed = fixed.replace(/}(\s*{)/g, '},$1');
    fixed = fixed.replace(/](\s*\[)/g, '],$1');
    
    // Fix missing quotes around property names
    fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    
    // Fix multiple consecutive commas
    fixed = fixed.replace(/,+/g, ',');
    
    // Remove commas before closing brackets/braces (again, more thorough)
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix incomplete string values (missing closing quotes)
    fixed = fixed.replace(/:\s*"([^"]*?)(?=\s*[,}\]])/g, ': "$1"');
    
    return fixed;
  }

  // Last-resort aggressive repair for badly formatted JSON-like strings
  private static repairJsonLoose(jsonStr: string): string {
    let s = jsonStr.trim();
    // If wrapped in code fencing artifacts like json:, strip them
    s = s.replace(/^json\s*/i, '');
    const balanced = this.extractBalancedJson(s);
    const core = balanced || s;
    // Apply common fixes and extra lenient rules
    const fixed = this.fixCommonJsonIssues(core);
    // Remove stray leading/trailing non-brace chars
    return fixed.replace(/^[^\{]*/, '').replace(/[^\}]*$/, '');
  }

  // Remove surrounding markdown code fences if present
  private static stripCodeFences(input: string): string {
    const trimmed = (input || '').trim();
    // Case 1: the entire response is a single fenced block
    const wholeFence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```\s*$/);
    if (wholeFence) {
      return wholeFence[1].trim();
    }
    // Case 2: leading/trailing standalone fence lines
    if (trimmed.startsWith('```')) {
      const withoutLeading = trimmed.replace(/^```[^\n]*\n/, '');
      if (withoutLeading.endsWith('```')) {
        return withoutLeading.replace(/\n?```\s*$/,'').trim();
      }
      return withoutLeading.trim();
    }
    return trimmed;
  }

  // Extract a balanced JSON object substring respecting quotes and escapes
  private static extractBalancedJson(input: string): string | null {
    let start = -1;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      if (inString) {
        if (escape) {
          escape = false;
        } else if (ch === '\\') {
          escape = true;
        } else if (ch === '"') {
          inString = false;
        }
        continue;
      }
      if (ch === '"') {
        inString = true;
        continue;
      }
      if (ch === '{') {
        if (start === -1) start = i;
        depth++;
      } else if (ch === '}') {
        if (depth > 0) depth--;
        if (depth === 0 && start !== -1) {
          return input.substring(start, i + 1);
        }
      }
    }
    return null;
  }
}
