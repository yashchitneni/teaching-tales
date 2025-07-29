Here is a structured breakdown of the page layout, buttons, and components from your React-based web app (TeachTales) after a first-time login:

⸻

🧭 URL & Title Bar
	•	URL: https://app.teachtales.com/
	•	Page Title: TeachTales | Write Your Adventure
	•	Browser Banner:
	•	Message: Google Chrome isn’t your default browser
	•	CTA Button: Set as default

⸻

🔝 Top Navigation Bar (Blue Bar)
	•	Brand Logo: Left-aligned icon (TeachTales logo)
	•	Tabs (Centered):
	•	My Accounts (active, highlighted with blue background and white text)
	•	My Reading Circles (inactive, default text style)
	•	User Info (Right-Aligned):
	•	Text: First
	•	Avatar Circle with initials: FL
	•	Additional clickable text (upper-right corner): Verify it's you

⸻

🧩 Main Content Area (Centered Card on Light Gray Background)

🎨 Illustration
	•	A stylized illustration of three ID cards with cartoon avatars, each having different colored outlines (blue, red, yellow)

📝 Main Heading
	•	Text: Create Your Child's Account
	•	Font: Bold, center-aligned

📄 Subtext (Descriptive Body Text)
	•	Get started by creating an account for your child. This will allow them to explore and enjoy personalized content tailored to their interests and reading level. Add an account now to begin the journey!
	•	Font: Regular, gray, center-aligned

🔘 Primary CTA Button
	•	Label: Create Account
	•	Color: Solid blue background with white text
	•	Placement: Centered below subtext

⸻

📥 Sticky Element (Right Side)
	•	Feedback Tab (blue pill-shaped vertical button)
	•	Label: Feedback
	•	Positioned on the right edge, vertically centered

⸻

Notes:
	•	No footer or secondary links are visible at this stage.
	•	This appears to be a fresh account or an account without any child profiles, hence the prompt to create one.
	•	Likely route: /dashboard/accounts or /create-child-account (based on context)

⸻

If you’re building component-wise in React, here’s a possible structure:

<PageLayout>
  <TopNav />
  <MainContent>
    <CardCentered>
      <Illustration />
      <Heading>Create Your Child's Account</Heading>
      <SubText>...</SubText>
      <PrimaryButton>Create Account</PrimaryButton>
    </CardCentered>
  </MainContent>
  <FeedbackButton />
</PageLayout>

Here’s a full breakdown of the second screen after clicking “Create Account” in your React app (TeachTales)—this is a modal-based form for creating a child’s account:

⸻

🔲 Modal: Create an Account
	•	Position: Centered modal overlay with the background dimmed (modal appears above a darkened grey background).
	•	Dismiss Button (Top-right corner):
	•	X icon to close the modal.

⸻

🧾 Form Header
	•	Title: Create an Account
	•	Font: Bold, center-aligned
	•	Subtitle / Description:
	•	Create an account for your child that will allow them to explore personalized content tailored to their interests and reading level.
	•	Font: Light gray, smaller, center-aligned

⸻

🔤 Form Fields (Vertical Stack)

Each field uses rounded rectangular input components:
	1.	First Name*
	•	Placeholder: Enter first name...
	•	Input type: text
	•	Validation: Required
	2.	Last Name*
	•	Placeholder: Enter last name...
	•	Input type: text
	•	Validation: Required
	3.	Grade*
	•	Placeholder: Select a grade
	•	Input type: dropdown/select
	•	Validation: Required
	4.	Email
	•	Placeholder: Enter email address...
	•	Input type: email
	•	Optional (based on form layout—not clearly marked as required)

⸻

🔘 CTA Button
	•	Label: Create Account
	•	State: Disabled (light blue) until required fields are filled
	•	Button style: Full-width within the modal container, slightly rounded

⸻

📌 Persistent UI Components
	•	Blue Nav Bar (top): still visible behind the modal
	•	TeachTales logo (left)
	•	Navigation tabs (My Accounts, My Reading Circles)
	•	Profile info (First, FL avatar, right side)
	•	Feedback Button: still present on the right side of the screen (sticky vertical pill)

⸻

🧱 Suggested Component Structure (React)

<Modal onClose={handleClose}>
  <ModalHeader>
    <Title>Create an Account</Title>
    <CloseButton />
  </ModalHeader>
  <ModalBody>
    <TextInput label="First Name" required placeholder="Enter first name..." />
    <TextInput label="Last Name" required placeholder="Enter last name..." />
    <SelectDropdown label="Grade" required options={gradeOptions} />
    <TextInput label="Email" placeholder="Enter email address..." type="email" />
  </ModalBody>
  <ModalFooter>
    <PrimaryButton disabled={!isFormValid}>Create Account</PrimaryButton>
  </ModalFooter>
