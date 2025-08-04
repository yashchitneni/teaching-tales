# Teaching Tales - Codebase Structure Map

## 📖 Project Overview

**Teaching Tales** is a Next.js 15 educational platform that creates personalized AI-driven stories for children using characters from popular franchises like Harry Potter, Pokémon, and Marvel.

### 🏗️ Architecture Overview

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Auth & Database**: Supabase
- **Styling**: Tailwind CSS + Shadcn/ui components
- **Package Manager**: Bun
- **Development**: ESLint, Biome for formatting

## 🗺️ Visual Project Structure

```mermaid
graph TD
    subgraph "Teaching Tales Project Structure"
        root[/"🏠 teaching-tales<br/>(Next.js 15 App)"/]
        
        subgraph "📁 Root Config Files"
            package["📦 package.json<br/>(Next.js, React, Supabase)"]
            tsconfig["⚙️ tsconfig.json<br/>(TypeScript Config)"]
            tailwind["🎨 tailwind.config.ts<br/>(Styling)"]
            next["⚡ next.config.js<br/>(Next.js Config)"]
        end
        
        subgraph "📂 src/"
            app_dir["📁 app/<br/>(Next.js App Router)"]
            components["📁 components/<br/>(Reusable UI)"]
            contexts["📁 contexts/<br/>(React Context)"]
            lib["📁 lib/<br/>(Utilities & DB)"]
        end
        
        subgraph "🌐 App Router (src/app/)"
            layout["📄 layout.tsx<br/>(Root Layout + Auth)"]
            home["🏠 page.tsx<br/>(Homepage)"]
            globals["🎨 globals.css<br/>(Global Styles)"]
            client_body["📱 ClientBody.tsx<br/>(Client Wrapper)"]
            
            subgraph "🔐 Auth Pages"
                login["📄 login/page.tsx"]
                signup["📄 signup/page.tsx"]
            end
            
            subgraph "📊 Dashboard"
                dashboard["📄 dashboard/page.tsx<br/>(User Dashboard)"]
            end
            
            subgraph "🚀 Onboarding"
                onboarding["📄 onboarding/page.tsx"]
            end
            
            subgraph "📚 Book System"
                book_dynamic["📁 book/[bookId]/<br/>(Dynamic Book Routes)"]
                chapter_dynamic["📁 chapter/[chapterId]/<br/>(Dynamic Chapter)"]
                chapter_page["📄 page.tsx<br/>(Chapter Reader)"]
            end
            
            subgraph "✍️ Book Creation"
                create_book["📁 create-book/"]
                character["📄 character/page.tsx<br/>(Character Selection)"]
                universe["📄 universe/page.tsx<br/>(Universe Selection)"]
                spark["📄 spark/page.tsx<br/>(Story Spark)"]
                loading["📄 loading/page.tsx<br/>(Creation Process)"]
            end
        end
        
        subgraph "🧩 Components (src/components/)"
            ui_components["📁 ui/<br/>(Shadcn Components)"]
            button_ui["📄 button.tsx"]
            card_ui["📄 card.tsx"]
            input_ui["📄 input.tsx"]
            
            app_components["📄 App Components"]
            top_nav["📄 TopNav.tsx<br/>(Navigation)"]
            create_child["📄 CreateChildModal.tsx"]
            assessment["📄 AssessmentResults.tsx"]
            feedback["📄 FeedbackButton.tsx"]
            choices["📄 ChapterChoices.tsx"]
        end
        
        subgraph "🔧 Contexts (src/contexts/)"
            auth_context["📄 AuthContext.tsx<br/>(Authentication State)"]
        end
        
        subgraph "📚 Library (src/lib/)"
            utils["📄 utils.ts<br/>(Utility Functions)"]
            supabase_client["📄 supabase.ts<br/>(Database Client)"]
            mock_data["📄 mockData.ts<br/>(Test Data)"]
        end
    end
    
    %% Connections
    root --> app_dir
    root --> components
    root --> contexts
    root --> lib
    
    app_dir --> layout
    app_dir --> home
    app_dir --> login
    app_dir --> signup
    app_dir --> dashboard
    app_dir --> onboarding
    app_dir --> book_dynamic
    app_dir --> create_book
    
    book_dynamic --> chapter_dynamic
    chapter_dynamic --> chapter_page
    
    create_book --> character
    create_book --> universe
    create_book --> spark
    create_book --> loading
    
    components --> ui_components
    components --> app_components
    ui_components --> button_ui
    ui_components --> card_ui
    ui_components --> input_ui
    
    contexts --> auth_context
    
    lib --> utils
    lib --> supabase_client
    lib --> mock_data
    
    %% Key integrations
    layout -.-> auth_context
    dashboard -.-> auth_context
    layout -.-> globals
    auth_context -.-> supabase_client
    components -.-> utils
    
    classDef appRouter fill:#e1f5fe
    classDef components fill:#f3e5f5
    classDef config fill:#fff3e0
    classDef lib fill:#e8f5e8
    
    class app_dir,layout,home,login,signup,dashboard,onboarding,book_dynamic,create_book,chapter_dynamic appRouter
    class components,ui_components,app_components,top_nav,create_child,assessment,feedback,choices components
    class package,tsconfig,tailwind,next config
    class lib,utils,supabase_client,mock_data,contexts,auth_context lib
```

## 📁 Detailed Directory Structure

