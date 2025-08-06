# TeachTales Setup Guide

## Environment Variables Setup

Create a `.env.local` file in the project root with the following variables:

```env
# AWS Cognito Configuration for TeachTales
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your_cognito_user_pool_id_here
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=your_cognito_client_id_here
NEXT_PUBLIC_COGNITO_REGION=your_aws_region_here
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

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Security Notes

- The `.env.local` file is automatically gitignored
- Never commit API keys or database passwords to version control
- Use AWS IAM best practices for access management 
