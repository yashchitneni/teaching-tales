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

STRUCTURE REQUIREMENTS:
1. Create exactly 5 story sections
2. Each section should be 160-240 words
3. End each section with a natural pause or cliffhanger to encourage continued reading
4. Use age-appropriate vocabulary and themes for ${request.gradeLevel}
5. Include educational elements that promote reading comprehension

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
  "readingTime": "4 minutes"
}

Important: 
- Ensure the JSON is valid and properly formatted
- Include all 5 sections with 2 questions each
- Make questions engaging and educational
- Keep the story cohesive and engaging throughout all sections`;
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
}