### 🏠 Root Level
```
teaching-tales/
├── 📦 package.json          # Dependencies & scripts
├── ⚙️ tsconfig.json         # TypeScript configuration
├── 🎨 tailwind.config.ts    # Tailwind CSS configuration
├── ⚡ next.config.js        # Next.js configuration
├── 📋 biome.json            # Code formatting rules
├── 🔧 eslint.config.mjs     # ESLint configuration
└── 📂 src/                  # Source code directory
```

### 📂 src/app/ - Next.js App Router

#### Core Pages
- **`layout.tsx`** - Root layout with fonts, global CSS, and AuthProvider
- **`page.tsx`** - Marketing homepage with cosmic theme
- **`globals.css`** - Global styles and CSS custom properties
- **`ClientBody.tsx`** - Client-side body wrapper component

#### Authentication Flow
```
📁 auth/
├── 📄 login/page.tsx        # User login page
└── 📄 signup/page.tsx       # User registration page
```

#### User Dashboard
```
📁 dashboard/
└── 📄 page.tsx              # Main user dashboard with child profiles
```

#### Onboarding
```
📁 onboarding/
└── 📄 page.tsx              # New user onboarding flow
```

#### Dynamic Book System
```
📁 book/
└── 📁 [bookId]/
    └── 📁 chapter/
        └── 📁 [chapterId]/
            └── 📄 page.tsx  # Individual chapter reading interface
```

#### Book Creation Flow
```
📁 create-book/
├── 📄 character/page.tsx    # Character selection step
├── 📄 universe/page.tsx     # Universe/world selection step  
├── 📄 spark/page.tsx        # Story spark/prompt creation
└── 📄 loading/page.tsx      # Story generation loading screen
```

### 📂 src/components/ - Reusable Components

#### UI Foundation (Shadcn/ui)
```
📁 ui/
├── 📄 button.tsx            # Button component variants
├── 📄 card.tsx              # Card component for content containers
├── 📄 input.tsx             # Form input components
└── 📄 label.tsx             # Form label components
```

#### Application Components
```
📄 TopNav.tsx                # Main navigation component
📄 TopNavWithTabs.tsx        # Navigation with tab variants
📄 CreateChildModal.tsx      # Modal for creating child profiles
📄 AssessmentResults.tsx     # Post-chapter assessment display
📄 ChapterChoices.tsx        # Story choice selection interface
📄 GuidingQuestions.tsx      # Reading comprehension questions
📄 FeedbackButton.tsx        # User feedback collection
📄 RewardsModal.tsx          # Achievement/rewards display
📄 StreakModal.tsx           # Reading streak celebrations
```

### 📂 src/contexts/ - State Management
```
📄 AuthContext.tsx           # Authentication state management
                            # - User session handling
                            # - Profile management
                            # - Sign out functionality
```

### 📂 src/lib/ - Utilities & Database
```
📄 supabase.ts              # Supabase client setup
                            # - Database types (Profile, Child, Book, etc.)
                            # - Auth helpers
                            # - Database operations

📄 utils.ts                 # Utility functions
                            # - cn() for className merging

📄 mockData.ts              # Development/testing data
                            # - Sample characters, universes, stories
```

## 🔄 Key User Flows

### 1. New User Journey
```
Landing Page → Sign Up → Onboarding → Dashboard → Create Child Profile → Book Creation
```

### 2. Book Creation Flow  
```
Character Selection → Universe Selection → Story Spark → Loading/Generation → Reading Experience
```

### 3. Reading Experience
```
Book Dashboard → Chapter Selection → Reading Interface → Assessment → Next Chapter/Rewards
```

### 4. Authenticated User Flow
```
Login → Dashboard → [Select Child] → [Continue Reading | Create New Book]
```

## 🎯 Core Features

### ✨ Educational Features
- **Adaptive Reading Levels** - Stories adjust to child's Lexile level
- **Comprehension Assessment** - Questions after each chapter
- **Progress Tracking** - Reading streaks and achievements  
- **Reward System** - Coins for correct answers, redeemable for Robux

### 🎨 User Experience
- **Cosmic/Magical Theme** - Deep space backgrounds with gradients
- **Character Integration** - Harry Potter, Pokémon, Marvel characters
- **Choose-Your-Adventure** - Interactive story branching
- **Responsive Design** - Mobile, tablet, desktop optimized

### 🔧 Technical Architecture
- **Server-Side Rendering** - Next.js App Router with SSR
- **Real-time Auth** - Supabase authentication with session management
- **Type Safety** - Full TypeScript implementation
- **Component Library** - Shadcn/ui for consistent design system

## 🚀 Development Commands

```bash
# Development server
bun dev

# Production build  
bun run build

# Code linting & type checking
bun run lint

# Code formatting
bun run format
```

## 📋 Key Dependencies

### Core Framework
- **Next.js 15** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety

### Database & Auth
- **Supabase** - Authentication and database
- **@supabase/supabase-js** - Supabase client

### UI & Styling  
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Component library (@radix-ui/react-slot, class-variance-authority)
- **Lucide React** - Icon library
- **clsx & tailwind-merge** - Conditional class utilities

### Development Tools
- **Biome** - Code formatting
- **ESLint** - Code linting  
- **Playwright** - E2E testing
- **Puppeteer** - Browser automation

---

*This map provides a comprehensive overview of the Teaching Tales codebase structure. Use it as a reference when navigating the project or planning new features.*
