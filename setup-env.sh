#!/bin/bash

# TeachTales Environment Setup Script

echo "🚀 Setting up TeachTales environment..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << 'EOF'
# Supabase Configuration for TeachTales
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Service Role Key (for server-side operations - keep secure!)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Database Password (for reference)
# Database Password: your_database_password_here
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
echo "3. Open http://localhost:3001 in your browser"
echo ""
echo "🔐 Security note: .env.local is gitignored and won't be committed to GitHub" 