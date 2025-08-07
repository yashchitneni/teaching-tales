# Multi-Chapter Story Generation Specification
## For Task 8 Implementation

---

## Table of Contents
1. [Current Implementation Overview](#current-implementation-overview)
2. [Grade Level Integration](#grade-level-integration)
3. [Enhanced Story Structure](#enhanced-story-structure)
4. [Chapter Planning by Grade Level](#chapter-planning-by-grade-level)
5. [Prompt Engineering Improvements](#prompt-engineering-improvements)
6. [Multi-Chapter Continuity](#multi-chapter-continuity)
7. [Implementation Roadmap](#implementation-roadmap)

---

## Current Implementation Overview

### File Locations
- **Main Prompt Template**: `src/lib/ai/prompt-templates.ts`
  - `generateStoryPrompt()` - Initial chapter generation (lines 4-114)
  - `generateContinuationPrompt()` - Subsequent chapters (lines 116-183)
  - `getGradeLevelGuidance()` - Grade-specific requirements (lines 232-272)
  
- **Story Generation Service**: `src/lib/ai/story-generation-service.ts`
  - Handles AI interactions with Gemini
  - Applies prompt templates with grade-level guidance
  
- **API Endpoint**: `src/app/api/generate-story/route.ts`
  - Receives story generation requests
  - Validates authentication
  - Passes grade level from user profile

### Current Story Structure
- **5 Beats/Sections** per chapter (needs grade-level adjustment - see Enhanced Story Structure)
- **160-240 words** per beat
- **800-1200 total words** per chapter
- Each beat has 2 comprehension questions (1 literal, 1 inferential)
- Vocabulary words integrated with grade-appropriate definitions

---

## Grade Level Integration

### How Grade Level Flows Through the System

1. **Profile Creation** (`src/components/CreateChildModal.tsx`):
   ```typescript
   const studentData = {
     grades: [formData.grade],  // Captured from dropdown
     metadata: {
       age: getAgeFromGrade(formData.grade),
       parentId: user.id
     }
   }
   ```

2. **Story Generation Request** (`src/lib/ai/types.ts`):
   ```typescript
   export interface StoryGenerationRequest {
     gradeLevel: string;  // "K-1", "2-3", "4-5", "6-8"
     // ... other parameters
   }
   ```

3. **Grade-Specific Prompt Guidance**:
   - Applied via `generateStoryPromptWithGradeLevel()`
   - Inserts grade-specific requirements into base prompt
   - Adjusts sentence complexity, vocabulary, themes

---

## Enhanced Story Structure

### Beats Per Chapter by Grade Level

| Grade Level | Beats per Chapter | Words per Beat | Total Chapter Words | Rationale |
|------------|-------------------|----------------|---------------------|-----------|
| **K-1** | 3 beats | 80-120 words | 240-360 words | Simple structure, short attention spans |
| **2-3** | 4 beats | 100-150 words | 400-600 words | Building complexity, manageable chunks |
| **4-5** | 5 beats | 160-240 words | 800-1200 words | Full narrative arc, sustained reading |
| **6-8** | 6 beats | 200-300 words | 1200-1800 words | Complex storytelling, advanced structure |

### Beat Architecture by Grade Level

#### K-1: 3-Beat Structure (Simple Arc)
Each beat should have clear beginning/middle/end:

1. **THE PROBLEM** - "Something Happens"
   - Show character in normal situation → Problem appears → Character decides to help
   - Simple cliffhanger: "What will they do?"

2. **THE ATTEMPT** - "Trying to Fix It"
   - Character tries to solve → Faces small challenge → Learns something new
   - Simple cliffhanger: "Will it work?"

3. **THE SOLUTION** - "Happy Ending"
   - Character uses what they learned → Solves the problem → Everyone is happy
   - Future hint: Gentle suggestion of more adventures

#### 2-3: 4-Beat Structure (Classic Beginning-Middle-End)

1. **THE DISCOVERY** - "Something New"
   - Normal day → Interesting discovery → Character gets curious
   - Cliffhanger: "What is it?"

2. **THE ADVENTURE BEGINS** - "Let's Explore"
   - Character investigates → Meets helper/obstacle → Makes progress
   - Cliffhanger: "What happens next?"

3. **THE CHALLENGE** - "Uh Oh!"
   - Bigger problem appears → Character feels worried → Decides to be brave
   - Cliffhanger: "Can they do it?"

4. **THE VICTORY** - "We Did It!"
   - Character solves problem → Celebrates with friends → Ready for more
   - Future hint: Something new to explore later

#### 4-5: 5-Beat Structure (Full Narrative Arc)

1. **THE HOOK** - "The World Changes"
   - Establish normal → Introduce disruption → Character chooses adventure
   - Cliffhanger: Surprising consequence emerges

2. **THE QUEST BEGINS** - "First Steps"  
   - Take action → Face first challenge → Overcome with unique traits
   - Cliffhanger: Victory reveals bigger mystery

3. **THE COMPLICATION** - "Deeper Than Expected"
   - Investigate → Learn crucial info → Realize true scope
   - Cliffhanger: Unexpected ally/enemy appears

4. **THE TURNING POINT** - "Everything Changes"
   - Adapt to situation → Use learning → Achieve breakthrough
   - Cliffhanger: Solution creates new problem

5. **THE RESOLUTION WITH PROMISE** - "Today's Victory, Tomorrow's Adventure"
   - Address urgent problem → Resolve crisis → Celebrate growth
   - Future Hook: Plant 2-3 seeds for next chapter

#### 6-8: 6-Beat Structure (Complex Narrative)

1. **THE INCITING INCIDENT** - "The Call to Adventure"
   - Detailed world-building → Complex problem introduced → Character's internal conflict
   - Cliffhanger: Moral dilemma or difficult choice

2. **THE COMMITMENT** - "Crossing the Threshold"
   - Character commits to path → Faces first real opposition → Stakes are established
   - Cliffhanger: Unexpected complication or betrayal

3. **THE FIRST TRIAL** - "Tests and Allies"
   - Navigate complex challenge → Form alliances → Learn about true enemy/problem
   - Cliffhanger: Major revelation changes everything

4. **THE ORDEAL** - "The Dark Moment"
   - Face greatest fear/challenge → Seem to fail → Character growth moment
   - Cliffhanger: Hope appears from unexpected source

5. **THE BREAKTHROUGH** - "The Reward"
   - Use growth to overcome → Achieve victory → Gain new understanding/power
   - Cliffhanger: Victory has unexpected cost or consequence

6. **THE TRANSFORMATION** - "The Road Back"
   - Deal with consequences → Character is changed → Set up future adventures
   - Future Hook: Multiple threads for continuing story

---

## Chapter Planning by Grade Level

### Proposed Standard Chapter Counts

| Grade Level | Chapter Count | Rationale |
|------------|---------------|-----------|
| **K-1** | 3 chapters | Short attention spans, simple arc completion |
| **2-3** | 6 chapters | Building reading stamina, episodic adventures |
| **4-5** | 10 chapters | Complex plots, character development |
| **6-7** | 15 chapters | Multi-layered narratives, subplots |
| **8th** | 20 chapters | Full novel-length experience, complex themes |

### Story Arc Distribution

#### K-1 (3 Chapters)
- **Chapter 1**: Problem introduction & first attempt
- **Chapter 2**: Learning and second attempt  
- **Chapter 3**: Success and celebration

#### 2-3 (6 Chapters)
- **Chapter 1**: Discovery of adventure
- **Chapter 2**: First challenge & helpers
- **Chapter 3**: Major setback or obstacle
- **Chapter 4**: New understanding & plan
- **Chapter 5**: Big attempt with friends
- **Chapter 6**: Victory and growth celebration

#### 4-5 (10 Chapters)
- **Chapters 1-2**: Setup, world-building, and inciting incident
- **Chapters 3-4**: First adventures and skill building
- **Chapters 5-6**: Rising challenges and complications
- **Chapters 7-8**: Major revelations and setbacks
- **Chapter 9**: Climactic confrontation
- **Chapter 10**: Resolution and character growth

#### 6-7 (15 Chapters)
- **Chapters 1-3**: Complex world introduction, multiple character threads
- **Chapters 4-6**: Initial adventures, relationship building
- **Chapters 7-9**: Deepening mystery, subplot development
- **Chapters 10-12**: Major complications, character testing
- **Chapters 13-14**: Climactic sequence with multiple plot threads
- **Chapter 15**: Resolution with sequel potential

#### 8th Grade (20 Chapters)
- **Chapters 1-4**: Rich world-building, character establishment, multiple POVs
- **Chapters 5-8**: Adventure begins, relationships deepen, mysteries emerge
- **Chapters 9-12**: Complications multiply, subplots interweave, character growth
- **Chapters 13-16**: Major revelations, ethical dilemmas, high stakes
- **Chapters 17-19**: Climactic sequence with multiple story threads converging
- **Chapter 20**: Satisfying resolution with mature themes and future possibilities

---

## Prompt Engineering Improvements

### Key Enhancements Needed

1. **Chapter Awareness**
   ```typescript
   // Add to StoryGenerationRequest
   currentChapter: number;
   totalChapters: number;
   storyArc: 'beginning' | 'middle' | 'climax' | 'resolution';
   ```

2. **Story Planning Context**
   ```typescript
   // For initial generation
   storyPlan?: {
     overallConflict: string;
     characterGrowthArc: string;
     majorPlotPoints: string[];
     plannedEnding: string;
     chapterMilestones: string[]; // Key events for each chapter
   }
   ```

3. **Enhanced Prompt Structure**
   - Include chapter position: "This is Chapter X of Y total chapters"
   - Specify story arc phase: "This chapter is part of the [beginning/middle/climax/resolution]"
   - Provide pacing guidance: "Build toward the climax in Chapter X"

### Engagement Techniques by Grade

#### K-1 Engagement
- Repetitive phrases for comfort
- Sound words and sensory details
- "What's that?" moments (not scary)
- Clear single goals per beat

#### 2-3 Engagement
- Vivid descriptions (colors, sounds)
- "Oh no!" moments
- Simple moral choices
- Friendship themes

#### 4-5 Engagement
- Plot twists and revelations
- Moral dilemmas
- Character growth challenges
- Mystery elements

#### 6-8 Engagement
- Emotional complexity
- Ethical choices
- Relationship dynamics
- Layered mysteries

---

## Multi-Chapter Continuity

### Context Management

1. **Story State Tracking**
   ```typescript
   interface StoryState {
     storyId: string;
     currentChapter: number;
     totalChapters: number;
     characterDevelopment: string[];
     unressolvedThreads: string[];
     establishedWorldRules: string[];
     relationships: Map<string, string>;
     inventoryItems: string[];
     majorEventsLog: string[];
   }
   ```

2. **Chapter Transition Data**
   ```typescript
   interface ChapterTransition {
     previousChapterSummary: string;
     playerChoice: string;
     consequencesOfChoice: string;
     threadsToResolve: string[];
     threadsToIntroduce: string[];
   }
   ```

3. **Continuity Validation**
   - Character consistency checks
   - World rule adherence
   - Plot thread tracking
   - Relationship progression

### Future Threads Management

Each chapter should:
- **Resolve** 1-2 threads from previous chapters
- **Maintain** 2-3 ongoing threads
- **Introduce** 1-2 new threads (except final chapter)
- **Plant seeds** for long-term payoffs

---

## Implementation Roadmap

### Phase 1: Update Prompt Templates
1. Modify `generateStoryPrompt()` to include:
   - Chapter awareness (X of Y)
   - Story arc position
   - Overall story plan
   - **Grade-specific beat counts** (3 for K-1, 4 for 2-3, 5 for 4-5, 6 for 6-8)
   
2. Enhance `generateContinuationPrompt()` to:
   - Reference story state
   - Manage thread continuity
   - Adjust pacing based on chapter position
   - **Use appropriate beat structure** for grade level

### Phase 2: Story State Management
1. Create story state service:
   - Track all story elements
   - Maintain continuity database
   - Validate chapter coherence

2. Implement chapter planning:
   - Generate overall story arc on first chapter
   - Store plan for reference
   - Adjust dynamically based on choices

### Phase 3: Grade-Specific Adaptations
1. Implement chapter count by grade
2. Adjust pacing algorithms
3. Scale complexity appropriately

### Phase 4: QTI Package Updates
1. Generate per-chapter packages
2. Track assessment across chapters
3. Create cumulative progress reports

### Phase 5: OneRoster Integration
1. Update LineItems per chapter
2. Track reading progress
3. Report comprehension scores

---

## Key Implementation Files to Modify

### Core Files
- `src/lib/ai/prompt-templates.ts` - Main prompt engineering (update beat counts by grade)
- `src/lib/ai/story-generation-service.ts` - Add story planning and grade-specific beat handling
- `src/lib/ai/types.ts` - New interfaces for multi-chapter and beat configuration

### New Files Needed
- `src/lib/services/story-state-service.ts` - Manage continuity
- `src/lib/services/chapter-planning-service.ts` - Arc management
- `src/lib/db/story-chapters-schema.ts` - Database schema

### API Updates
- `src/app/api/generate-story/route.ts` - Handle chapter requests
- `src/app/api/story-plan/route.ts` - New endpoint for planning
- `src/app/api/story-state/route.ts` - State management endpoint

---

## Database Schema Considerations

### Stories Table
```sql
CREATE TABLE stories (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  title TEXT,
  universe TEXT,
  character TEXT,
  total_chapters INTEGER,
  current_chapter INTEGER,
  story_plan JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Chapters Table
```sql
CREATE TABLE chapters (
  id UUID PRIMARY KEY,
  story_id UUID REFERENCES stories(id),
  chapter_number INTEGER,
  title TEXT,
  content JSONB,
  choices_presented JSONB,
  choice_selected TEXT,
  threads_resolved TEXT[],
  threads_introduced TEXT[],
  qti_package_url TEXT,
  created_at TIMESTAMP
);
```

### Story State Table
```sql
CREATE TABLE story_states (
  id UUID PRIMARY KEY,
  story_id UUID REFERENCES stories(id),
  chapter_number INTEGER,
  state_data JSONB, -- Full context snapshot
  updated_at TIMESTAMP
);
```

---

## Testing Considerations

### Unit Tests
- Prompt generation with chapter awareness
- Story state continuity validation
- Grade-level appropriate content

### Integration Tests
- Multi-chapter generation flow
- Choice → consequence tracking
- QTI package generation per chapter

### E2E Tests
- Complete story generation (all chapters)
- Student progress tracking
- Assessment score aggregation

---

## Success Metrics

1. **Engagement**: Students complete more chapters
2. **Comprehension**: Consistent or improving quiz scores
3. **Continuity**: No plot inconsistencies reported
4. **Satisfaction**: Positive feedback on story endings
5. **Grade-Appropriate**: Content matches reading level

---

## Notes for Implementation Team

### Critical Success Factors
1. **Always pass chapter context** to the AI for coherent storytelling
2. **Maintain story state** between chapters for continuity
3. **Plan the entire arc** upfront but allow flexibility
4. **Test grade-level appropriateness** thoroughly
5. **Validate continuity** between chapters programmatically

### Potential Challenges
- Managing complex state across multiple chapters
- Balancing predetermined arc with dynamic choices
- Ensuring satisfying conclusions at the right time
- Maintaining engagement across longer stories (6-8 grade)
- Handling edge cases (student abandonment, returning later)

### Recommended Next Steps
1. Review and approve chapter count standards
2. Design story state management system
3. Update prompt templates with chapter awareness
4. Implement story planning service
5. Create continuity validation system
6. Test with sample stories at each grade level

---

## Appendix: Sample Enhanced Prompts

### Initial Chapter with Planning
```
You are generating Chapter 1 of a 6-chapter story for grade 2-3.
This chapter should have exactly 4 beats (400-600 words total).

Beat structure for this grade level:
1. THE DISCOVERY (100-150 words)
2. THE ADVENTURE BEGINS (100-150 words)
3. THE CHALLENGE (100-150 words)
4. THE VICTORY (100-150 words)

This story should have a clear six-chapter structure:
- Chapter 1: Discovery of adventure
- Chapter 2: First challenge & helpers
- Chapter 3: Major setback or obstacle
- Chapter 4: New understanding & plan
- Chapter 5: Big attempt with friends
- Chapter 6: Victory and growth celebration

The overall conflict is: [character] must [goal] by overcoming [obstacle].
By the end, [character] will have learned [lesson].

Generate Chapter 1 focusing on the initial discovery...
```

### Middle Chapter with Context
```
You are generating Chapter 3 of a 6-chapter story for grade 2-3.
This chapter should have exactly 4 beats (400-600 words total).
This is the major setback chapter - things get harder but character stays determined.

Beat structure for this grade level:
1. THE DISCOVERY (100-150 words)
2. THE ADVENTURE BEGINS (100-150 words)
3. THE CHALLENGE (100-150 words)
4. THE VICTORY (100-150 words)

Story so far: [summary]
Unresolved threads: [list]
Chapter 4 will show new understanding & planning.
Chapters 5-6 will build to the satisfying conclusion.

The reader chose: [choice]
Generate Chapter 3 showing the consequences of this choice...
```

### Final Chapter with Closure
```
You are generating Chapter 6 of 6 - the final chapter for grade 2-3.
This chapter should have exactly 4 beats (400-600 words total).
This is the victory and growth celebration - satisfying closure with hints of future adventures.

Beat structure for this grade level:
1. THE DISCOVERY (100-150 words) - Final challenge appears
2. THE ADVENTURE BEGINS (100-150 words) - Character prepares
3. THE CHALLENGE (100-150 words) - Face the final test
4. THE VICTORY (100-150 words) - Celebrate success and growth

Threads to resolve: [list]
Character growth to demonstrate: [arc]
Lessons to reinforce: [themes]

Create a ending that feels complete but leaves room for imagination...
```

---

*Document prepared for Task 8: Implement Multi-Chapter Story Generation*
*Last updated: [Current Date]*
*Based on discussions regarding prompt engineering and story structure improvements*
