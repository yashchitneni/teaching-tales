import { 
  createAssessmentTest, 
  getAssessmentTest, 
  updateAssessmentTest, 
  deleteAssessmentTest,
  type CreateAssessmentTestRequest,
  type AssessmentTestResponse 
} from '@/lib/api/qti-client';
import type { ComprehensionQuestion } from '@/lib/ai/types';

export interface StoryAssessment {
  id: string;
  storyId: string;
  stimulusId: string;
  title: string;
  questions: ComprehensionQuestion[];
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export class AssessmentService {
  
  /**
   * Create assessment tests for all story sections
   */
  static async createStoryAssessments(
    storyId: string,
    stimulusId: string,
    storyTitle: string,
    sections: Array<{
      id: number;
      content: string;
      questions: ComprehensionQuestion[];
    }>,
    metadata: {
      universe: string;
      character: string;
      spark: string;
      gradeLevel: string;
      studentId: string;
    }
  ): Promise<StoryAssessment[]> {
    try {
      console.debug('AssessmentService.createStoryAssessments', {
        storyId,
        sectionCount: sections.length
      });

      const assessments: StoryAssessment[] = [];

      // Create a separate assessment test for each section
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        
        if (section.questions && section.questions.length > 0) {
          const assessmentData: CreateAssessmentTestRequest = {
            identifier: `story-${storyId}-section-${section.id}`,
            title: `${storyTitle} - Section ${section.id} Assessment`,
            description: `Comprehension questions for section ${section.id} of "${storyTitle}"`,
            language: 'en',
            duration: section.questions.length * 60, // 1 minute per question
            metadata: {
              // Story context
              storyId,
              stimulusId,
              sectionId: section.id,
              sectionIndex: i,
              
              // Story metadata
              storyTitle,
              universe: metadata.universe,
              character: metadata.character,
              spark: metadata.spark,
              gradeLevel: metadata.gradeLevel,
              studentId: metadata.studentId,
              
              // Assessment metadata
              appName: 'Teaching Tales',
              contentType: 'story-comprehension-assessment',
              questionCount: section.questions.length,
              version: '1.0',
              
              // Questions data (stored as metadata since QTI items require XML)
              questions: section.questions.map((q, index) => ({
                id: q.id || `q${index + 1}`,
                question: q.question,
                options: q.options,
                correct: q.correct,
                explanation: q.explanation || 'Based on the story content.'
              }))
            }
          };

          
          const createdAssessment = await createAssessmentTest(assessmentData);
          
          const storyAssessment: StoryAssessment = {
            id: createdAssessment.id,
            storyId,
            stimulusId,
            title: createdAssessment.title,
            questions: section.questions,
            createdAt: createdAssessment.createdAt,
            updatedAt: createdAssessment.updatedAt,
            metadata: createdAssessment.metadata
          };
          
          assessments.push(storyAssessment);
          
        } else {
          console.warn(`⚠️ Section ${section.id} has no questions, skipping assessment creation`);
        }
      }

      return assessments;
      
    } catch (error) {
      console.error('❌ Failed to create story assessments:', error);
      throw error;
    }
  }

  /**
   * Get assessment for a specific story section
   */
  static async getSectionAssessment(assessmentId: string): Promise<StoryAssessment | null> {
    try {
      
      const assessment = await getAssessmentTest(assessmentId);
      
      if (!assessment.metadata?.questions) {
        console.warn('Assessment found but no questions in metadata');
        return null;
      }

      const storyAssessment: StoryAssessment = {
        id: assessment.id,
        storyId: assessment.metadata.storyId,
        stimulusId: assessment.metadata.stimulusId,
        title: assessment.title,
        questions: assessment.metadata.questions,
        createdAt: assessment.createdAt,
        updatedAt: assessment.updatedAt,
        metadata: assessment.metadata
      };

      return storyAssessment;
      
    } catch (error) {
      console.error('❌ Failed to get section assessment:', error);
      return null;
    }
  }

  /**
   * Get all assessments for a story
   */
  static async getStoryAssessments(storyId: string): Promise<StoryAssessment[]> {
    try {
      
      // Note: This would require a search/filter endpoint in the QTI API
      // For now, we'll need to store assessment IDs with the story or implement a different approach
      
      console.warn('⚠️ getStoryAssessments not fully implemented - need QTI search/filter capability');
      return [];
      
    } catch (error) {
      console.error('❌ Failed to get story assessments:', error);
      return [];
    }
  }

  /**
   * Delete all assessments for a story
   */
  static async deleteStoryAssessments(assessmentIds: string[]): Promise<void> {
    try {
      
      const deletePromises = assessmentIds.map(id => deleteAssessmentTest(id));
      await Promise.all(deletePromises);
      
      
    } catch (error) {
      console.error('❌ Failed to delete story assessments:', error);
      throw error;
    }
  }

  /**
   * Convert questions to QTI XML format (for future use with proper QTI items)
   */
  static generateQTIQuestionXML(question: ComprehensionQuestion, index: number): string {
    const questionId = question.id || `question_${index + 1}`;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v3p0" 
                identifier="${questionId}" 
                title="${question.question}" 
                adaptive="false" 
                timeDependent="false">
  <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="identifier">
    <correctResponse>
      <value>choice_${question.correct}</value>
    </correctResponse>
  </responseDeclaration>
  
  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float">
    <defaultValue>
      <value>0</value>
    </defaultValue>
  </outcomeDeclaration>
  
  <itemBody>
    <div>
      <p>${question.question}</p>
      <choiceInteraction responseIdentifier="RESPONSE" shuffle="false" maxChoices="1">
        ${question.options.map((option, i) => 
          `<simpleChoice identifier="choice_${i}">${option}</simpleChoice>`
        ).join('\n        ')}
      </choiceInteraction>
    </div>
  </itemBody>
  
  <responseProcessing template="http://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct"/>
  
  ${question.explanation ? `
  <modalFeedback outcomeIdentifier="SCORE" identifier="correct" showHide="show">
    <p>${question.explanation}</p>
  </modalFeedback>` : ''}
</assessmentItem>`;
  }
}