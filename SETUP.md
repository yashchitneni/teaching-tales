# TeachTales Setup Guide

## Environment Variables Setup

Create a `.env.local` file in the project root with the following variables:

```env
# Supabase Configuration for TeachTales
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Service Role Key (for server-side operations - keep secure!)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3001](http://localhost:3001) in your browser.

## Security Notes

- The `.env.local` file is automatically gitignored
- Never commit API keys or database passwords to version control
- Keep your Supabase service role key secure and never expose it in client-side code
- Use Supabase Row Level Security (RLS) policies for data access control 
