import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export type Profile = {
  id: string
  email: string
  display_name?: string
  avatar_url?: string
  subscription_tier: 'free' | 'premium'
  created_at: string
  updated_at: string
}

export type Child = {
  id: string
  parent_id: string
  name: string
  age: number
  avatar_url?: string
  favorite_genres: string[]
  reading_level: 'beginner' | 'intermediate' | 'advanced'
  created_at: string
  updated_at: string
}

export type Book = {
  id: string
  child_id: string
  title: string
  universe: string
  character: string
  spark: string
  story_content?: string
  cover_image_url?: string
  status: 'draft' | 'generating' | 'completed' | 'archived'
  word_count: number
  estimated_reading_time: number
  created_at: string
  updated_at: string
}

export type Chapter = {
  id: string
  book_id: string
  chapter_number: number
  title: string
  content: string
  illustration_prompt?: string
  illustration_url?: string
  word_count: number
  created_at: string
  updated_at: string
}

export type ReadingProgress = {
  id: string
  child_id: string
  book_id: string
  chapter_id?: string
  progress_percentage: number
  last_read_at: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export type StoryGenerationLog = {
  id: string
  book_id: string
  prompt_used: string
  ai_model: string
  generation_time_ms?: number
  success: boolean
  error_message?: string
  created_at: string
}

// Helper types for inserts (without auto-generated fields)
export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'>
export type ChildInsert = Omit<Child, 'id' | 'created_at' | 'updated_at'>
export type BookInsert = Omit<Book, 'id' | 'created_at' | 'updated_at'>
export type ChapterInsert = Omit<Chapter, 'id' | 'created_at' | 'updated_at'>

// Authentication helper functions
export const auth = {
  signUp: async (email: string, password: string, displayName?: string) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    })
  },

  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    })
  },

  signInWithGoogle: async () => {
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
  },

  signInWithApple: async () => {
    return await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
  },

  signOut: async () => {
    return await supabase.auth.signOut()
  },

  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  },
}

// Database helper functions
export const db = {
  // Profile operations
  getProfile: async (userId: string) => {
    return await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
  },

  updateProfile: async (userId: string, updates: Partial<Profile>) => {
    return await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
  },

  // Children operations
  getChildren: async (parentId: string) => {
    return await supabase
      .from('children')
      .select('*')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: true })
  },

  createChild: async (child: ChildInsert) => {
    return await supabase
      .from('children')
      .insert(child)
      .select()
      .single()
  },

  updateChild: async (childId: string, updates: Partial<Child>) => {
    return await supabase
      .from('children')
      .update(updates)
      .eq('id', childId)
  },

  deleteChild: async (childId: string) => {
    return await supabase
      .from('children')
      .delete()
      .eq('id', childId)
  },

  // Books operations
  getBooks: async (childId: string) => {
    return await supabase
      .from('books')
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
  },

  createBook: async (book: BookInsert) => {
    return await supabase
      .from('books')
      .insert(book)
      .select()
      .single()
  },

  getBook: async (bookId: string) => {
    return await supabase
      .from('books')
      .select(`
        *,
        chapters (*)
      `)
      .eq('id', bookId)
      .single()
  },

  updateBook: async (bookId: string, updates: Partial<Book>) => {
    return await supabase
      .from('books')
      .update(updates)
      .eq('id', bookId)
  },

  // Chapters operations
  getChapters: async (bookId: string) => {
    return await supabase
      .from('chapters')
      .select('*')
      .eq('book_id', bookId)
      .order('chapter_number', { ascending: true })
  },

  createChapter: async (chapter: ChapterInsert) => {
    return await supabase
      .from('chapters')
      .insert(chapter)
      .select()
      .single()
  },

  getChapter: async (chapterId: string) => {
    return await supabase
      .from('chapters')
      .select('*')
      .eq('id', chapterId)
      .single()
  },

  // Reading progress operations
  getReadingProgress: async (childId: string, bookId: string) => {
    return await supabase
      .from('reading_progress')
      .select('*')
      .eq('child_id', childId)
      .eq('book_id', bookId)
      .single()
  },

  updateReadingProgress: async (
    childId: string,
    bookId: string,
    progress: Partial<ReadingProgress>
  ) => {
    return await supabase
      .from('reading_progress')
      .upsert({
        child_id: childId,
        book_id: bookId,
        ...progress,
      })
  },
} 