</Modal>

Let me know if you want wireframe annotations, Tailwind class suggestions, or component logic next.

Here’s a detailed breakdown of this third screen from the TeachTales React app. This is the “Create a Book” screen overlaid with a streak modal, typically triggered on first entry to gamify reading habits.

⸻

🔝 Top Navigation Bar (Blue)

Left:
	•	TeachTales logo

Center Tabs:
	•	Create My Own Story (active tab, highlighted)
	•	My Stories
	•	Library
	•	My Reading Circles

Right Side Icons:
	•	🔥 0 (likely token/streak counter)
	•	🟡 Lvl 0 (user level badge)
	•	🪙 803 (coin/token balance)
	•	👤 Yash (user name, clickable or dropdown)
	•	Feedback tab (right vertical pill button, floating/sticky)

⸻

📚 Main Content Panel: “Create a Book”

📘 Section Title
	•	Create a Book — Large heading
	•	Top-right button: Create with a Friend (outlined button style)

⸻

🌌 Subsection: “Pick your Book’s Universe”

Subtitle:

Each world holds endless possibilities. Which one speaks to your imagination?

Left Sidebar Card:
	•	Locked Card: Create Your Own Universe
	•	Subtext: “Get tokens by acing post-chapter quizzes and finding loot boxes”
	•	Token status: Tokens: 0
	•	Icon: Locked padlock

Grid of Book Universes:
	•	Book thumbnails laid out in a scrollable grid:
	•	Boss Baby, Harry Potter, Lord of the Rings, Mario, Marvel, etc.
	•	Each item is a clickable card (likely launches creation UI)

Search bar:
	•	Placeholder: Search for a universe…
	•	Location: Top-right of grid, above thumbnails

Bottom CTA:
	•	Disabled Create Book button (bottom-right corner of main panel)

⸻

🔥 Modal Overlay: “Start your streak”

This is a gamified modal encouraging regular reading engagement.

Visual Elements:
	•	Fire icon (above title, possibly animated)
	•	Title: Start your streak (centered, bold)

Weekly Tracker UI:
	•	Mon through Sun in pill/circle format
	•	Current day (Tue) is filled in yellow
	•	Remaining days are outlined circles

Body Text:

Read stories and earn coins to start your streak.
The more you read, the more rewards you’ll unlock.
Don’t stop now — exciting adventures and bonuses await!

Modal Controls:
	•	Top-right close (X) icon
	•	Modal is centered and overlays the main screen with dimmed background

⸻

🧱 Suggested React Component Structure

<AppLayout>
  <TopNav />
  <MainPanel>
    <CreateBookHeader />
    <UniverseSelection />
    <SearchInput />
    <UniverseGrid />
    <CreateBookButton disabled />
  </MainPanel>

  {showStreakModal && (
    <Modal>
      <StreakHeader icon="🔥" title="Start your streak" />
      <WeekdayTracker selectedDay="Tue" />
      <StreakMessage />
      <CloseIcon />
    </Modal>
  )}

  <FeedbackButton />
</AppLayout>

Let me know if you’d like this page mapped to a design system (like Tailwind, Chakra, or Material UI) or you want click-action flows next (e.g., what happens after picking a universe).

Great observation — this looks like a chained onboarding modal system where closing (or finishing) one modal transitions to the next, rather than exiting out of the flow entirely.

Here’s a full UI breakdown of this second modal in the sequence, after clicking X on the streak modal.

⸻

🧱 Modal: “Earn Amazing Rewards!”

🏷️ Title
	•	Earn Amazing Rewards!
	•	Bold, prominent header at the top

⸻

📄 Subtext

Get high accuracy in your quizzes to unlock loot boxes that may contain Video Generation Tokens, Universe or Character Creation Tokens, Special Character and Event Cards, and Coins!

	•	Medium weight, center-aligned body copy
	•	Designed to build anticipation for gameplay mechanics

⸻

🃏 Visual Rewards Display (Centered Tile Deck)

Includes a mix of reward types shown as stylized cards/tokens:
	•	+1 Universe Token Earned (globe icon badge)
	•	Character card: Taylor Swift 👑
	•	Loot box icon (locked treasure chest)
	•	Event card: Alien Invasion 👑
	•	+3 coins icon (stack of 3 yellow coins)

