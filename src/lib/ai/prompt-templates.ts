import { StoryGenerationRequest, ContinuationRequest } from './types';

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
          "id": "q1_1",
          "type": "multiple_choice",
          "question": "What did ${request.character} discover at the beginning of the story?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct": 0,
          "explanation": "This is correct because..."
        },
        {
          "id": "q1_2",
          "type": "multiple_choice",
          "question": "How do you think ${request.character} felt when this happened?",
          "options": ["Excited", "Worried", "Curious", "Confused"],
          "correct": 2,
          "explanation": "The character likely felt curious because..."
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
- Cliffhangers should feel organic to the story, not forced`;
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

  static generateStoryPromptWithGradeLevel(request: StoryGenerationRequest): string {
    const basePrompt = this.generateStoryPrompt(request);
    const gradeGuidance = this.getGradeLevelGuidance(request.gradeLevel);
    
    return basePrompt.replace(
      'VOCABULARY INTEGRATION:',
      gradeGuidance + '\n\nVOCABULARY INTEGRATION:'
    );
  }

  static parseAIResponse(response: string): any {
    try {
      // First, try parsing as-is
      return JSON.parse(response);
    } catch (error) {
      // If that fails, try to extract JSON from markdown code blocks
      const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        try {
          return JSON.parse(codeBlockMatch[1]);
        } catch (innerError) {
          // Try to fix common JSON issues in code blocks
          const fixedJson = this.fixCommonJsonIssues(codeBlockMatch[1]);
          try {
            return JSON.parse(fixedJson);
          } catch (finalError) {
            throw new Error(`Failed to parse JSON from code block: ${finalError.message}`);
          }
        }
      }
      
      // Try to find JSON-like content between first { and last }
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (innerError) {
          // Try to fix common JSON issues in extracted content
          const fixedJson = this.fixCommonJsonIssues(jsonMatch[0]);
          try {
            return JSON.parse(fixedJson);
          } catch (finalError) {
            throw new Error(`Failed to parse extracted JSON: ${finalError.message}`);
          }
        }
      }
      
      throw new Error(`No valid JSON found in response: ${error.message}`);
    }
  }

  private static fixCommonJsonIssues(jsonStr: string): string {
    let fixed = jsonStr;
    
    // Remove trailing commas before closing braces/brackets
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix unescaped quotes in HTML attributes (the main issue!)
    // This handles: class="vocabulary" -> class=\"vocabulary\"
    fixed = fixed.replace(/([a-zA-Z-]+)="([^"]*?)"/g, '$1=\\"$2\\"');
    
    // Fix unescaped control characters in strings - more comprehensive approach
    fixed = fixed.replace(/:\s*"([^"]*)"([,}\]])/g, (match, content, ending) => {
      // Clean up the content string
      const cleaned = content
        .replace(/\\/g, '\\\\')  // Escape backslashes first
        .replace(/"/g, '\\"')    // Escape quotes
        .replace(/\n/g, '\\n')   // Escape newlines
        .replace(/\r/g, '\\r')   // Escape carriage returns
        .replace(/\t/g, '\\t')   // Escape tabs
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ''); // Remove other control chars
      return `: "${cleaned}"${ending}`;
    });
    
    // Fix missing commas between object properties and array elements
    fixed = fixed.replace(/}(\s*")/g, '},$1');
    fixed = fixed.replace(/](\s*")/g, '],$1');
    fixed = fixed.replace(/"(\s*)}/g, '"$1}'); // Clean up spaces before closing braces
    fixed = fixed.replace(/"(\s*)]/g, '"$1]'); // Clean up spaces before closing brackets
    
    // Fix missing quotes around property names
    fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    
    // Fix multiple consecutive commas
    fixed = fixed.replace(/,+/g, ',');
    
    // Fix spaces around colons and commas for better parsing
    fixed = fixed.replace(/\s*:\s*/g, ':');
    fixed = fixed.replace(/\s*,\s*/g, ',');
    
    return fixed;
  }
}