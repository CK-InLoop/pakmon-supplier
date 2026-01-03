# R2 Configuration Fix

## 🚨 Issues Found:

1. **Wrong bucket name**: Using `chat-pakmon` instead of `chatbot-pakmon`
2. **R2_TOKEN not used**: You have an R2 token but code uses AWS S3 credentials
3. **Authentication method**: Should use R2 token authentication

## 🔧 Fix Your .env File:

Update your `.env` file with these corrections:

```env
# CORRECTED R2 Configuration
R2_ACCOUNT_ID="62823221dfff75d61e6a8dfc45ad4148"
R2_ACCESS_KEY_ID="5fb2c769cfec25400b3c365cdeb1b408"
R2_SECRET_ACCESS_KEY="cc8c44e2cac2680cf0ff65455ffeb025347a8eb5eb2a465b1f7dec0b945d32fc"
R2_BUCKET_NAME="chatbot-pakmon"  # CHANGED: was "chat-pakmon"
R2_ENDPOINT="https://62823221dfff75d61e6a8dfc45ad4148.r2.cloudflarestorage.com"
R2_PUBLIC_URL="https://pub-your-r2-public-domain.r2.dev"
R2_TOKEN="27dcyWk2I58DvdVkZs_tJJYfVG_e4xhbVUmMq0fR"
```

## 🔄 Alternative: Use R2 Token Authentication

If you want to use the R2_TOKEN instead of AWS S3 credentials, we need to modify the R2 client:

```typescript
// Alternative R2 client using token
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
  // Add custom headers for R2 token
  requestHandler: {
    handle: async (request) => {
      request.headers['Authorization'] = `Bearer ${process.env.R2_TOKEN}`;
      return request;
    }
  }
});
```

## 📋 Steps to Fix:

1. **Update bucket name** in .env: `R2_BUCKET_NAME="chatbot-pakmon"`
2. **Restart your server**: `npm run dev`
3. **Test file upload** again

## 🎯 The Main Issue:

The bucket name mismatch (`chat-pakmon` vs `chatbot-pakmon`) is causing the AccessDenied error because the code is trying to access the wrong bucket.

---

**Quick Fix**: Just change `R2_BUCKET_NAME="chatbot-pakmon"` in your .env file and restart the server.