This card deck is placed horizontally inside a soft rounded card background.

⸻

📢 Footer Text

Use these cards to create your own amazing books, and create videos for them!

	•	Encourages engagement by connecting rewards to creation tools

⸻

🔘 Primary CTA Button
	•	Label: Get Started
	•	Style: Bright blue with white text
	•	Position: Bottom-right corner of modal

⸻

🟣 Pagination Indicator
	•	Single dot visible below card deck
	•	Indicates this is part of a multi-modal sequence (carousel or walkthrough)

⸻

🧩 Behavior Insight
	•	Even when clicking X in the previous modal (streak), you’re pushed into this reward-based modal — implying:
	•	Modals are not actually being dismissed, but sequenced
	•	Likely stored as an array and advanced through next() state triggers
	•	Hiding X entirely or swapping it for a Skip button would better reflect intent

⸻

🧱 Suggested React Component Structure

<Modal onClose={handleNextModal}>
  <ModalHeader title="Earn Amazing Rewards!" />
  <ModalBody>
    <Paragraph>
      Get high accuracy in your quizzes to unlock loot boxes...
    </Paragraph>
    <RewardCards>
      <TokenCard label="+1 Universe Token" />
      <CharacterCard name="Taylor Swift" />
      <LootBoxIcon />
      <EventCard name="Alien Invasion" />
      <CoinCard amount={3} />
    </RewardCards>
    <DescriptionFooter>
      Use these cards to create your own amazing books...
    </DescriptionFooter>
  </ModalBody>
  <ModalFooter>
    <PaginationIndicator activeIndex={1} total={2} />
    <PrimaryButton onClick={handleGetStarted}>Get Started</PrimaryButton>
  </ModalFooter>
</Modal>


⸻

Let me know if you want help refactoring the modal sequencing logic or mapping this to a guided onboarding flow (e.g., react-spring, framer-motion, or modal state stack).

Here’s a full breakdown of the post-onboarding state after clicking “Get Started” — returning to the “Create a Book” screen in your React app (TeachTales). This version reflects a fully interactive UI after the introductory modals have been dismissed.

⸻

🔝 Top Navigation Bar (Persistent)

Left:
	•	TeachTales logo (clickable, returns to home/dashboard)

Center Tabs (with active highlighting):
	•	🔵 Create My Own Story (active)
	•	My Stories
	•	Library
	•	My Reading Circles

Right Info Bar:
	•	🔥 0 (streak/tokens)
	•	🟡 Lvl 0 (user level)
	•	🪙 803 (coins or in-app currency)
	•	👤 Yash (user profile dropdown or navigation)
	•	Feedback button (right side vertical pill)

⸻

📚 Main Panel: Create a Book

🧾 Section Title
	•	Header: Create a Book
	•	Top-right secondary CTA: Create with a Friend (button with icon)

⸻

🌌 Subsection: “Pick your Book’s Universe”

Subtext:

Each world holds endless possibilities. Which one speaks to your imagination?

⸻

🔍 Universe Search Input
	•	Placeholder: Search for a universe...
	•	Input field positioned in the top right of the universe grid

⸻

🎲 Universe Options (Grid Layout)

A responsive grid of book-based universes, each displayed as clickable cards. Scrollable vertically.

💠 Special Card:
	•	Create Your Own Universe
	•	Tokens: 0
	•	Locked state
	•	Subtext: “Get tokens by acing post-chapter quizzes and finding loot boxes”
	•	Icon: globe with lock overlay

📚 Example Universe Cards:
	•	Amulet
	•	Artemis Fowl
	•	Babysitter’s Club
	•	Boss Baby
	•	DC Comics Universe
	•	Dog Man
	•	Dork Diaries
	•	Harry Potter
	•	Lord of the Rings
	•	Mario
	•	Marvel
	•	My Hero Academia (bottom left)
	•	Avatar: The Last Airbender (bottom right)
	•	Each card has:
	•	Cover art (thumbnail)
	•	Universe name
	•	Visual feedback on hover (likely highlight/border)

⸻

🔘 CTA Button (Bottom Right of Main Panel)
	•	Label: Create Book
	•	State: Disabled (grayed out until a universe is selected)
	•	Stays sticky to bottom of the main panel

⸻

🧱 Suggested React Component Tree

