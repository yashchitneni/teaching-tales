## Reading Level Rubric (TEKS/Lexile-aligned Implementation)

This document defines the implemented reading level parameters for story generation, aligned with Texas education standards and Lexile frameworks.

### Grade Bands (Implemented)
- K-1: Lexile 0-300L (Beginning Reader to 300L)
- 2-3: Lexile 300L-700L (Early Elementary)
- 4-5: Lexile 700L-1000L (Upper Elementary)
- 6-8: Lexile 925L-1185L (Middle School)
- 9-12: Lexile 1050L-1400L (High School) - Future implementation

### Implemented Parameters per Band

#### K-1 (Kindergarten - 1st Grade)
- **Word Count**: 150-300 words per chapter
- **Sentence Length**: Maximum 8 words, average 6 words
- **Vocabulary**: High-frequency, concrete nouns, 2-3 new words with definitions
- **Complexity**: Simple sentences, present tense, concrete concepts
- **Scaffolding**: High support with repetition and explicit context

#### 2-3 (2nd - 3rd Grade)
- **Word Count**: 300-600 words per chapter
- **Sentence Length**: Maximum 12 words, average 8 words
- **Vocabulary**: Controlled vocabulary, familiar contexts, 3-4 new words
- **Complexity**: Simple and compound sentences, some past tense
- **Scaffolding**: High support with clear transitions

#### 4-5 (4th - 5th Grade)
- **Word Count**: 600-1000 words per chapter
- **Sentence Length**: Maximum 16 words, average 10 words
- **Vocabulary**: Mixed familiar/challenging, some academic terms, 4-5 new words
- **Complexity**: Varied structures, light figurative language, mixed concepts
- **Scaffolding**: Medium support with moderate repetition

#### 6-8 (6th - 8th Grade)
- **Word Count**: 1000-1500 words per chapter
- **Sentence Length**: Maximum 20 words, average 12 words
- **Vocabulary**: Advanced and academic vocabulary, 5-6 challenging words
- **Complexity**: Complex sentences, figurative language, abstract concepts
- **Scaffolding**: Low support, reader independence expected

### Implementation Features

#### Reading Level Service
- **Automatic Parameter Generation**: `ReadingLevelService.generatePromptParameters(gradeLevel)`
- **Content Validation**: `ReadingLevelService.validateReadingLevel(content, gradeLevel)`
- **Lexile Estimation**: Simple algorithm for content complexity assessment

#### A/B Testing Framework
- **Control vs Enhanced**: Test basic prompts against detailed reading level parameters
- **Metric Tracking**: Story completion, reading time, quiz accuracy, engagement
- **User Assignment**: Deterministic assignment based on user ID hash

#### Quality Assessment
- **Automatic Validation**: Sentence length, word count, complexity checks
- **Improvement Suggestions**: Specific recommendations for reading level alignment
- **Engagement Metrics**: Track user behavior to validate effectiveness

### Usage in Story Generation

The reading level parameters are automatically applied in:
1. **Chapter Generation**: Multi-chapter stories use grade-appropriate structure
2. **Single Story Generation**: Traditional stories with reading level constraints
3. **A/B Testing**: Compare enhanced vs basic prompt approaches
4. **Quality Validation**: Post-generation content assessment

### Telemetry and Iteration

The system captures:
- Reading level assignment and user engagement
- A/B test variant performance
- Content quality metrics
- User completion and satisfaction rates

This data enables continuous refinement of reading level parameters and prompt effectiveness.


