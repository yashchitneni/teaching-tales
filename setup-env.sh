#!/bin/bash

# TeachTales Environment Setup Script

echo "🚀 Setting up TeachTales environment..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << 'EOF'
# Supabase Configuration for TeachTales
NEXT_PUBLIC_SUPABASE_URL=https://gccgwmuyzlsazkliswjp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjY2d3bXV5emxzYXprbGlzd2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDMwNTUsImV4cCI6MjA2OTM3OTA1NX0.RZ-rSJWzTgDRjnM-E27hIjNgQpFBQmB7cX9DPVcUYqU

# Service Role Key (for server-side operations - keep secure!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjY2d3bXV5emxzYXprbGlzd2pwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgwMzA1NSwiZXhwIjoyMDY5Mzc5MDU1fQ.HC2OL-eBX-nkCYF4mXBMkOQ6-0t6onAPUgGqdCXA-pE

# Database Password (for reference)
# Database Password: kpArzpbhvqsvhyOj
EOF
    echo "✅ .env.local file created!"
else
    echo "✅ .env.local file already exists!"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Restart Cursor to activate the new MCP configuration"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "🔐 Security note: .env.local is gitignored and won't be committed to GitHub" 