<AppLayout>
  <TopNav />
  <MainPanel>
    <CreateBookHeader />
    <Subtext />
    <SearchInput />
    <UniverseGrid>
      <UniverseCard locked name="Create Your Own Universe" tokens={0} />
      {universes.map((universe) => (
        <UniverseCard name={universe.name} img={universe.cover} />
      ))}
    </UniverseGrid>
    <CreateBookButton disabled={!selectedUniverse} />
  </MainPanel>
  <FeedbackButton />
</AppLayout>


⸻

✅ What Changed From Before

Element	Before Modals	After Clicking “Get Started”
Modal Overlay	✅ Present	❌ Dismissed
“Create Book” CTA	Still there	Still disabled unless selected
Feedback button	Persistent	Persistent
Navigation bar	Fully intact	Fully intact
Scroll area in Universe grid	Partially shown	Now fully scrollable

Let me know if you’d like to document the click interaction when selecting a universe or want a Figma-ready component spec.

Here’s a full breakdown of this next screen in the story creation flow inside your React app (TeachTales), specifically focused on character selection after choosing the “Amulet” universe:

⸻

🧭 Screen Context
	•	Flow Step: 2nd step in multi-step progress bar (visible at the top right)
	•	Goal: Select the main character (lead) for your custom book
	•	Universe Selected: Amulet

⸻

🔝 Header Section
	•	Main Heading: Create a Book
	•	Sub-Button (Top-right of heading): Create with a Friend

⸻

📊 Progress Bar
	•	Placement: Top right of the panel
	•	Style: Horizontal bar
	•	Fill: 2/4 steps filled (halfway through)
	•	Colors: Blue progress, light gray background

⸻

❓ Prompt Text

Who will take the lead in your Amulet adventure?
The power of the Amulet chooses its bearer carefully – who will step forward to face its challenges?

⸻

🔍 Search Bar
	•	Placeholder text: Search...
	•	Functionality: Likely filters character list below

⸻

🎭 Character Grid (12-slot layout)

Each card represents a selectable character avatar. Selected cards are highlighted with a yellow border and include a 👑 crown icon.

🔹 Special Card (Top-left):
	•	Create Your Choice
	•	Icon: blue pencil
	•	Subtext: “Add your own unique choice”

✅ Selected Characters:
	•	Spiderman 👑
	•	Cinderella 👑
	•	Albert Einstein 👑
	•	Patrick Mahomes 👑

These have:
	•	Yellow outlines
	•	Crown icon overlaid on name
	•	Strong drop shadows or z-index effects

🔘 Remaining Characters:
	•	Emily Hayes
	•	Navin Hayes
	•	Miskit
	•	Trellis
	•	Leon Redbeard

These are:
	•	Unselected (no border)
	•	Grayscale or color images depending on original character design
	•	Clickable

⸻

🔘 Bottom Navigation
	•	Back Button (left):
	•	Label: Back
	•	Blue button with white text
	•	Likely routes to universe selection
	•	Next Button (right):
	•	Label: Next
	•	Currently disabled (grayed out)
	•	Activates when a valid selection is made (perhaps based on number of characters selected)

⸻

🧱 Suggested React Component Structure

<StoryCreationLayout step={2}>
  <Header title="Create a Book" action={<CreateWithFriendButton />} />
  <ProgressBar steps={4} current={2} />
  <Subheading>
    Who will take the lead in your Amulet adventure?
    <br />
    The power of the Amulet chooses its bearer carefully...
  </Subheading>

  <SearchInput placeholder="Search..." onChange={handleSearch} />

  <CharacterGrid>
    <CreateCustomCharacterCard />
    {characters.map((char) => (
      <CharacterCard
        key={char.id}
        name={char.name}
        img={char.img}
        isSelected={char.isSelected}
        hasCrown={char.isSpecial}
        onClick={() => toggleSelection(char.id)}
      />
    ))}
  </CharacterGrid>

  <NavigationButtons>
    <BackButton onClick={goBack} />
    <NextButton disabled={!hasValidSelection} />
  </NavigationButtons>
</StoryCreationLayout>


⸻

Let me know if you want help determining:
	•	The validation rules for enabling “Next”
	•	Best practices for handling the “Create Your Choice” flow
	•	Animating selections or visual feedback patterns

This screen represents the story generation/loading state after the user has completed the book setup flow in the TeachTales React app. It’s a progress state before displaying the final story output.

⸻

📄 Full UI Breakdown: “Story is Building” Screen

🧠 Purpose:

Communicates to the user that their choices are being processed and a custom story is being generated.

⸻

