# Environment Variables Setup Guide

## ⚠️ CRITICAL: Missing Environment Variables

Your application has several placeholder values that need to be replaced with real credentials for full functionality.

## 🔧 Required Environment Variables

### 1. **Cloudflare R2 Storage** (File Uploads)
```env
# Current placeholder values that need to be replaced:
R2_ACCESS_KEY_ID="your-access-key-id"  # ❌ PLACEHOLDER
R2_PUBLIC_URL="https://pub-your-r2-public-domain.r2.dev"  # ❌ PLACEHOLDER

# You need to:
# 1. Go to Cloudflare Dashboard → R2 Object Storage
# 2. Create a new R2 bucket or use existing "chat-flavi"
# 3. Go to "Manage R2 API tokens" → Create API token
# 4. Set up a custom domain for public access
# 5. Replace the values above with real credentials
```

### 2. **Cloudflare AutoRAG** (AI Search)
```env
# Current placeholder values that need to be replaced:
CLOUDFLARE_API_TOKEN="your-cloudflare-api-token"  # ❌ PLACEHOLDER
CLOUDFLARE_AUTORAG_INDEX="my-autorag"  # ❌ PLACEHOLDER

# You need to:
# 1. Go to Cloudflare Dashboard → AI → AutoRAG
# 2. Create a new AutoRAG index
# 3. Generate API token with AutoRAG permissions
# 4. Replace the values above with real credentials
```

### 3. **NextAuth Secret** (Security)
```env
# Current placeholder that needs to be replaced:
NEXTAUTH_SECRET="change-this-to-a-secure-random-string"  # ❌ PLACEHOLDER

# Generate a secure secret:
# Option 1: Use openssl
openssl rand -base64 32

# Option 2: Use online generator
# Visit: https://generate-secret.vercel.app/32
```

## 🚀 Quick Setup Steps

### Step 1: Generate NextAuth Secret
```bash
# Generate a secure secret
openssl rand -base64 32
# Copy the output and replace NEXTAUTH_SECRET in your .env file
```

### Step 2: Set up Cloudflare R2
1. **Login to Cloudflare Dashboard**
2. **Go to R2 Object Storage**
3. **Create/Configure your bucket:**
   - Bucket name: `chat-flavi` (already configured)
   - Set up public access domain
4. **Create API Token:**
   - Go to "Manage R2 API tokens"
   - Create token with R2 permissions
   - Copy `Access Key ID` and `Secret Access Key`
5. **Update .env file:**
   ```env
   R2_ACCESS_KEY_ID="your-actual-access-key-id"
   R2_PUBLIC_URL="https://your-bucket.your-domain.com"
   ```

### Step 3: Set up Cloudflare AutoRAG
1. **Go to Cloudflare Dashboard → AI → AutoRAG**
2. **Create new AutoRAG index:**
   - Name: `flavi-supplier-products`
   - Model: Choose appropriate embedding model
3. **Generate API Token:**
   - Go to "API Tokens"
   - Create token with AutoRAG permissions
4. **Update .env file:**
   ```env
   CLOUDFLARE_API_TOKEN="your-actual-api-token"
   CLOUDFLARE_AUTORAG_INDEX="flavi-supplier-products"
   ```

## 🔍 Current Status

### ✅ **Working Features:**
- ✅ Authentication (signup, login, email verification)
- ✅ Database operations (MongoDB)
- ✅ Email sending (Resend)
- ✅ Basic product management
- ✅ User onboarding

### ⚠️ **Limited Features (due to missing env vars):**
- ⚠️ File uploads to R2 (will fail with current placeholders)
- ⚠️ AutoRAG product indexing (will fail with current placeholders)
- ⚠️ AI-powered search (depends on AutoRAG)

## 🧪 Testing Without Full Setup

You can test the application with limited functionality:

1. **Authentication works** - users can sign up, verify email, and login
2. **Product management works** - users can add products (without file uploads)
3. **Dashboard works** - users can view their products and analytics

## 🚨 Production Deployment

**DO NOT deploy to production with placeholder values!**

Before deploying to Vercel:
1. Set up all Cloudflare services
2. Replace all placeholder values
3. Test file uploads and AutoRAG functionality
4. Update `NEXTAUTH_URL` to your production domain

## 📝 Environment Variables Checklist

- [ ] `NEXTAUTH_SECRET` - Generate secure random string
- [ ] `R2_ACCESS_KEY_ID` - Get from Cloudflare R2 API tokens
- [ ] `R2_PUBLIC_URL` - Set up custom domain for R2 bucket
- [ ] `CLOUDFLARE_API_TOKEN` - Get from Cloudflare API tokens
- [ ] `CLOUDFLARE_AUTORAG_INDEX` - Create AutoRAG index
- [ ] `NEXTAUTH_URL` - Update to production domain

## 🔗 Helpful Links

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Cloudflare AutoRAG Documentation](https://developers.cloudflare.com/ai-search/)
- [NextAuth.js Environment Variables](https://next-auth.js.org/configuration/options#environment-variables)
