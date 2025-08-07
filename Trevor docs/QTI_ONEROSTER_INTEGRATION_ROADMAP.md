# 🗺️ Teaching Tales QTI/OneRoster Integration Roadmap

**Goal**: Complete Tasks 5, 6, and 7 with full QTI and OneRoster compliance before proceeding to Task 8.

---

## **Phase 1: Foundation & Infrastructure** 
*Build the core APIs and data structures that everything else depends on*

### 1.1 QTI API Endpoints ⚡ *CRITICAL FOUNDATION*

- [ ] **Create POST /api/qti/v3/responses endpoint**
  - [ ] Create `src/app/api/qti/v3/responses/route.ts`
  - [ ] Implement request validation (assessmentId, studentId, responses)
  - [ ] Store responses in TimeBack QTI API format
  - [ ] Handle response scoring and feedback generation
  - [ ] Return response confirmation with timestamps
  - [ ] Add error handling for malformed requests

- [ ] **Enhance GET /api/qti/v3/assessments/{id} endpoint**
  - [ ] Modify existing endpoint to return proper QTI XML format
  - [ ] Include assessment metadata and structure
  - [ ] Support section-by-section loading
  - [ ] Add response processing rules in XML
  - [ ] Handle assessment not found scenarios

- [ ] **Create QTI response processing engine**
  - [ ] Implement `src/lib/qti/processors/response-processor.ts`
  - [ ] Add scoring algorithms for different question types
  - [ ] Handle partial credit and complex response patterns
  - [ ] Generate feedback based on QTI rules
  - [ ] Support adaptive questioning logic

### 1.2 OneRoster Write Operations ⚡ *CRITICAL FOUNDATION*

- [ ] **Extend oneroster-client.ts with write operations**
  - [ ] Add `createClass(classData: ClassCreationData): Promise<ClassResponse>`
  - [ ] Add `createLineItem(lineItemData: LineItemData): Promise<LineItemResponse>`
  - [ ] Add `enrollStudent(enrollmentData: EnrollmentData): Promise<EnrollmentResponse>`
  - [ ] Add `updateResult(resultData: ResultData): Promise<ResultResponse>`
  - [ ] Add proper TypeScript interfaces for all request/response types

- [ ] **Create OneRoster data validation**
  - [ ] Implement `src/lib/api/oneroster-validator.ts`
  - [ ] Validate class creation payloads against OneRoster spec
  - [ ] Ensure proper TimeBack API compliance
  - [ ] Handle error responses gracefully
  - [ ] Add field validation and sanitization

### 1.3 Enhanced QTI Generator

- [ ] **Upgrade QTIGenerator to produce true QTI v3 XML**
  - [ ] Modify `src/lib/qti/generators/qti-generator.ts`
  - [ ] Generate compliant assessment XML with proper namespaces
  - [ ] Include response processing rules in XML
  - [ ] Add section-level navigation controls
  - [ ] Support all QTI interaction types

- [ ] **Add assessment metadata tracking**
  - [ ] Link generated assessments to OneRoster classes
  - [ ] Store assessment-to-story mapping
  - [ ] Include grading rubrics and standards alignment
  - [ ] Add versioning for assessment updates

---

## **Phase 2: Story Generation Integration** 
*Complete Task 5 with full OneRoster integration*

### 2.1 Complete Story Generation Flow

- [ ] **Add OneRoster class creation to loading page**
  - [ ] Modify `src/app/create-book/loading/page.tsx`
  - [ ] After QTI storage, call `createClass()` with story metadata
  - [ ] Handle class creation errors gracefully
  - [ ] Store class ID in story metadata for future reference

- [ ] **Create LineItem for each story chapter**
  - [ ] Loop through generated assessments
  - [ ] Create LineItem for each chapter/assessment
  - [ ] Set appropriate due dates and max scores
  - [ ] Link LineItems to the created class

- [ ] **Auto-enroll current student**
  - [ ] Call `enrollStudent()` after class creation
  - [ ] Set proper enrollment dates and status
  - [ ] Handle enrollment conflicts/duplicates
  - [ ] Update user's class list

### 2.2 Enhanced Metadata Tracking

- [ ] **Store OneRoster IDs in QTI metadata**
  - [ ] Update `StoryStorageService.saveStory()`
  - [ ] Include classId, lineItemIds in stimulus metadata
  - [ ] Store enrollment references
  - [ ] Enable bidirectional data flow