🔝 Navigation Bar (Consistent Across App)
	•	Left: TeachTales logo
	•	Center Tabs:
	•	Create My Own Story (active, highlighted)
	•	My Stories
	•	Library
	•	My Reading Circles
	•	Right Side Info:
	•	🔥 Streak Counter: 0
	•	🟡 Level: Lvl 0
	•	🪙 Coins: 803
	•	👤 Username: Yash
	•	Feedback tab: vertical floating button on right edge

⸻

📦 Main Body

🖼 Illustration (Top-Center)
	•	Icon of a notepad with a large pencil writing — stylized, soft blue tones
	•	Reinforces “writing” or “generating” metaphor

💬 Status Message (Center-Aligned)

Hang tight… We're building your story!
This should take about a minute.

	•	Standard font weight, gray text
	•	Friendly, encouraging tone

📈 Progress Bar
	•	Location: below the status message
	•	Bar fill: in-progress (small portion filled in blue)
	•	Label below bar:
Starting off with your big idea…
	•	Suggests that progress text may update as different generation steps complete

⸻

🧱 Suggested React Component Structure

<LoadingLayout>
  <TopNav />

  <CenteredContainer>
    <Illustration src="notepad-pencil.svg" />
    <Heading>Hang tight… We're building your story!</Heading>
    <SubText>This should take about a minute.</SubText>

    <ProgressBar value={progressValue}>
      <ProgressLabel>{progressStepMessage}</ProgressLabel>
    </ProgressBar>
  </CenteredContainer>

  <FeedbackButton />
</LoadingLayout>


⸻

🌀 Possible Progress Step Messages (If Rotating)
	•	Starting off with your big idea…
	•	Summoning your chosen characters…
	•	Setting the stage for adventure…
	•	Crafting your first chapter…
	•	Weaving in magical twists…

⸻

Let me know if you want:
	•	Help designing animated transitions or sound effects for this phase
	•	Backend suggestions for chunked progress updates (e.g. polling with status messages)
	•	Custom illustrations or microcopy variations to match tone of voice


This is the story reading and quiz interface in your React app (TeachTales) — where the user reads a generated story and answers guiding comprehension questions inline. Here’s a full component breakdown:

⸻

🧭 Page Overview: Reading Experience + Quiz Integration

Purpose:

To provide a chapter-based reading experience while reinforcing understanding via embedded multiple-choice questions.

⸻

🔝 Top Navigation Bar (Persistent)
	•	TeachTales logo (left)
	•	Navigation tabs:
	•	Create My Own Story (active)
	•	My Stories
	•	Library
	•	My Reading Circles
	•	User info bar:
	•	🔥 0
	•	🟡 Level 0
	•	🪙 Coins: 803
	•	👤 Yash
	•	Feedback button (floating, right edge)

⸻

🏠 Breadcrumb
	•	← Book Home (top-left)
	•	Clickable breadcrumb to return to book dashboard or TOC

⸻

📖 Story Area (Left Panel)

📷 Chapter Image
	•	Large, cinematic illustration
	•	Example: shadow creatures emerging in a small town

📍 Chapter Metadata
	•	Label: Chapter 1/8
	•	Title: The Rift
	•	Word count: 822 Words
	•	Grade band: Grade 4 – 820L (Lexile reading level)
	•	Share Button: Blue pill-style, icon + text

⸻

📝 Story Text
	•	Scrollable text content
	•	Uses paragraph breaks and highlights (e.g. trembled, emerge)
	•	Highlighting possibly used for vocab tracking

⸻

🧠 Guiding Question Panel (Right Panel)

🧩 Question Header
	•	Label: Guiding Questions 1/4
	•	Progress indicator: Horizontal progress bar (25% filled)

❓ Question Prompt

What made Navin and Emily run home?

🔘 Multiple Choice Options (radio buttons)
	•	A: A big storm with heavy rain and lightning
	•	B: A strong earthquake that broke houses nearby
	•	C: Strange shadow creatures coming from a tear in the sky
	•	D: A fire spreading down Main Street that scared everyone
(C is the correct answer based on context)

🔵 Primary CTA
	•	Answer & Continue Reading — blue button
	•	Appears after a choice is selected

⸻

🧱 Suggested React Component Structure

