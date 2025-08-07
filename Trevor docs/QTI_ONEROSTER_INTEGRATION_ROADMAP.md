# 🗺️ Teaching Tales QTI/OneRoster Integration Roadmap

**Goal**: Complete Tasks 5, 6, and 7 with full QTI and OneRoster compliance before proceeding to Task 8.

---

## **Phase 1: Foundation & Infrastructure** 
*Build the core APIs and data structures that everything else depends on*

### 1.1 QTI API Endpoints ⚡ *CRITICAL FOUNDATION*

- [x] **Create POST /api/qti/v3/responses endpoint**
  - [x] Create `src/app/api/qti/v3/responses/route.ts`
  - [x] Implement request validation (assessmentId, studentId, responses)
  - [x] Store responses in TimeBack QTI API format
  - [x] Handle response scoring and feedback generation
  - [x] Return response confirmation with timestamps
  - [x] Add error handling for malformed requests

- [x] **Enhance GET /api/qti/v3/assessments/{id} endpoint**
  - [x] Create dedicated `src/app/api/qti/v3/assessments/[id]/route.ts`
  - [x] Support multiple response formats (JSON, XML, full)
  - [x] Include assessment metadata and structure
  - [x] Support section-by-section loading
  - [x] Add QTI XML generation capabilities
  - [x] Handle assessment not found scenarios

- [x] **Create QTI response processing engine**
  - [x] Implement `src/lib/qti/processors/response-processor.ts`
  - [x] Add scoring algorithms for different question types
  - [x] Handle partial credit and complex response patterns
  - [x] Generate feedback based on QTI rules
  - [x] Support adaptive questioning logic

### 1.2 OneRoster Write Operations ⚡ *CRITICAL FOUNDATION*

- [x] **Extend oneroster-client.ts with write operations**
  - [x] Add `createClass(classData: ClassCreationData): Promise<ClassResponse>`
  - [x] Add `createLineItem(lineItemData: LineItemData): Promise<LineItemResponse>`
  - [x] Add `enrollStudent(enrollmentData: EnrollmentData): Promise<EnrollmentResponse>`
  - [x] Add `updateResult(resultData: ResultData): Promise<ResultResponse>`
  - [x] Add proper TypeScript interfaces for all request/response types

- [x] **Create OneRoster data validation**
  - [x] Implement `src/lib/api/oneroster-validator.ts`
  - [x] Validate class creation payloads against OneRoster spec
  - [x] Ensure proper TimeBack API compliance
  - [x] Handle error responses gracefully
  - [x] Add field validation and sanitization

### 1.3 Enhanced QTI Generator

- [x] **Upgrade QTIGenerator to produce true QTI v3 XML**
  - [x] QTI Generator already produces compliant XML (verified in existing implementation)
  - [x] Create `src/lib/qti/parsers/qti-xml-parser.ts` for parsing QTI XML
  - [x] Create `src/lib/qti/engines/unlock-engine.ts` for section unlocking
  - [x] Create `src/lib/services/response-storage-service.ts` for response management
  - [x] Create `src/lib/services/gradebook-service.ts` for OneRoster integration

- [x] **Add assessment metadata tracking**
  - [x] Enhanced assessment endpoint supports metadata and XML generation
  - [x] Response storage service tracks assessment-to-response mapping
  - [x] Gradebook service links assessments to OneRoster results
  - [x] Comprehensive metadata support in all services

---

## **Phase 2: Story Generation Integration** 
*Complete Task 5 with full OneRoster integration*

### 2.1 Complete Story Generation Flow

- [x] **Add OneRoster class creation to loading page**
  - [x] Modify `src/app/create-book/loading/page.tsx`
  - [x] After QTI storage, call `createClass()` with story metadata
  - [x] Handle class creation errors gracefully
  - [x] Store class ID in story metadata for future reference

- [x] **Create LineItem for each story chapter**
  - [x] Loop through generated assessments
  - [x] Create LineItem for each chapter/assessment
  - [x] Set appropriate due dates and max scores
  - [x] Link LineItems to the created class

- [x] **Auto-enroll current student**
  - [x] Call `enrollStudent()` after class creation
  - [x] Set proper enrollment dates and status
  - [x] Handle enrollment conflicts/duplicates
  - [x] Update user's class list

### 2.2 Enhanced Metadata Tracking

- [x] **Store OneRoster IDs in QTI metadata**
  - [x] Update `StoryStorageService.saveStory()`
  - [x] Include classId, lineItemIds in stimulus metadata
  - [x] Store enrollment references
  - [x] Enable bidirectional data flow

- [x] **Add error handling and rollback**
  - [x] Create comprehensive `OneRosterIntegrationService`
  - [x] Create `ErrorRecoveryService` for rollback operations
  - [x] Provide meaningful error messages to users
  - [x] Implement retry mechanisms for transient failures
  - [x] Create integration testing utilities

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

**Phase 1**: ✅ Foundation (12/12 tasks completed - 100%) 🎉  
**Phase 2**: ✅ Story Generation (8/8 tasks completed - 100%) 🎉  
**Phase 3**: ☐ Reading Interface (0/12 tasks completed)  
**Phase 4**: ☐ Response Handling (0/10 tasks completed)  
**Phase 5**: ☐ Integration & Testing (0/10 tasks completed)  
**Phase 6**: ☐ Final Polish (0/8 tasks completed)  

**Overall Progress**: 20/60 tasks completed (33%)

---

*This roadmap ensures that each phase builds on the previous one without requiring any rework, and all integration points are properly tested before moving to Task 8.*