- [ ] **Add error handling and rollback**
  - [ ] If OneRoster creation fails, clean up QTI data
  - [ ] Provide meaningful error messages to users
  - [ ] Implement retry mechanisms for transient failures
  - [ ] Log errors for debugging

---

## **Phase 3: Reading Interface Overhaul** 
*Complete Task 6 with true QTI integration*

### 3.1 QTI Assessment Loading

- [ ] **Replace localStorage with QTI API calls**
  - [ ] Modify `src/app/book/[bookId]/page.tsx`
  - [ ] Create `loadQTIAssessment()` function
  - [ ] Call proper QTI endpoints for assessment data
  - [ ] Remove localStorage fallback dependencies

- [ ] **Create QTI XML parser**
  - [ ] Create `src/lib/qti/parsers/qti-xml-parser.ts`
  - [ ] Parse sections, items, response declarations
  - [ ] Extract navigation rules and unlocking conditions
  - [ ] Return structured data for React components
  - [ ] Handle malformed or invalid XML

### 3.2 Section Blurring & Progressive Unlocking

- [ ] **Implement section state management**
  - [ ] Create `SectionState` interface and context
  - [ ] Track unlocked/completed status per section
  - [ ] Store unlock requirements and dependencies
  - [ ] Persist state across page refreshes

- [ ] **Add visual blurring for locked sections**
  - [ ] Add CSS filters for locked content
  - [ ] Show lock icons and unlock requirements
  - [ ] Add progress indicators showing completion status
  - [ ] Animate unlock transitions

- [ ] **Create unlock condition engine**
  - [ ] Implement `src/lib/qti/engines/unlock-engine.ts`
  - [ ] Check prerequisite section completion
  - [ ] Validate minimum score requirements
  - [ ] Handle complex branching logic
  - [ ] Support time-based unlocking

### 3.3 QTI-Compliant Question Rendering

- [ ] **Support all QTI interaction types**
  - [ ] Update `GuidingQuestions` component
  - [ ] Add choiceInteraction (multiple choice) support
  - [ ] Add textEntryInteraction (fill-in-blank) support
  - [ ] Add extendedTextInteraction (essay) support
  - [ ] Add orderInteraction (drag-and-drop) support

- [ ] **Render QTI feedback and hints**
  - [ ] Show immediate feedback based on QTI rules
  - [ ] Display hints when available
  - [ ] Handle adaptive questioning
  - [ ] Support rich media in questions

---

## **Phase 4: Response Handling & Persistence** 
*Complete Task 7 with full backend integration*

### 4.1 Response Capture & Processing

- [ ] **Enhance answer submission handling**
  - [ ] Update `handleQuestionAnswer()` in reading components
  - [ ] Process locally for immediate feedback
  - [ ] Call backend API to store responses
  - [ ] Update section unlock status
  - [ ] Handle submission errors gracefully

- [ ] **Implement response batching**
  - [ ] Create `src/lib/services/response-queue.ts`
  - [ ] Queue responses for offline scenarios
  - [ ] Batch submit when connection restored
  - [ ] Handle duplicate submission prevention
  - [ ] Add retry logic for failed submissions

### 4.2 Backend Response Storage

- [ ] **Create response storage service**
  - [ ] Create `src/lib/services/response-storage-service.ts`
  - [ ] Implement `storeResponse()` method
  - [ ] Implement `getResponses()` method
  - [ ] Implement `calculateResults()` method
  - [ ] Add response validation against QTI declarations

- [ ] **Implement response validation**
  - [ ] Validate against QTI response declarations
  - [ ] Check response format and constraints
  - [ ] Handle invalid or malformed responses
  - [ ] Provide meaningful validation errors

### 4.3 OneRoster Gradebook Integration

- [ ] **Create result submission service**
  - [ ] Create `src/lib/services/gradebook-service.ts`
  - [ ] Implement `submitToGradebook()` method
  - [ ] Map assessment results to OneRoster format
  - [ ] Handle grade submission errors
  - [ ] Support grade updates and corrections

- [ ] **Add grade synchronization**
  - [ ] Implement real-time grade updates to TimeBack
  - [ ] Handle grade override scenarios
  - [ ] Maintain audit trail of score changes
  - [ ] Support bulk grade operations

---

## **Phase 5: Integration & Testing** 
*Ensure everything works together seamlessly*

### 5.1 End-to-End Flow Testing

