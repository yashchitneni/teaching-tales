1. Introduction
This document maps the user journeys through the Teach Tales application as observed in the provided video walkthrough. It serves as the primary guide for understanding user interactions, system responses, and the visual flow of the application. The purpose of this document is to provide a clear blueprint for development, defining the exact sequence of interactions required to clone the application's user experience.

2. Identified User Flows
The following core user flows have been identified from the video analysis.

UF-001: New User Authentication Flow

UF-002: Child Account Creation Flow

UF-003: Book Creation Flow

UF-004: Interactive Reading and Quiz Flow

3. Flow Documentation: UF-001 (New User Authentication)
Element

Description

Flow ID

UF-001

Flow Name

New User Authentication Flow

Entry Points

User navigates to the main "Sign in to Teach Tales" page.

Success Criteria

User is successfully authenticated via a third-party provider (Google) and is redirected to the next step in the onboarding process (Child Account Creation).

Exit Points

- Successful authentication. <br> - User closes the Google authentication pop-up. <br> - User closes the browser/tab.

Step-by-Step Interaction Mapping (UF-001)
Step

User Action

UI Element / Screen

System Response

Next Step

Error Path

1

Lands on page

Sign In Screen: Clean layout with an illustration on the left and form on the right.

The sign-in form and third-party login options are displayed.

2

N/A

2

Clicks "Continue with Google"

Purple button with the Google logo.

1. A pop-up window for Google Authentication appears. <br> 2. The system requests user account information from Google.

3

If the pop-up is blocked, show a notification. If Google auth fails, display an error message on the sign-in screen.

3

Selects their Google Account

Google's native account selection UI.

The pop-up closes. The system receives an authentication token from Google.

4

If the user closes the pop-up, the flow returns to Step 1.

4

N/A

Loading/Redirect: The screen briefly shows a loading state.

The system validates the token, creates a new user profile in the database, and initiates a user session.

End Flow. Proceed to UF-002.

If token validation fails, show an "Authentication Failed" error on the sign-in screen.

4. Flow Documentation: UF-002 (Child Account Creation)
Element

Description

Flow ID

UF-002

Flow Name

Child Account Creation Flow

Entry Points

Successful completion of UF-001 for a first-time user.

Success Criteria

The child's profile is created and associated with the parent's account. The user is redirected to the main dashboard/book creation screen.

Exit Points

- Successful account creation. <br> - User closes the browser/tab.

Step-by-Step Interaction Mapping (UF-002)
Step

User Action

UI Element / Screen

System Response

Next Step

Error Path

1

Lands on page

Create Your Child's Account Screen: A simple, centered form.

The form with fields for First Name, Last Name, Grade, and Email is displayed.

2

N/A

2

Enters details

Input fields for the form.

The UI reflects the text being entered.

3

N/A

3

Clicks "Create Account"

Purple primary button.

1. The system validates the form data. <br> 2. An API call is made to create the child's profile. <br> 3. The system shows a loading indicator.

4

If validation fails (e.g., empty fields), display inline error messages below the relevant fields.

4

N/A

Onboarding Modal: A "Start your streak" modal appears over the main dashboard.

The system confirms the profile was created and displays an onboarding message.

5

If the API call fails, show a general error message (e.g., "Could not create account. Please try again.").

5

Clicks the 'X' to close

Close icon on the modal.

The modal is dismissed, revealing the main app interface.

End Flow. Proceed to UF-003.

N/A

5. Flow Documentation: UF-003 (Book Creation)
Element

Description

Flow ID

UF-003

Flow Name

Book Creation Flow

Entry Points

After dismissing the "Streak" modal or clicking a "Create New Book" button from the dashboard.

Success Criteria

A new book is generated based on user selections and the user is taken to the reading interface.

Exit Points

- Successful book creation. <br> - User navigates away using the back button or other navigation.

Decision Points
ID

Decision Point

Condition

Path A (True)

Path B (False)

DP-01

Select Universe

User clicks on a "Universe" card.

Proceed to Character Selection.

Remain on Universe Selection.

DP-02

Select Character

User clicks on a "Character" card.

Proceed to Spark Selection.

Remain on Character Selection.

DP-03

Select Spark

User clicks on a "Spark" card.

Proceed to Book Generation.

Remain on Spark Selection.

Step-by-Step Interaction Mapping (UF-003)
Step