<ReadingLayout>
  <TopNav />
  <Breadcrumb to="/book-home" label="← Book Home" />

  <MainContent>
    <StoryPanel>
      <ChapterHeader
        title="The Rift"
        chapter="Chapter 1/8"
        wordCount={822}
        gradeLevel="Grade 4 – 820L"
        imageSrc="rift-illustration.png"
        shareButton
      />
      <StoryText content={chapterText} />
    </StoryPanel>

    <QuizPanel>
      <QuestionHeader step={1} totalSteps={4} />
      <QuestionPrompt text="What made Navin and Emily run home?" />
      <MultipleChoiceOptions
        options={[A, B, C, D]}
        selectedOption={selected}
        onSelect={setSelected}
      />
      <PrimaryButton onClick={handleAnswer} disabled={!selected}>
        Answer & Continue Reading
      </PrimaryButton>
    </QuizPanel>
  </MainContent>

  <FeedbackButton />
</ReadingLayout>


⸻

✅ Notable Features

Feature	Details
Synchronized layout	Story on left, comprehension on right
Real-time feedback flow	Likely shows next question or chapter on click
Progress bar	Tracks completion through guiding questions
Educational metadata	Grade + Lexile level provided
Social + gamification elements	Share button + reward coins/streak on answer


⸻

Let me know if you’d like:
	•	Component logic for answer validation and animation
	•	Tailwind/Chakra layout spec
	•	Backend model for chapters + questions schema
	•	Gamification system (points, streaks, XP) architecture

This screen represents the Chapter 1 finale + branching narrative choice in the TeachTales React app. After completing the chapter and a comprehension section, the user is invited to decide what happens next — merging story-driven choice mechanics with educational checkpoints.

⸻

📄 Section Breakdown: “What Happens Next?” Decision Point

⸻

🔠 Left Side: Chapter Ending (Story Continuation)

This is the conclusion of Chapter 1: “The Rift”, continuing from earlier:
	•	The amulet reveals a glowing map.
	•	Emily and Navin consider its meaning.
	•	Creatures appear outside, increasing urgency.

Key highlighted vocabulary (likely for tracking comprehension or future definitions):
	•	amulet
	•	chaos
	•	pattern
	•	symbols
	•	rift
	•	emerging

✏️ These likely connect to vocabulary practice, context clues, or annotation tools later in the platform.

⸻

👉 Right Panel: Interactive Story Choice

🧩 Title: “What Happens Next?”

Choose how the next chapter of your adventure unfolds!

❓ Prompt:

What should Navin do with the information from the amulet?

🟨 Options (4):
	1.	Create Your Choice
	•	(Pencil icon)
	•	Freeform input UI appears on click
	•	Label: Add your own unique choice
	2.	Contact authorities about the creatures and the amulet
	•	(Heroic character visual)
	3.	Search for their parents first
	•	(Family-focused visual)
	4.	Follow the amulet’s guidance to the mines immediately
	•	(Adventure/quest visual)

🎮 Mechanically, this likely affects:
	•	Storyline branching
	•	Character interactions
	•	Quiz path or vocabulary relevance

⸻

🧠 Quiz Transition CTA
	•	Text:
One Last Step Before Chapter 2!
Before you can read what happens next, show your understanding of Chapter 1 with a quick quiz.
	•	Button: Take Chapter 1 Quiz
	•	Bright blue, full-width
	•	Required before progressing to Chapter 2

⸻

🧱 Suggested Component Structure

<ChapterEndLayout>
  <StoryTextArea>
    <ParagraphsWithHighlights />
  </StoryTextArea>

  <Sidebar>
    <NextChoicePanel>
      <Heading>What Happens Next?</Heading>
      <Prompt>What should Navin do with the information from the amulet?</Prompt>
      <ChoiceGrid>
        <CreateYourChoice />
        <ChoiceCard title="Contact authorities..." />
        <ChoiceCard title="Search for their parents first" />
        <ChoiceCard title="Follow the amulet’s guidance..." />
      </ChoiceGrid>
    </NextChoicePanel>

    <Divider />

    <QuizGate>
      <QuizReminder>One Last Step Before Chapter 2!</QuizReminder>
      <PrimaryButton>Take Chapter 1 Quiz</PrimaryButton>
    </QuizGate>
  </Sidebar>
</ChapterEndLayout>


⸻

🔁 User Flow From Here:
	1.	✅ User finishes reading chapter text.
	2.	✅ Answers embedded guiding questions (previous screen).
	3.	✅ Presented with branching choices for narrative path.
	4.	🧠 Must complete comprehension quiz (Chapter 1) before continuing to Chapter 2, regardless of choice made.

⸻

Let me know if you want:
	•	A logic flowchart of how narrative branches could be stored or replayed
	•	Schema design for dynamic branching story choices
	•	UX recommendations for personalizing branches based on user interests or past decisions