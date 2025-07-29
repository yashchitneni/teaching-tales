# TeachTales Setup Guide

## Environment Variables Setup

Create a `.env.local` file in the project root with the following variables:

```env
# Supabase Configuration for TeachTales
NEXT_PUBLIC_SUPABASE_URL=https://gccgwmuyzlsazkliswjp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjY2d3bXV5emxzYXprbGlzd2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDMwNTUsImV4cCI6MjA2OTM3OTA1NX0.RZ-rSJWzTgDRjnM-E27hIjNgQpFBQmB7cX9DPVcUYqU

# Service Role Key (for server-side operations - keep secure!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjY2d3bXV5emxzYXprbGlzd2pwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgwMzA1NSwiZXhwIjoyMDY5Mzc5MDU1fQ.HC2OL-eBX-nkCYF4mXBMkOQ6-0t6onAPUgGqdCXA-pE
```

## Database Setup

The database password is: `kpArzpbhvqsvhyOj`

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Security Notes

- The `.env.local` file is automatically gitignored
- Never commit API keys or database passwords to version control
- The anon key is safe to use in client-side code
- The service role key should only be used server-side and kept secure

## Supabase Project

- **Project URL**: https://gccgwmuyzlsazkliswjp.supabase.co
- **Project ID**: gccgwmuyzlsazkliswjp 