// Updated to use server-side proxy routes for security
// See docs/AUTHENTICATION_ARCHITECTURE.md for details

interface TestPart {
  id: string;
  identifier: string;
  sections: Section[];
}

interface Section {
  id: string;
  identifier: string;
  title: string;
  items: Item[];
}

interface Item {
  id: string;
  identifier: string;
  title: string;
  interactionType: string;
  sequence: number;
  xmlContent?: string;
}

interface ItemDetails {
  item: {
    id: string;
    identifier: string;
    title: string;
    xmlUrl: string;
    xmlHash: string;
  };
}

interface TestPartsResponse {
  testParts: TestPart[];
}

interface AssessmentTest {
  id: string;
  identifier: string;
  title: string;
  testPartCount: number;
  itemCount: number;
  language: string;
  toolName?: string;
  toolVersion?: string;
  duration?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// QTI Stimuli interfaces
interface Stimulus {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  content: string;
  mediaType: string;
  language?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface CreateStimulusRequest {
  identifier: string;
  title: string;
  contentType: string;
  contentText?: string;
  contentFile?: string;
  altText?: string;
  transcript?: string;
  captions?: Record<string, any>;
  metadata?: Record<string, any>;
}

interface UpdateStimulusRequest {
  identifier?: string;
  title?: string;
  description?: string;
  content?: string;
  mediaType?: string;
  language?: string;
  metadata?: Record<string, any>;
}

interface StimuliListResponse {
  stimuli: Stimulus[];
  total: number;
  page: number;
  pageSize: number;
}

// QTI Assessment Test interfaces for questions
interface CreateAssessmentTestRequest {
  identifier: string;
  title: string;
  description?: string;
  language?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

interface AssessmentTestResponse {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  language?: string;
  duration?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

interface CreateTestItemRequest {
  identifier: string;
  title: string;
  interactionType: string;
  xmlContent: string;
  sequence?: number;
}

interface AssessmentTestsResponse {
  tests: AssessmentTest[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export async function fetchAssessmentTests(limit: number = 100, offset: number = 0): Promise<AssessmentTestsResponse> {
  const response = await fetch(
    `/api/ims/qti/v3p0/assessment-tests?limit=${limit}&offset=${offset}`,
    {
      credentials: 'include',  // Include HttpOnly cookies
      headers: {
        'Accept': 'application/json',
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch assessment tests: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchTestHierarchy(testId: string): Promise<TestPartsResponse> {
  const response = await fetch(
    `/api/ims/qti/v3p0/assessment-tests/${testId}/test-parts`,
    {
      credentials: 'include',  // Include HttpOnly cookies
      headers: {
        'Accept': 'application/json',
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch test hierarchy: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchItemDetails(itemId: string): Promise<ItemDetails> {
  console.log('Fetching item details for:', itemId);
  const response = await fetch(
    `/api/ims/qti/v3p0/assessment-items/${itemId}`,
    {
      credentials: 'include',  // Include HttpOnly cookies
      headers: {
        'Accept': 'application/json',
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch item details: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('Item details response:', JSON.stringify(data, null, 2));
  return data;
}

export async function fetchItemXML(xmlUrl: string): Promise<string> {
  console.log('Fetching XML from URL:', xmlUrl);
  
  // The xmlUrl should be a pre-signed S3 URL that doesn't require authentication
  const response = await fetch(xmlUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/xml, text/xml',
    },
  });

  if (!response.ok) {
    console.error('Failed to fetch XML. Status:', response.status);
    console.error('Response headers:', response.headers);
    throw new Error(`Failed to fetch item XML: ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type');
  console.log('Response content-type:', contentType);

  const xmlContent = await response.text();
  console.log('Fetched content length:', xmlContent.length);
  console.log('Content preview:', xmlContent.substring(0, 500));
  
  // Check if we received HTML instead of XML
  if (xmlContent.includes('<!DOCTYPE html') || xmlContent.includes('<html')) {
    console.error('ERROR: Received HTML instead of XML. This might be a CORS issue or incorrect URL.');
    console.error('Full URL was:', xmlUrl);
  }
  
  return xmlContent;
}

export async function loadCompleteAssessmentTest(testId: string): Promise<TestPartsResponse> {
  try {
    // Step 1: Fetch test hierarchy
    const testData = await fetchTestHierarchy(testId);

    // Step 2 & 3: Fetch item details and XML for each item
    for (const part of testData.testParts) {
      for (const section of part.sections) {
        const itemPromises = section.items.map(async (item) => {
          try {
            // Step 2: Get item details including XML URL
            const itemDetails = await fetchItemDetails(item.id);
            
            // Check if xmlUrl exists
            const xmlUrl = itemDetails.item.xmlUrl;
            if (!xmlUrl) {
              console.warn(`No XML URL provided for item ${item.id}. Using mock XML for testing.`);
              
              // Use mock XML based on interaction type for testing
              let mockXml = '';
              if (item.interactionType === 'choice') {
                mockXml = `<?xml version="1.0" encoding="UTF-8"?>
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p2" 
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                identifier="${item.identifier}" 
                title="${item.title}">
  <itemBody>
    <div>
      <p>What city is Gauntlet AI based in?</p>
      <choiceInteraction responseIdentifier="RESPONSE" shuffle="false" maxChoices="1">
        <simpleChoice identifier="choice_austin">Austin, Texas</simpleChoice>
        <simpleChoice identifier="choice_paris">Paris, France</simpleChoice>
        <simpleChoice identifier="choice_london">London, UK</simpleChoice>
        <simpleChoice identifier="choice_tokyo">Tokyo, Japan</simpleChoice>
      </choiceInteraction>
    </div>
  </itemBody>
</assessmentItem>`;
              } else if (item.interactionType === 'textEntry') {
                mockXml = `<?xml version="1.0" encoding="UTF-8"?>
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p2"
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                identifier="${item.identifier}"
                title="${item.title}">
  <itemBody>
    <div>
      <p>What is Austen's last name?</p>
      <textEntryInteraction responseIdentifier="RESPONSE" expectedLength="20"/>
    </div>
  </itemBody>
</assessmentItem>`;
              }
              
              return { ...item, xmlContent: mockXml };
            }
            
            // Check if xmlUrl looks like an S3 URL
            if (!xmlUrl.includes('s3.amazonaws.com') && !xmlUrl.includes('s3://')) {
              console.warn('XML URL does not appear to be an S3 URL:', xmlUrl);
            }
            
            // Step 3: Fetch the XML content
            const xmlContent = await fetchItemXML(xmlUrl);
            
            // Add XML content to the item
            return { ...item, xmlContent };
          } catch (error) {
            console.error(`Failed to load item ${item.id}:`, error);
            return { ...item, xmlContent: '' };
          }
        });

        // Wait for all items in the section to load
        section.items = await Promise.all(itemPromises);
      }
    }

    return testData;
  } catch (error) {
    console.error('Failed to load assessment test:', error);
    throw error;
  }
}

// QTI Stimuli API functions

/**
 * Get list of stimuli
 */
export async function listStimuli(page: number = 1, pageSize: number = 20): Promise<StimuliListResponse> {
  try {
    const response = await fetch(`/api/ims/qti/v3p0/stimuli?page=${page}&pageSize=${pageSize}`, {
      method: 'GET',
      credentials: 'include',  // Include HttpOnly cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stimuli: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to list stimuli:', error);
    throw error;
  }
}

/**
 * Create a new stimulus (story)
 */
export async function createStimulus(stimulusData: CreateStimulusRequest): Promise<Stimulus> {
  try {
    const response = await fetch(`/api/ims/qti/v3p0/stimuli`, {
      method: 'POST',
      credentials: 'include',  // Include HttpOnly cookies
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stimulusData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create stimulus: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to create stimulus:', error);
    throw error;
  }
}

/**
 * Get a specific stimulus by ID
 */
export async function getStimulus(stimulusId: string): Promise<Stimulus> {
  try {
    const response = await fetch(`/api/ims/qti/v3p0/stimuli/${stimulusId}`, {
      method: 'GET',
      credentials: 'include',  // Include HttpOnly cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stimulus: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get stimulus:', error);
    throw error;
  }
}

/**
 * Update a stimulus
 */
export async function updateStimulus(stimulusId: string, updateData: UpdateStimulusRequest): Promise<Stimulus> {
  try {
    const response = await fetch(`/api/ims/qti/v3p0/stimuli/${stimulusId}`, {
      method: 'PUT',
      credentials: 'include',  // Include HttpOnly cookies
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update stimulus: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to update stimulus:', error);
    throw error;
  }
}

/**
 * Delete a stimulus
 */
export async function deleteStimulus(stimulusId: string): Promise<void> {
  try {
    const response = await fetch(`/api/ims/qti/v3p0/stimuli/${stimulusId}`, {
      method: 'DELETE',
      credentials: 'include',  // Include HttpOnly cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete stimulus: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to delete stimulus:', error);
    throw error;
  }
}

// QTI Assessment Tests API functions (for storing comprehension questions)

/**
 * Create a new assessment test for story comprehension questions
 */
export async function createAssessmentTest(testData: CreateAssessmentTestRequest): Promise<AssessmentTestResponse> {
  try {
    const response = await fetch(`/api/ims/qti/v3p0/assessment-tests`, {
      method: 'POST',
      credentials: 'include',  // Include HttpOnly cookies
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create assessment test: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to create assessment test:', error);
    throw error;
  }
}

/**
 * Get an assessment test by ID
 */
export async function getAssessmentTest(testId: string): Promise<AssessmentTestResponse> {
  try {
    const response = await fetch(`/api/ims/qti/v3p0/assessment-tests/${testId}`, {
      method: 'GET',
      credentials: 'include',  // Include HttpOnly cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch assessment test: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get assessment test:', error);
    throw error;
  }
}

/**
 * Update an assessment test
 */
export async function updateAssessmentTest(testId: string, updateData: Partial<CreateAssessmentTestRequest>): Promise<AssessmentTestResponse> {
  try {
    const response = await fetch(`/api/ims/qti/v3p0/assessment-tests/${testId}`, {
      method: 'PUT',
      credentials: 'include',  // Include HttpOnly cookies
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update assessment test: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to update assessment test:', error);
    throw error;
  }
}

/**
 * Delete an assessment test
 */
export async function deleteAssessmentTest(testId: string): Promise<void> {
  try {
    const response = await fetch(`/api/ims/qti/v3p0/assessment-tests/${testId}`, {
      method: 'DELETE',
      credentials: 'include',  // Include HttpOnly cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete assessment test: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to delete assessment test:', error);
    throw error;
  }
}