- [ ] **Create comprehensive test scenarios**
  - [ ] Test: Story generation → QTI creation → OneRoster class → Student enrollment
  - [ ] Test: Reading interface → QTI loading → Section unlocking → Response submission
  - [ ] Test: Answer processing → Score calculation → Gradebook update
  - [ ] Document test procedures and expected outcomes

- [ ] **Test error scenarios**
  - [ ] API failures at each integration point
  - [ ] Network interruptions during critical operations
  - [ ] Invalid data handling and recovery
  - [ ] User session timeout scenarios

### 5.2 Data Consistency Validation

- [ ] **Verify QTI ↔ OneRoster data alignment**
  - [ ] Assessment IDs match between systems
  - [ ] Student enrollments are properly linked
  - [ ] Scores sync correctly between systems
  - [ ] Metadata consistency across APIs

- [ ] **Add data integrity checks**
  - [ ] Implement orphaned assessment detection
  - [ ] Add missing enrollment validation
  - [ ] Create score discrepancy monitoring
  - [ ] Set up automated data validation

### 5.3 Performance Optimization

- [ ] **Optimize QTI XML parsing**
  - [ ] Cache parsed assessments
  - [ ] Lazy load sections as needed
  - [ ] Minimize DOM manipulation
  - [ ] Add parsing performance metrics

- [ ] **Batch OneRoster operations**
  - [ ] Group API calls where possible
  - [ ] Implement request queuing
  - [ ] Add retry logic with exponential backoff
  - [ ] Monitor API rate limits

---

## **Phase 6: Final Polish & Documentation**
*Prepare for Task 8 and beyond*

### 6.1 Error Handling & User Experience

- [ ] **Add comprehensive error boundaries**
  - [ ] Graceful degradation when APIs fail
  - [ ] User-friendly error messages
  - [ ] Recovery action suggestions
  - [ ] Error reporting to development team

- [ ] **Implement loading states**
  - [ ] Progress indicators for all async operations
  - [ ] Skeleton screens for content loading
  - [ ] Timeout handling with retry options
  - [ ] Smooth transitions between states

### 6.2 Documentation & Monitoring

- [ ] **Update API documentation**
  - [ ] Document all new endpoints
  - [ ] Include request/response examples
  - [ ] Add error code references
  - [ ] Create integration guides

- [ ] **Add operational monitoring**
  - [ ] Track QTI/OneRoster integration success rates
  - [ ] Monitor response times and failures
  - [ ] Set up alerting for critical issues
  - [ ] Create operational dashboards

---

## **🎯 Success Criteria for Task 8 Readiness**

### ✅ **Story Generation Complete**
- [ ] Creates QTI assessments AND OneRoster classes with student enrollment
- [ ] All metadata properly linked between systems
- [ ] Error handling and rollback mechanisms working
- [ ] No dependency on localStorage for core functionality

### ✅ **Reading Interface Complete**  
- [ ] Loads true QTI XML with progressive section unlocking
- [ ] Supports all required QTI interaction types
- [ ] Visual feedback for locked/unlocked sections
- [ ] Proper state management and persistence

### ✅ **Response Handling Complete**
- [ ] Persists responses to backend AND updates OneRoster gradebook
- [ ] Offline support with response queuing
- [ ] Proper validation and error handling
- [ ] Real-time grade synchronization

### ✅ **Data Integrity Verified**
- [ ] All systems stay in sync with proper error handling
- [ ] Comprehensive test coverage of integration points
- [ ] Performance optimized for production use
- [ ] Monitoring and alerting in place

### ✅ **User Experience Polished**
- [ ] Seamless flow with proper loading states and error recovery
- [ ] No visible API failures or data inconsistencies
- [ ] Responsive and performant user interface
- [ ] Clear feedback for all user actions

---

## **📋 Tracking Progress**

**Phase 1**: ☐ Foundation (0/12 tasks completed)  
**Phase 2**: ☐ Story Generation (0/8 tasks completed)  
**Phase 3**: ☐ Reading Interface (0/12 tasks completed)  
**Phase 4**: ☐ Response Handling (0/10 tasks completed)  
**Phase 5**: ☐ Integration & Testing (0/10 tasks completed)  
**Phase 6**: ☐ Final Polish (0/8 tasks completed)  

**Overall Progress**: 0/60 tasks completed (0%)

---

*This roadmap ensures that each phase builds on the previous one without requiring any rework, and all integration points are properly tested before moving to Task 8.*
