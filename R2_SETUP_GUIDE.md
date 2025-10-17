# Cloudflare R2 Setup Guide

## 🚨 Current Error: AccessDenied

Your R2 credentials are valid but don't have the correct permissions. Follow these steps to fix it.

## 🔧 Step-by-Step R2 Setup

### Step 1: Access Cloudflare Dashboard
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Login with your account
3. Navigate to **R2 Object Storage**

### Step 2: Create/Verify Your Bucket
1. **Check if bucket exists:**
   - Look for a bucket named `chat-flavi`
   - If it doesn't exist, click **"Create bucket"**
   - Name: `chat-flavi`
   - Location: Choose closest to your users

### Step 3: Create R2 API Token
1. **Go to R2 → Manage R2 API tokens**
2. **Click "Create API token"**
3. **Configure the token:**
   - **Token name**: `supplier-portal-uploads`
   - **Permissions**: 
     - ✅ **Object Read & Write** (REQUIRED)
     - ✅ **Object List** (optional but recommended)
   - **Bucket access**: 
     - ✅ **Specific bucket**: `chat-flavi`
     - ✅ **All objects** (or specific path: `suppliers/`)
4. **Click "Create API token"**
5. **Copy the credentials:**
   - **Access Key ID** (starts with letters/numbers)
   - **Secret Access Key** (long random string)

### Step 4: Set Up Public Access (Optional but Recommended)
1. **Go to your bucket → Settings**
2. **Enable public access:**
   - Go to **"Settings"** tab
   - Find **"Public access"** section
   - Click **"Allow Access"**
   - Choose **"Custom domain"** or **"R2.dev subdomain"**

### Step 5: Update Your .env File
Replace the placeholder values in your `.env` file:

```env
# Replace these with your actual R2 credentials
R2_ACCESS_KEY_ID="your-actual-access-key-id-here"
R2_SECRET_ACCESS_KEY="your-actual-secret-access-key-here"
R2_BUCKET_NAME="chat-flavi"
R2_ENDPOINT="https://62823221dfff75d61e6a8dfc45ad4148.r2.cloudflarestorage.com"
R2_PUBLIC_URL="https://your-bucket.your-domain.com"  # or use R2.dev subdomain
```

## 🔍 Troubleshooting AccessDenied Error

### Common Causes:
1. **Wrong permissions**: Token needs "Object Read & Write"
2. **Wrong bucket**: Token not assigned to `chat-flavi` bucket
3. **Expired token**: Token may have expired
4. **Wrong credentials**: Copied wrong Access Key ID or Secret

### Quick Test:
You can test your R2 setup by running this command in your terminal:

```bash
# Test R2 connection (replace with your actual credentials)
curl -X PUT "https://62823221dfff75d61e6a8dfc45ad4148.r2.cloudflarestorage.com/chat-flavi/test.txt" \
  -H "Authorization: AWS4-HMAC-SHA256 ..." \
  -d "Hello R2"
```

## 📋 R2 Configuration Checklist

- [ ] ✅ R2 bucket `chat-flavi` exists
- [ ] ✅ API token created with "Object Read & Write" permissions
- [ ] ✅ Token assigned to `chat-flavi` bucket
- [ ] ✅ `R2_ACCESS_KEY_ID` updated in .env (not placeholder)
- [ ] ✅ `R2_SECRET_ACCESS_KEY` updated in .env (not placeholder)
- [ ] ✅ `R2_BUCKET_NAME` set to `chat-flavi`
- [ ] ✅ `R2_ENDPOINT` points to your account
- [ ] ✅ `R2_PUBLIC_URL` configured for public access

## 🚀 After Setup

Once you've updated your `.env` file:

1. **Restart your development server:**
   ```bash
   npm run dev
   ```

2. **Test file upload:**
   - Go to Dashboard → Products → Add Product
   - Try uploading an image or PDF
   - Should work without errors

## 🔗 Helpful Links

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [R2 API Tokens Guide](https://developers.cloudflare.com/r2/api/tokens/)
- [R2 Public Access Setup](https://developers.cloudflare.com/r2/buckets/public-buckets/)

## 💡 Pro Tips

1. **Use R2.dev subdomain** for quick setup (no custom domain needed)
2. **Set up CORS** if you plan to upload from frontend
3. **Monitor usage** in Cloudflare Dashboard to avoid overages
4. **Use lifecycle rules** to automatically delete old files

---

**Need help?** Check the error message in your browser console for specific details about what's failing.