User Action

UI Element / Screen

System Response

Next Step

Error Path

1

Lands on page

Create a Book - Universe Screen: A grid of colorful cards representing different universes.

The list of available universes is displayed.

2

If universes fail to load, show a loading error.

2

Selects "Pokemon"

A card with the Pokemon logo.

The card gets a visual selection indicator (e.g., a border). The "Next" button becomes active.

3

N/A

3

Clicks "Next"

Purple primary button.

The app transitions to the Character Selection screen.

4

N/A

4

Selects "Luigi"

A card with a character image.

The card gets a visual selection indicator. The "Next" button becomes active.

5

N/A

5

Clicks "Next"

Purple primary button.

The app transitions to the Spark Selection screen.

6

N/A

6

Selects a story premise

A card with the spark text.

The card gets a visual selection indicator. The "Create Book" button becomes active.

7

N/A

7

Clicks "Create Book"

Purple primary button.

1. The system displays a loading state. <br> 2. An API call is made with the selected universe, character, and spark. <br> 3. The AI generates the first chapter.

End Flow. Proceed to UF-004.

If the API call to generate the book fails, display an error message.

6. Flow Documentation: UF-004 (Interactive Reading and Quiz)
Element

Description

Flow ID

UF-004

Flow Name

Interactive Reading and Quiz Flow

Entry Points

Successful completion of UF-003.

Success Criteria

User reads the chapter, answers all questions, completes the quiz, and chooses the next story path.

Exit Points

- User closes the book and returns to the dashboard.

State Transition Diagram
READING → ANSWERING_GUIDING_QUESTION → READING (loop until end of chapter) → CHOOSING_NEXT_PATH → TAKING_QUIZ → VIEWING_SUMMARY → GENERATING_NEXT_CHAPTER → READING

Step-by-Step Interaction Mapping (UF-004)
Step

User Action

UI Element / Screen

System Response

Next Step

Error Path

1

Lands on page

Reading Interface: Two-column layout with story on the left and questions on the right.

The generated story is displayed. Nouns/adjectives are highlighted. Text is blurred after the first section. The first guiding question is shown.

2

If the story fails to load, show an error.

2

Selects an answer

Multiple-choice option in the right sidebar.

1. The system validates the answer. <br> 2. If correct, the next section of the story is un-blurred. <br> 3. The next guiding question is displayed.

Loop to 2 until all questions are answered. Then 3.

If incorrect, show visual feedback (e.g., red flash) and allow the user to try again.

3

Reaches end of chapter

"What happens next?" prompt at the bottom of the story.

The system displays multiple story path options for the user to choose from.

4

N/A

4

Selects a path

Clicks on one of the path options.

The system transitions to the Chapter Quiz screen.

5

N/A

5

Answers quiz questions

Multiple-choice quiz interface.

The system records answers. After the last question, it calculates the results.

6

N/A

6

N/A

Reading Summary Screen: Displays metrics like reading speed.

The summary of the user's performance is shown.

End Flow. (The flow would loop back to generate the next chapter based on the chosen path).

N/A

7. UI Component States
This section describes the visual states of key UI components observed in the flow.

Primary Button (Purple):

Default: Solid purple with white text.

Disabled: Grayed out, non-interactive.

Hover/Active (Inferred): Should lighten or darken slightly on hover/click.

Selection Cards (Universe, Character, Spark):

Default: Card with image/text and a light border/shadow.

Hover (Inferred): Shadow or border should become more prominent.

Selected: A thick, colored border (e.g., purple) appears around the card.

Input Fields:

Default: White background with a light gray border and placeholder text.

Focused: The border color changes to purple.

Error (Inferred): The border color should change to red, with an error message appearing below.

Story Text:

Default: Black text.

Highlighted Noun/Adjective: Text color changes to blue or orange.

Blurred: Text is obscured with a blur filter.

8. Navigation and Browser Behavior
URL Structure (Assumed):

/login

/onboarding/create-child

/dashboard

/create-book/universe

/create-book/character

/book/{bookId}/chapter/{chapterId}

Browser Back Button: The back button should navigate to the previous step in a logical sequence (e.g., from Character selection back to Universe selection).

Refresh Behavior: The application state should be preserved on refresh. A logged-in user should remain logged in. If they are in the middle of reading a book, they should return to that same page.