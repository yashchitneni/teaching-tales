# 🔐 OAuth Setup Guide for TeachTales

## **Google OAuth Configuration**

### **Step 1: Google Cloud Console Setup**

1. **Go to** [Google Cloud Console](https://console.cloud.google.com/)
2. **Create a new project** or select existing one
3. **Enable Google+ API** (if not already enabled)
4. **Go to** "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"

### **Step 2: Configure OAuth Client**

**Application type:** Web application  
**Name:** TeachTales

#### **Authorized JavaScript origins:**
```
http://localhost:3000
https://your-production-domain.com
```

#### **Authorized redirect URIs:**
```
http://localhost:3000/auth/callback
https://your-production-domain.com/auth/callback
```

### **Step 3: Supabase Configuration**

1. **Go to your Supabase project:** https://gccgwmuyzlsazkliswjp.supabase.co
2. **Navigate to:** Authentication → Providers
3. **Enable Google provider**
4. **Add your Google credentials:**
   - Client ID: `[from Google Cloud Console]`
   - Client Secret: `[from Google Cloud Console]`

### **Step 4: Environment Variables**

#### **Local Development (.env.local):**
```env
# Add these after getting credentials from Google
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

#### **Production Environment:**
- Add the same variables to your hosting platform (Vercel, Netlify, etc.)
- Make sure to use your production domain in the Google OAuth settings

## **Apple OAuth Configuration (Optional)**

### **Step 1: Apple Developer Setup**

1. **Go to** [Apple Developer Console](https://developer.apple.com/)
2. **Navigate to** Certificates, Identifiers & Profiles
3. **Create a new App ID** for TeachTales
4. **Enable Sign in with Apple** capability

### **Step 2: Configure Service ID**

1. **Create a Service ID**
2. **Configure domains and URLs:**
   - **Domains:** `localhost:3000`, `your-production-domain.com`
   - **Return URLs:** 
     - `http://localhost:3000/auth/callback`
     - `https://your-production-domain.com/auth/callback`

### **Step 3: Supabase Apple Configuration**

1. **In Supabase:** Authentication → Providers → Apple
2. **Add your Apple credentials:**
   - Services ID: `[from Apple Developer]`
   - Secret Key: `[from Apple Developer]`

## **Testing the Setup**

### **Local Testing:**
1. **Start your dev server:** `npm run dev`
2. **Visit:** http://localhost:3000/login
3. **Click "Continue with Google"**
4. **Should redirect to Google OAuth flow**
5. **After approval, should redirect back to your app**

### **Production Testing:**
1. **Deploy your app** to your hosting platform
2. **Update Google OAuth settings** with production domain
3. **Test the same flow** on production

## **Troubleshooting**

### **Common Issues:**

**"redirect_uri_mismatch" error:**
- Check that your redirect URIs in Google Cloud Console match exactly
- Make sure you included both `http://localhost:3000/auth/callback` and your production callback URL

**OAuth not working in production:**
- Verify production domain is added to Authorized JavaScript origins
- Check that environment variables are set in your hosting platform
- Ensure HTTPS is enabled for production

**Supabase auth not working:**
- Verify that your Supabase Site URL is set correctly in Authentication → Settings
- Check that redirect URLs are configured in Supabase

## **Security Notes**

- ✅ **Never commit** OAuth secrets to GitHub
- ✅ **Use environment variables** for all sensitive data
- ✅ **Different OAuth apps** for development vs production (recommended)
- ✅ **Restrict domains** in OAuth settings to only your domains
- ✅ **Enable HTTPS** in production

## **Next Steps After Setup**

1. **Test authentication flow**
2. **Set up user profiles** (already handled in our schema)
3. **Configure email templates** in Supabase
4. **Set up error handling** for auth failures
5. **Add logout functionality** 