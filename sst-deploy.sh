#!/bin/bash

# Script to deploy SST with Supabase environment variables

# Export the environment variables
export NEXT_PUBLIC_SUPABASE_URL="https://gccgwmuyzlsazkliswjp.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjY2d3bXV5emxzYXprbGlzd2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDMwNTUsImV4cCI6MjA2OTM3OTA1NX0.RZ-rSJWzTgDRjnM-E27hIjNgQpFBQmB7cX9DPVcUYqU"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjY2d3bXV5emxzYXprbGlzd2pwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgwMzA1NSwiZXhwIjoyMDY5Mzc5MDU1fQ.HC2OL-eBX-nkCYF4mXBMkOQ6-0t6onAPUgGqdCXA-pE"

# Deploy to the specified stage (default: production)
STAGE=${1:-production}

echo "Deploying to stage: $STAGE"
npx sst deploy --stage $STAGE
